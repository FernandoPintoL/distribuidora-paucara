<?php
namespace App\Http\Controllers;

use App\Models\Proforma;
use App\Services\WebSocketNotificationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class ProformaController extends Controller
{
    public function index(): Response
    {
        $proformas = Proforma::with(['cliente', 'usuarioCreador', 'detalles.producto'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Proformas/Index', [
            'proformas' => $proformas,
        ]);
    }

    public function show(Proforma $proforma): Response
    {
        $proforma->load([
            'cliente',
            'usuarioCreador',
            'detalles.producto.marca',
            'detalles.producto.categoria',
        ]);

        return Inertia::render('Proformas/Show', [
            'proforma' => $proforma,
        ]);
    }

    public function aprobar(Proforma $proforma)
    {
        // Implementar lógica de aprobación
        $proforma->update([
            'estado'               => Proforma::APROBADA,
            'usuario_aprobador_id' => Auth::id(),
            'fecha_aprobacion'     => now(),
        ]);

        // Notificar vía WebSocket (sin afectar la respuesta si falla)
        try {
            $webSocketService = app(WebSocketNotificationService::class);
            $proforma->load(['cliente', 'detalles.producto', 'usuarioAprobador']);
            $webSocketService->notifyProformaApproved($proforma);
        } catch (\Exception $e) {
            Log::warning('Error enviando notificación WebSocket de proforma aprobada', [
                'proforma_id' => $proforma->id,
                'error' => $e->getMessage(),
            ]);
        }

        return back()->with('success', 'Proforma aprobada exitosamente');
    }

    public function rechazar(Proforma $proforma)
    {
        // Implementar lógica de rechazo
        $proforma->update([
            'estado' => Proforma::RECHAZADA,
        ]);

        // Notificar vía WebSocket (sin afectar la respuesta si falla)
        try {
            $webSocketService = app(WebSocketNotificationService::class);
            $proforma->load(['cliente', 'detalles.producto']);
            $webSocketService->notifyProformaRejected($proforma);
        } catch (\Exception $e) {
            Log::warning('Error enviando notificación WebSocket de proforma rechazada', [
                'proforma_id' => $proforma->id,
                'error' => $e->getMessage(),
            ]);
        }

        return back()->with('success', 'Proforma rechazada');
    }

    /**
     * Convertir una proforma aprobada a venta
     *
     * IMPORTANTE: Este método NO procesa stock nuevamente
     * El stock ya fue reservado y será consumido al marcar como CONVERTIDA
     */
    public function convertirAVenta(Proforma $proforma)
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($proforma) {
            // Validación 1: La proforma debe poder convertirse
            if (!$proforma->puedeConvertirseAVenta()) {
                return back()->withErrors([
                    'error' => 'Esta proforma no puede convertirse a venta. Estado actual: ' . $proforma->estado
                ]);
            }

            // Validación 2: Verificar que tenga reservas activas
            $reservasActivas = $proforma->reservasActivas()->count();
            if ($reservasActivas === 0) {
                return back()->withErrors([
                    'error' => 'No hay reservas de stock activas para esta proforma. No se puede convertir.'
                ]);
            }

            // Validación 3: Verificar que las reservas NO estén expiradas
            if ($proforma->tieneReservasExpiradas()) {
                return back()->withErrors([
                    'error' => 'Las reservas de stock han expirado. No se puede convertir a venta.'
                ]);
            }

            // Validación 4: Verificar disponibilidad de stock actual
            $disponibilidad = $proforma->verificarDisponibilidadStock();
            $stockInsuficiente = array_filter($disponibilidad, fn($item) => !$item['disponible']);

            if (!empty($stockInsuficiente)) {
                $mensajes = array_map(
                    fn($item) => "{$item['producto_nombre']}: requerido {$item['cantidad_requerida']}, disponible {$item['cantidad_disponible']}",
                    $stockInsuficiente
                );

                return back()->withErrors([
                    'error' => 'Stock insuficiente para algunos productos: ' . implode(', ', $mensajes)
                ]);
            }

            // Preparar datos para la venta desde la proforma
            $datosVenta = $this->prepararDatosVentaDesdeProforma($proforma);

            // Crear la venta
            // IMPORTANTE: NO se procesa stock aquí, se hace al consumir reservas
            $venta = \App\Models\Venta::create($datosVenta);

            // Crear detalles de la venta desde los detalles de la proforma
            foreach ($proforma->detalles as $detalleProforma) {
                $venta->detalles()->create([
                    'producto_id' => $detalleProforma->producto_id,
                    'cantidad' => $detalleProforma->cantidad,
                    'precio_unitario' => $detalleProforma->precio_unitario,
                    'subtotal' => $detalleProforma->subtotal,
                ]);
            }

            // Marcar la proforma como convertida
            // IMPORTANTE: Esto dispara ProformaObserver::updated() que automáticamente
            // consume las reservas (reduce cantidad física del stock)
            if (!$proforma->marcarComoConvertida()) {
                throw new \Exception('Error al marcar la proforma como convertida');
            }

            // Cargar relaciones para la respuesta
            $venta->load(['cliente', 'detalles.producto', 'moneda']);

            \Illuminate\Support\Facades\Log::info('Proforma convertida a venta exitosamente', [
                'proforma_id' => $proforma->id,
                'proforma_numero' => $proforma->numero,
                'venta_id' => $venta->id,
                'venta_numero' => $venta->numero,
                'reservas_consumidas' => $reservasActivas,
            ]);

            // Notificar vía WebSocket sobre conversión a venta (sin afectar la respuesta si falla)
            try {
                $webSocketService = app(WebSocketNotificationService::class);
                $proforma->load(['cliente', 'detalles.producto', 'usuarioAprobador']);
                $webSocketService->notifyProformaConverted($proforma, $venta);
            } catch (\Exception $e) {
                Log::warning('Error enviando notificación WebSocket de proforma convertida', [
                    'proforma_id' => $proforma->id,
                    'venta_id' => $venta->id,
                    'error' => $e->getMessage(),
                ]);
            }

            return redirect()->route('ventas.show', $venta->id)
                ->with('success', "Proforma {$proforma->numero} convertida exitosamente a venta {$venta->numero}");
        });
    }

    /**
     * Preparar datos de venta desde una proforma
     */
    private function prepararDatosVentaDesdeProforma(Proforma $proforma): array
    {
        return [
            'numero' => \App\Models\Venta::generarNumero(),
            'fecha' => now()->toDateString(),
            'subtotal' => $proforma->subtotal,
            'descuento' => $proforma->descuento ?? 0,
            'impuesto' => $proforma->impuesto,
            'total' => $proforma->total,
            'observaciones' => $proforma->observaciones,
            'cliente_id' => $proforma->cliente_id,
            'usuario_id' => Auth::id(),
            'moneda_id' => $proforma->moneda_id,
            'proforma_id' => $proforma->id, // ← CRÍTICO: Marca que viene de proforma
            // Campos de logística (si la proforma es de app externa, requiere envío)
            'requiere_envio' => $proforma->esDeAppExterna(),
            'canal_origen' => $proforma->canal_origen,
            'estado_logistico' => $proforma->esDeAppExterna()
                ? \App\Models\Venta::ESTADO_PENDIENTE_ENVIO
                : null,
            // Estado del documento (pendiente de confirmación)
            'estado_documento_id' => \App\Models\EstadoDocumento::where('nombre', 'PENDIENTE')->first()?->id,
        ];
    }
}
