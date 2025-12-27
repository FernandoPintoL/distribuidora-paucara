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
use App\Services\WebSocket\EntregaWebSocketService;
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
        'PROGRAMADO' => ['ASIGNADA', 'CANCELADA'],          // Nuevo estado inicial
        'PENDIENTE' => ['ASIGNADA', 'CANCELADA'],           // Legacy
        'ASIGNADA' => ['EN_CAMINO', 'PROGRAMADO', 'PENDIENTE', 'CANCELADA'],
        'EN_CAMINO' => ['LLEGO', 'NOVEDAD', 'CANCELADA'],
        'LLEGO' => ['ENTREGADO', 'NOVEDAD', 'CANCELADA'],
        'ENTREGADO' => [],
        'NOVEDAD' => ['ASIGNADA', 'CANCELADA'],             // Para reintentar
        'CANCELADA' => [],
        // Legacy states
        'ENTREGADA' => [],
        'RECHAZADA' => ['ASIGNADA'],
    ];

    public function __construct(
        private StockService $stockService,
        private \App\Services\RutaOptimizer $rutaOptimizer,
        private EntregaWebSocketService $webSocketService,
        private ReporteCargoService $reporteCargoService,
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
     *
     * Soporta tanto estado PROGRAMADO (nuevo) como PENDIENTE (legacy)
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

            // Validar transición (soporta PROGRAMADO y PENDIENTE)
            if (!in_array($entrega->estado, ['PROGRAMADO', 'PENDIENTE'])) {
                throw EstadoInvalidoException::transicionInvalida(
                    'Entrega',
                    $entregaId,
                    $entrega->estado,
                    'ASIGNADA'
                );
            }

            // Validar que chofer y vehículo existan y estén disponibles
            $chofer = \App\Models\Empleado::findOrFail($choferId);
            $vehiculo = \App\Models\Vehiculo::findOrFail($vehiculoId);

            // Validar estado del chofer
            if ($chofer->estado !== 'activo') {
                throw new \Exception("Chofer {$chofer->nombre} no está activo");
            }

            // Validar licencia (si está configurada)
            if ($chofer->licencia && $chofer->fecha_vencimiento_licencia) {
                if ($chofer->fecha_vencimiento_licencia < now()) {
                    throw new \Exception("Chofer {$chofer->nombre} tiene licencia vencida");
                }
            }

            // Validar estado del vehículo (case-insensitive)
            if (strtolower($vehiculo->estado) !== 'disponible') {
                throw new \Exception("Vehículo {$vehiculo->placa} no está disponible");
            }

            // Guardar estado anterior para historial
            $estadoAnterior = $entrega->estado;

            // Actualizar entrega
            $entrega->update([
                'chofer_id' => $choferId,
                'vehiculo_id' => $vehiculoId,
                'estado' => 'ASIGNADA',
                'fecha_asignacion' => now(),
            ]);

            // Registrar cambio de estado
            $this->registrarCambioEstado(
                $entrega,
                $estadoAnterior,
                'ASIGNADA',
                "Asignado chofer: {$chofer->nombre}, Vehículo: {$vehiculo->placa}"
            );


            return $entrega;
        });

        $this->logSuccess('Entrega asignada', [
            'entrega_id' => $entregaId,
            'chofer_id' => $choferId,
            'vehiculo_id' => $vehiculoId,
        ]);

        return EntregaResponseDTO::fromModel($entrega);
    }

    /**
     * Iniciar entrega - Cambiar a "EN_CAMINO"
     *
     * El chofer inicia la ruta de entrega
     * ⚠️ CRÍTICO: Aquí se reduce el stock de la venta
     */
    public function iniciarEntrega(int $entregaId): EntregaResponseDTO
    {
        $entrega = $this->transaction(function () use ($entregaId) {
            $entrega = Entrega::lockForUpdate()->findOrFail($entregaId);

            // Validar que esté ASIGNADA
            $this->validarTransicion($entrega->estado, 'EN_CAMINO');

            // Guardar estado anterior
            $estadoAnterior = $entrega->estado;

            // ⚠️ PUNTO CRÍTICO: Reducir stock de la venta asociada
            $venta = $entrega->venta;
            if ($venta && $venta->detalles && !in_array($venta->estado, ['PENDIENTE', 'BORRADOR'], true)) {
                $this->procesarStockEntrega($entrega, 'reducir');
            }

            // Actualizar a EN_CAMINO
            $entrega->update([
                'estado' => 'EN_CAMINO',
                'fecha_inicio' => now(),
            ]);

            $this->registrarCambioEstado(
                $entrega,
                $estadoAnterior,
                'EN_CAMINO',
                'Chofer inicia ruta de entrega - Stock reducido'
            );


            return $entrega;
        });

        $this->logSuccess('Entrega iniciada y stock reducido', ['entrega_id' => $entregaId]);

        return EntregaResponseDTO::fromModel($entrega);
    }

    /**
     * Registrar llegada del chofer - Cambiar a "LLEGO"
     *
     * El chofer llegó a la ubicación del cliente
     */
    public function registrarLlegada(int $entregaId): EntregaResponseDTO
    {
        $entrega = $this->transaction(function () use ($entregaId) {
            $entrega = Entrega::lockForUpdate()->findOrFail($entregaId);

            // Validar que esté EN_CAMINO
            $this->validarTransicion($entrega->estado, 'LLEGO');

            $estadoAnterior = $entrega->estado;

            // Actualizar a LLEGO
            $entrega->update([
                'estado' => 'LLEGO',
                'fecha_llegada' => now(),
            ]);

            $this->registrarCambioEstado(
                $entrega,
                $estadoAnterior,
                'LLEGO',
                'Chofer llegó a ubicación del cliente'
            );

            return $entrega;
        });

        $this->logSuccess('Llegada registrada', ['entrega_id' => $entregaId]);

        return EntregaResponseDTO::fromModel($entrega);
    }

    /**
     * Confirmar entrega exitosa - Cambiar a "ENTREGADO"
     *
     * El cliente recibió la mercadería satisfactoriamente
     *
     * @param int $entregaId ID de la entrega
     * @param string|null $firmaDigitalUrl URL de la firma digital del cliente
     * @param string|null $fotoEntregaUrl URL de la foto de la entrega
     */
    public function confirmar(
        int $entregaId,
        ?string $firmaDigitalUrl = null,
        ?string $fotoEntregaUrl = null,
    ): EntregaResponseDTO {
        $entrega = $this->transaction(function () use ($entregaId, $firmaDigitalUrl, $fotoEntregaUrl) {
            $entrega = Entrega::lockForUpdate()->findOrFail($entregaId);

            // Validar transición (desde LLEGO o EN_CAMINO para retrocompatibilidad)
            $this->validarTransicion($entrega->estado, 'ENTREGADO');

            $estadoAnterior = $entrega->estado;

            // Actualizar a ENTREGADO
            $entrega->update([
                'estado' => 'ENTREGADO',
                'fecha_entrega' => now(),
                'fecha_firma_entrega' => $firmaDigitalUrl ? now() : null,
                'firma_digital_url' => $firmaDigitalUrl,
                'foto_entrega_url' => $fotoEntregaUrl,
            ]);

            $this->registrarCambioEstado(
                $entrega,
                $estadoAnterior,
                'ENTREGADO',
                'Entrega confirmada por cliente - Mercadería recibida satisfactoriamente'
            );

            // Actualizar venta si existe
            $venta = $entrega->venta;
            if ($venta && \in_array($venta->estado, ['EN_ENTREGA', 'PENDIENTE'], true)) {
                $venta->update(['estado' => 'ENTREGADO']);
            }


            return $entrega;
        });

        $this->logSuccess('Entrega confirmada', [
            'entrega_id' => $entregaId,
            'con_firma' => $firmaDigitalUrl !== null,
            'con_foto' => $fotoEntregaUrl !== null,
        ]);

        return EntregaResponseDTO::fromModel($entrega);
    }

    /**
     * Reportar novedad en entrega - Cambiar a "NOVEDAD"
     *
     * El chofer reporta un problema: cliente ausente, dirección incorrecta, rechazo, etc.
     *
     * @param int $entregaId ID de la entrega
     * @param string $motivoNovedad Descripción de la novedad
     * @param bool $devolverStock Si debe revertir el stock (default: false, solo para rechazos definitivos)
     */
    public function reportarNovedad(
        int $entregaId,
        string $motivoNovedad,
        bool $devolverStock = false,
    ): EntregaResponseDTO {
        $entrega = $this->transaction(function () use ($entregaId, $motivoNovedad, $devolverStock) {
            $entrega = Entrega::lockForUpdate()->findOrFail($entregaId);

            // Validar transición (desde EN_CAMINO o LLEGO)
            $this->validarTransicion($entrega->estado, 'NOVEDAD');

            $estadoAnterior = $entrega->estado;

            // Revertir stock SOLO si es rechazo definitivo
            if ($devolverStock) {
                $venta = $entrega->venta;
                if ($venta && $venta->detalles && !\in_array($venta->estado, ['PENDIENTE', 'BORRADOR'], true)) {
                    $this->stockService->devolverStock(
                        $venta->detalles->toArray(),
                        "ENTREGA#{$entregaId}-NOVEDAD",
                        $venta->almacen_id ?? null
                    );
                }
            }

            // Actualizar a NOVEDAD
            $entrega->update([
                'estado' => 'NOVEDAD',
                'motivo_novedad' => $motivoNovedad,
            ]);

            $this->registrarCambioEstado(
                $entrega,
                $estadoAnterior,
                'NOVEDAD',
                "Novedad reportada: {$motivoNovedad}"
            );

            // Actualizar venta
            $venta = $entrega->venta;
            if ($venta) {
                $venta->update(['estado' => 'CON_NOVEDAD']);
            }


            return $entrega;
        });

        $this->logSuccess('Novedad reportada', [
            'entrega_id' => $entregaId,
            'motivo' => $motivoNovedad,
            'stock_revertido' => $devolverStock,
        ]);

        return EntregaResponseDTO::fromModel($entrega);
    }

    /**
     * Rechazar entrega (legacy - compatibility)
     *
     * @deprecated Use reportarNovedad() instead
     */
    public function rechazar(int $entregaId, string $razon): EntregaResponseDTO
    {
        return $this->reportarNovedad($entregaId, $razon, devolverStock: true);
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
     * Optimizar asignación de múltiples entregas usando FFD + Nearest Neighbor
     *
     * Este método agrupa entregas por capacidad de vehículo y optimiza rutas por distancia
     *
     * @param array $entregaIds IDs de entregas a asignar
     * @param float $capacidadMaxVehiculo Capacidad estándar de vehículos (kg)
     * @return array ['rutas' => [...], 'estadisticas' => [...]]
     */
    public function optimizarAsignacionMasiva(array $entregaIds, float $capacidadMaxVehiculo = 1000): array
    {
        // Cargar entregas con relaciones necesarias
        $entregas = Entrega::with(['venta.cliente', 'venta.direccionCliente'])
            ->whereIn('id', $entregaIds)
            ->whereIn('estado', ['PROGRAMADO', 'PENDIENTE'])
            ->get();

        if ($entregas->isEmpty()) {
            return [
                'rutas' => [],
                'estadisticas' => [
                    'total_entregas' => 0,
                    'rutas_creadas' => 0,
                ],
            ];
        }

        // Preparar datos para algoritmo
        $entregasParaOptimizar = $entregas->map(function ($entrega) {
            $direccion = $entrega->venta?->direccionCliente ?? null;

            return [
                'id' => $entrega->id,
                'entrega_id' => $entrega->id,
                'venta_id' => $entrega->venta_id,
                'cliente_id' => $entrega->venta?->cliente_id,
                'peso' => $entrega->peso_kg ?? 10, // Default 10kg si no está configurado
                'peso_kg' => $entrega->peso_kg ?? 10,
                'lat' => $direccion?->latitud ?? -17.3895,  // Default: Cochabamba centro
                'lon' => $direccion?->longitud ?? -66.1568,
                'direccion' => $entrega->direccion_entrega ?? $direccion?->direccion ?? 'Sin dirección',
            ];
        })->toArray();

        // Ejecutar optimización
        $resultado = $this->rutaOptimizer->optimizarMultiplesRutas(
            $entregasParaOptimizar,
            $capacidadMaxVehiculo
        );

        // Agregar información adicional a cada ruta
        foreach ($resultado['rutas'] as &$ruta) {
            $ruta['entregas_ids'] = array_column($ruta['ruta'], 'entrega_id');
            $ruta['sugerencia_vehiculo'] = $this->sugerirVehiculo($ruta['peso_total_bin']);
            $ruta['sugerencia_chofer'] = $this->sugerirChofer();
        }
        unset($ruta);

        return $resultado;
    }

    /**
     * Sugerir vehículo basado en peso total
     */
    private function sugerirVehiculo(float $pesoTotal): ?array
    {
        $vehiculo = \App\Models\Vehiculo::where('estado', 'disponible')
            ->where('capacidad_kg', '>=', $pesoTotal)
            ->orderBy('capacidad_kg', 'asc')
            ->first();

        if (!$vehiculo) {
            return null;
        }

        return [
            'id' => $vehiculo->id,
            'placa' => $vehiculo->placa,
            'marca' => $vehiculo->marca,
            'modelo' => $vehiculo->modelo,
            'capacidad_kg' => $vehiculo->capacidad_kg,
        ];
    }

    /**
     * Sugerir chofer disponible
     */
    private function sugerirChofer(): ?array
    {
        $chofer = \App\Models\Empleado::where('estado', 'activo')
            ->whereNotNull('licencia')
            ->where(function($q) {
                $q->whereNull('fecha_vencimiento_licencia')
                  ->orWhere('fecha_vencimiento_licencia', '>=', now());
            })
            ->first();

        if (!$chofer) {
            return null;
        }

        return [
            'id' => $chofer->id,
            'nombre' => $chofer->nombre,
            'licencia' => $chofer->licencia,
        ];
    }

    /**
     * Validar si una transición de estado es válida
     *
     * @throws EstadoInvalidoException
     */
    private function validarTransicion(string $estadoActual, string $estadoNuevo): void
    {
        $permitidas = self::$transicionesValidas[$estadoActual] ?? [];

        if (!\in_array($estadoNuevo, $permitidas, true)) {
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
        // Para operaciones en lote, no asignamos usuario_id ya que es una operación del sistema
        // El campo es nullable, así evitamos validaciones que podrían fallar dentro de una transacción

        return EntregaEstadoHistorial::create([
            'entrega_id' => $entrega->id,
            'estado_anterior' => $estadoAnterior,
            'estado_nuevo' => $estadoNuevo,
            'comentario' => $razon,
            'usuario_id' => null,
        ]);
    }

    /**
     * Procesar stock para una entrega (reducir o restaurar)
     *
     * ⚠️ CRÍTICO: Se ejecuta DENTRO de una transacción
     *
     * @param Entrega $entrega Entrega a procesar
     * @param string $operacion 'reducir' o 'restaurar'
     */
    private function procesarStockEntrega(Entrega $entrega, string $operacion): void
    {
        $venta = $entrega->venta;
        if (!$venta || !$venta->detalles) {
            return;
        }

        // Mapear detalles de venta a formato esperado por StockService
        $productos = $venta->detalles->map(function ($detalle) {
            return [
                'producto_id' => $detalle->producto_id,
                'cantidad' => $detalle->cantidad,
            ];
        })->toArray();

        // Usar número de entrega como referencia
        $referencia = "ENTREGA#{$entrega->id}";

        // Obtener almacén para esta entrega
        $almacenId = $this->obtenerAlmacenParaEntrega($entrega);

        // Ejecutar operación
        if ($operacion === 'reducir') {
            $this->stockService->procesarSalidaVenta($productos, $referencia, $almacenId);
            $this->logSuccess('Stock reducido para entrega', [
                'entrega_id' => $entrega->id,
                'venta_id' => $venta->id,
                'almacen_id' => $almacenId,
            ]);
        } elseif ($operacion === 'restaurar') {
            $this->stockService->devolverStock($productos, $referencia, $almacenId);
            $this->logSuccess('Stock restaurado para entrega', [
                'entrega_id' => $entrega->id,
                'venta_id' => $venta->id,
                'almacen_id' => $almacenId,
            ]);
        }
    }

    /**
     * Crear entregas en lote desde múltiples ventas
     *
     * FASE 2: Creación masiva optimizada
     *
     * Flujo:
     * 1. Crear entregas para cada venta
     * 2. Asignar chofer y vehículo
     * 3. Opcionalmente optimizar rutas
     * 4. Retornar entregas creadas con información de optimización
     *
     * @param array $ventaIds IDs de ventas a procesar
     * @param int $vehiculoId ID del vehículo a usar
     * @param int $choferId ID del chofer a usar
     * @param bool $optimizar Si debe optimizar rutas (genera sugerencias)
     * @return array ['entregas' => [...], 'optimizacion' => [...], 'estadisticas' => [...]]
     */
    public function crearLote(
        array $ventaIds,
        int $vehiculoId,
        int $choferId,
        bool $optimizar = true,
        string $tipoReporte = 'individual'
    ): array {
        $resultado = $this->transaction(function () use ($ventaIds, $vehiculoId, $choferId, $optimizar, $tipoReporte) {
            $entregasCreadas = collect(); // Usar Collection en lugar de array para acceso a métodos como count() y isEmpty()
            $errores = [];

            // Validar vehículo y chofer
            $vehiculo = \App\Models\Vehiculo::findOrFail($vehiculoId);
            // ✅ CORREGIDO: Eager load user para evitar lazy loading dentro de la transacción
            $chofer = \App\Models\Empleado::with('user')->findOrFail($choferId);

            // Validar estado del vehículo (case-insensitive)
            if (strtolower($vehiculo->estado) !== 'disponible') {
                throw new \Exception("Vehículo {$vehiculo->placa} no está disponible");
            }

            if ($chofer->estado !== 'activo') {
                throw new \Exception("Chofer {$chofer->nombre} no está activo");
            }

            // 1. Crear entregas desde ventas
            foreach ($ventaIds as $ventaId) {
                try {
                    $venta = Venta::with('direccionCliente')->findOrFail($ventaId);

                    // Crear una entrega por venta con todos los datos disponibles
                    // ✅ CORREGIDO: Removido 'usuario_asignado_id' que no existe en el modelo
                    $entrega = Entrega::create([
                        'venta_id'              => $venta->id,
                        'estado'                => 'PROGRAMADO',
                        'direccion_entrega'     => $venta->direccion_entrega ?? $venta->direccionCliente?->direccion,
                        'direccion_cliente_id'  => $venta->direccion_cliente_id,
                        'fecha_programada'      => $venta->fecha_entrega_programada ?? now()->addDays(3),
                        'peso_kg'               => $venta->detalles->sum(fn($det) => $det->cantidad * 2) ?? 10,
                        'chofer_id'             => $choferId,
                        'vehiculo_id'           => $vehiculoId,
                    ]);

                    // Registrar en historial
                    $this->registrarCambioEstado(
                        $entrega,
                        null,
                        'PROGRAMADO',
                        'Entrega creada en lote'
                    );


                    // FASE 3: Generar reporte individual si tipo_reporte === 'individual'
                    if ($tipoReporte === 'individual') {
                        try {
                            $reporte = $this->reporteCargoService->generarReporteDesdeEntrega(
                                $entrega,
                                [
                                    'vehiculo_id' => $vehiculoId,
                                    'descripcion' => "Reporte automático - Batch individual",
                                    'peso_total_kg' => $entrega->peso_kg,
                                ]
                            );

                            $this->logSuccess('Reporte individual generado', [
                                'entrega_id' => $entrega->id,
                                'reporte_id' => $reporte->id,
                            ]);
                        } catch (\Exception $e) {
                            // Log error pero continuar con las demás entregas
                            $this->logError('Error generando reporte individual', [
                                'entrega_id' => $entrega->id,
                                'error' => $e->getMessage(),
                            ]);

                            $errores[] = [
                                'entrega_id' => $entrega->id,
                                'error' => "Reporte no generado: {$e->getMessage()}",
                            ];
                        }
                    }

                    $entregasCreadas->push($entrega);
                } catch (\Exception $e) {
                    $errores[] = [
                        'venta_id' => $ventaId,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            // FASE 3: Generar reporte consolidado si tipo_reporte === 'consolidado'
            if ($tipoReporte === 'consolidado' && !$entregasCreadas->isEmpty()) {
                try {
                    $reporteConsolidado = $this->reporteCargoService->generarReporteConsolidado(
                        $entregasCreadas->toArray(),
                        [
                            'vehiculo_id' => $vehiculoId,
                            'descripcion' => "Reporte consolidado - Batch ({$entregasCreadas->count()} entregas)",
                        ]
                    );

                    $this->logSuccess('Reporte consolidado generado', [
                        'reporte_id' => $reporteConsolidado->id,
                        'entregas_count' => $entregasCreadas->count(),
                    ]);

                    // Agregar reporte_consolidado a la respuesta
                    // Se agregaré a la respuesta después de crear la respuesta base
                } catch (\Exception $e) {
                    $this->logError('Error generando reporte consolidado', [
                        'error' => $e->getMessage(),
                    ]);

                    $errores[] = [
                        'tipo' => 'reporte_consolidado',
                        'error' => "Reporte consolidado no generado: {$e->getMessage()}",
                    ];
                }
            }

            // 2. Preparar respuesta
            $respuesta = [
                'entregas' => $entregasCreadas,
                'estadisticas' => [
                    'total_creadas' => count($entregasCreadas),
                    'total_errores' => count($errores),
                    'peso_total' => $entregasCreadas->sum('peso_kg'),
                    'vehiculo' => [
                        'id' => $vehiculo->id,
                        'placa' => $vehiculo->placa,
                        'capacidad_kg' => $vehiculo->capacidad_kg,
                    ],
                    'chofer' => [
                        'id' => $chofer->id,
                        'nombre' => $chofer->nombre,
                    ],
                ],
                'errores' => $errores,
            ];

            // 3. Si se solicita optimización, calcular sugerencias de rutas
            if ($optimizar && !$entregasCreadas->isEmpty()) {
                $entregaIds = $entregasCreadas->pluck('id')->toArray();
                $optimizacion = $this->optimizarAsignacionMasiva($entregaIds, $vehiculo->capacidad_kg);
                $respuesta['optimizacion'] = $optimizacion;
            }

            return $respuesta;
        });

        $this->logSuccess('Entregas en lote creadas', [
            'total' => count($resultado['entregas']),
            'vehiculo_id' => $vehiculoId,
            'chofer_id' => $choferId,
        ]);

        return $resultado;
    }

    /**
     * Obtener el almacén a usar para una entrega
     *
     * Prioridad:
     * 1. Almacén asociado a la venta
     * 2. Almacén principal configurado en sistema
     * 3. Primer almacén activo (fallback)
     *
     * @param Entrega $entrega
     * @return int ID del almacén
     */
    private function obtenerAlmacenParaEntrega(Entrega $entrega): int
    {
        // 1. Intentar obtener almacén de la venta
        $venta = $entrega->venta;
        if ($venta && isset($venta->almacen_id) && $venta->almacen_id) {
            return $venta->almacen_id;
        }

        // 2. Obtener almacén principal desde configuración
        $almacenPrincipalId = config('inventario.almacen_principal_id');
        if ($almacenPrincipalId) {
            return $almacenPrincipalId;
        }

        // 3. Fallback: primer almacén activo
        $almacen = \App\Models\Almacen::where('activo', true)->first();

        return $almacen ? $almacen->id : 1;
    }

    /**
     * Confirmar carga de una entrega (cambiar a EN_CARGA)
     *
     * Se ejecuta después de que el reporte de carga ha sido confirmado
     * Indica que la carga física está en progreso
     *
     * @param int $entregaId ID de la entrega
     * @return EntregaResponseDTO
     * @throws EstadoInvalidoException
     */
    public function confirmarCarga(int $entregaId): EntregaResponseDTO
    {
        $entrega = $this->transaction(function () use ($entregaId) {
            $entrega = Entrega::lockForUpdate()->findOrFail($entregaId);

            // Validar que esté en PREPARACION_CARGA
            if ($entrega->estado !== Entrega::ESTADO_PREPARACION_CARGA) {
                throw EstadoInvalidoException::transicionInvalida(
                    'Entrega',
                    $entregaId,
                    $entrega->estado,
                    Entrega::ESTADO_EN_CARGA
                );
            }

            $estadoAnterior = $entrega->estado;

            // Actualizar a EN_CARGA
            $entrega->update([
                'estado' => Entrega::ESTADO_EN_CARGA,
                'confirmado_carga_por' => Auth::id(),
                'fecha_confirmacion_carga' => now(),
            ]);

            $this->registrarCambioEstado(
                $entrega,
                $estadoAnterior,
                Entrega::ESTADO_EN_CARGA,
                'Carga confirmada - Iniciando proceso de carga física'
            );

            // Recargar relaciones para WebSocket
            $entrega->load(['chofer', 'venta.cliente', 'confirmadorCarga']);

            return $entrega;
        });

        $this->logSuccess('Carga confirmada', ['entrega_id' => $entregaId]);

        // Notificar por WebSocket a chofer y cliente
        try {
            $this->webSocketService->notifyCargoConfirmado($entrega);
        } catch (\Exception $e) {
            $this->logError('Error enviando notificación WebSocket de carga confirmada', [
                'entrega_id' => $entregaId,
                'error' => $e->getMessage(),
            ]);
        }

        return EntregaResponseDTO::fromModel($entrega);
    }

    /**
     * Marcar entrega como lista para partida (después de completar carga)
     *
     * Transición: EN_CARGA → LISTO_PARA_ENTREGA
     * Indica que la carga está completa y lista para que el chofer inicie viaje
     *
     * @param int $entregaId ID de la entrega
     * @return EntregaResponseDTO
     * @throws EstadoInvalidoException
     */
    public function marcarListoParaEntrega(int $entregaId): EntregaResponseDTO
    {
        $entrega = $this->transaction(function () use ($entregaId) {
            $entrega = Entrega::lockForUpdate()->findOrFail($entregaId);

            // Validar que esté en EN_CARGA
            if ($entrega->estado !== Entrega::ESTADO_EN_CARGA) {
                throw EstadoInvalidoException::transicionInvalida(
                    'Entrega',
                    $entregaId,
                    $entrega->estado,
                    Entrega::ESTADO_LISTO_PARA_ENTREGA
                );
            }

            $estadoAnterior = $entrega->estado;

            // Actualizar a LISTO_PARA_ENTREGA
            $entrega->update([
                'estado' => Entrega::ESTADO_LISTO_PARA_ENTREGA,
            ]);

            $this->registrarCambioEstado(
                $entrega,
                $estadoAnterior,
                Entrega::ESTADO_LISTO_PARA_ENTREGA,
                'Carga completada - Entrega lista para partida'
            );


            // Recargar relaciones para WebSocket
            $entrega->load(['chofer', 'venta.cliente', 'vehiculo']);

            return $entrega;
        });

        $this->logSuccess('Entrega marcada como lista para partida', ['entrega_id' => $entregaId]);

        // Notificar por WebSocket a chofer y cliente
        try {
            $this->webSocketService->notifyListoParaEntrega($entrega);
        } catch (\Exception $e) {
            $this->logError('Error enviando notificación WebSocket de listo para entrega', [
                'entrega_id' => $entregaId,
                'error' => $e->getMessage(),
            ]);
        }

        return EntregaResponseDTO::fromModel($entrega);
    }

    /**
     * Iniciar tránsito de entrega con coordenadas GPS (cambiar a EN_TRANSITO)
     *
     * Se ejecuta cuando el chofer inicia el viaje de entrega
     * Requiere ubicación GPS inicial
     *
     * @param int $entregaId ID de la entrega
     * @param float $latitud Latitud inicial
     * @param float $longitud Longitud inicial
     * @return EntregaResponseDTO
     * @throws EstadoInvalidoException
     */
    public function iniciarTransito(int $entregaId, float $latitud, float $longitud): EntregaResponseDTO
    {
        $entrega = $this->transaction(function () use ($entregaId, $latitud, $longitud) {
            $entrega = Entrega::lockForUpdate()->findOrFail($entregaId);

            // Validar que esté en LISTO_PARA_ENTREGA
            if ($entrega->estado !== Entrega::ESTADO_LISTO_PARA_ENTREGA) {
                throw EstadoInvalidoException::transicionInvalida(
                    'Entrega',
                    $entregaId,
                    $entrega->estado,
                    Entrega::ESTADO_EN_TRANSITO
                );
            }

            $estadoAnterior = $entrega->estado;

            // Actualizar a EN_TRANSITO con coordenadas iniciales
            $entrega->update([
                'estado' => Entrega::ESTADO_EN_TRANSITO,
                'latitud_actual' => $latitud,
                'longitud_actual' => $longitud,
                'fecha_ultima_ubicacion' => now(),
            ]);

            $this->registrarCambioEstado(
                $entrega,
                $estadoAnterior,
                Entrega::ESTADO_EN_TRANSITO,
                "Chofer iniciando tránsito - Ubicación inicial: ({$latitud}, {$longitud})"
            );


            // Recargar relaciones para WebSocket
            $entrega->load(['chofer', 'venta.cliente', 'vehiculo']);

            return $entrega;
        });

        $this->logSuccess('Entrega iniciada en tránsito', [
            'entrega_id' => $entregaId,
            'latitud' => $latitud,
            'longitud' => $longitud,
        ]);

        // Notificar por WebSocket a chofer y cliente
        try {
            $this->webSocketService->notifyInicioTransito($entrega, $latitud, $longitud);
        } catch (\Exception $e) {
            $this->logError('Error enviando notificación WebSocket de inicio de tránsito', [
                'entrega_id' => $entregaId,
                'error' => $e->getMessage(),
            ]);
        }

        return EntregaResponseDTO::fromModel($entrega);
    }

    /**
     * Actualizar ubicación GPS actual de una entrega en tránsito
     *
     * @param int $entregaId ID de la entrega
     * @param float $latitud Latitud actual
     * @param float $longitud Longitud actual
     * @return void
     */
    public function actualizarUbicacionGPS(int $entregaId, float $latitud, float $longitud): void
    {
        $entrega = Entrega::lockForUpdate()->findOrFail($entregaId);

        if ($entrega->estado === Entrega::ESTADO_EN_TRANSITO) {
            $entrega->update([
                'latitud_actual' => $latitud,
                'longitud_actual' => $longitud,
                'fecha_ultima_ubicacion' => now(),
            ]);

            $this->logSuccess('Ubicación GPS actualizada', [
                'entrega_id' => $entregaId,
                'latitud' => $latitud,
                'longitud' => $longitud,
            ]);

            // Notificar por WebSocket a cliente sobre actualización de ubicación
            try {
                $this->webSocketService->notifyActualizacionUbicacion($entrega, $latitud, $longitud);
            } catch (\Exception $e) {
                $this->logError('Error enviando notificación WebSocket de actualización de ubicación', [
                    'entrega_id' => $entregaId,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
