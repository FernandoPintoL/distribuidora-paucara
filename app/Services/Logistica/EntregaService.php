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

            // Validar estado del vehículo
            if ($vehiculo->estado !== 'disponible') {
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

            event(new \App\Events\EntregaAsignada($entrega));

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

            event(new \App\Events\EntregaEnCamino($entrega));

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

            event(new \App\Events\EntregaCompletada($entrega));

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

            event(new \App\Events\EntregaRechazada($entrega, $motivoNovedad));

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
        return EntregaEstadoHistorial::create([
            'entrega_id' => $entrega->id,
            'estado_anterior' => $estadoAnterior,
            'estado_nuevo' => $estadoNuevo,
            'razon_cambio' => $razon,
            'usuario_id' => Auth::id(),
            'fecha' => now(),
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
}
