<?php

namespace App\Services\Venta;

use App\DTOs\Venta\CrearVentaDTO;
use App\DTOs\Venta\VentaResponseDTO;
use App\Exceptions\Stock\StockInsuficientException;
use App\Exceptions\Venta\EstadoInvalidoException;
use App\Models\Venta;
use App\Models\VentaDetalle;
use App\Services\Stock\StockService;
use App\Services\Traits\LogsOperations;
use App\Services\Traits\ManagesTransactions;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

/**
 * VentaService - Lógica de negocio para Ventas
 *
 * RESPONSABILIDADES:
 * ✓ Crear ventas
 * ✓ Aprobar/rechazar ventas
 * ✓ Cambiar estado de ventas
 * ✓ Consultar ventas
 * ✓ Coordinar con Stock y Contabilidad
 *
 * NO RESPONSABILIDADES:
 * ✗ HTTP/Controllers (eso es del Controller)
 * ✗ Formateo de respuesta (eso es del Controller)
 * ✗ Validación de Request (eso es de Form Request)
 * ✗ Transacciones (las maneja, pero no crea)
 */
class VentaService
{
    use ManagesTransactions, LogsOperations;

    public function __construct(
        private StockService $stockService,
        private ContabilidadService $contabilidadService,
    ) {}

    /**
     * Crear una venta
     *
     * FLUJO:
     * 1. Validar datos
     * 2. Validar stock disponible
     * 3. Crear Venta en DB (transacción)
     * 4. Crear DetalleVenta
     * 5. Consumir stock
     * 6. Crear asientos contables
     * 7. Emitir evento VentaCreada
     * 8. Retornar DTO
     *
     * @throws StockInsuficientException
     * @throws \InvalidArgumentException
     */
    public function crear(CrearVentaDTO $dto): VentaResponseDTO
    {
        // 1. Validar datos
        $dto->validarDetalles();

        // 2. Validar stock ANTES de la transacción
        $validacionStock = $this->stockService->validarDisponible(
            $dto->detalles,
            $dto->almacen_id
        );

        if (!$validacionStock['valido']) {
            throw StockInsuficientException::create($validacionStock['detalles']);
        }

        // 3. Crear dentro de transacción
        $venta = $this->transaction(function () use ($dto) {
            // 3.1 Crear Venta
            $venta = Venta::create([
                'cliente_id' => $dto->cliente_id,
                'usuario_id' => $dto->usuario_id ?? Auth::id(),
                'fecha' => $dto->fecha,
                'subtotal' => $dto->subtotal,
                'impuesto' => $dto->impuesto,
                'total' => $dto->total,
                'estado' => 'PENDIENTE',
                'observaciones' => $dto->observaciones,
                'almacen_id' => $dto->almacen_id,
            ]);

            // 3.2 Crear detalles
            foreach ($dto->detalles as $detalle) {
                VentaDetalle::create([
                    'venta_id' => $venta->id,
                    'producto_id' => $detalle['producto_id'],
                    'cantidad' => $detalle['cantidad'],
                    'precio_unitario' => $detalle['precio_unitario'],
                    'subtotal' => $detalle['cantidad'] * $detalle['precio_unitario'],
                ]);
            }

            // 3.3 Consumir stock (Service maneja su propia lógica dentro de transacción)
            $this->stockService->procesarSalidaVenta(
                $dto->detalles,
                "VENTA#{$venta->id}",
                $dto->almacen_id
            );

            // 3.4 Crear asiento contable
            $this->contabilidadService->crearAsientoVenta($venta);

            // 3.5 Emitir evento (DESPUÉS de que todo esté persisted)
            event(new \App\Events\VentaCreada($venta));

            return $venta;
        });

        // 4. Log de éxito
        $this->logSuccess('Venta creada exitosamente', [
            'venta_id' => $venta->id,
            'cliente_id' => $venta->cliente_id,
            'total' => $venta->total,
        ]);

        // 5. Retornar DTO
        return VentaResponseDTO::fromModel($venta);
    }

    /**
     * Aprobar una venta (cambiar de PENDIENTE a APROBADA)
     *
     * @throws EstadoInvalidoException
     */
    public function aprobar(int $ventaId): VentaResponseDTO
    {
        $venta = $this->transaction(function () use ($ventaId) {
            // Obtener con lock pesimista
            $venta = Venta::lockForUpdate()->findOrFail($ventaId);

            // Validar transición de estado
            if ($venta->estado !== 'PENDIENTE') {
                throw EstadoInvalidoException::transicionInvalida(
                    'Venta',
                    $ventaId,
                    $venta->estado,
                    'APROBADA'
                );
            }

            // Cambiar estado
            $venta->update(['estado' => 'APROBADA']);

            // Emitir evento
            event(new \App\Events\VentaAprobada($venta));

            return $venta;
        });

        $this->logSuccess('Venta aprobada', ['venta_id' => $ventaId]);

        return VentaResponseDTO::fromModel($venta);
    }

    /**
     * Rechazar una venta (cambiar a RECHAZADA)
     *
     * Implica revertir stock, contabilidad, etc
     *
     * @throws EstadoInvalidoException
     */
    public function rechazar(int $ventaId, string $motivo = ''): VentaResponseDTO
    {
        $venta = $this->transaction(function () use ($ventaId, $motivo) {
            $venta = Venta::lockForUpdate()->findOrFail($ventaId);

            // Si ya está entregada o pagada, no se puede rechazar
            if (in_array($venta->estado, ['ENTREGADA', 'PAGADA', 'CERRADA'])) {
                throw EstadoInvalidoException::transicionInvalida(
                    'Venta',
                    $ventaId,
                    $venta->estado,
                    'RECHAZADA'
                );
            }

            // Revertir stock si ya se consumió
            if ($venta->estado === 'APROBADA') {
                $this->stockService->devolverStock(
                    $venta->detalles->toArray(),
                    "VENTA#{$ventaId}-RECHAZO",
                    $venta->almacen_id
                );
            }

            // Cambiar estado
            $venta->update([
                'estado' => 'RECHAZADA',
                'observaciones' => ($venta->observaciones ?? '') . "\nMotivo rechazo: {$motivo}",
            ]);

            // Emitir evento
            event(new \App\Events\VentaRechazada($venta, $motivo));

            return $venta;
        });

        $this->logSuccess('Venta rechazada', [
            'venta_id' => $ventaId,
            'motivo' => $motivo,
        ]);

        return VentaResponseDTO::fromModel($venta);
    }

    /**
     * Obtener una venta por ID
     */
    public function obtener(int $ventaId): VentaResponseDTO
    {
        $venta = $this->read(fn() => Venta::with(['detalles', 'cliente'])->findOrFail($ventaId));

        return VentaResponseDTO::fromModel($venta);
    }

    /**
     * Listar ventas con paginación
     *
     * @param int $perPage
     * @param array $filtros Puede incluir: estado, cliente_id, fecha_desde, fecha_hasta
     */
    public function listar(int $perPage = 15, array $filtros = []): LengthAwarePaginator
    {
        return $this->read(function () use ($perPage, $filtros) {
            $query = Venta::with(['cliente', 'detalles'])
                ->when($filtros['estado'] ?? null, fn($q, $estado) =>
                    $q->where('estado', $estado)
                )
                ->when($filtros['cliente_id'] ?? null, fn($q, $clienteId) =>
                    $q->where('cliente_id', $clienteId)
                )
                ->when($filtros['fecha_desde'] ?? null, fn($q, $fecha) =>
                    $q->where('fecha', '>=', $fecha)
                )
                ->when($filtros['fecha_hasta'] ?? null, fn($q, $fecha) =>
                    $q->where('fecha', '<=', $fecha)
                );

            return $query
                ->orderByDesc('fecha')
                ->orderByDesc('id')
                ->paginate($perPage);
        });
    }

    /**
     * Registrar pago en venta
     *
     * @throws EstadoInvalidoException
     */
    public function registrarPago(int $ventaId, float $monto): VentaResponseDTO
    {
        $venta = $this->transaction(function () use ($ventaId, $monto) {
            $venta = Venta::lockForUpdate()->findOrFail($ventaId);

            // Validar que esté en estado para pagar
            if (!in_array($venta->estado, ['ENTREGADA', 'PAGADA'])) {
                throw EstadoInvalidoException::transicionInvalida(
                    'Venta',
                    $ventaId,
                    $venta->estado,
                    'PAGADA'
                );
            }

            // Crear registro de pago
            \App\Models\Pago::create([
                'venta_id' => $ventaId,
                'usuario_id' => Auth::id(),
                'monto' => $monto,
                'fecha' => now(),
            ]);

            // Calcular total pagado
            $totalPagado = $venta->pagos()->sum('monto') + $monto;

            // Si está completamente pagada, cambiar estado
            if ($totalPagado >= $venta->total) {
                $venta->update(['estado' => 'PAGADA']);
                event(new \App\Events\VentaPagada($venta, $monto));
            }

            return $venta;
        });

        $this->logSuccess('Pago registrado en venta', [
            'venta_id' => $ventaId,
            'monto' => $monto,
        ]);

        return VentaResponseDTO::fromModel($venta);
    }
}
