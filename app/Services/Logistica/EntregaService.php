<?php

namespace App\Services\Logistica;

use App\DTOs\Logistica\EntregaResponseDTO;
use App\Exceptions\Venta\EstadoInvalidoException;
use App\Models\Entrega;
use App\Models\EntregaEstadoHistorial;
use App\Models\Venta;
use App\Services\Stock\StockService;
use App\Services\Traits\LogsOperations;
use App\Services\Traits\ManagesTransactions;
use Illuminate\Support\Facades\Auth;

/**
 * EntregaService - Logística de entregas
 *
 * RESPONSABILIDADES:
 * ✓ Crear entregas desde ventas
 * ✓ Cambiar estado de entregas
 * ✓ Asignar chofer y vehículo
 * ✓ Registrar ubicación
 * ✓ Confirmar/rechazar entrega
 * ✓ Mantener historial de estados
 *
 * INVARIANTE: ÚNICO punto donde cambia estado de Entrega
 */
class EntregaService
{
    use ManagesTransactions, LogsOperations;

    private static array $transicionesValidas = [
        'PENDIENTE' => ['ASIGNADA', 'CANCELADA'],
        'ASIGNADA' => ['EN_CAMINO', 'PENDIENTE', 'CANCELADA'],
        'EN_CAMINO' => ['ENTREGADA', 'RECHAZADA', 'CANCELADA'],
        'ENTREGADA' => [],
        'RECHAZADA' => ['ASIGNADA'], // Para reintentar
        'CANCELADA' => [],
    ];

    public function __construct(
        private StockService $stockService,
    ) {}

    /**
     * Crear entregas desde una venta
     *
     * Se ejecuta después de que la venta es aprobada
     */
    public function crearDesdeVenta(Venta $venta): array
    {
        $entregas = $this->transaction(function () use ($venta) {
            $entregas = [];

            // Si la venta no requiere entrega (venta mostrador), no crear
            if (!$venta->requiere_envio) {
                return $entregas;
            }

            // Crear una entrega por cada dirección de entrega
            $direccion = $venta->direccion_entrega;

            $entrega = Entrega::create([
                'venta_id' => $venta->id,
                'estado' => 'PENDIENTE',
                'direccion' => $direccion,
                'fecha_programada' => $venta->fecha_entrega_programada ?? now()->addDays(3),
                'usuario_asignado_id' => Auth::id(),
            ]);

            // Registrar en historial
            $this->registrarCambioEstado(
                $entrega,
                null,
                'PENDIENTE',
                'Entrega creada desde venta'
            );

            event(new \App\Events\EntregaCreada($entrega));

            $entregas[] = $entrega;

            return $entregas;
        });

        $this->logSuccess('Entregas creadas desde venta', [
            'venta_id' => $venta->id,
            'entregas' => count($entregas),
        ]);

        return $entregas;
    }

    /**
     * Asignar chofer y vehículo a una entrega
     */
    public function asignarChoferVehiculo(
        int $entregaId,
        int $choferId,
        int $vehiculoId,
    ): EntregaResponseDTO {
        $entrega = $this->transaction(function () use (
            $entregaId,
            $choferId,
            $vehiculoId
        ) {
            $entrega = Entrega::lockForUpdate()->findOrFail($entregaId);

            // Validar transición
            if ($entrega->estado !== 'PENDIENTE') {
                throw EstadoInvalidoException::transicionInvalida(
                    'Entrega',
                    $entregaId,
                    $entrega->estado,
                    'ASIGNADA'
                );
            }

            // Validar que chofer y vehículo existan
            $chofer = \App\Models\Empleado::findOrFail($choferId);
            $vehiculo = \App\Models\Vehiculo::findOrFail($vehiculoId);

            // Validar que el chofer tenga licencia válida
            if (!$chofer->licencia_vigente) {
                throw new \Exception('Chofer no tiene licencia vigente');
            }

            // Actualizar entrega
            $entrega->update([
                'chofer_id' => $choferId,
                'vehiculo_id' => $vehiculoId,
                'estado' => 'ASIGNADA',
            ]);

            // Registrar cambio de estado
            $this->registrarCambioEstado(
                $entrega,
                'PENDIENTE',
                'ASIGNADA',
                "Asignado chofer: {$chofer->nombre}, Vehículo: {$vehiculo->placa}"
            );

            event(new \App\Events\EntregaAsignada($entrega));

            return $entrega;
        });

        $this->logSuccess('Entrega asignada', [
            'entrega_id' => $entregaId,
            'chofer_id' => $choferId,
        ]);

        return EntregaResponseDTO::fromModel($entrega);
    }

    /**
     * Cambiar entrega a "EN_CAMINO"
     */
    public function iniciarEntrega(int $entregaId): EntregaResponseDTO
    {
        $entrega = $this->transaction(function () use ($entregaId) {
            $entrega = Entrega::lockForUpdate()->findOrFail($entregaId);

            $this->validarTransicion($entrega->estado, 'EN_CAMINO');

            $entrega->update([
                'estado' => 'EN_CAMINO',
                'fecha_inicio' => now(),
            ]);

            $this->registrarCambioEstado(
                $entrega,
                'ASIGNADA',
                'EN_CAMINO',
                'Chofer inicia ruta'
            );

            event(new \App\Events\EntregaEnCamino($entrega));

            return $entrega;
        });

        $this->logSuccess('Entrega iniciada', ['entrega_id' => $entregaId]);

        return EntregaResponseDTO::fromModel($entrega);
    }

    /**
     * Confirmar entrega (éxito)
     */
    public function confirmar(
        int $entregaId,
        string $firma = null,
        array $fotos = [],
    ): EntregaResponseDTO {
        $entrega = $this->transaction(function () use ($entregaId, $firma, $fotos) {
            $entrega = Entrega::lockForUpdate()->findOrFail($entregaId);

            $this->validarTransicion($entrega->estado, 'ENTREGADA');

            $entrega->update([
                'estado' => 'ENTREGADA',
                'fecha_entrega' => now(),
                'firma' => $firma,
                'fotos_entrega' => json_encode($fotos),
            ]);

            $this->registrarCambioEstado(
                $entrega,
                'EN_CAMINO',
                'ENTREGADA',
                'Entrega confirmada por chofer'
            );

            // Actualizar venta
            $venta = $entrega->venta;
            if ($venta->estado === 'EN_ENTREGA') {
                $venta->update(['estado' => 'ENTREGADA']);
            }

            event(new \App\Events\EntregaCompletada($entrega));

            return $entrega;
        });

        $this->logSuccess('Entrega confirmada', ['entrega_id' => $entregaId]);

        return EntregaResponseDTO::fromModel($entrega);
    }

    /**
     * Rechazar entrega (fallo)
     */
    public function rechazar(
        int $entregaId,
        string $razon,
    ): EntregaResponseDTO {
        $entrega = $this->transaction(function () use ($entregaId, $razon) {
            $entrega = Entrega::lockForUpdate()->findOrFail($entregaId);

            $this->validarTransicion($entrega->estado, 'RECHAZADA');

            // Revertir stock si se consumió
            $venta = $entrega->venta;
            if ($venta->estado !== 'PENDIENTE') {
                $this->stockService->devolverStock(
                    $venta->detalles->toArray(),
                    "ENTREGA#{$entregaId}-RECHAZO",
                    $venta->almacen_id
                );
            }

            $entrega->update([
                'estado' => 'RECHAZADA',
                'razon_rechazo' => $razon,
                'fecha_rechazo' => now(),
            ]);

            $this->registrarCambioEstado(
                $entrega,
                'EN_CAMINO',
                'RECHAZADA',
                "Motivo: {$razon}"
            );

            // Actualizar venta
            $venta->update(['estado' => 'RECHAZADA']);

            event(new \App\Events\EntregaRechazada($entrega, $razon));

            return $entrega;
        });

        $this->logSuccess('Entrega rechazada', [
            'entrega_id' => $entregaId,
            'razon' => $razon,
        ]);

        return EntregaResponseDTO::fromModel($entrega);
    }

    /**
     * Obtener una entrega
     */
    public function obtener(int $entregaId): EntregaResponseDTO
    {
        $entrega = Entrega::with([
            'venta',
            'chofer',
            'vehiculo',
            'ubicaciones',
        ])->findOrFail($entregaId);

        return EntregaResponseDTO::fromModel($entrega);
    }

    /**
     * Validar si una transición de estado es válida
     *
     * @throws EstadoInvalidoException
     */
    private function validarTransicion(string $estadoActual, string $estadoNuevo): void
    {
        $permitidas = self::$transicionesValidas[$estadoActual] ?? [];

        if (!in_array($estadoNuevo, $permitidas)) {
            throw EstadoInvalidoException::transicionInvalida(
                'Entrega',
                0,
                $estadoActual,
                $estadoNuevo
            );
        }
    }

    /**
     * Registrar cambio de estado en historial
     *
     * IMPORTANTE: Se ejecuta DENTRO de una transacción
     */
    private function registrarCambioEstado(
        Entrega $entrega,
        ?string $estadoAnterior,
        string $estadoNuevo,
        string $razon = '',
    ): EntregaEstadoHistorial {
        return EntregaEstadoHistorial::create([
            'entrega_id' => $entrega->id,
            'estado_anterior' => $estadoAnterior,
            'estado_nuevo' => $estadoNuevo,
            'razon_cambio' => $razon,
            'usuario_id' => Auth::id(),
            'fecha' => now(),
        ]);
    }
}
