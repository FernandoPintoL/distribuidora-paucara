<?php

namespace App\Services\Logistica;

use App\Models\Empleado;
use App\Models\Entrega;
use App\Models\Vehiculo;
use App\Models\Venta;
use App\Services\Traits\LogsOperations;
use App\Services\Traits\ManagesTransactions;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * CrearEntregaPorLocalidadService
 *
 * FASE 3 - SERVICIO PRINCIPAL DE CREACIÓN DE ENTREGAS
 *
 * RESPONSABILIDADES:
 * ✓ Crear 1 Entrega consolidada con N Ventas
 * ✓ Asignar 1 Vehículo y 1 Chofer
 * ✓ Agrupar por Zona/Localidad
 * ✓ Validar peso, disponibilidad, consistencia
 * ✓ Generar ReporteCarga automático
 * ✓ Sincronizar con todas las ventas
 * ✓ Mantener transaccionalidad (ACID)
 *
 * INVARIANTE:
 * - ÚNICO punto donde se crean entregas consolidadas con múltiples ventas
 * - Todas las operaciones son atómicas (transacción única)
 * - Sincronización automática con Ventas via SincronizacionVentaEntregaService
 *
 * FLUJO:
 * ─────
 * 1. Validar ventas (existan, estado, pertenezcan a misma zona)
 * 2. Validar vehículo (disponible, capacidad suficiente)
 * 3. Validar chofer (activo, licencia vigente)
 * 4. Crear Entrega con Número único
 * 5. Vincular Ventas via entrega_venta (pivot) con orden
 * 6. Generar ReporteCarga automático
 * 7. Registrar en historial
 * 8. Sincronizar estados de Ventas
 * 9. Emitir evento via WebSocket
 */
class CrearEntregaPorLocalidadService
{
    use ManagesTransactions, LogsOperations;

    private SincronizacionVentaEntregaService $sincronizador;
    private ReporteCargoService $reporteCargoService;

    public function __construct(
        SincronizacionVentaEntregaService $sincronizador,
        ReporteCargoService $reporteCargoService,
    ) {
        $this->sincronizador = $sincronizador;
        $this->reporteCargoService = $reporteCargoService;
    }

    /**
     * ─────────────────────────────────────────────────────────────
     * MÉTODO PRINCIPAL: Crear entrega consolidada con múltiples ventas
     * ─────────────────────────────────────────────────────────────
     *
     * @param array $ventaIds IDs de ventas a consolidar: [1001, 1002, 1003]
     * @param int $vehiculoId ID del vehículo a asignar
     * @param int $choferId ID del chofer a asignar
     * @param int|null $zonaId ID de la zona (opcional, para agrupamiento)
     * @param array $datos Datos adicionales: ['descripcion', 'observaciones', etc]
     *
     * @return Entrega Entrega creada con ventas asociadas
     *
     * @throws Exception Si hay problemas con validaciones o transacción
     *
     * EJEMPLO DE USO:
     * ───────────────
     * $entrega = $service->crearEntregaConsolidada(
     *     ventaIds: [1001, 1002, 1003],
     *     vehiculoId: 10,
     *     choferId: 5,
     *     zonaId: 3,
     *     datos: ['descripcion' => 'Entrega zona centro']
     * );
     */
    public function crearEntregaConsolidada(
        array $ventaIds,
        int $vehiculoId,
        int $choferId,
        ?int $zonaId = null,
        array $datos = [],
    ): Entrega {
        $entrega = $this->transaction(function () use (
            $ventaIds,
            $vehiculoId,
            $choferId,
            $zonaId,
            $datos
        ) {
            Log::info('Iniciando creación de entrega consolidada', [
                'venta_ids' => $ventaIds,
                'vehiculo_id' => $vehiculoId,
                'chofer_id' => $choferId,
                'zona_id' => $zonaId,
            ]);

            // ═════════════════════════════════════════════════════════════
            // PASO 1: VALIDAR VENTAS
            // ═════════════════════════════════════════════════════════════
            $ventas = $this->validarYObtenerVentas($ventaIds);

            // ═════════════════════════════════════════════════════════════
            // PASO 2: VALIDAR VEHÍCULO
            // ═════════════════════════════════════════════════════════════
            $vehiculo = $this->validarVehiculo($vehiculoId);

            // ═════════════════════════════════════════════════════════════
            // PASO 3: VALIDAR CHOFER
            // ═════════════════════════════════════════════════════════════
            $chofer = $this->validarChofer($choferId);

            // ═════════════════════════════════════════════════════════════
            // PASO 4: CALCULAR MÉTRICAS Y VALIDAR CAPACIDAD
            // ═════════════════════════════════════════════════════════════
            $metricas = $this->calcularMetricas($ventas);
            $this->validarCapacidad($metricas, $vehiculo);

            // ═════════════════════════════════════════════════════════════
            // PASO 5: CREAR ENTREGA
            // ═════════════════════════════════════════════════════════════
            $entrega = $this->crearEntrega(
                $vehiculoId,
                $choferId,
                $zonaId,
                $metricas,
                $datos,
                $ventas  // Pasar ventas para obtener localidad
            );

            // ═════════════════════════════════════════════════════════════
            // PASO 6: VINCULAR VENTAS (Pivot entrega_venta)
            // ═════════════════════════════════════════════════════════════
            $this->vincularVentas($entrega, $ventas);
            Log::info('Después de vincular ventas - transacción activa', ['entrega_id' => $entrega->id]);

            // ═════════════════════════════════════════════════════════════
            // PASO 7: GENERAR REPORTE DE CARGA
            // ═════════════════════════════════════════════════════════════
            try {
                $reporte = $this->generarReporte($entrega, $ventas);
                Log::info('Después de generar reporte - transacción activa', ['entrega_id' => $entrega->id]);
            } catch (Exception $e) {
                Log::error('Excepción en generarReporte dentro de transacción', [
                    'entrega_id' => $entrega->id,
                    'error' => $e->getMessage(),
                ]);
                throw $e;
            }

            // ═════════════════════════════════════════════════════════════
            // PASO 8: LOGUEAR ÉXITO (sincronización se hace FUERA de transacción)
            // ═════════════════════════════════════════════════════════════
            $this->logSuccess('Entrega consolidada creada exitosamente', [
                'entrega_id' => $entrega->id,
                'numero_entrega' => $entrega->numero_entrega,
                'ventas_consolidadas' => count($ventas),
                'peso_total_kg' => $metricas['peso_total'],
                'vehiculo_id' => $vehiculoId,
                'chofer_id' => $choferId,
            ]);

            return $entrega;
        });

        // ═════════════════════════════════════════════════════════════
        // SINCRONIZACIÓN Y CARGA DE RELACIONES (FUERA DE TRANSACCIÓN)
        // ═════════════════════════════════════════════════════════════
        // Hacer esto fuera de la transacción para evitar errores de "ambiguous column"
        // y "transacción abortada" que ocurren cuando se ejecutan queries complejas dentro
        // del contexto transaccional

        // Sincronizar ventas con el nuevo estado de entrega
        try {
            $this->sincronizador->alCrearEntrega($entrega);
        } catch (Exception $e) {
            Log::warning('Error sincronizando ventas después de crear entrega', [
                'entrega_id' => $entrega->id,
                'error' => $e->getMessage(),
            ]);
            // Continuar sin fallar - la sincronización es no-bloqueante
        }

        return $entrega;
    }

    /**
     * ─────────────────────────────────────────────────────────────
     * VALIDACIONES
     * ─────────────────────────────────────────────────────────────
     */

    /**
     * Validar y obtener las ventas
     */
    private function validarYObtenerVentas(array $ventaIds): array
    {
        if (empty($ventaIds)) {
            throw new Exception('Debe proporcionar al menos 1 venta');
        }

        // Obtener las ventas con bloqueo para evitar lecturas sucias
        $ventas = Venta::whereIn('id', $ventaIds)
            ->lockForUpdate()
            ->get();

        // Validar que se encontraron todas las ventas
        if ($ventas->count() !== count($ventaIds)) {
            $ventasEncontradas = $ventas->pluck('id')->toArray();
            $ventasFaltantes = array_diff($ventaIds, $ventasEncontradas);
            throw new Exception(
                'Ventas no encontradas: ' . implode(',', $ventasFaltantes)
            );
        }

        // Validar que todas las ventas requieran envío
        $sinEnvio = $ventas->filter(fn($v) => !$v->requiere_envio);
        if ($sinEnvio->count() > 0) {
            $numeros = $sinEnvio->pluck('numero')->implode(', ');
            throw new Exception(
                "Ventas que no requieren envío: $numeros"
            );
        }

        // Validar que todas las ventas estén en estado logístico correcto
        // Estados válidos: PENDIENTE_ENVIO, SIN_ENTREGA
        // Estos son los estados que indican que la venta aún no tiene entrega asignada
        $estadosLogisticosValidos = ['PENDIENTE_ENVIO', 'SIN_ENTREGA', ''];
        $estadosInvalidos = $ventas->reject(
            fn($v) => in_array(strtoupper($v->estado_logistico ?? ''), $estadosLogisticosValidos, true)
        );

        if ($estadosInvalidos->count() > 0) {
            $numeros = $estadosInvalidos->pluck('numero')->implode(', ');
            $estados = $estadosInvalidos->pluck('estado_logistico')->unique()->implode(', ');
            throw new Exception(
                "Ventas con estado logístico no válido para entrega: $numeros. " .
                "Estados actuales: $estados. " .
                "Estados válidos: PENDIENTE_ENVIO, SIN_ENTREGA"
            );
        }

        // Log de validación exitosa
        Log::info('Ventas validadas correctamente', [
            'cantidad' => $ventas->count(),
            'numeros' => $ventas->pluck('numero')->implode(', '),
        ]);

        return $ventas->toArray();
    }

    /**
     * Validar vehículo
     */
    private function validarVehiculo(int $vehiculoId): Vehiculo
    {
        $vehiculo = Vehiculo::lockForUpdate()->find($vehiculoId);

        if (!$vehiculo) {
            throw new Exception("Vehículo #$vehiculoId no existe");
        }

        // Validar estado (case-insensitive comparison)
        if (strtoupper($vehiculo->estado) !== 'DISPONIBLE') {
            throw new Exception(
                "Vehículo {$vehiculo->placa} no está disponible. " .
                "Estado actual: {$vehiculo->estado}"
            );
        }

        // Validar capacidad
        if (!$vehiculo->capacidad_kg || $vehiculo->capacidad_kg <= 0) {
            throw new Exception(
                "Vehículo {$vehiculo->placa} no tiene capacidad configurada"
            );
        }

        Log::info('Vehículo validado', [
            'vehiculo_id' => $vehiculoId,
            'placa' => $vehiculo->placa,
            'capacidad_kg' => $vehiculo->capacidad_kg,
        ]);

        return $vehiculo;
    }

    /**
     * Validar chofer
     */
    private function validarChofer(int $choferId): Empleado
    {
        $chofer = Empleado::lockForUpdate()->find($choferId);

        if (!$chofer) {
            throw new Exception("Chofer #$choferId no existe");
        }

        // Validar estado
        if ($chofer->estado !== 'activo') {
            throw new Exception(
                "Chofer {$chofer->nombre} no está activo. " .
                "Estado: {$chofer->estado}"
            );
        }

        // Validar licencia si existe
        if ($chofer->licencia && $chofer->fecha_vencimiento_licencia) {
            if ($chofer->fecha_vencimiento_licencia < now()) {
                throw new Exception(
                    "Chofer {$chofer->nombre} tiene licencia vencida " .
                    "desde {$chofer->fecha_vencimiento_licencia->format('Y-m-d')}"
                );
            }
        }

        Log::info('Chofer validado', [
            'chofer_id' => $choferId,
            'nombre' => $chofer->nombre,
        ]);

        return $chofer;
    }

    /**
     * Validar capacidad del vehículo
     */
    private function validarCapacidad(array $metricas, Vehiculo $vehiculo): void
    {
        $pesoTotal = $metricas['peso_total'];
        $capacidad = $vehiculo->capacidad_kg;

        if ($pesoTotal > $capacidad) {
            throw new Exception(
                "Peso total ({$pesoTotal}kg) excede capacidad del vehículo " .
                "({$capacidad}kg). Utilización: " .
                round(($pesoTotal / $capacidad) * 100, 2) . "%"
            );
        }

        // Advertencia si utilización es muy alta (>90%)
        $porcentajeUso = ($pesoTotal / $capacidad) * 100;
        if ($porcentajeUso > 90) {
            Log::warning('Vehículo con utilización muy alta', [
                'vehiculo_id' => $vehiculo->id,
                'utilización' => round($porcentajeUso, 2) . '%',
            ]);
        }
    }

    /**
     * ─────────────────────────────────────────────────────────────
     * CÁLCULOS
     * ─────────────────────────────────────────────────────────────
     */

    /**
     * Calcular métricas consolidadas de ventas
     */
    private function calcularMetricas(array $ventas): array
    {
        $pesoTotal = 0;
        $volumenTotal = 0;
        $montoTotal = 0;

        foreach ($ventas as $venta) {
            // Si peso_estimado no está definido, usar un valor por defecto de 5kg por venta
            // (esto es una aproximación hasta que el usuario ingrese pesos reales)
            $peso = $venta['peso_estimado'] ?? 5;
            $pesoTotal += $peso;
            $volumenTotal += $venta['volumen_estimado'] ?? 0;
            $montoTotal += $venta['total'] ?? 0;
        }

        return [
            'peso_total' => $pesoTotal,
            'volumen_total' => $volumenTotal,
            'monto_total' => $montoTotal,
            'cantidad_ventas' => count($ventas),
        ];
    }

    /**
     * ─────────────────────────────────────────────────────────────
     * CREACIÓN
     * ─────────────────────────────────────────────────────────────
     */

    /**
     * Crear el registro de Entrega
     */
    private function crearEntrega(
        int $vehiculoId,
        int $choferId,
        ?int $zonaId,
        array $metricas,
        array $datos,
        array $ventas = []
    ): Entrega {
        // Determinar la localidad desde el cliente de las ventas (si no se proporciona zonaId)
        $localidadId = $zonaId;
        if (!$localidadId && !empty($ventas)) {
            // Obtener la localidad del primer cliente de las ventas
            // En una entrega consolidada, todos los clientes deberían estar en la misma zona
            $primerVenta = is_array($ventas[0]) ? Venta::find($ventas[0]['id']) : $ventas[0];
            if ($primerVenta && $primerVenta->cliente) {
                $localidadId = $primerVenta->cliente->localidad_id;
            }
        }

        // Determinar fecha programada
        // Usar la fecha comprometida más próxima o hoy + 1 día por defecto
        $fechaProgramada = null;
        if (!empty($ventas)) {
            $fechas = [];
            foreach ($ventas as $venta) {
                $v = is_array($venta) ? Venta::find($venta['id']) : $venta;
                if ($v && $v->fecha_entrega_comprometida) {
                    $fechas[] = $v->fecha_entrega_comprometida;
                }
            }
            if (!empty($fechas)) {
                // Usar la fecha más temprana
                $fechaProgramada = min($fechas);
            }
        }
        // Si no hay fecha comprometida, asignar mañana
        if (!$fechaProgramada) {
            $fechaProgramada = now()->addDay();
        }

        // Crear entrega sin número primero (para obtener el ID)
        $entrega = Entrega::create([
            'numero_entrega' => '',  // Temporal, se actualizará después
            'vehiculo_id' => $vehiculoId,
            'chofer_id' => $choferId,
            'zona_id' => $localidadId,  // Usar localidadId (puede ser null)
            'peso_kg' => $metricas['peso_total'],
            'volumen_m3' => $metricas['volumen_total'],
            'estado' => Entrega::ESTADO_PROGRAMADO,
            'fecha_asignacion' => now(),
            'fecha_programada' => $fechaProgramada,
            'descripcion' => $datos['descripcion'] ?? null,
            'observaciones' => $datos['observaciones'] ?? null,
        ]);

        // Generar número de entrega con el ID
        // Formato: ENT-YYYYMMDD-ID
        $numeroEntrega = $this->generarNumeroEntregaConId($entrega->id);

        // Actualizar el número de entrega
        $entrega->update(['numero_entrega' => $numeroEntrega]);

        Log::info('Entrega creada', [
            'entrega_id' => $entrega->id,
            'numero_entrega' => $numeroEntrega,
            'localidad_id' => $localidadId,
            'fecha_programada' => $fechaProgramada,
            'peso_kg' => $metricas['peso_total'],
        ]);

        return $entrega;
    }

    /**
     * Generar número único de entrega con el ID
     * Formato: ENT-YYYYMMDD-ID
     * Ejemplo: ENT-20251227-60
     */
    private function generarNumeroEntregaConId(int $entregaId): string
    {
        $hoy = now()->format('Ymd');
        return "ENT-{$hoy}-{$entregaId}";
    }

    /**
     * ─────────────────────────────────────────────────────────────
     * VINCULACIÓN DE VENTAS
     * ─────────────────────────────────────────────────────────────
     */

    /**
     * Vincular ventas a la entrega via pivot entrega_venta
     */
    private function vincularVentas(Entrega $entrega, array $ventas): void
    {
        $attach = [];

        foreach ($ventas as $index => $venta) {
            $attach[$venta['id']] = [
                'orden' => $index + 1,  // orden 1, 2, 3, ...
                'confirmado_por' => null,  // Se confirmarán después
                'fecha_confirmacion' => null,
                'notas' => null,
            ];
        }

        $entrega->ventas()->attach($attach);

        Log::info('Ventas vinculadas a entrega', [
            'entrega_id' => $entrega->id,
            'cantidad' => count($attach),
        ]);
    }

    /**
     * ─────────────────────────────────────────────────────────────
     * GENERACIÓN DE REPORTE
     * ─────────────────────────────────────────────────────────────
     */

    /**
     * Generar ReporteCarga desde la Entrega
     */
    private function generarReporte(Entrega $entrega, array $ventas)
    {
        // Obtener modelos de Venta completos para generar reporte
        $ventasModelos = Venta::whereIn('id', array_column($ventas, 'id'))->get();

        try {
            $reporte = $this->reporteCargoService->generarReporteDesdeEntrega(
                $entrega,
                [
                    'vehiculo_id' => $entrega->vehiculo_id,
                    'descripcion' => "Reporte consolidado de {$ventasModelos->count()} ventas",
                ]
            );

            Log::info('Reporte de carga generado', [
                'reporte_id' => $reporte->id,
                'numero_reporte' => $reporte->numero_reporte,
                'entrega_id' => $entrega->id,
            ]);

            return $reporte;
        } catch (Exception $e) {
            Log::error('Error generando reporte de carga', [
                'entrega_id' => $entrega->id,
                'error' => $e->getMessage(),
            ]);
            throw new Exception(
                'No se pudo generar reporte de carga: ' . $e->getMessage()
            );
        }
    }

    /**
     * ─────────────────────────────────────────────────────────────
     * SINCRONIZACIÓN
     * ─────────────────────────────────────────────────────────────
     */

}
