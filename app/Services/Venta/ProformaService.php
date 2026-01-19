<?php
namespace App\Services\Venta;

use App\DTOs\Venta\CrearProformaDTO;
use App\DTOs\Venta\ProformaResponseDTO;
use App\Exceptions\Stock\StockInsuficientException;
use App\Exceptions\Venta\EstadoInvalidoException;
use App\Models\Cliente;
use App\Models\DetalleProforma;
use App\Models\Proforma;
use App\Models\ReservaStock;
use App\Services\Stock\StockService;
use App\Services\Traits\LogsOperations;
use App\Services\Traits\ManagesTransactions;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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
        'PENDIENTE'  => ['APROBADA', 'RECHAZADA'],
        'APROBADA'   => ['CONVERTIDA', 'RECHAZADA'],
        'CONVERTIDA' => [],
        'RECHAZADA'  => [],
        'VENCIDA'    => [],
    ];

    public function __construct(
        private StockService $stockService,
        private VentaService $ventaService,
    ) {}

    /**
     * Listar proformas con filtros
     */
    public function listar(int $perPage = 15, array $filtros = [])
    {
        $query = Proforma::query();

        // Filtrar por estado
        if (! empty($filtros['estado'])) {
            $query->where('estado', $filtros['estado']);
        }

        // Filtrar por cliente
        if (! empty($filtros['cliente_id'])) {
            $query->where('cliente_id', $filtros['cliente_id']);
        }

        // Buscar por número o cliente
        if (! empty($filtros['q'])) {
            $search = $filtros['q'];
            $query->where(function ($q) use ($search) {
                $q->where('numero', 'like', "%{$search}%")
                    ->orWhereHas('cliente', function ($q) use ($search) {
                        $q->where('nombre', 'like', "%{$search}%");
                    });
            });
        }

        return $query->with(['cliente', 'detalles'])
            ->latest()
            ->paginate($perPage);
    }

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

        // 2. Validar política de pago (si es CREDITO, validar permisos del cliente)
        if ($dto->politica_pago === Proforma::POLITICA_CREDITO) {
            $cliente = Cliente::findOrFail($dto->cliente_id);

            if (! $cliente->puede_tener_credito) {
                throw new \Exception(
                    "El cliente '{$cliente->nombre}' no tiene permiso para solicitar crédito"
                );
            }

            if (! $cliente->limite_credito || $cliente->limite_credito <= 0) {
                throw new \Exception(
                    "El cliente '{$cliente->nombre}' no tiene límite de crédito configurado"
                );
            }
        }

        // 3. Validar stock ANTES de transacción
        // 🔧 Usar almacén del usuario autenticado (consistencia con convertirAVenta)
        $almacenId = auth()->user()?->empresa?->almacen_id ?? 2;
        $validacion = $this->stockService->validarDisponible(
            $dto->detalles,
            $almacenId
        );

        if (! $validacion->esValida()) {
            throw StockInsuficientException::create($validacion->detalles);
        }

        // 3. Crear dentro de transacción
        $proforma = $this->transaction(function () use ($dto, $almacenId) {
            // 3.1 Crear Proforma
            // ✅ Obtener el estado PENDIENTE para la proforma inicial
            $estadoPendiente = \App\Models\EstadoLogistica::where('codigo', 'PENDIENTE')
                ->where('activo', true)
                ->first();

            $proforma = Proforma::create([
                'numero'            => $this->generarNumero(),
                'cliente_id'        => $dto->cliente_id,
                'usuario_creador_id'=> $dto->usuario_id ?? Auth::id(),
                'fecha'             => $dto->fecha,
                'fecha_vencimiento' => $dto->fecha_vencimiento,
                'subtotal'          => $dto->subtotal,
                'impuesto'          => $dto->impuesto,
                'total'             => $dto->total,
                'estado_proforma_id'=> $estadoPendiente?->id ?? 1,
                'observaciones'     => $dto->observaciones,
                'canal_origen'      => $dto->canal ?? 'PRESENCIAL',
                'politica_pago'     => $dto->politica_pago ?? 'CONTRA_ENTREGA',
                // Nota: almacen_id no se asigna en proforma, se usa del usuario al convertir a venta
            ]);

            // 3.2 Crear detalles
            foreach ($dto->detalles as $detalle) {
                DetalleProforma::create([
                    'proforma_id'     => $proforma->id,
                    'producto_id'     => $detalle['producto_id'],
                    'cantidad'        => $detalle['cantidad'],
                    'precio_unitario' => $detalle['precio_unitario'],
                    'subtotal'        => $detalle['cantidad'] * $detalle['precio_unitario'],
                ]);
            }

            // 3.3 RESERVAR stock (no consumir)
            foreach ($dto->detalles as $detalle) {
                ReservaStock::create([
                    'proforma_id'               => $proforma->id,
                    'producto_id'               => $detalle['producto_id'],
                    'cantidad'                  => $detalle['cantidad'],
                    'almacen_id'                => $almacenId,
                    'fecha_vencimiento_reserva' => $dto->fecha_vencimiento,
                ]);
            }

            // 3.4 Emitir evento
            event(new \App\Events\ProformaCreada($proforma));

            return $proforma;
        });

        $this->logSuccess('Proforma creada', [
            'proforma_id' => $proforma->id,
            'numero'      => $proforma->numero,
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

            // ✅ Obtener el estado APROBADA (ID=2 en estados_logistica, categoría: proforma)
            $estadoAprobada = \App\Models\EstadoLogistica::where('codigo', 'APROBADA')
                ->where('categoria', 'proforma')
                ->where('activo', true)
                ->first();

            $proforma->update(['estado_proforma_id' => $estadoAprobada?->id ?? 2]);

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

            // ✅ Obtener el estado RECHAZADA (ID=3 en estados_logistica, categoría: proforma)
            $estadoRechazada = \App\Models\EstadoLogistica::where('codigo', 'RECHAZADA')
                ->where('categoria', 'proforma')
                ->where('activo', true)
                ->first();

            $proforma->update([
                'estado_proforma_id' => $estadoRechazada?->id ?? 3,
                'observaciones' => ($proforma->observaciones ?? '') . "\nMotivo rechazo: {$motivo}",
            ]);

            event(new \App\Events\ProformaRechazada($proforma, $motivo));

            return $proforma;
        });

        $this->logSuccess('Proforma rechazada', [
            'proforma_id' => $proformaId,
            'motivo'      => $motivo,
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
            Log::info('🔄 [ProformaService::convertirAVenta] Iniciando transacción', [
                'proforma_id' => $proformaId,
                'timestamp'   => now()->toIso8601String(),
            ]);

            $proforma = Proforma::lockForUpdate()->with('detalles')->findOrFail($proformaId);

            Log::info('📋 [ProformaService::convertirAVenta] Proforma cargada', [
                'proforma_id' => $proformaId,
                'estado'      => $proforma->estado,
                'numero'      => $proforma->numero,
                'cliente_id'  => $proforma->cliente_id,
                'total'       => $proforma->total,
            ]);

            // Validar estado
            if ($proforma->estado !== 'APROBADA') {
                Log::warning('⚠️ [ProformaService::convertirAVenta] Estado inválido', [
                    'proforma_id'     => $proformaId,
                    'estado_actual'   => $proforma->estado,
                    'estado_esperado' => 'APROBADA',
                ]);
                throw EstadoInvalidoException::transicionInvalida(
                    'Proforma',
                    $proformaId,
                    $proforma->estado,
                    'CONVERTIDA'
                );
            }

            // Validar que siga vigente
            if ($proforma->fecha_vencimiento < now()) {
                Log::warning('⚠️ [ProformaService::convertirAVenta] Proforma vencida', [
                    'proforma_id'       => $proformaId,
                    'fecha_vencimiento' => $proforma->fecha_vencimiento,
                ]);
                throw new \Exception('Proforma vencida, no puede ser convertida');
            }

            // Preparar datos para crear venta
            $detalles = $proforma->detalles->map(fn($det) => [
                'producto_id'     => $det->producto_id,
                'cantidad'        => $det->cantidad,
                'precio_unitario' => $det->precio_unitario,
            ])->toArray();

            // ✅ NUEVO: Calcular peso total desde detalles
            // Fórmula: pesoTotal = Σ(cantidad × peso_producto)
            $pesoTotal = 0;
            foreach ($proforma->detalles as $detalle) {
                $pesoProducto  = $detalle->producto?->peso ?? 0;
                $pesoTotal    += $detalle->cantidad * $pesoProducto;
            }

            Log::info('📦 [ProformaService::convertirAVenta] Detalles preparados', [
                'proforma_id'         => $proformaId,
                'cantidad_detalles'   => count($detalles),
                'peso_total_estimado' => $pesoTotal,
                'detalles'            => $detalles,
            ]);

            // Crear venta (StockService consume stock dentro)
            Log::info('🔄 [ProformaService::convertirAVenta] Llamando a VentaService::crear()', [
                'proforma_id' => $proformaId,
                'cliente_id'  => $proforma->cliente_id,
                'total'       => $proforma->total,
            ]);

            // Determinar si requiere envío basado en las direcciones de la proforma
            $requiereEnvio = $this->determinarSiRequiereEnvio($proforma);

            // Obtener política de pago (puede venir del cliente o usar default)
            $politicaPago = $this->obtenerPoliticaPago($proforma);

            // Calcular ventanas de entrega
            $ventanas = $this->calcularVentanasEntrega($proforma);

            // Obtener dirección de entrega confirmada (prioridad) o solicitada
            $direccionClienteId = $proforma->direccion_entrega_confirmada_id ?? $proforma->direccion_entrega_solicitada_id;

            // ✅ NUEVO: Obtener el estado APROBADO para la venta creada desde proforma
            $estadoAprobado = \App\Models\EstadoDocumento::where('codigo', 'APROBADO')
                ->where('activo', true)
                ->first();

            $estadoDocumentoIdFinal = $estadoAprobado?->id ?? 3;
            Log::info('📋 [ProformaService::convertirAVenta] Estado APROBADO obtenido', [
                'estado_documento_id_encontrado' => $estadoAprobado?->id,
                'estado_documento_id_final' => $estadoDocumentoIdFinal,
                'estado_codigo' => $estadoAprobado?->codigo ?? 'FALLBACK A 3',
            ]);

            // ✅ NUEVO: Obtener montos pagados en la aprobación (si los hay)
            // Esto permite saber si hubo pago inicial cuando se aprobó
            $montoPagadoInicial = 0;
            // Por ahora, asumimos que si se pagó, se registró como Pago en la BD
            // En futuro, esto podría venir del registro de aprobación
            Log::info('💰 [ProformaService::convertirAVenta] Monto pagado inicial', [
                'monto_pagado' => $montoPagadoInicial,
                'nota'         => 'Será actualizado cuando se implemente registro de pagos en aprobación',
            ]);

            $ventaDTO = $this->ventaService->crear(
                new \App\DTOs\Venta\CrearVentaDTO(
                    cliente_id: $proforma->cliente_id,
                    fecha: now()->toDateString(),
                    detalles: $detalles,
                    subtotal: $proforma->subtotal,
                    impuesto: $proforma->impuesto,
                    total: $proforma->total,
                    peso_total_estimado: $pesoTotal, // ✅ NUEVO: Pasar peso calculado
                                                     // 🔧 Obtener almacén del usuario autenticado (no de la proforma)
                    almacen_id: auth()->user()?->empresa?->almacen_id ?? 2,
                    observaciones: "Convertida desde proforma #{$proforma->numero}",
                    usuario_id: Auth::id(),
                    proforma_id: $proforma->id,
                    // Dirección de entrega
                    direccion_cliente_id: $direccionClienteId,
                    // Campos de logística
                    requiere_envio: $requiereEnvio,
                    canal_origen: $proforma->canal_origen ?? 'WEB',
                    estado_logistico_id: $this->obtenerEstadoLogisticoInicial($requiereEnvio),
                    // Campos de política de pago
                    politica_pago: $politicaPago,
                    // ✅ estado_pago se calcula dinámicamente en VentaService basado en monto_pagado_inicial
                    // Campos de SLA y compromisos de entrega
                    fecha_entrega_comprometida: $proforma->fecha_entrega_confirmada,
                    hora_entrega_comprometida: $proforma->hora_entrega_confirmada
                        ? (is_string($proforma->hora_entrega_confirmada)
                            ? $proforma->hora_entrega_confirmada
                            : $proforma->hora_entrega_confirmada->format('H:i:s'))
                        : null,
                    ventana_entrega_ini: $ventanas['inicio'],
                    ventana_entrega_fin: $ventanas['fin'],
                    idempotency_key: "proforma-{$proforma->id}-" . now()->timestamp,
                    // ✅ NUEVO: Estado APROBADO para venta desde proforma aprobada
                    estado_documento_id: $estadoDocumentoIdFinal,
                    // ✅ NUEVO: Monto pagado inicial (si lo hay)
                    monto_pagado_inicial: $montoPagadoInicial > 0 ? $montoPagadoInicial : null,
                )
            );

            // Obtener el código del estado logístico asignado (para logging)
            $estadoLogisticoInfo = $ventaDTO->estado_logistico_id
                ? \App\Models\EstadoLogistica::find($ventaDTO->estado_logistico_id)?->codigo
                : 'SIN_LOGISTICA';

            Log::info('✅ [ProformaService::convertirAVenta] Venta creada exitosamente', [
                'proforma_id'             => $proformaId,
                'venta_id'                => $ventaDTO->id,
                'venta_numero'            => $ventaDTO->numero,
                'requiere_envio'          => $requiereEnvio,
                'estado_logistico_id'     => $ventaDTO->estado_logistico_id,
                'estado_logistico_codigo' => $estadoLogisticoInfo,
            ]);

            // Liberar reserva de stock (COMENTADO: sera implementado con referencia_id correctamente)
            Log::info('🔄 [ProformaService::convertirAVenta] Liberando reserva de stock', [
                'proforma_id' => $proformaId,
            ]);

            // ReservaStock::where('proforma_id', $proformaId)->delete();
            // Usar referencia_id en su lugar cuando se implemente correctamente
            ReservaStock::where('referencia_tipo', 'proforma')
                ->where('referencia_id', $proformaId)
                ->update(['estado' => 'utilizada']);

            Log::info('✅ [ProformaService::convertirAVenta] Reserva de stock marcada como utilizada', [
                'proforma_id' => $proformaId,
            ]);

            // Marcar proforma como convertida
            // 🔧 Usar el ID correcto del estado (4 = CONVERTIDA en estados_logistica)
            $proforma->update(['estado_proforma_id' => 4]);

            Log::info('✅ [ProformaService::convertirAVenta] Proforma marcada como CONVERTIDA', [
                'proforma_id' => $proformaId,
            ]);

            // Obtener el modelo Venta desde la BD (necesario para el evento)
            // Ya que VentaService retorna un DTO, necesitamos el modelo real
            $ventaModel = \App\Models\Venta::find($ventaDTO->id);

            // Disparar evento de proforma convertida
            if ($ventaModel) {
                Log::debug('📢 [ProformaService::convertirAVenta] Disparando evento ProformaConvertida');
                event(new \App\Events\ProformaConvertida($proforma, $ventaModel));
            } else {
                Log::warning('⚠️ [ProformaService::convertirAVenta] No se pudo obtener el modelo Venta para el evento', [
                    'proforma_id' => $proformaId,
                    'venta_id'    => $ventaDTO->id,
                ]);
            }

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
        $proforma = Proforma::with([
            'detalles.producto.categoria',
            'detalles.producto.marca',
            'cliente',
            'direccionSolicitada',
            'direccionConfirmada',
        ])->findOrFail($proformaId);

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
            'dias'        => $dias,
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

        if (! in_array($estadoNuevo, $permitidas)) {
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
        $year  = now()->year;
        $count = Proforma::whereYear('created_at', $year)->count() + 1;

        return sprintf('PF-%d-%06d', $year, $count);
    }

    /**
     * Determinar si la venta requiere envío
     *
     * Lógica:
     * - Si tiene dirección de entrega confirmada → requiere envío
     * - Si el cliente está fuera de la ciudad → requiere envío
     * - Si es de canal APP_EXTERNA → generalmente requiere envío
     */
    private function determinarSiRequiereEnvio(Proforma $proforma): bool
    {
        // Si tiene dirección de entrega confirmada, requiere envío
        if ($proforma->direccion_entrega_confirmada_id) {
            return true;
        }

        // Si tiene dirección solicitada, requiere envío
        if ($proforma->direccion_entrega_solicitada_id) {
            return true;
        }

        // Si es de app externa, generalmente requiere envío
        if ($proforma->canal_origen === Proforma::CANAL_APP_EXTERNA) {
            return true;
        }

        // Si el cliente tiene localidad fuera de la ciudad base, requiere envío
        if ($proforma->cliente && $proforma->cliente->localidad_id) {
            // Aquí podrías agregar lógica para verificar si la localidad requiere envío
            // Por ahora, asumimos que si tiene localidad, probablemente requiere envío
            return true;
        }

        // Por defecto, no requiere envío (venta en mostrador)
        return false;
    }

    /**
     * Obtener política de pago para la venta
     *
     * Prioridad:
     * 1. Política de la proforma (establecida en el formulario)
     * 2. Política específica del cliente (si existe en tabla clientes)
     * 3. Política por categoría de cliente
     * 4. Default: CONTRA_ENTREGA
     */
    private function obtenerPoliticaPago(Proforma $proforma): string
    {
        // 1. Si la proforma tiene una política explícita, usarla
        if ($proforma->politica_pago && in_array($proforma->politica_pago, [
            \App\Models\Proforma::POLITICA_CONTRA_ENTREGA,
            \App\Models\Proforma::POLITICA_ANTICIPADO_100,
            \App\Models\Proforma::POLITICA_MEDIO_MEDIO,
            \App\Models\Proforma::POLITICA_CREDITO,
        ])) {
            return $proforma->politica_pago;
        }

        // TODO: Cuando se agregue campo politica_pago en tabla clientes
        // if ($proforma->cliente && $proforma->cliente->politica_pago) {
        //     return $proforma->cliente->politica_pago;
        // }

        // TODO: Cuando se agregue política por categoría
        // if ($proforma->cliente && $proforma->cliente->categorias->isNotEmpty()) {
        //     $categoria = $proforma->cliente->categorias->first();
        //     if ($categoria->politica_pago_default) {
        //         return $categoria->politica_pago_default;
        //     }
        // }

        // Default: CONTRA_ENTREGA (pago al recibir)
        return 'CONTRA_ENTREGA';
    }

    /**
     * Calcular ventanas de entrega basadas en la hora comprometida
     *
     * Si hay hora confirmada, genera una ventana de ±1 hora
     * Si no hay hora, retorna null para ambas
     */
    private function calcularVentanasEntrega(Proforma $proforma): array
    {
        if (! $proforma->hora_entrega_confirmada) {
            return [
                'inicio' => null,
                'fin'    => null,
            ];
        }

        // Crear ventana de ±1 hora alrededor de la hora comprometida
        // 🔧 Convertir string a Carbon si es necesario (ahora que el cast es 'string')
        $horaConfirmada = $proforma->hora_entrega_confirmada;
        if (is_string($horaConfirmada)) {
            $horaConfirmada = \Carbon\Carbon::createFromFormat('H:i:s', $horaConfirmada);
        }

        $horaInicio = $horaConfirmada->copy()->subHour();
        $horaFin    = $horaConfirmada->copy()->addHour();

        return [
            'inicio' => $horaInicio->format('H:i:s'),
            'fin'    => $horaFin->format('H:i:s'),
        ];
    }

    /**
     * Obtener el estado logístico inicial para una venta recién creada desde proforma
     *
     * Estados iniciales:
     * - Si requiere envío: PENDIENTE_ENVIO
     * - Si es retiro: PENDIENTE_RETIRO
     * - Si no requiere logística: null
     *
     * @param bool $requiereEnvio Si la venta requiere envío/logística
     * @return int|null ID del estado logístico inicial, o null si no requiere logística
     */
    private function obtenerEstadoLogisticoInicial(bool $requiereEnvio): ?int
    {
        if (! $requiereEnvio) {
            return null; // Venta de mostrador, no requiere logística
        }

        // Por defecto, usar PENDIENTE_ENVIO para ventas que requieren envío
        $estadoId = \App\Models\EstadoLogistica::where('codigo', 'PENDIENTE_ENVIO')
            ->where('categoria', 'venta_logistica')
            ->value('id');

        if (! $estadoId) {
            Log::error('❌ [ProformaService] Estado PENDIENTE_ENVIO no encontrado en estados_logistica', [
                'categoria' => 'venta_logistica',
                'codigo'    => 'PENDIENTE_ENVIO',
            ]);

            // Fallback a PENDIENTE_RETIRO si PENDIENTE_ENVIO no existe
            $estadoId = \App\Models\EstadoLogistica::where('codigo', 'PENDIENTE_RETIRO')
                ->where('categoria', 'venta_logistica')
                ->value('id');
        }

        if (! $estadoId) {
            Log::error('❌ [ProformaService] No hay estados logísticos disponibles', [
                'categoria' => 'venta_logistica',
            ]);
        }

        return $estadoId;
    }
}
