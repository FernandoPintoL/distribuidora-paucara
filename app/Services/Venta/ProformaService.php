<?php

namespace App\Services\Venta;

use App\DTOs\Venta\CrearProformaDTO;
use App\DTOs\Venta\ProformaResponseDTO;
use App\Exceptions\Stock\StockInsuficientException;
use App\Exceptions\Venta\EstadoInvalidoException;
use App\Models\DetalleProforma;
use App\Models\Proforma;
use App\Models\ReservaStock;
use App\Services\Stock\StockService;
use App\Services\Traits\LogsOperations;
use App\Services\Traits\ManagesTransactions;
use Illuminate\Support\Facades\Auth;

/**
 * ProformaService - ÚNICA FUENTE DE VERDAD para Proformas
 *
 * RESPONSABILIDADES:
 * ✓ Crear proformas (con reserva de stock)
 * ✓ Aprobar proformas (mantiene reserva)
 * ✓ Rechazar proformas (libera reserva)
 * ✓ Convertir a venta (consume reserva)
 * ✓ Extender validez
 * ✓ Validar disponibilidad
 *
 * INVARIANTE: Reserva de stock SÍ se maneja aquí
 *
 * FLUJO DE ESTADOS:
 * PENDIENTE → APROBADA → CONVERTIDA (a Venta)
 *         ↘ RECHAZADA
 *         ↘ VENCIDA
 */
class ProformaService
{
    use ManagesTransactions, LogsOperations;

    private static array $transicionesValidas = [
        'PENDIENTE' => ['APROBADA', 'RECHAZADA'],
        'APROBADA' => ['CONVERTIDA', 'RECHAZADA'],
        'CONVERTIDA' => [],
        'RECHAZADA' => [],
        'VENCIDA' => [],
    ];

    public function __construct(
        private StockService $stockService,
        private VentaService $ventaService,
    ) {}

    /**
     * Crear una proforma
     *
     * FLUJO:
     * 1. Validar stock disponible
     * 2. Crear proforma
     * 3. Crear detalles
     * 4. RESERVAR stock (diferencia clave con Venta)
     * 5. Emitir evento ProformaCreada
     *
     * @throws StockInsuficientException
     */
    public function crear(CrearProformaDTO $dto): ProformaResponseDTO
    {
        // 1. Validar datos
        $dto->validarDetalles();

        // 2. Validar stock ANTES de transacción
        $validacion = $this->stockService->validarDisponible(
            $dto->detalles,
            $dto->almacen_id ?? 1
        );

        if (!$validacion->esValida()) {
            throw StockInsuficientException::create($validacion->detalles);
        }

        // 3. Crear dentro de transacción
        $proforma = $this->transaction(function () use ($dto) {
            // 3.1 Crear Proforma
            $proforma = Proforma::create([
                'numero' => $this->generarNumero(),
                'cliente_id' => $dto->cliente_id,
                'usuario_id' => $dto->usuario_id ?? Auth::id(),
                'fecha' => $dto->fecha,
                'fecha_vencimiento' => $dto->fecha_vencimiento,
                'subtotal' => $dto->subtotal,
                'impuesto' => $dto->impuesto,
                'total' => $dto->total,
                'estado' => 'PENDIENTE',
                'observaciones' => $dto->observaciones,
                'almacen_id' => $dto->almacen_id ?? 1,
                'canal' => $dto->canal ?? 'PRESENCIAL',
            ]);

            // 3.2 Crear detalles
            foreach ($dto->detalles as $detalle) {
                DetalleProforma::create([
                    'proforma_id' => $proforma->id,
                    'producto_id' => $detalle['producto_id'],
                    'cantidad' => $detalle['cantidad'],
                    'precio_unitario' => $detalle['precio_unitario'],
                    'subtotal' => $detalle['cantidad'] * $detalle['precio_unitario'],
                ]);
            }

            // 3.3 RESERVAR stock (no consumir)
            foreach ($dto->detalles as $detalle) {
                ReservaStock::create([
                    'proforma_id' => $proforma->id,
                    'producto_id' => $detalle['producto_id'],
                    'cantidad' => $detalle['cantidad'],
                    'almacen_id' => $dto->almacen_id ?? 1,
                    'fecha_vencimiento_reserva' => $dto->fecha_vencimiento,
                ]);
            }

            // 3.4 Emitir evento
            event(new \App\Events\ProformaCreada($proforma));

            return $proforma;
        });

        $this->logSuccess('Proforma creada', [
            'proforma_id' => $proforma->id,
            'numero' => $proforma->numero,
        ]);

        return ProformaResponseDTO::fromModel($proforma);
    }

    /**
     * Aprobar una proforma
     *
     * Mantiene la reserva de stock (no la consume)
     * La consumición ocurre al convertir a venta
     *
     * @throws EstadoInvalidoException
     */
    public function aprobar(int $proformaId): ProformaResponseDTO
    {
        $proforma = $this->transaction(function () use ($proformaId) {
            $proforma = Proforma::lockForUpdate()->findOrFail($proformaId);

            $this->validarTransicion($proforma->estado, 'APROBADA');

            // Validar que reserva siga vigente
            if ($proforma->fecha_vencimiento < now()) {
                throw new \Exception('Proforma vencida, no puede ser aprobada');
            }

            $proforma->update(['estado' => 'APROBADA']);

            event(new \App\Events\ProformaAprobada($proforma));

            return $proforma;
        });

        $this->logSuccess('Proforma aprobada', ['proforma_id' => $proformaId]);

        return ProformaResponseDTO::fromModel($proforma);
    }

    /**
     * Rechazar una proforma
     *
     * Libera la reserva de stock
     *
     * @throws EstadoInvalidoException
     */
    public function rechazar(int $proformaId, string $motivo = ''): ProformaResponseDTO
    {
        $proforma = $this->transaction(function () use ($proformaId, $motivo) {
            $proforma = Proforma::lockForUpdate()->findOrFail($proformaId);

            $this->validarTransicion($proforma->estado, 'RECHAZADA');

            // Liberar reserva de stock
            ReservaStock::where('proforma_id', $proformaId)->delete();

            $proforma->update([
                'estado' => 'RECHAZADA',
                'observaciones' => ($proforma->observaciones ?? '') . "\nMotivo rechazo: {$motivo}",
            ]);

            event(new \App\Events\ProformaRechazada($proforma, $motivo));

            return $proforma;
        });

        $this->logSuccess('Proforma rechazada', [
            'proforma_id' => $proformaId,
            'motivo' => $motivo,
        ]);

        return ProformaResponseDTO::fromModel($proforma);
    }

    /**
     * Convertir proforma a venta
     *
     * FLUJO:
     * 1. Validar estado de proforma (debe ser APROBADA)
     * 2. Validar que stock reservado siga disponible
     * 3. Crear venta desde proforma
     * 4. Consumir stock (usa StockService)
     * 5. Liberar reserva de proforma
     * 6. Marcar proforma como CONVERTIDA
     *
     * @throws EstadoInvalidoException
     * @throws StockInsuficientException
     */
    public function convertirAVenta(int $proformaId): \App\DTOs\Venta\VentaResponseDTO
    {
        $ventaDTO = $this->transaction(function () use ($proformaId) {
            $proforma = Proforma::lockForUpdate()->with('detalles')->findOrFail($proformaId);

            // Validar estado
            if ($proforma->estado !== 'APROBADA') {
                throw EstadoInvalidoException::transicionInvalida(
                    'Proforma',
                    $proformaId,
                    $proforma->estado,
                    'CONVERTIDA'
                );
            }

            // Validar que siga vigente
            if ($proforma->fecha_vencimiento < now()) {
                throw new \Exception('Proforma vencida, no puede ser convertida');
            }

            // Preparar datos para crear venta
            $detalles = $proforma->detalles->map(fn($det) => [
                'producto_id' => $det->producto_id,
                'cantidad' => $det->cantidad,
                'precio_unitario' => $det->precio_unitario,
            ])->toArray();

            // Crear venta (StockService consume stock dentro)
            $ventaDTO = $this->ventaService->crear(
                new \App\DTOs\Venta\CrearVentaDTO(
                    cliente_id: $proforma->cliente_id,
                    fecha: now()->toDateString(),
                    detalles: $detalles,
                    subtotal: $proforma->subtotal,
                    impuesto: $proforma->impuesto,
                    total: $proforma->total,
                    almacen_id: $proforma->almacen_id ?? 1,
                    observaciones: "Convertida desde proforma #{$proforma->numero}",
                    usuario_id: Auth::id(),
                )
            );

            // Liberar reserva de stock
            ReservaStock::where('proforma_id', $proformaId)->delete();

            // Marcar proforma como convertida
            $proforma->update(['estado' => 'CONVERTIDA']);

            event(new \App\Events\ProformaConvertida($proforma));

            return $ventaDTO;
        });

        $this->logSuccess('Proforma convertida a venta', [
            'proforma_id' => $proformaId,
        ]);

        return $ventaDTO;
    }

    /**
     * Obtener una proforma
     */
    public function obtener(int $proformaId): ProformaResponseDTO
    {
        $proforma = Proforma::with(['detalles', 'cliente'])->findOrFail($proformaId);

        return ProformaResponseDTO::fromModel($proforma);
    }

    /**
     * Extender validez de proforma
     */
    public function extenderValidez(int $proformaId, int $dias = 15): ProformaResponseDTO
    {
        $proforma = $this->transaction(function () use ($proformaId, $dias) {
            $proforma = Proforma::lockForUpdate()->findOrFail($proformaId);

            if ($proforma->estado !== 'PENDIENTE' && $proforma->estado !== 'APROBADA') {
                throw new \Exception(
                    "Solo se puede extender validez de proformas PENDIENTE o APROBADA"
                );
            }

            $nuevaFechaVencimiento = $proforma->fecha_vencimiento->addDays($dias);

            $proforma->update(['fecha_vencimiento' => $nuevaFechaVencimiento]);

            // Actualizar también reservas
            ReservaStock::where('proforma_id', $proformaId)
                ->update(['fecha_vencimiento_reserva' => $nuevaFechaVencimiento]);

            return $proforma;
        });

        $this->logSuccess('Validez de proforma extendida', [
            'proforma_id' => $proformaId,
            'dias' => $dias,
        ]);

        return ProformaResponseDTO::fromModel($proforma);
    }

    /**
     * Validar transición de estado
     *
     * @throws EstadoInvalidoException
     */
    private function validarTransicion(string $estadoActual, string $estadoNuevo): void
    {
        $permitidas = self::$transicionesValidas[$estadoActual] ?? [];

        if (!in_array($estadoNuevo, $permitidas)) {
            throw EstadoInvalidoException::transicionInvalida(
                'Proforma',
                0,
                $estadoActual,
                $estadoNuevo
            );
        }
    }

    /**
     * Generar número secuencial de proforma
     */
    private function generarNumero(): string
    {
        $year = now()->year;
        $count = Proforma::whereYear('created_at', $year)->count() + 1;

        return sprintf('PF-%d-%06d', $year, $count);
    }
}
