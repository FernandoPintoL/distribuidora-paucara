<?php
namespace App\Services\Venta;

use App\DTOs\Venta\CrearVentaDTO;
use App\DTOs\Venta\VentaResponseDTO;
use App\Exceptions\Stock\StockInsuficientException;
use App\Exceptions\Venta\EstadoInvalidoException;
use App\Models\EstadoDocumento;
use App\Models\Venta;
use App\Services\Stock\StockService;
use App\Services\Traits\LogsOperations;
use App\Services\Traits\ManagesTransactions;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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
    public function crear(CrearVentaDTO $dto, ?int $cajaId = null): VentaResponseDTO
    {
        Log::info('🔄 [VentaService::crear] Iniciando creación de venta', [
            'cliente_id'                          => $dto->cliente_id,
            'cantidad_detalles'                   => count($dto->detalles),
            'total'                               => $dto->total,
            'almacen_id'                          => $dto->almacen_id,
            'estado_documento_id_recibido_en_dto' => $dto->estado_documento_id,
            'proforma_id'                         => $dto->proforma_id,
            'timestamp'                           => now()->toIso8601String(),
        ]);

        // 1. Validar datos
        Log::debug('✓ [VentaService::crear] Validando detalles DTO');
        $dto->validarDetalles();

        // 2. Validar stock ANTES de la transacción
        // ✅ MODIFICADO: NO validar stock para CREDITO (son promesas de pago, no ventas inmediatas)
        $esCREDITO = strtoupper($dto->politica_pago ?? '') === 'CREDITO';

        // COMBO: expandir antes de validar y decrementar stock.
        // $dto->detalles se preserva sin cambios para DetalleVenta.
        $detallesParaStock = $this->stockService->expandirCombos($dto->detalles);

        if (!$esCREDITO) {
            Log::info('🔄 [VentaService::crear] Validando stock disponible', [
                'almacen_id'     => $dto->almacen_id,
                'detalles_count' => count($dto->detalles),
                'politica_pago'  => $dto->politica_pago,
            ]);

            $validacionStock = $this->stockService->validarDisponible(
                $detallesParaStock,
                $dto->almacen_id
            );

            if (! $validacionStock->valido) {
                Log::warning('❌ [VentaService::crear] Stock insuficiente', [
                    'detalles' => $validacionStock->detalles,
                ]);
                throw StockInsuficientException::create($validacionStock->detalles);
            }

            Log::info('✅ [VentaService::crear] Stock validado exitosamente');
        } else {
            Log::info('⏭️ [VentaService::crear] Saltando validación de stock (CREDITO permite stock negativo)', [
                'politica_pago' => $dto->politica_pago,
            ]);
        }

        // 3. Crear dentro de transacción
        // ✅ NUEVO: Pasar $esCREDITO al closure para permitir stock negativo
        $venta = $this->transaction(function () use ($dto, $cajaId, $esCREDITO, $detallesParaStock) {
            Log::debug('🔄 [VentaService::crear] Iniciando transacción', [
                'proforma_id' => $dto->proforma_id,
            ]);

            // ✅ NUEVO: Usar estado_documento_id del DTO si viene especificado
            // De lo contrario, usar el estado inicial (PENDIENTE)
            if ($dto->estado_documento_id) {
                $estadoDocumentoId = $dto->estado_documento_id;
                Log::info('📋 [VentaService::crear] Usando estado_documento_id del DTO', [
                    'estado_documento_id' => $estadoDocumentoId,
                ]);
            } else {
                $estadoDocumentoId = \App\Models\EstadoDocumento::obtenerEstadoInicial();
                Log::info('📋 [VentaService::crear] Usando estado inicial por defecto', [
                    'estado_documento_id' => $estadoDocumentoId,
                ]);
            }

            // Obtener moneda por defecto (BOB - Bolivianos)
            $monedaDefecto = \App\Models\Moneda::where('codigo', 'BOB')->first() ??
            \App\Models\Moneda::first();

                                       // ✅ NUEVO: Calcular estado_pago dinámicamente
            $estadoPago = 'PENDIENTE'; // Default
            if ($dto->monto_pagado_inicial && $dto->monto_pagado_inicial > 0) {
                if ($dto->monto_pagado_inicial >= $dto->total) {
                    $estadoPago = 'PAGADO'; // Pagado completamente
                    Log::info('💰 Estado pago: PAGADA (pago completo)', [
                        'monto_pagado' => $dto->monto_pagado_inicial,
                        'total'        => $dto->total,
                    ]);
                } else {
                    $estadoPago = 'PARCIAL'; // Pago parcial
                    Log::info('💰 Estado pago: PARCIAL (pago incompleto)', [
                        'monto_pagado' => $dto->monto_pagado_inicial,
                        'total'        => $dto->total,
                    ]);
                }
            } else {
                Log::info('💰 Estado pago: PENDIENTE (sin pago inicial)', [
                    'politica_pago' => $dto->politica_pago,
                ]);
            }

            // 3.1 Crear Venta
            Log::debug('📝 [VentaService::crear] Creando registro de Venta en BD', [
                'cliente_id'          => $dto->cliente_id,
                'total'               => $dto->total,
                'estado_documento_id' => $estadoDocumentoId,
            ]);

            $venta = Venta::create([
                'numero'                     => Venta::generarNumero(),
                'cliente_id'                 => $dto->cliente_id,
                'usuario_id'                 => $dto->usuario_id ?? Auth::id(),
                'fecha'                      => $dto->fecha,
                'subtotal'                   => $dto->subtotal,
                'impuesto'                   => $dto->impuesto,
                'total'                      => $dto->total,
                'peso_total_estimado'        => $dto->peso_total_estimado ?? 0, // ✅ NUEVO: Peso total calculado
                'estado_documento_id'        => $estadoDocumentoId,
                'moneda_id'                  => $monedaDefecto?->id ?? 1,
                'observaciones'              => $dto->observaciones,
                'almacen_id'                 => $dto->almacen_id,
                'proforma_id'                => $dto->proforma_id,
                'direccion_cliente_id'       => $dto->direccion_cliente_id,
                // Campos de logística
                'requiere_envio'             => $dto->requiere_envio,
                'canal_origen'               => $dto->canal_origen ?? 'WEB',
                'estado_logistico_id'        => $dto->estado_logistico_id,
                // Campos de política de pago
                'tipo_pago_id'               => $dto->tipo_pago_id,  // ✅ NUEVO: Tipo de pago seleccionado
                'politica_pago'              => $dto->politica_pago ?? 'CONTRA_ENTREGA',
                'estado_pago'                => $estadoPago,                                             // ✅ Dinámico según pago inicial
                'monto_pagado'               => $dto->monto_pagado_inicial ?? 0,                         // ✅ Si se pagó al aprobar
                'monto_pendiente'            => max(0, $dto->total - ($dto->monto_pagado_inicial ?? 0)), // ✅ Resta pago inicial
                                                                                                         // Campos de SLA y compromisos de entrega
                'fecha_entrega_comprometida' => $dto->fecha_entrega_comprometida,
                'hora_entrega_comprometida'  => $dto->hora_entrega_comprometida,
                'ventana_entrega_ini'        => $dto->ventana_entrega_ini,
                'ventana_entrega_fin'        => $dto->ventana_entrega_fin,
                'idempotency_key'            => $dto->idempotency_key,
            ]);

            Log::info('✅ [VentaService::crear] Venta creada en BD', [
                'venta_id'     => $venta->id,
                'venta_numero' => $venta->numero,
            ]);

            // ✅ Almacenar cajaId para que el observer lo use
            if ($cajaId) {
                $venta->setAttribute('_caja_id', $cajaId);
            }

            // 3.2 Crear detalles
            Log::debug('📦 [VentaService::crear] Creando detalles de venta');
            foreach ($dto->detalles as $detalle) {
                // ✅ MODIFICADO: Respetar el precio_unitario enviado desde el frontend
                // El descuento también se considera al calcular el subtotal
                $cantidad = $detalle['cantidad'] ?? 0;
                $precio = $detalle['precio_unitario'] ?? 0;
                $descuento = $detalle['descuento'] ?? 0;
                $subtotal = ($cantidad * $precio) - $descuento;

                \App\Models\DetalleVenta::create([
                    'venta_id'           => $venta->id,
                    'producto_id'        => $detalle['producto_id'],
                    'cantidad'           => $cantidad,
                    'precio_unitario'    => $precio,
                    'descuento'          => $descuento,
                    'subtotal'           => $subtotal,
                    'tipo_precio_id'     => $detalle['tipo_precio_id'] ?? null,    // ✅ NUEVO: Tipo de precio seleccionado
                    'tipo_precio_nombre' => $detalle['tipo_precio_nombre'] ?? null, // ✅ NUEVO: Nombre del tipo de precio
                ]);
            }
            Log::info('✅ [VentaService::crear] Detalles de venta creados', [
                'venta_id'          => $venta->id,
                'cantidad_detalles' => count($dto->detalles),
            ]);

            // 3.3 Consumir stock (Service maneja su propia lógica dentro de transacción)
            Log::debug('🔄 [VentaService::crear] Procesando salida de stock', [
                'venta_id' => $venta->id,
                'politica_pago' => $dto->politica_pago,
            ]);

            // ✅ NUEVO: Permitir stock negativo para CREDITO (son promesas de pago, no ventas inmediatas)
            $this->stockService->procesarSalidaVenta(
                $detallesParaStock,
                $venta->numero,
                $dto->almacen_id,
                permitirStockNegativo: $esCREDITO  // ✅ Permite stock negativo para CREDITO
            );

            Log::info('✅ [VentaService::crear] Stock procesado exitosamente', [
                'venta_id' => $venta->id,
                'politica_pago' => $dto->politica_pago,
            ]);

            // 3.4 Crear asiento contable (COMENTADO: Se habilitará cuando CuentasContables esté configurado)
            // \Log::debug('🔄 [VentaService::crear] Creando asiento contable');
            // $this->contabilidadService->crearAsientoVenta($venta);
            Log::info('✅ [VentaService::crear] Asiento contable omitido (será habilitado después)');

            // 3.5 Generar token de acceso público
            Log::debug('🔐 [VentaService::crear] Generando token de acceso público');
            \App\Models\VentaAccessToken::create([
                'venta_id'  => $venta->id,
                'token'     => \App\Models\VentaAccessToken::generateToken(),
                'is_active' => true,
            ]);
            Log::info('✅ [VentaService::crear] Token de acceso creado');

            // 3.6 Emitir evento (DESPUÉS de que todo esté persisted)
            Log::debug('📢 [VentaService::crear] Disparando evento VentaCreada');
            event(new \App\Events\VentaCreada($venta));

            return $venta;
        });

        // 4. Log de éxito
        Log::info('✅ [VentaService::crear] Venta creada exitosamente', [
            'venta_id'   => $venta->id,
            'cliente_id' => $venta->cliente_id,
            'total'      => $venta->total,
            'timestamp'  => now()->toIso8601String(),
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
            if ($venta->estado !== 'Pendiente') {
                throw EstadoInvalidoException::transicionInvalida(
                    'Venta',
                    $ventaId,
                    $venta->estado,
                    'Aprobado'
                );
            }

            // Cambiar estado
            $venta->update(['estado_documento_id' => EstadoDocumento::where('nombre', 'Aprobado')->first()->id]);

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

            // Si ya está en estado final, no se puede rechazar
            if (in_array($venta->estado, ['Facturado', 'Anulado', 'Cancelado'])) {
                throw EstadoInvalidoException::transicionInvalida(
                    'Venta',
                    $ventaId,
                    $venta->estado,
                    'Cancelado'
                );
            }

            // Revertir stock si ya se consumió
            if ($venta->estado === 'Aprobado') {
                $this->stockService->devolverStock(
                    $venta->detalles->toArray(),
                    $venta->numero . "-RECHAZO",
                    $venta->almacen_id
                );
            }

            // Cambiar estado a Cancelado
            $estadoCancelado = EstadoDocumento::where('nombre', 'Cancelado')->first();
            $venta->update([
                'estado_documento_id' => $estadoCancelado->id,
                'observaciones'       => ($venta->observaciones ?? '') . "\nMotivo rechazo: {$motivo}",
            ]);

            // Emitir evento
            event(new \App\Events\VentaRechazada($venta, $motivo));

            return $venta;
        });

        $this->logSuccess('Venta rechazada', [
            'venta_id' => $ventaId,
            'motivo'   => $motivo,
        ]);

        return VentaResponseDTO::fromModel($venta);
    }

    /**
     * Obtener una venta por ID
     */
    public function obtener(int $ventaId): VentaResponseDTO
    {
        $venta = $this->read(fn() => Venta::with([
            'detalles.producto', // ✅ Incluir productos de detalles
            'cliente',
            'usuario',
            'estadoDocumento',
            'moneda',
            'tipoPago',
            'proforma',
            'direccionCliente.localidad', // ✅ Cargar localidad para mapas
            'estadoLogistica',            // ✅ NUEVO: Estado logístico
        ])->findOrFail($ventaId));

        return VentaResponseDTO::fromModel($venta);
    }

    /**
     * Listar ventas con paginación
     *
     * @param int $perPage
     * @param array $filtros Puede incluir: estado, estado_documento_id, cliente_id, usuario_id, fecha_desde, fecha_hasta, numero, search, monto_min, monto_max, moneda_id
     */
    public function listar(int $perPage = 15, array $filtros = []): LengthAwarePaginator
    {
        return $this->read(function () use ($perPage, $filtros) {
            // ✅ ACTUALIZADO: Cargar todas las relaciones necesarias para el frontend
            // Incluye estadoLogistica para mostrar estado de entregas en tabla
            $query = Venta::with([
                'cliente',
                'estadoDocumento',
                'usuario',
                'moneda',
                'direccionCliente.localidad', // ✅ Cargar localidad de la dirección para mapas
                'estadoLogistica',            // ✅ NUEVO: Para mostrar estado logístico en tabla
                'detalles.producto',          // ✅ RECOMENDADO: Para verificar peso_total_estimado si es necesario
            ])
                ->when($filtros['id'] ?? null, fn($q, $id) =>
                    $q->where('id', $id)
                )
                ->when($filtros['estado'] ?? null, fn($q, $estado) =>
                    $q->where('estado', $estado)
                )
                ->when($filtros['estado_documento_id'] ?? null, fn($q, $estadoId) =>
                    $q->where('estado_documento_id', $estadoId)
                )
                ->when($filtros['cliente_id'] ?? null, fn($q, $clienteId) =>
                    $q->where('cliente_id', $clienteId)
                )
                ->when($filtros['usuario_id'] ?? null, fn($q, $usuarioId) =>
                    $q->where('usuario_id', $usuarioId)
                )
                ->when($filtros['fecha_desde'] ?? null, fn($q, $fecha) =>
                    $q->where('fecha', '>=', $fecha)
                )
                ->when($filtros['fecha_hasta'] ?? null, fn($q, $fecha) =>
                    $q->where('fecha', '<=', $fecha)
                )
                ->when($filtros['numero'] ?? null, fn($q, $numero) =>
                    $q->where('numero', 'like', '%' . $numero . '%')
                )
                ->when($filtros['search'] ?? null, fn($q, $search) =>
                    $q->where(function ($subQuery) use ($search) {
                        // Si el término es un número, buscar por ID exacto primero
                        if (is_numeric($search)) {
                            $subQuery->where('id', '=', (int)$search)
                                ->orWhere('numero', '=', $search); // Búsqueda exacta por número
                        } else {
                            // Para términos no numéricos, buscar al inicio del número (más exacto que parcial)
                            $subQuery->where('numero', 'like', $search . '%')
                                ->orWhereHas('cliente', fn($qCli) =>
                                    $qCli->where('nombre', 'like', '%' . $search . '%')
                                );
                        }
                    })
                )
                ->when($filtros['monto_min'] ?? null, fn($q, $monto) =>
                    $q->where('total', '>=', $monto)
                )
                ->when($filtros['monto_max'] ?? null, fn($q, $monto) =>
                    $q->where('total', '<=', $monto)
                )
                ->when($filtros['moneda_id'] ?? null, fn($q, $monedaId) =>
                    $q->where('moneda_id', $monedaId)
                )
                ->when($filtros['tipo_venta'] ?? null, fn($q, $tipoVenta) =>
                    $tipoVenta === 'delivery'
                        ? $q->where('requiere_envio', true)
                        : ($tipoVenta === 'presencial' ? $q->where('requiere_envio', false) : $q)
                )
            // ✅ NUEVO: Filtro de estado de pago (para Flutter app)
                ->when($filtros['estado_pago'] ?? null, fn($q, $estadoPago) =>
                    $q->where('estado_pago', $estadoPago)
                )
            // ✅ NUEVO: Filtro de estado logístico (para Flutter app)
            // Filtrar por código de estado_logistica a través de la relación
                ->when($filtros['estado_logistico'] ?? null, fn($q, $estadoLogistico) =>
                    $q->whereHas('estadoLogistica', fn($subQ) =>
                        $subQ->where('codigo', $estadoLogistico)
                    )
                );

            $resultado = $query
                ->orderByDesc('fecha')
                ->orderByDesc('id')
                ->paginate($perPage);

            // ✅ DEBUG: Verificar que las relaciones se cargaron correctamente
            Log::debug('📦 VentaService::listar - Primeras ventas cargadas', [
                'total'                   => $resultado->total(),
                'primera_venta_id'        => $resultado->first()?->id ?? 'N/A',
                'tiene_direccion_cliente' => $resultado->first()?->direccionCliente ? 'SÍ' : 'NO',
                'tiene_estadoLogistica'   => $resultado->first()?->estadoLogistica ? 'SÍ' : 'NO',
                'latitud'                 => $resultado->first()?->direccionCliente?->latitud ?? 'N/A',
                'longitud'                => $resultado->first()?->direccionCliente?->longitud ?? 'N/A',
            ]);

            return $resultado;
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
            if (! in_array($venta->estado, ['ENTREGADA', 'PAGADA'])) {
                throw EstadoInvalidoException::transicionInvalida(
                    'Venta',
                    $ventaId,
                    $venta->estado,
                    'PAGADA'
                );
            }

            // Crear registro de pago
            \App\Models\Pago::create([
                'venta_id'   => $ventaId,
                'usuario_id' => Auth::id(),
                'monto'      => $monto,
                'fecha'      => now(),
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
            'monto'    => $monto,
        ]);

        return VentaResponseDTO::fromModel($venta);
    }
}
