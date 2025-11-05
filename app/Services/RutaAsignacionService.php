<?php

namespace App\Services;

use App\Models\Envio;
use App\Models\Ruta;
use App\Models\RutaDetalle;
use App\Models\Zona;
use App\Models\Empleado;
use Illuminate\Database\Eloquent\Collection;
use Exception;
use Illuminate\Support\Facades\DB;

/**
 * Servicio para crear y asignar rutas automáticamente por zonas
 */
class RutaAsignacionService
{
    /**
     * Crear rutas automáticas para hoy agrupando envíos por zona
     *
     * @param array $opciones Opciones de configuración
     * @return Collection Rutas creadas
     * @throws Exception
     */
    public function crearRutasDelDia(array $opciones = []): Collection
    {
        $fecha = $opciones['fecha'] ?? today();
        $choferesPorZona = $opciones['choferes'] ?? []; // Mapeo manual de zona->chofer si existe
        $rutasCreadas = collect();

        // Obtener envíos pendientes de hoy agrupados por zona
        $enviosPorZona = $this->obtenerEnviosPorZona($fecha);

        DB::transaction(function () use ($enviosPorZona, $choferesPorZona, $fecha, &$rutasCreadas) {
            foreach ($enviosPorZona as $zonaId => $envios) {
                try {
                    $ruta = $this->crearRutaPorZona(
                        $zonaId,
                        $envios,
                        $choferesPorZona[$zonaId] ?? null,
                        $fecha
                    );

                    if ($ruta) {
                        $rutasCreadas->push($ruta);
                    }
                } catch (Exception $e) {
                    // Log del error pero continúa con siguiente zona
                    \Log::error("Error creando ruta para zona {$zonaId}: " . $e->getMessage());
                }
            }
        });

        return $rutasCreadas;
    }

    /**
     * Obtener envíos pendientes agrupados por zona
     */
    private function obtenerEnviosPorZona($fecha): array
    {
        $envios = Envio::whereDate('fecha_envio', $fecha)
            ->where('estado', 'confirmada') // Solo confirmadas
            ->with(['cliente.zona'])
            ->get();

        $agrupadosPorZona = [];

        foreach ($envios as $envio) {
            if (!$envio->cliente || !$envio->cliente->zona_id) {
                continue; // Saltar envíos sin zona
            }

            $zonaId = $envio->cliente->zona_id;

            if (!isset($agrupadosPorZona[$zonaId])) {
                $agrupadosPorZona[$zonaId] = [];
            }

            $agrupadosPorZona[$zonaId][] = $envio;
        }

        return $agrupadosPorZona;
    }

    /**
     * Crear una ruta para una zona específica
     */
    private function crearRutaPorZona(int $zonaId, array $envios, ?int $choferIdSolicitado, $fecha): ?Ruta
    {
        $zona = Zona::findOrFail($zonaId);

        // Obtener chofer disponible
        $chofer = $this->asignarChofer($zonaId, $choferIdSolicitado);

        if (!$chofer) {
            throw new Exception("No hay chofer disponible para la zona {$zona->nombre}");
        }

        // Crear ruta
        $ruta = Ruta::create([
            'codigo' => Ruta::generarCodigo($zona),
            'fecha_ruta' => $fecha,
            'zona_id' => $zonaId,
            'chofer_id' => $chofer->id,
            'vehiculo_id' => $this->asignarVehiculo($chofer)?->id,
            'estado' => 'planificada',
            'creado_por' => auth()->id(),
        ]);

        // Agregar detalles de ruta (entregas)
        $this->agregarDetallesRuta($ruta, $envios);

        // Actualizar cantidad de paradas
        $ruta->recalcularParadas();

        return $ruta;
    }

    /**
     * Asignar un chofer a una zona
     */
    private function asignarChofer(?int $zonaId, ?int $choferIdSolicitado): ?Empleado
    {
        // Si se solicita un chofer específico
        if ($choferIdSolicitado) {
            return Empleado::where('id', $choferIdSolicitado)
                ->whereHasRole('Chofer')
                ->activos()
                ->first();
        }

        // Si la zona tiene preventista, ¿preferir su chofer?
        $zona = Zona::find($zonaId);
        if ($zona && $zona->preventista_id) {
            // Podría haber relación chofer preferido del preventista
            // Por ahora, usar estrategia general
        }

        // Obtener chofer menos cargado
        return $this->obtenerChoferMenosCargado($zonaId);
    }

    /**
     * Obtener el chofer con menos rutas hoy (menos cargado)
     */
    private function obtenerChoferMenosCargado(?int $zonaId = null): ?Empleado
    {
        $query = Empleado::query()
            ->activos()
            ->whereHasRole('Chofer')
            ->with('user')
            ->withCount(['rutasAsignadas' => function ($q) {
                $q->whereDate('fecha_ruta', today())
                    ->whereIn('estado', ['planificada', 'en_progreso']);
            }]);

        if ($zonaId) {
            $query->whereHas('zona', function ($q) use ($zonaId) {
                $q->where('zonas.id', $zonaId);
            });
        }

        return $query->orderBy('rutas_asignadas_count', 'asc')->first();
    }

    /**
     * Asignar vehículo disponible al chofer
     */
    private function asignarVehiculo(Empleado $chofer): ?Vehiculo
    {
        // Obtener vehículo disponible para hoy
        return \App\Models\Vehiculo::disponibles()
            ->whereDate('fecha', today())
            ->first();
    }

    /**
     * Agregar detalles de ruta (entregas/paradas)
     */
    private function agregarDetallesRuta(Ruta $ruta, array $envios): void
    {
        $secuencia = 1;

        // Ordenar envíos por distancia o secuencia óptima
        $enviosOrdenados = $this->optimizarSecuenciaEntregas($ruta->zona, $envios);

        foreach ($enviosOrdenados as $envio) {
            RutaDetalle::create([
                'ruta_id' => $ruta->id,
                'cliente_id' => $envio->cliente_id,
                'envio_id' => $envio->id,
                'secuencia' => $secuencia++,
                'direccion_entrega' => $envio->cliente->direccion,
                'latitud' => $envio->cliente->latitud,
                'longitud' => $envio->cliente->longitud,
                'estado' => 'pendiente',
                'hora_entrega_estimada' => $this->calcularHoraEstimada($ruta->zona, $secuencia),
            ]);

            // Actualizar estado del envío
            $envio->update(['estado' => 'en_ruta']);
        }
    }

    /**
     * Optimizar la secuencia de entregas usando algoritmo simple
     * Podría mejorarse con algoritmo TSP (Traveling Salesman Problem)
     */
    private function optimizarSecuenciaEntregas(Zona $zona, array $envios)
    {
        // Por ahora, ordenar por distancia al primer punto (simple)
        // TODO: Implementar algoritmo de optimización de ruta

        usort($envios, function ($a, $b) use ($zona) {
            $distA = $this->calcularDistancia(
                $zona->latitud_centro,
                $zona->longitud_centro,
                $a->cliente->latitud,
                $a->cliente->longitud
            );

            $distB = $this->calcularDistancia(
                $zona->latitud_centro,
                $zona->longitud_centro,
                $b->cliente->latitud,
                $b->cliente->longitud
            );

            return $distA <=> $distB;
        });

        return $envios;
    }

    /**
     * Calcular distancia entre dos puntos (Fórmula Haversine)
     */
    private function calcularDistancia($lat1, $lon1, $lat2, $lon2): float
    {
        $R = 6371; // Radio tierra en km

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        $distance = $R * $c;

        return $distance;
    }

    /**
     * Calcular hora estimada de entrega
     */
    private function calcularHoraEstimada(Zona $zona, int $secuencia)
    {
        $horaInicio = now()->setHour(8)->setMinute(0);
        $tiempoPromedio = $zona->tiempo_estimado_entrega ?? 30; // 30 minutos por defecto

        return $horaInicio->addMinutes($tiempoPromedio * $secuencia);
    }

    /**
     * Validar que una ruta puede ser iniciada
     */
    public function validarInicio(Ruta $ruta): array
    {
        $errores = [];

        if ($ruta->estado !== 'planificada') {
            $errores[] = "La ruta debe estar en estado planificada";
        }

        if ($ruta->detalles()->count() === 0) {
            $errores[] = "La ruta no tiene entregas asignadas";
        }

        if (!$ruta->chofer || $ruta->chofer->estado !== 'activo') {
            $errores[] = "El chofer no está disponible";
        }

        return $errores;
    }

    /**
     * Iniciar una ruta
     */
    public function iniciarRuta(Ruta $ruta): bool
    {
        $errores = $this->validarInicio($ruta);

        if (!empty($errores)) {
            throw new Exception(implode(', ', $errores));
        }

        return $ruta->iniciar();
    }

    /**
     * Completar una ruta
     */
    public function completarRuta(Ruta $ruta): bool
    {
        if ($ruta->estado !== 'en_progreso') {
            throw new Exception('Solo se pueden completar rutas en progreso');
        }

        return $ruta->completar();
    }

    /**
     * Registrar entrega
     */
    public function registrarEntrega(RutaDetalle $detalle, array $datos): bool
    {
        if (!isset($datos['estado']) || !in_array($datos['estado'], ['entregado', 'no_entregado', 'reprogramado'])) {
            throw new Exception('Estado de entrega inválido');
        }

        if ($datos['estado'] === 'entregado') {
            return $detalle->marcarEntregado($datos);
        } elseif ($datos['estado'] === 'no_entregado') {
            return $detalle->marcarNoEntregado($datos['razon'] ?? 'Sin especificar');
        } elseif ($datos['estado'] === 'reprogramado') {
            return $detalle->reprogramar($datos['razon'] ?? 'Reprogramado');
        }

        return false;
    }

    /**
     * Obtener estadísticas de ruta
     */
    public function obtenerEstadisticas(Ruta $ruta): array
    {
        $progreso = $ruta->obtenerProgreso();

        return array_merge($progreso, [
            'estado' => $ruta->estado,
            'chofer' => $ruta->chofer?->user?->name,
            'zona' => $ruta->zona?->nombre,
            'distancia_km' => $ruta->distancia_km,
            'hora_salida' => $ruta->hora_salida,
            'hora_llegada' => $ruta->hora_llegada,
            'tiempo_real_minutos' => $ruta->tiempo_real_minutos,
        ]);
    }
}
