<?php

namespace App\Services\Logistica;

use App\Models\Entrega;
use App\Models\Venta;
use Illuminate\Support\Facades\Log;

/**
 * SincronizacionVentaEntregaService
 *
 * Responsable de mantener sincronizado el estado logístico de las ventas
 * con los estados de las entregas asociadas.
 *
 * Mapeo de Estados:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ ESTADO VENTA → DESENCADENANTE → ESTADO ENTREGA              │
 * ├─────────────────────────────────────────────────────────────┤
 * │ SIN_ENTREGA → Se crea entrega → PROGRAMADO                 │
 * │ EN_PREPARACION → Entrega pasa a EN_CARGA → EN_PREPARACION  │
 * │ EN_TRANSITO → Entrega pasa a EN_TRANSITO → EN_TRANSITO     │
 * │ ENTREGADA → Entrega es ENTREGADA → ENTREGADA               │
 * │ PROBLEMAS → Entrega es RECHAZADA/NOVEDAD → PROBLEMAS       │
 * │ CANCELADA → Entrega es CANCELADA → CANCELADA               │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Estados Logísticos de Venta:
 * - SIN_ENTREGA: No tiene entregas asignadas
 * - PROGRAMADO: Tiene entregas en estado PROGRAMADO
 * - EN_PREPARACION: Tiene entregas en preparación de carga
 * - EN_TRANSITO: Tiene entregas en tránsito
 * - ENTREGADA: Todas las entregas han sido entregadas
 * - PROBLEMAS: Una o más entregas con novedad/rechazo
 * - CANCELADA: Todas las entregas fueron canceladas
 */
class SincronizacionVentaEntregaService
{
    /**
     * Estados válidos de logística en venta
     */
    private const ESTADOS_LOGISTICOS = [
        'SIN_ENTREGA',          // Sin entregas
        'PROGRAMADO',           // En espera de asignación
        'EN_PREPARACION',       // Preparando carga
        'EN_TRANSITO',          // En camino
        'ENTREGADA',            // Entregada exitosamente
        'PROBLEMAS',            // Con novedad o rechazo
        'CANCELADA',            // Cancelada
    ];

    /**
     * Mapeo de estados de entrega a estados logísticos de venta
     */
    private static array $mapeoEstados = [
        'PROGRAMADO' => 'PROGRAMADO',
        'ASIGNADA' => 'PROGRAMADO',
        'PREPARACION_CARGA' => 'EN_PREPARACION',
        'EN_CARGA' => 'EN_PREPARACION',
        'LISTO_PARA_ENTREGA' => 'EN_PREPARACION',
        'EN_CAMINO' => 'EN_TRANSITO',
        'EN_TRANSITO' => 'EN_TRANSITO',
        'LLEGO' => 'EN_TRANSITO',
        'ENTREGADO' => 'ENTREGADA',
        'NOVEDAD' => 'PROBLEMAS',
        'RECHAZADO' => 'PROBLEMAS',
        'CANCELADA' => 'CANCELADA',
        'PENDIENTE' => 'PROGRAMADO',
    ];

    /**
     * Actualizar estado logístico de la venta cuando se crea una entrega
     */
    public function alCrearEntrega(Entrega $entrega): void
    {
        if (!$entrega->venta_id) {
            return;
        }

        $venta = $entrega->venta;
        if (!$venta) {
            return;
        }

        // Determinar nuevo estado logístico
        $nuevoEstado = $this->determinarEstadoLogistico($venta);

        Log::info('Sincronización: Entrega creada', [
            'venta_id' => $venta->id,
            'entrega_id' => $entrega->id,
            'estado_anterior' => $venta->estado_logistico,
            'estado_nuevo' => $nuevoEstado,
        ]);

        // Actualizar solo si cambió
        if ($venta->estado_logistico !== $nuevoEstado) {
            $venta->update(['estado_logistico' => $nuevoEstado]);
        }
    }

    /**
     * Actualizar estado logístico cuando cambia el estado de la entrega
     */
    public function alCambiarEstadoEntrega(Entrega $entrega, string $estadoAnterior, string $estadoNuevo): void
    {
        if (!$entrega->venta_id) {
            return;
        }

        $venta = $entrega->venta;
        if (!$venta) {
            return;
        }

        // Determinar nuevo estado logístico de venta
        $nuevoEstadoVenta = $this->determinarEstadoLogistico($venta);

        Log::info('Sincronización: Estado de entrega cambió', [
            'venta_id' => $venta->id,
            'entrega_id' => $entrega->id,
            'estado_entrega_anterior' => $estadoAnterior,
            'estado_entrega_nuevo' => $estadoNuevo,
            'estado_venta_anterior' => $venta->estado_logistico,
            'estado_venta_nuevo' => $nuevoEstadoVenta,
        ]);

        // Actualizar solo si cambió
        if ($venta->estado_logistico !== $nuevoEstadoVenta) {
            $venta->update(['estado_logistico' => $nuevoEstadoVenta]);
        }
    }

    /**
     * Determinar el estado logístico de una venta basado en sus entregas
     *
     * Lógica:
     * 1. Si no tiene entregas → SIN_ENTREGA
     * 2. Si alguna está en PROBLEMAS → PROBLEMAS
     * 3. Si todas están CANCELADAS → CANCELADA
     * 4. Si todas están ENTREGADAS → ENTREGADA
     * 5. Si alguna está EN_TRANSITO → EN_TRANSITO
     * 6. Si alguna está EN_PREPARACION → EN_PREPARACION
     * 7. Si alguna está PROGRAMADO → PROGRAMADO
     * 8. Por defecto → PROGRAMADO
     */
    public function determinarEstadoLogistico(Venta $venta): string
    {
        $entregas = $venta->entregas()
            ->select('id', 'estado')
            ->get();

        // Si no hay entregas
        if ($entregas->isEmpty()) {
            return 'SIN_ENTREGA';
        }

        $estados = $entregas->pluck('estado')->toArray();

        // Obtener estados únicos
        $estadosUnicos = array_unique($estados);

        // Prioridad: PROBLEMAS > CANCELADA > ENTREGADA > EN_TRANSITO > EN_PREPARACION > PROGRAMADO

        // 1. Si alguna tiene problemas
        if (
            in_array('NOVEDAD', $estadosUnicos) ||
            in_array('RECHAZADO', $estadosUnicos)
        ) {
            return 'PROBLEMAS';
        }

        // 2. Si todas están canceladas
        if (count($estadosUnicos) === 1 && in_array('CANCELADA', $estadosUnicos)) {
            return 'CANCELADA';
        }

        // 3. Si todas están entregadas
        if (count($estadosUnicos) === 1 && in_array('ENTREGADO', $estadosUnicos)) {
            return 'ENTREGADA';
        }

        // 4. Si alguna está en tránsito
        if (
            in_array('EN_TRANSITO', $estadosUnicos) ||
            in_array('EN_CAMINO', $estadosUnicos) ||
            in_array('LLEGO', $estadosUnicos)
        ) {
            return 'EN_TRANSITO';
        }

        // 5. Si alguna está en preparación
        if (
            in_array('PREPARACION_CARGA', $estadosUnicos) ||
            in_array('EN_CARGA', $estadosUnicos) ||
            in_array('LISTO_PARA_ENTREGA', $estadosUnicos)
        ) {
            return 'EN_PREPARACION';
        }

        // 6. Por defecto PROGRAMADO
        return 'PROGRAMADO';
    }

    /**
     * Obtener información de entregas para una venta
     */
    public function obtenerDetalleEntregas(Venta $venta): array
    {
        $entregas = $venta->entregas()
            ->select('id', 'estado', 'fecha_programada', 'chofer_id', 'vehiculo_id')
            ->with(['chofer:id,nombre', 'vehiculo:id,placa'])
            ->get();

        return [
            'total_entregas' => $entregas->count(),
            'estado_logistico_actual' => $venta->estado_logistico,
            'estado_logistico_calculado' => $this->determinarEstadoLogistico($venta),
            'entregas' => $entregas->map(function ($entrega) {
                return [
                    'id' => $entrega->id,
                    'estado' => $entrega->estado,
                    'estado_logistico_venta' => self::$mapeoEstados[$entrega->estado] ?? 'DESCONOCIDO',
                    'fecha_programada' => $entrega->fecha_programada,
                    'chofer' => $entrega->chofer?->nombre ?? 'Sin asignar',
                    'vehiculo' => $entrega->vehiculo?->placa ?? 'Sin asignar',
                ];
            })->toArray(),
        ];
    }

    /**
     * Resincronizar estados de todas las ventas (útil para auditoría)
     * Solo debe ejecutarse si se detectan inconsistencias
     */
    public function resincronizarTodas(): array
    {
        $ventasActualizadas = [];
        $ventasConError = [];

        $ventas = Venta::whereHas('entregas')->get();

        foreach ($ventas as $venta) {
            try {
                $estadoAntiguo = $venta->estado_logistico;
                $estadoNuevo = $this->determinarEstadoLogistico($venta);

                if ($estadoAntiguo !== $estadoNuevo) {
                    $venta->update(['estado_logistico' => $estadoNuevo]);

                    $ventasActualizadas[] = [
                        'venta_id' => $venta->id,
                        'numero' => $venta->numero,
                        'estado_anterior' => $estadoAntiguo,
                        'estado_nuevo' => $estadoNuevo,
                    ];

                    Log::info('Resincronización: Venta actualizada', [
                        'venta_id' => $venta->id,
                        'numero' => $venta->numero,
                        'estado_anterior' => $estadoAntiguo,
                        'estado_nuevo' => $estadoNuevo,
                    ]);
                }
            } catch (\Exception $e) {
                $ventasConError[] = [
                    'venta_id' => $venta->id,
                    'numero' => $venta->numero,
                    'error' => $e->getMessage(),
                ];

                Log::error('Error resincronizando venta', [
                    'venta_id' => $venta->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return [
            'total_procesadas' => count($ventasActualizadas) + count($ventasConError),
            'total_actualizadas' => count($ventasActualizadas),
            'total_errores' => count($ventasConError),
            'actualizadas' => $ventasActualizadas,
            'errores' => $ventasConError,
        ];
    }

    /**
     * Obtener estadísticas de entregas por estado logístico
     */
    public function obtenerEstadisticas(): array
    {
        $estadisticas = [];

        foreach (self::ESTADOS_LOGISTICOS as $estado) {
            $count = Venta::where('estado_logistico', $estado)
                ->whereHas('entregas')
                ->count();

            $estadisticas[$estado] = $count;
        }

        return $estadisticas;
    }
}
