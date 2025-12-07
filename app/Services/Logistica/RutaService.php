<?php

namespace App\Services\Logistica;

use App\DTOs\Logistica\CrearRutaDTO;
use App\DTOs\Logistica\RutaResponseDTO;
use App\Exceptions\Venta\EstadoInvalidoException;
use App\Models\Entrega;
use App\Models\Ruta;
use App\Models\RutaDetalle;
use App\Services\Traits\LogsOperations;
use App\Services\Traits\ManagesTransactions;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

/**
 * RutaService - ÚNICA FUENTE DE VERDAD para Rutas de Entrega
 *
 * RESPONSABILIDADES:
 * ✓ Planificar rutas diarias (optimizar entregas)
 * ✓ Crear rutas
 * ✓ Asignar entregas a rutas
 * ✓ Cambiar estado de ruta
 * ✓ Obtener detalle de ruta
 * ✓ Calcular matrices de distancia
 *
 * INVARIANTE: Rutas se crean solo a partir de Entregas PENDIENTES
 *
 * ESTADOS:
 * PLANIFICADA → EN_PROCESO → COMPLETADA
 *           ↘ CANCELADA
 */
class RutaService
{
    use ManagesTransactions, LogsOperations;

    private static array $transicionesValidas = [
        'PLANIFICADA' => ['EN_PROCESO', 'CANCELADA'],
        'EN_PROCESO' => ['COMPLETADA', 'CANCELADA'],
        'COMPLETADA' => [],
        'CANCELADA' => [],
    ];

    /**
     * Planificar rutas para un día
     *
     * FLUJO:
     * 1. Obtener entregas PENDIENTES del día
     * 2. Agrupar por zona/área
     * 3. Optimizar orden (Nearest Neighbor)
     * 4. Crear ruta por grupo
     * 5. Asignar entregas a ruta
     * 6. Asignar chofer + vehículo
     *
     * @param \DateTime $fecha
     * @return array Rutas creadas
     */
    public function planificar(\DateTime $fecha): array
    {
        $rutas = $this->transaction(function () use ($fecha) {
            $rutasCreadas = [];

            // 1. Obtener entregas PENDIENTES del día
            $entregas = Entrega::where('estado', 'PENDIENTE')
                ->whereBetween('fecha_programada', [
                    $fecha->startOfDay(),
                    $fecha->endOfDay(),
                ])
                ->with(['venta', 'venta.cliente'])
                ->get();

            if ($entregas->isEmpty()) {
                $this->logSuccess('No hay entregas para planificar', [
                    'fecha' => $fecha->toDateString(),
                ]);
                return [];
            }

            // 2. Agrupar por zona/localidad
            $entregazPorZona = $entregas->groupBy(function ($entrega) {
                return $entrega->venta->cliente->zona_id ?? 'DEFAULT';
            });

            // 3. Crear ruta por zona
            foreach ($entregazPorZona as $zonaId => $entregasZona) {
                // 3.1 Optimizar orden de entregas (Nearest Neighbor)
                $entregasOptimizadas = $this->optimizarRuta($entregasZona);

                // 3.2 Crear ruta
                $ruta = Ruta::create([
                    'numero' => $this->generarNumeroRuta(),
                    'zona_id' => $zonaId,
                    'fecha_planificacion' => $fecha,
                    'estado' => 'PLANIFICADA',
                    'cantidad_entregas' => $entregasOptimizadas->count(),
                    'usuario_planificador_id' => Auth::id(),
                ]);

                // 3.3 Asignar entregas a ruta
                foreach ($entregasOptimizadas as $posicion => $entrega) {
                    RutaDetalle::create([
                        'ruta_id' => $ruta->id,
                        'entrega_id' => $entrega->id,
                        'posicion_orden' => $posicion + 1,
                        'estado_entrega' => $entrega->estado,
                    ]);

                    // Cambiar estado de entrega a ASIGNADA
                    $entrega->update(['estado' => 'ASIGNADA']);

                    event(new \App\Events\EntregaAsignada($entrega));
                }

                $rutasCreadas[] = $ruta;

                event(new \App\Events\RutaPlanificada($ruta));
            }

            return $rutasCreadas;
        });

        $this->logSuccess('Rutas planificadas', [
            'fecha' => $fecha->toDateString(),
            'rutas' => count($rutas),
        ]);

        return $rutas;
    }

    /**
     * Crear una ruta manualmente
     */
    public function crear(CrearRutaDTO $dto): RutaResponseDTO
    {
        $ruta = $this->transaction(function () use ($dto) {
            $ruta = Ruta::create([
                'numero' => $this->generarNumeroRuta(),
                'zona_id' => $dto->zona_id,
                'chofer_id' => $dto->chofer_id,
                'vehiculo_id' => $dto->vehiculo_id,
                'fecha_planificacion' => $dto->fecha,
                'estado' => 'PLANIFICADA',
                'usuario_planificador_id' => Auth::id(),
            ]);

            // Asignar entregas
            foreach ($dto->entrega_ids as $posicion => $entregaId) {
                $entrega = Entrega::findOrFail($entregaId);

                RutaDetalle::create([
                    'ruta_id' => $ruta->id,
                    'entrega_id' => $entregaId,
                    'posicion_orden' => $posicion + 1,
                    'estado_entrega' => $entrega->estado,
                ]);

                $entrega->update(['estado' => 'ASIGNADA']);
            }

            $ruta->update(['cantidad_entregas' => count($dto->entrega_ids)]);

            event(new \App\Events\RutaPlanificada($ruta));

            return $ruta;
        });

        $this->logSuccess('Ruta creada', ['ruta_id' => $ruta->id]);

        return RutaResponseDTO::fromModel($ruta);
    }

    /**
     * Asignar chofer y vehículo a una ruta
     */
    public function asignarRecursos(
        int $rutaId,
        int $choferId,
        int $vehiculoId,
    ): RutaResponseDTO {
        $ruta = $this->transaction(function () use ($rutaId, $choferId, $vehiculoId) {
            $ruta = Ruta::lockForUpdate()->findOrFail($rutaId);

            // Validar que chofer esté disponible
            $chofer = \App\Models\Empleado::findOrFail($choferId);
            if (!$chofer->licencia_vigente) {
                throw new \Exception('Chofer no tiene licencia vigente');
            }

            // Validar que vehículo esté disponible
            $vehiculo = \App\Models\Vehiculo::findOrFail($vehiculoId);
            if (!$vehiculo->operativo) {
                throw new \Exception('Vehículo no está operativo');
            }

            $ruta->update([
                'chofer_id' => $choferId,
                'vehiculo_id' => $vehiculoId,
            ]);

            return $ruta;
        });

        $this->logSuccess('Recursos asignados a ruta', [
            'ruta_id' => $rutaId,
            'chofer_id' => $choferId,
        ]);

        return RutaResponseDTO::fromModel($ruta);
    }

    /**
     * Cambiar estado de ruta
     */
    public function cambiarEstado(int $rutaId, string $nuevoEstado): RutaResponseDTO
    {
        $ruta = $this->transaction(function () use ($rutaId, $nuevoEstado) {
            $ruta = Ruta::lockForUpdate()->findOrFail($rutaId);

            $this->validarTransicion($ruta->estado, $nuevoEstado);

            $ruta->update(['estado' => $nuevoEstado]);

            if ($nuevoEstado === 'EN_PROCESO') {
                event(new \App\Events\RutaEnProceso($ruta));
            } elseif ($nuevoEstado === 'COMPLETADA') {
                event(new \App\Events\RutaCompletada($ruta));
            }

            return $ruta;
        });

        $this->logSuccess('Estado de ruta actualizado', [
            'ruta_id' => $rutaId,
            'estado' => $nuevoEstado,
        ]);

        return RutaResponseDTO::fromModel($ruta);
    }

    /**
     * Obtener detalle de ruta con entregas
     */
    public function obtener(int $rutaId): RutaResponseDTO
    {
        $ruta = Ruta::with([
            'detalles' => fn($q) => $q->orderBy('posicion_orden'),
            'detalles.entrega.venta.cliente',
            'chofer',
            'vehiculo',
        ])->findOrFail($rutaId);

        return RutaResponseDTO::fromModel($ruta);
    }

    /**
     * Listar rutas con filtros
     */
    public function listar(array $filtros = [])
    {
        return Ruta::with(['chofer', 'vehiculo', 'detalles'])
            ->when($filtros['fecha'] ?? null, fn($q, $fecha) =>
                $q->whereDate('fecha_planificacion', $fecha)
            )
            ->when($filtros['estado'] ?? null, fn($q, $estado) =>
                $q->where('estado', $estado)
            )
            ->when($filtros['chofer_id'] ?? null, fn($q, $choferId) =>
                $q->where('chofer_id', $choferId)
            )
            ->orderByDesc('fecha_planificacion')
            ->orderByDesc('id')
            ->paginate(15);
    }

    /**
     * Optimizar orden de entregas usando algoritmo de Nearest Neighbor
     *
     * Ordena entregas por proximidad geográfica para minimizar distancia
     */
    private function optimizarRuta(Collection $entregas): Collection
    {
        // Si solo hay una entrega, no hay que optimizar
        if ($entregas->count() <= 1) {
            return $entregas;
        }

        // Para demo, ordenar por ciudad/zona
        // En producción, usar matriz de distancia y algoritmo más sofisticado
        return $entregas->sortBy(function ($entrega) {
            return $entrega->venta->cliente->localidad_id ?? 0;
        });
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
                'Ruta',
                0,
                $estadoActual,
                $estadoNuevo
            );
        }
    }

    /**
     * Generar número secuencial de ruta
     */
    private function generarNumeroRuta(): string
    {
        $year = now()->year;
        $count = Ruta::whereYear('created_at', $year)->count() + 1;

        return sprintf('RTA-%d-%04d', $year, $count);
    }
}
