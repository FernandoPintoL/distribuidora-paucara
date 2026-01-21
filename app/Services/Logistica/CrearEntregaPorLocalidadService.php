<?php

namespace App\Services\Logistica;

use App\Models\Empleado;
use App\Models\Entrega;
use App\Models\Vehiculo;
use App\Models\Venta;
use App\Services\Traits\LogsOperations;
use App\Services\Traits\ManagesTransactions;
use App\Events\EntregaAsignada;
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
        Log::info('📍 validarYObtenerVentas: starting validation', ['venta_ids' => $ventaIds]);

        if (empty($ventaIds)) {
            throw new Exception('Debe proporcionar al menos 1 venta');
        }

        // Obtener las ventas con bloqueo para evitar lecturas sucias
        Log::info('📍 Fetching ventas with lock...');
        $ventas = Venta::whereIn('id', $ventaIds)
            ->lockForUpdate()
            ->get();

        Log::info('✅ Ventas fetched', ['count' => $ventas->count()]);

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
     *
     * @param int $choferId ID del User (no Empleado)
     * @return Empleado El empleado asociado al user
     */
    private function validarChofer(int $choferId): Empleado
    {
        // chofer_id apunta a users.id
        $choferUser = \App\Models\User::with('empleado')->lockForUpdate()->find($choferId);

        if (!$choferUser || !$choferUser->empleado) {
            throw new Exception("Chofer (Usuario) #$choferId no existe o no tiene datos de empleado");
        }

        // ✅ VALIDACIÓN CRÍTICA: Verificar que el usuario tenga rol 'chofer'/'Chofer'
        if (!$choferUser->hasRole(['Chofer', 'chofer'])) {
            throw new Exception(
                "Usuario #{$choferId} no tiene el rol 'chofer'. " .
                "Roles actuales: " . $choferUser->getRoleNames()->implode(', ')
            );
        }

        $chofer = $choferUser->empleado;

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
            'chofer_user_id' => $choferId,
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
     * ✅ ACTUALIZADO: Calcular métricas consolidadas de ventas
     *
     * Ahora usa peso_total_estimado (pre-calculado cuando se crea la venta)
     * en lugar de calcular desde detalles cada vez
     *
     * VENTAJAS:
     * - Performance: O(n) en lugar de O(n*m) donde m = detalles por venta
     * - Auditabilidad: El peso está persistido en BD para cada venta
     * - Consistencia: Mismo peso que se usa en validaciones de stock
     */
    private function calcularMetricas(array $ventas): array
    {
        $pesoTotal = 0;
        $volumenTotal = 0;
        $montoTotal = 0;

        foreach ($ventas as $venta) {
            // ✅ NUEVO: Usar peso_total_estimado calculado al crear venta
            // Si es null (para ventas antiguas sin peso calculado), usar 0
            $peso = $venta['peso_total_estimado'] ?? 0;
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
        Log::info('📍 crearEntrega: starting', [
            'vehiculo_id' => $vehiculoId,
            'chofer_id' => $choferId,
            'zona_id' => $zonaId,
            'ventas_count' => count($ventas),
        ]);

        // Determinar la localidad desde el cliente de las ventas (si no se proporciona zonaId)
        $localidadId = $zonaId;
        if (!$localidadId && !empty($ventas)) {
            Log::info('📍 Determining localidad from cliente...');

            try {
                // Obtener la localidad del primer cliente de las ventas
                // En una entrega consolidada, todos los clientes deberían estar en la misma zona
                $primerVenta = is_array($ventas[0]) ? Venta::find($ventas[0]['id']) : $ventas[0];

                Log::info('✅ Primera venta obtained', [
                    'is_array' => is_array($ventas[0]),
                    'venta_id' => $primerVenta?->id ?? 'null',
                ]);

                if ($primerVenta && $primerVenta->cliente) {
                    $localidadId = $primerVenta->cliente->localidad_id;
                    Log::info('✅ Localidad determined', ['localidad_id' => $localidadId]);
                } else {
                    Log::warning('⚠️ Could not determine localidad - no cliente found');
                }
            } catch (\Exception $e) {
                Log::error('❌ Error determining localidad', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                throw $e;
            }
        }

        // Determinar fecha programada
        // PRIORIDAD: datos['fecha_programada'] > fechas de ventas > hoy (same-day delivery)
        $fechaProgramada = null;

        // ✅ NUEVO: Si se proporciona fecha_programada en datos, usar esa
        if (!empty($datos['fecha_programada'])) {
            $fechaProgramada = $datos['fecha_programada'];
            Log::info('📅 Usando fecha_programada del request', ['fecha' => $fechaProgramada]);
        } else {
            // Fallback: calcular desde fechas comprometidas de ventas
            if (!empty($ventas)) {
                $fechas = [];
                foreach ($ventas as $venta) {
                    $v = is_array($venta) ? Venta::find($venta['id']) : $venta;
                    if ($v && $v->fecha_entrega_comprometida) {
                        $fechas[] = $v->fecha_entrega_comprometida;
                    }
                }
                if (!empty($fechas)) {
                    // Usar la fecha más temprana (puede ser hoy mismo si está comprometida)
                    $fechaProgramada = min($fechas);
                    Log::info('📅 Fecha programada calculada desde ventas', ['fecha' => $fechaProgramada]);
                }
            }
        }

        // ✅ MEJORADO: Si no hay fecha programada, permitir entrega el MISMO DÍA (same-day delivery)
        // El usuario puede cambiar esto manualmente si es necesario
        if (!$fechaProgramada) {
            $fechaProgramada = now(); // Usar HOY como fecha de entrega
            Log::info('📅 Usando fecha por defecto (hoy - same-day delivery)', ['fecha' => $fechaProgramada]);
        }

        // Obtener el estado inicial PREPARACION_CARGA desde estados_logistica
        $estadoInicial = \App\Models\EstadoLogistica::where('codigo', 'PREPARACION_CARGA')
            ->where('categoria', 'entrega')
            ->first();

        if (!$estadoInicial) {
            Log::error('❌ Estado PREPARACION_CARGA no encontrado en estados_logistica', [
                'categoria' => 'entrega',
                'estados_disponibles' => \App\Models\EstadoLogistica::where('categoria', 'entrega')
                    ->pluck('codigo')
                    ->toArray(),
            ]);
            // Fallback: intentar sin categoría específica
            $estadoInicial = \App\Models\EstadoLogistica::where('codigo', 'PREPARACION_CARGA')->first();
        }

        $estadoEntregaId = $estadoInicial?->id;

        Log::info('🔧 [CrearEntregaConsolidada] Estado obtenido', [
            'codigo' => $estadoInicial?->codigo ?? 'NULL',
            'estado_entrega_id' => $estadoEntregaId ?? 'NULL',
            'estado_completo' => $estadoInicial,
        ]);

        // Crear entrega sin número primero (para obtener el ID)
        $entrega = Entrega::create([
            'numero_entrega' => '',  // Temporal, se actualizará después
            'vehiculo_id' => $vehiculoId,
            'chofer_id' => $choferId,
            'zona_id' => $localidadId,  // Usar localidadId (puede ser null)
            'peso_kg' => $metricas['peso_total'],
            'volumen_m3' => $metricas['volumen_total'],
            'estado' => $estadoInicial?->codigo ?? Entrega::ESTADO_PREPARACION_CARGA,  // Mantener estado ENUM como estaba
            'estado_entrega_id' => $estadoEntregaId,  // ✅ FK a estados_logistica con el ID de PREPARACION_CARGA
            'fecha_asignacion' => now(),
            'fecha_programada' => $fechaProgramada,
            'descripcion' => $datos['descripcion'] ?? null,
            'observaciones' => $datos['observaciones'] ?? null,
        ]);

        Log::info('✅ Entrega creada (con estado_entrega_id)', [
            'entrega_id' => $entrega->id,
            'estado' => $entrega->estado,
            'estado_entrega_id' => $entrega->estado_entrega_id,
            'es_null' => is_null($entrega->estado_entrega_id),
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
     * Vincular ventas a la entrega
     *
     * Phase 3: Actualiza directamente la FK entrega_id en ventas (relación HasMany)
     * No usa tabla pivot, sino actualización directa en tabla ventas.
     */
    private function vincularVentas(Entrega $entrega, array $ventas): void
    {
        Log::info('📍 Vinculando ventas a entrega', [
            'entrega_id' => $entrega->id,
            'cantidad_ventas' => count($ventas),
        ]);

        foreach ($ventas as $venta) {
            try {
                // Actualizar la venta con la FK entrega_id
                Venta::where('id', $venta['id'])
                    ->update(['entrega_id' => $entrega->id]);

                Log::info('✅ Venta vinculada a entrega', [
                    'venta_id' => $venta['id'],
                    'entrega_id' => $entrega->id,
                ]);
            } catch (\Throwable $e) {
                Log::error('❌ Error vinculando venta individual', [
                    'venta_id' => $venta['id'],
                    'entrega_id' => $entrega->id,
                    'error' => $e->getMessage(),
                ]);
                throw $e;
            }
        }

        Log::info('✅ Todas las ventas vinculadas a entrega', [
            'entrega_id' => $entrega->id,
            'cantidad' => count($ventas),
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
