<?php

namespace App\Http\Controllers;

use App\Models\Envio;
use App\Models\Proforma;
use App\Models\User;
use App\Models\Vehiculo;
use App\Models\Venta;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EnvioController extends Controller
{
    public function index()
    {
        $envios = Envio::with(['venta.cliente', 'vehiculo', 'chofer'])
            ->orderBy('fecha_programada', 'desc')
            ->paginate(20);

        return Inertia::render('Envios/Index', [
            'envios' => $envios,
        ]);
    }

    public function show(Envio $envio)
    {
        $envio->load([
            'venta.cliente',
            'venta.detalles.producto',
            'vehiculo',
            'chofer',
            'seguimientos.usuario',
        ]);

        return Inertia::render('Envios/Show', [
            'envio' => $envio,
        ]);
    }

    public function programar(Venta $venta, Request $request)
    {
        $request->validate([
            'vehiculo_id' => 'required|exists:vehiculos,id',
            'chofer_id' => 'required|exists:users,id',
            'fecha_programada' => 'required|date|after:now',
            'direccion_entrega' => 'nullable|string|max:500',
        ]);

        if (! $venta->puedeEnviarse()) {
            return back()->withErrors(['error' => 'Esta venta no puede enviarse']);
        }

        // Verificar que el vehículo esté disponible
        $vehiculo = Vehiculo::find($request->vehiculo_id);
        if ($vehiculo->estado !== Vehiculo::DISPONIBLE) {
            return back()->withErrors(['error' => 'El vehículo seleccionado no está disponible']);
        }

        DB::beginTransaction();
        try {
            // Programar envío
            $envio = $venta->programarEnvio([
                'vehiculo_id' => $request->vehiculo_id,
                'chofer_id' => $request->chofer_id,
                'fecha_programada' => $request->fecha_programada,
                'direccion_entrega' => $request->direccion_entrega,
            ]);

            // Actualizar estado de venta
            $venta->update(['estado_logistico' => Venta::ESTADO_PREPARANDO]);

            // Crear seguimiento inicial
            $envio->agregarSeguimiento('PROGRAMADO', [
                'observaciones' => 'Envío programado para '.$request->fecha_programada,
            ]);

            DB::commit();

            return redirect()->route('envios.show', $envio)
                ->with('success', 'Envío programado exitosamente');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Error al programar el envío: '.$e->getMessage()]);
        }
    }

    public function iniciarPreparacion(Envio $envio)
    {
        if (! $envio->puedeIniciarPreparacion()) {
            return back()->withErrors(['error' => 'Este envío no puede iniciar preparación']);
        }

        DB::beginTransaction();
        try {
            // ⚠️ PUNTO CRÍTICO: Aquí es donde se reduce el stock
            $this->reducirStockParaEnvio($envio);

            // Actualizar estado del envío
            $envio->update(['estado' => Envio::EN_PREPARACION]);

            // Actualizar estado del vehículo
            $envio->vehiculo->update(['estado' => Vehiculo::EN_RUTA]);

            // Crear seguimiento
            $envio->agregarSeguimiento('EN_PREPARACION', [
                'observaciones' => 'Iniciada la preparación del pedido',
            ]);

            DB::commit();

            return back()->with('success', 'Preparación iniciada. Stock reducido correctamente.');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Error al iniciar preparación: '.$e->getMessage()]);
        }
    }

    public function confirmarSalida(Envio $envio, Request $request)
    {
        if (! $envio->puedeConfirmarSalida()) {
            return back()->withErrors(['error' => 'Este envío no puede confirmar salida']);
        }

        $envio->update([
            'estado' => Envio::EN_RUTA,
            'fecha_salida' => now(),
        ]);

        $envio->venta->update(['estado_logistico' => Venta::ESTADO_ENVIADO]);

        // Crear seguimiento
        $envio->agregarSeguimiento('EN_RUTA', [
            'observaciones' => 'Vehículo salió del almacén',
        ]);

        return back()->with('success', 'Salida confirmada. El envío está en ruta.');
    }

    public function confirmarEntrega(Envio $envio, Request $request)
    {
        $request->validate([
            'receptor_nombre' => 'required|string|max:255',
            'receptor_documento' => 'nullable|string|max:20',
            'foto_entrega' => 'nullable|image|max:2048',
            'observaciones_entrega' => 'nullable|string|max:500',
        ]);

        if (! $envio->puedeConfirmarEntrega()) {
            return back()->withErrors(['error' => 'Este envío no puede confirmar entrega']);
        }

        DB::beginTransaction();
        try {
            $fotoPath = null;
            if ($request->hasFile('foto_entrega')) {
                $fotoPath = $request->file('foto_entrega')->store('entregas', 'public');
            }

            $envio->update([
                'estado' => Envio::ENTREGADO,
                'fecha_entrega' => now(),
                'receptor_nombre' => $request->receptor_nombre,
                'receptor_documento' => $request->receptor_documento,
                'foto_entrega' => $fotoPath,
            ]);

            $envio->venta->update(['estado_logistico' => Venta::ESTADO_ENTREGADO]);

            // Liberar vehículo
            $envio->vehiculo->update(['estado' => Vehiculo::DISPONIBLE]);

            // Crear seguimiento final
            $envio->agregarSeguimiento('ENTREGADO', [
                'observaciones' => 'Entregado a: '.$request->receptor_nombre.'. '.($request->observaciones_entrega ?? ''),
            ]);

            DB::commit();

            return back()->with('success', 'Entrega confirmada exitosamente');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Error al confirmar entrega: '.$e->getMessage()]);
        }
    }

    public function cancelar(Envio $envio, Request $request)
    {
        $request->validate([
            'motivo_cancelacion' => 'required|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            // Si ya se había reducido stock, revertirlo
            if ($envio->estado === Envio::EN_PREPARACION || $envio->estado === Envio::EN_RUTA) {
                $this->revertirStockDelEnvio($envio);
            }

            $envio->update(['estado' => Envio::CANCELADO]);
            $envio->venta->update(['estado_logistico' => Venta::ESTADO_PENDIENTE_ENVIO]);

            // Liberar vehículo
            $envio->vehiculo->update(['estado' => Vehiculo::DISPONIBLE]);

            // Crear seguimiento
            $envio->agregarSeguimiento('CANCELADO', [
                'observaciones' => 'Cancelado: '.$request->motivo_cancelacion,
            ]);

            DB::commit();

            return back()->with('success', 'Envío cancelado y stock revertido');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Error al cancelar envío: '.$e->getMessage()]);
        }
    }

    public function obtenerVehiculosDisponibles()
    {
        $vehiculos = Vehiculo::where('estado', Vehiculo::DISPONIBLE)
            ->with('choferAsignado')
            ->get();

        return response()->json($vehiculos);
    }

    public function obtenerChoferesDisponibles()
    {
        $choferes = User::whereHas('roles', function ($query) {
            $query->where('name', 'chofer');
        })->get();

        return response()->json($choferes);
    }

    private function reducirStockParaEnvio(Envio $envio)
    {
        $stockService = app(StockService::class);

        foreach ($envio->venta->detalles as $detalle) {
            $stockService->reducirStock(
                $detalle->producto_id,
                $detalle->cantidad,
                'ENVIO',
                "Envío #{$envio->numero_envio}",
                1// almacen_id por defecto
            );
        }
    }

    private function revertirStockDelEnvio(Envio $envio)
    {
        $stockService = app(StockService::class);

        foreach ($envio->venta->detalles as $detalle) {
            $stockService->aumentarStock(
                $detalle->producto_id,
                $detalle->cantidad,
                'CANCELACION_ENVIO',
                "Cancelación envío #{$envio->numero_envio}",
                1// almacen_id por defecto
            );
        }
    }

    // ==========================================
    // 📊 MÉTODOS PARA DASHBOARD DE LOGÍSTICA
    // ==========================================

    /**
     * Obtener estadísticas para el dashboard de logística
     */
    public function dashboardStats(): JsonResponse
    {
        $stats = [
            'proformas_pendientes' => Proforma::where('estado', 'PENDIENTE')
                ->where('canal_origen', 'APP_EXTERNA')
                ->count(),
            'envios_programados' => Envio::where('estado', 'PROGRAMADO')->count(),
            'envios_en_transito' => Envio::where('estado', 'EN_TRANSITO')->count(),
            'envios_entregados_hoy' => Envio::where('estado', 'ENTREGADO')
                ->whereDate('updated_at', today())
                ->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Obtener seguimiento detallado de un envío para API
     */
    public function seguimiento(Envio $envio): JsonResponse
    {
        $envio->load([
            'venta.cliente',
            'venta.detalles.producto',
            'vehiculo',
            'chofer',
            'seguimientos.usuario',
        ]);

        return response()->json($envio);
    }

    /**
     * Actualizar estado de un envío desde API
     */
    public function actualizarEstado(Envio $envio, Request $request): JsonResponse
    {
        $request->validate([
            'estado' => 'required|in:PROGRAMADO,EN_PREPARACION,EN_TRANSITO,ENTREGADO,FALLIDO',
            'descripcion' => 'required|string|max:500',
            'ubicacion' => 'nullable|array',
            'ubicacion.latitud' => 'nullable|numeric',
            'ubicacion.longitud' => 'nullable|numeric',
        ]);

        DB::beginTransaction();
        try {
            $estadoAnterior = $envio->estado;

            // Actualizar estado del envío
            $envio->update(['estado' => $request->estado]);

            // Crear registro de seguimiento
            $envio->seguimientos()->create([
                'estado' => $request->estado,
                'descripcion' => $request->descripcion,
                'ubicacion' => $request->ubicacion,
                'usuario_id' => auth()->id(),
                'fecha' => now(),
            ]);

            // Lógica específica según el estado
            switch ($request->estado) {
                case 'EN_PREPARACION':
                    if ($estadoAnterior === 'PROGRAMADO') {
                        $this->reducirStockPreparacion($envio);
                    }
                    break;

                case 'ENTREGADO':
                    $this->marcarVentaComoEntregada($envio);
                    break;

                case 'FALLIDO':
                    $this->restaurarStockFallido($envio);
                    break;
            }

            DB::commit();

            return response()->json([
                'message' => 'Estado actualizado correctamente',
                'envio' => $envio->fresh(['seguimientos']),
            ]);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'message' => 'Error al actualizar el estado',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener envíos para cliente específico (API)
     */
    public function enviosCliente(Request $request): JsonResponse
    {
        $user = auth()->user();

        // Si es un cliente desde la app externa, buscar por cliente_app_id
        $envios = Envio::whereHas('venta', function ($query) use ($user) {
            $query->whereHas('cliente', function ($q) use ($user) {
                $q->where('email', $user->email);
            });
        })
            ->with(['venta.cliente', 'vehiculo', 'chofer', 'seguimientos'])
            ->orderBy('fecha_programada', 'desc')
            ->paginate(10);

        return response()->json($envios);
    }

    /**
     * API para seguimiento público (sin autenticación)
     */
    public function seguimientoApi(Envio $envio): JsonResponse
    {
        $envio->load([
            'venta' => function ($query) {
                $query->select('id', 'numero', 'total', 'cliente_id');
            },
            'venta.cliente' => function ($query) {
                $query->select('id', 'nombre', 'telefono');
            },
            'vehiculo' => function ($query) {
                $query->select('id', 'placa', 'marca', 'modelo');
            },
            'chofer' => function ($query) {
                $query->select('id', 'name');
            },
            'seguimientos' => function ($query) {
                $query->orderBy('fecha', 'desc');
            },
        ]);

        return response()->json($envio);
    }

    /**
     * Actualizar ubicación desde app móvil
     */
    public function actualizarUbicacion(Envio $envio, Request $request): JsonResponse
    {
        $request->validate([
            'latitud' => 'required|numeric',
            'longitud' => 'required|numeric',
        ]);

        $envio->seguimientos()->create([
            'estado' => $envio->estado,
            'descripcion' => 'Actualización de ubicación automática',
            'ubicacion' => [
                'latitud' => $request->latitud,
                'longitud' => $request->longitud,
            ],
            'usuario_id' => auth()->id(),
            'fecha' => now(),
        ]);

        return response()->json(['message' => 'Ubicación actualizada']);
    }

    private function marcarVentaComoEntregada(Envio $envio): void
    {
        $envio->venta->update([
            'entregado' => true,
            'fecha_entrega' => now(),
        ]);
    }

    private function restaurarStockFallido(Envio $envio): void
    {
        // Si el envío falló, restaurar el stock
        if ($envio->estado === 'EN_PREPARACION' || $envio->estado === 'EN_TRANSITO') {
            $this->restaurarStock($envio);
        }
    }
}
