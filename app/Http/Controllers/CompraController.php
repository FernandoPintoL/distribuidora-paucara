<?php
namespace App\Http\Controllers;

use App\Http\Requests\StoreCompraRequest;
use App\Http\Requests\UpdateCompraRequest;
use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\EstadoDocumento;
use App\Models\Moneda;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\TipoPago;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CompraController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:compras.index')->only('index');
        $this->middleware('permission:compras.show')->only('show');
        $this->middleware('permission:compras.store')->only('store');
        $this->middleware('permission:compras.update')->only('update');
        $this->middleware('permission:compras.destroy')->only('destroy');
    }

    public function index(Request $request)
    {
        // Validar filtros
        $filtros = $request->validate([
            'q'                   => ['nullable', 'string', 'max:255'],
            'proveedor_id'        => ['nullable', 'exists:proveedores,id'],
            'estado_documento_id' => ['nullable', 'exists:estados_documento,id'],
            'moneda_id'           => ['nullable', 'exists:monedas,id'],
            'tipo_pago_id'        => ['nullable', 'exists:tipos_pago,id'],
            'fecha_desde'         => ['nullable', 'date'],
            'fecha_hasta'         => ['nullable', 'date'],
            'per_page'            => ['nullable', 'integer', 'min:10', 'max:100'],
            'sort_by'             => ['nullable', 'string', 'in:numero,fecha,proveedor,total,created_at'],
            'sort_dir'            => ['nullable', 'string', 'in:asc,desc'],
        ]);

        $query = Compra::with(['proveedor', 'usuario', 'estadoDocumento', 'moneda', 'tipoPago']);

        // Filtro de búsqueda general
        if (! empty($filtros['q'])) {
            $searchTerm = $filtros['q'];
            $query->where(function ($q) use ($searchTerm) {
                $q->where('numero', 'ilike', "%{$searchTerm}%")
                    ->orWhere('numero_factura', 'ilike', "%{$searchTerm}%")
                    ->orWhere('observaciones', 'ilike', "%{$searchTerm}%")
                    ->orWhereHas('proveedor', function ($qq) use ($searchTerm) {
                        $qq->where('nombre', 'ilike', "%{$searchTerm}%");
                    });
            });
        }

        // Filtros específicos
        if (! empty($filtros['proveedor_id'])) {
            $query->where('proveedor_id', $filtros['proveedor_id']);
        }

        if (! empty($filtros['estado_documento_id'])) {
            $query->where('estado_documento_id', $filtros['estado_documento_id']);
        }

        if (! empty($filtros['moneda_id'])) {
            $query->where('moneda_id', $filtros['moneda_id']);
        }

        if (! empty($filtros['tipo_pago_id'])) {
            $query->where('tipo_pago_id', $filtros['tipo_pago_id']);
        }

        // Filtros de fecha
        if (! empty($filtros['fecha_desde'])) {
            $query->whereDate('fecha', '>=', $filtros['fecha_desde']);
        }

        if (! empty($filtros['fecha_hasta'])) {
            $query->whereDate('fecha', '<=', $filtros['fecha_hasta']);
        }

        // Ordenamiento
        $sortBy  = $filtros['sort_by'] ?? 'created_at';
        $sortDir = $filtros['sort_dir'] ?? 'desc';

        if ($sortBy === 'proveedor') {
            $query->leftJoin('proveedores', 'compras.proveedor_id', '=', 'proveedores.id')
                ->orderBy('proveedores.nombre', $sortDir)
                ->select('compras.*');
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        // Paginación
        $perPage = $filtros['per_page'] ?? 15;
        $compras = $query->paginate($perPage)->withQueryString();

        // Estadísticas para el dashboard
        $estadisticas = $this->calcularEstadisticas($filtros);

        // Datos para filtros - Mostrar todos los elementos activos disponibles
        $datosParaFiltros = [
            'proveedores' => Proveedor::where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre']),
            'estados'     => EstadoDocumento::where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre']),
            'monedas'     => Moneda::where('activo', true)
                ->orderBy('codigo')
                ->get(['id', 'codigo', 'simbolo']),
            'tipos_pago'  => TipoPago::orderBy('nombre')
                ->get(['id', 'codigo', 'nombre']),
        ];

        return Inertia::render('compras/index', [
            'compras'          => $compras,
            'filtros'          => $filtros,
            'estadisticas'     => $estadisticas,
            'datosParaFiltros' => $datosParaFiltros,
        ]);
    }

    public function create()
    {
        // Debug inicial
        Log::info('CompraController::create - MÉTODO EJECUTADO');

        $tipos_pago = TipoPago::orderBy('nombre')->get(['id', 'codigo', 'nombre']);
        Log::info('CompraController::create - tipos_pago obtenidos', [
            'count' => $tipos_pago->count(),
            'data'  => $tipos_pago->toArray(),
        ]);

        $data = [
            'tipos_pago'  => $tipos_pago,
            'selectores'  => [
                'tipospagos' => TipoPago::all(),
            ],
            'proveedores' => Proveedor::where('activo', true)->orderBy('nombre')->get(['id', 'nombre', 'email']),
            'productos'   => Producto::with([
                'precios'      => function ($query) {
                    $query->where('activo', true)
                        ->with(['tipoPrecio:id,codigo,nombre']);
                },
                'categoria:id,nombre',
                'marca:id,nombre',
                'unidad:id,codigo,nombre',
                'codigosBarra' => function ($query) {
                    $query->where('activo', true)
                        ->select('id', 'producto_id', 'codigo', 'es_principal');
                },
            ])
                ->where('activo', true)
                ->orderBy('nombre')
                ->get()
                ->map(function ($producto) {
                    // Mapear precios por tipo
                    $preciosMapeados = [];
                    foreach ($producto->precios as $precio) {
                        $codigo = $precio->tipoPrecio?->codigo;
                        if ($codigo) {
                            $preciosMapeados[$codigo] = $precio->precio;
                        }
                    }

                    // Obtener todos los códigos de barra activos
                    $codigosBarra = $producto->codigosBarra->pluck('codigo')->toArray();

                    // Obtener código principal o usar el de la tabla productos
                    $codigoPrincipal = $producto->codigosBarra->where('es_principal', true)->first()?->codigo
                        ?: ($producto->codigo_qr ?: $producto->codigo_barras);

                    return [
                        'id'             => $producto->id,
                        'nombre'         => $producto->nombre,
                        'codigo'         => $codigoPrincipal,
                        'codigo_barras'  => $codigoPrincipal,
                        'codigos_barras' => $codigosBarra, // Array con todos los códigos de barra
                        'precio_compra'  => $preciosMapeados['COSTO'] ?? 0,
                        'precio_venta'   => $preciosMapeados['VENTA_PUBLICO'] ?? 0,
                        'categoria'      => $producto->categoria?->nombre,
                        'marca'          => $producto->marca?->nombre,
                        'unidad'         => $producto->unidad?->nombre,
                        'stock'          => $producto->stockTotal(),
                        'stock_minimo'   => $producto->stock_minimo,
                        'stock_maximo'   => $producto->stock_maximo,
                    ];
                }),

            'monedas'     => Moneda::where('activo', true)->orderBy('codigo')->get(['id', 'codigo', 'nombre', 'simbolo']),
            'estados'     => EstadoDocumento::orderBy('nombre')->get(['id', 'nombre']),
        ];

        Log::info('CompraController::create - datos finales', [
            'proveedores_count' => $data['proveedores']->count(),
            'productos_count'   => $data['productos']->count(),
            'monedas_count'     => $data['monedas']->count(),
            'estados_count'     => $data['estados']->count(),
            'tipos_pago_count'  => $data['tipos_pago']->count(),
        ]);

        return Inertia::render('compras/create', $data);
    }

    public function show($id)
    {
        $compra = Compra::with(['proveedor', 'usuario', 'estadoDocumento', 'moneda', 'tipoPago', 'detalles.producto'])
            ->findOrFail($id);

        return Inertia::render('compras/show', [
            'compra' => $compra,
        ]);
    }

    public function edit($id)
    {
        $compra = Compra::with(['detalles.producto'])->findOrFail($id);

        return Inertia::render('compras/create', [
            'compra'      => $compra,
            'tipos_pago'  => TipoPago::orderBy('nombre')->get(['id', 'codigo', 'nombre']),
            'proveedores' => Proveedor::where('activo', true)->orderBy('nombre')->get(['id', 'nombre', 'email']),
            'productos'   => Producto::with([
                'precios'      => function ($query) {
                    $query->where('activo', true)
                        ->with(['tipoPrecio:id,codigo,nombre']);
                },
                'categoria:id,nombre',
                'marca:id,nombre',
                'unidad:id,codigo,nombre',
                'codigosBarra' => function ($query) {
                    $query->where('activo', true)
                        ->select('id', 'producto_id', 'codigo', 'es_principal');
                },
            ])
                ->where('activo', true)
                ->orderBy('nombre')
                ->get()
                ->map(function ($producto) {
                    // Mapear precios por tipo
                    $preciosMapeados = [];
                    foreach ($producto->precios as $precio) {
                        $codigo = $precio->tipoPrecio?->codigo;
                        if ($codigo) {
                            $preciosMapeados[$codigo] = $precio->precio;
                        }
                    }

                    // Obtener todos los códigos de barra activos
                    $codigosBarra = $producto->codigosBarra->pluck('codigo')->toArray();

                    // Obtener código principal o usar el de la tabla productos
                    $codigoPrincipal = $producto->codigosBarra->where('es_principal', true)->first()?->codigo
                        ?: ($producto->codigo_qr ?: $producto->codigo_barras);

                    return [
                        'id'             => $producto->id,
                        'nombre'         => $producto->nombre,
                        'codigo'         => $codigoPrincipal,
                        'codigo_barras'  => $codigoPrincipal,
                        'codigos_barras' => $codigosBarra, // Array con todos los códigos de barra
                        'precio_compra'  => $preciosMapeados['COSTO'] ?? 0,
                        'precio_venta'   => $preciosMapeados['VENTA_PUBLICO'] ?? 0,
                        'categoria'      => $producto->categoria?->nombre,
                        'marca'          => $producto->marca?->nombre,
                        'unidad'         => $producto->unidad?->nombre,
                        'stock'          => $producto->stockTotal(),
                        'stock_minimo'   => $producto->stock_minimo,
                        'stock_maximo'   => $producto->stock_maximo,
                    ];
                }),
            'monedas'     => Moneda::where('activo', true)->orderBy('codigo')->get(['id', 'codigo', 'nombre', 'simbolo']),
            'estados'     => EstadoDocumento::orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    public function store(StoreCompraRequest $request)
    {
        $data = $request->validated();

        try {
            DB::beginTransaction();

            // Generar número automático si no se proporciona
            if (empty($data['numero'])) {
                $data['numero'] = $this->generarNumeroCompra();
            }

            $compra = Compra::create($data);

            foreach ($data['detalles'] as $detalle) {
                $detalleCompra = $compra->detalles()->create($detalle);

                // Solo registrar inventario si el estado es RECIBIDO
                $estadoRecibido = \App\Models\EstadoDocumento::where('codigo', 'RECIBIDO')->first();
                if ($compra->estado_documento_id == $estadoRecibido?->id) {
                    $this->registrarEntradaInventario($detalleCompra, $compra);
                }
            }

            DB::commit();

            $numeroGenerado = $compra->numero;
            $mensaje        = "Compra {$numeroGenerado} creada exitosamente";

            return redirect()->route('compras.index')
                ->with('success', $mensaje);

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error al crear compra', [
                'error' => $e->getMessage(),
                'data'  => $data,
            ]);

            return back()->withInput()
                ->withErrors(['error' => 'Error al crear la compra: ' . $e->getMessage()]);
        }
    }

    public function update(UpdateCompraRequest $request, $id)
    {
        $compra = Compra::findOrFail($id);
        $data   = $request->validated();

        try {
            DB::beginTransaction();

            // Guardar estado anterior para detectar cambios
            $estadoAnterior = $compra->estado_documento_id;
            $estadoRecibido = \App\Models\EstadoDocumento::where('codigo', 'RECIBIDO')->first();

            // Si la compra está en estado RECIBIDO y se van a modificar detalles, revertir inventario
            if (isset($data['detalles']) && $estadoAnterior == $estadoRecibido?->id) {
                $this->revertirInventarioDetalles($compra);
            }

            $compra->update($data);

            // Verificar si cambió a estado RECIBIDO
            $cambioARecibido = $estadoAnterior != $estadoRecibido?->id &&
                             $compra->estado_documento_id == $estadoRecibido?->id;

            if (isset($data['detalles'])) {
                // Eliminar detalles existentes
                $compra->detalles()->delete();

                // Crear nuevos detalles
                foreach ($data['detalles'] as $detalle) {
                    $detalleCompra = $compra->detalles()->create($detalle);

                    // Registrar inventario si:
                    // 1. Cambió a RECIBIDO (nueva recepción)
                    // 2. Ya estaba RECIBIDO (re-registrar después de revertir)
                    if ($cambioARecibido || $compra->estado_documento_id == $estadoRecibido?->id) {
                        $this->registrarEntradaInventario($detalleCompra, $compra);
                    }
                }
            }

            DB::commit();

            return redirect()->route('compras.index')
                ->with('success', 'Compra actualizada exitosamente');

        } catch (\Exception $e) {
            DB::rollback();

            return back()->withInput()
                ->withErrors(['error' => 'Error al actualizar la compra: ' . $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        $compra = Compra::findOrFail($id);

        try {
            DB::beginTransaction();

            // Problema #17: Validar integridad referencial antes de eliminar
            $this->validarIntegridadReferencialCompra($compra);

            $this->revertirMovimientosInventario($compra);
            $compra->delete();

            DB::commit();

            return redirect()->route('compras.index')
                ->with('success', 'Compra eliminada exitosamente');

        } catch (\Exception $e) {
            DB::rollback();

            return back()->withErrors(['error' => 'Error al eliminar la compra: ' . $e->getMessage()]);
        }
    }

    /**
     * Problema #17: Validar integridad referencial antes de eliminar compra
     *
     * Lanza una excepción si la compra tiene dependencias que impiden su eliminación
     */
    private function validarIntegridadReferencialCompra(\App\Models\Compra $compra): void
    {
        $errores = [];

        // 1. Verificar si tiene pagos asociados
        if ($compra->pagos()->exists()) {
            $cantidadPagos = $compra->pagos()->count();
            $errores[] = "La compra tiene {$cantidadPagos} pago(s) asociado(s)";
        }

        // 2. Verificar si tiene cuenta por pagar con saldo pendiente
        if ($compra->cuentaPorPagar()->exists()) {
            $cuenta = $compra->cuentaPorPagar;
            if ($cuenta->saldo_pendiente > 0) {
                $errores[] = "La compra tiene una cuenta por pagar con saldo pendiente de " .
                    number_format($cuenta->saldo_pendiente, 2);
            }
        }

        // 3. Verificar si tiene asiento contable cerrado
        if ($compra->asientoContable()->exists()) {
            $asiento = $compra->asientoContable;
            if ($asiento->cerrado) {
                $errores[] = "La compra tiene un asiento contable cerrado que no puede revertirse";
            }
        }

        // 4. Verificar si el stock ya fue utilizado (vendido)
        // Esto es más complejo, pero podríamos verificar si los movimientos de salida
        // superan las entradas, indicando que parte del stock se vendió
        $movimientos = \App\Models\MovimientoInventario::where('numero_documento', $compra->numero)
            ->where('tipo', \App\Models\MovimientoInventario::TIPO_ENTRADA_COMPRA)
            ->get();

        foreach ($movimientos as $movimiento) {
            $stockProducto = $movimiento->stockProducto;
            if ($stockProducto) {
                $cantidadEntrada = abs($movimiento->cantidad);
                $stockActual = $stockProducto->cantidad;

                // Si el stock actual es menor que la cantidad original de la compra,
                // significa que parte se vendió
                if ($stockActual < $cantidadEntrada) {
                    $producto = $stockProducto->producto;
                    $cantidadVendida = $cantidadEntrada - $stockActual;
                    $errores[] = "Producto '{$producto->nombre}': se compraron {$cantidadEntrada} unidades pero {$cantidadVendida} ya fueron vendidas";
                }
            }
        }

        // Si hay errores, lanzar excepción
        if (!empty($errores)) {
            throw new \Exception(
                "No se puede eliminar la compra #{$compra->numero}:\n" .
                implode("\n", array_map(fn($e) => "- {$e}", $errores))
            );
        }
    }

    /**
     * Registrar entrada de inventario por compra
     */
    private function registrarEntradaInventario(DetalleCompra $detalle, Compra $compra): void
    {
        $producto = $detalle->producto;

        // Obtener el almacén principal o usar el primero disponible
        $almacenPrincipal = \App\Models\Almacen::where('activo', true)->first();

        if (! $almacenPrincipal) {
            Log::warning('No hay almacén disponible para registrar entrada de inventario', [
                'compra_id'   => $compra->id,
                'producto_id' => $producto->id,
            ]);

            return;
        }

        try {
            $producto->registrarMovimiento(
                almacenId: $almacenPrincipal->id,
                cantidad: (int) $detalle->cantidad,
                tipo: MovimientoInventario::TIPO_ENTRADA_COMPRA,
                observacion: "Entrada por compra #{$compra->numero}",
                numeroDocumento: $compra->numero_factura,
                lote: $detalle->lote,
                fechaVencimiento: $detalle->fecha_vencimiento ?
                \Carbon\Carbon::parse($detalle->fecha_vencimiento) : null,
                userId: $compra->usuario_id
            );

            Log::info('Movimiento de inventario registrado por compra', [
                'compra_id'   => $compra->id,
                'producto_id' => $producto->id,
                'cantidad'    => $detalle->cantidad,
                'almacen_id'  => $almacenPrincipal->id,
            ]);

        } catch (\Exception $e) {
            Log::error('Error al registrar movimiento de inventario por compra', [
                'compra_id'   => $compra->id,
                'producto_id' => $producto->id,
                'error'       => $e->getMessage(),
            ]);

            // No detener la transacción, solo registrar el error
        }
    }

    /**
     * Revertir inventario de detalles antes de modificarlos
     */
    private function revertirInventarioDetalles(Compra $compra): void
    {
        foreach ($compra->detalles as $detalle) {
            $producto = $detalle->producto;
            $almacenPrincipal = \App\Models\Almacen::where('activo', true)->first();

            if (!$almacenPrincipal) {
                Log::warning('No hay almacén disponible para revertir inventario', [
                    'compra_id' => $compra->id,
                    'detalle_id' => $detalle->id,
                ]);
                continue;
            }

            try {
                // Registrar salida para revertir la entrada original
                $producto->registrarMovimiento(
                    almacenId: $almacenPrincipal->id,
                    cantidad: -(int) $detalle->cantidad, // Negativo para salida
                    tipo: \App\Models\MovimientoInventario::TIPO_AJUSTE,
                    observacion: "Reversión por actualización de compra #{$compra->numero}",
                    numeroDocumento: $compra->numero_factura,
                    lote: $detalle->lote,
                    userId: Auth::id()
                );

                Log::info('Inventario revertido por actualización de compra', [
                    'compra_id' => $compra->id,
                    'producto_id' => $producto->id,
                    'cantidad' => $detalle->cantidad,
                ]);

            } catch (\Exception $e) {
                Log::error('Error al revertir inventario en actualización', [
                    'compra_id' => $compra->id,
                    'producto_id' => $producto->id,
                    'error' => $e->getMessage(),
                ]);
                // Continuar con los demás detalles
            }
        }
    }

    /**
     * Revertir movimientos de inventario al eliminar compra
     */
    private function revertirMovimientosInventario(Compra $compra): void
    {
        foreach ($compra->detalles as $detalle) {
            $producto         = $detalle->producto;
            $almacenPrincipal = \App\Models\Almacen::where('activo', true)->first();

            if (! $almacenPrincipal) {
                continue;
            }

            try {
                // Registrar salida para revertir la entrada original
                $producto->registrarMovimiento(
                    almacenId: $almacenPrincipal->id,
                    cantidad: -(int) $detalle->cantidad, // Negativo para salida
                    tipo: MovimientoInventario::TIPO_SALIDA_AJUSTE,
                    observacion: "Reversión por eliminación de compra #{$compra->numero}",
                    numeroDocumento: $compra->numero_factura,
                    userId: Auth::id()
                );

            } catch (\Exception $e) {
                Log::error('Error al revertir movimiento de inventario', [
                    'compra_id'   => $compra->id,
                    'producto_id' => $producto->id,
                    'error'       => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Calcular estadísticas para el dashboard de compras
     */
    private function calcularEstadisticas(array $filtros): array
    {
        $baseQuery = Compra::query();

        // Aplicar mismos filtros que en el index para estadísticas consistentes
        if (! empty($filtros['proveedor_id'])) {
            $baseQuery->where('proveedor_id', $filtros['proveedor_id']);
        }

        if (! empty($filtros['estado_documento_id'])) {
            $baseQuery->where('estado_documento_id', $filtros['estado_documento_id']);
        }

        if (! empty($filtros['moneda_id'])) {
            $baseQuery->where('moneda_id', $filtros['moneda_id']);
        }

        if (! empty($filtros['fecha_desde'])) {
            $baseQuery->whereDate('fecha', '>=', $filtros['fecha_desde']);
        }

        if (! empty($filtros['fecha_hasta'])) {
            $baseQuery->whereDate('fecha', '<=', $filtros['fecha_hasta']);
        }

        // Estadísticas generales
        $totalCompras   = (clone $baseQuery)->count();
        $montoTotal     = (clone $baseQuery)->sum('total');
        $promedioCompra = $totalCompras > 0 ? $montoTotal / $totalCompras : 0;

        // Compras por estado
        $comprasPorEstado = (clone $baseQuery)
            ->with('estadoDocumento')
            ->get()
            ->groupBy('estado_documento.nombre')
            ->map(function ($compras, $estado) {
                return [
                    'nombre'      => $estado ?? 'Sin estado',
                    'cantidad'    => $compras->count(),
                    'monto_total' => $compras->sum('total'),
                ];
            })
            ->values();

        // Compras del mes actual
        $inicioMes = now()->startOfMonth();
        $finMes    = now()->endOfMonth();

        $comprasMesActual = Compra::whereBetween('fecha', [$inicioMes, $finMes])->count();
        $montoMesActual   = Compra::whereBetween('fecha', [$inicioMes, $finMes])->sum('total');

        // Compras del mes anterior para comparación
        $inicioMesAnterior = now()->subMonth()->startOfMonth();
        $finMesAnterior    = now()->subMonth()->endOfMonth();

        $comprasMesAnterior = Compra::whereBetween('fecha', [$inicioMesAnterior, $finMesAnterior])->count();
        $montoMesAnterior   = Compra::whereBetween('fecha', [$inicioMesAnterior, $finMesAnterior])->sum('total');

        // Calcular variaciones porcentuales
        $variacionCompras = $comprasMesAnterior > 0
            ? (($comprasMesActual - $comprasMesAnterior) / $comprasMesAnterior) * 100
            : 0;

        $variacionMonto = $montoMesAnterior > 0
            ? (($montoMesActual - $montoMesAnterior) / $montoMesAnterior) * 100
            : 0;

        return [
            'total_compras'      => $totalCompras,
            'monto_total'        => $montoTotal,
            'promedio_compra'    => $promedioCompra,
            'compras_por_estado' => $comprasPorEstado,
            'mes_actual'         => [
                'compras'           => $comprasMesActual,
                'monto'             => $montoMesActual,
                'variacion_compras' => round($variacionCompras, 2),
                'variacion_monto'   => round($variacionMonto, 2),
            ],
        ];
    }

    /**
     * Generar número de compra único con protección contra race conditions
     *
     * Formato: COMP20241018-001, COMP20241018-002, etc.
     *
     * Usa bloqueo pesimista (FOR UPDATE) para evitar duplicados cuando
     * múltiples usuarios crean compras simultáneamente.
     */
    private function generarNumeroCompra(): string
    {
        $fecha = date('Ymd'); // Formato: 20240915
        $maxIntentos = 5; // Máximo de intentos en caso de deadlock
        $intento = 0;

        while ($intento < $maxIntentos) {
            try {
                // Usar bloqueo pesimista (FOR UPDATE) para evitar race conditions
                $ultimaCompra = Compra::where('numero', 'like', "COMP{$fecha}%")
                    ->orderBy('numero', 'desc')
                    ->lockForUpdate() // 🔒 BLOQUEO PESIMISTA
                    ->first();

                $secuencial = 1;
                if ($ultimaCompra) {
                    // Extraer el número secuencial del último número de compra
                    $ultimoNumero = $ultimaCompra->numero;
                    $partes = explode('-', $ultimoNumero);
                    if (count($partes) >= 2) {
                        $secuencial = intval($partes[1]) + 1;
                    }
                }

                // Formato: COMP20240915-001
                $numero = sprintf('COMP%s-%03d', $fecha, $secuencial);

                // Verificar que no exista (por si acaso)
                $existe = Compra::where('numero', $numero)->exists();
                if ($existe) {
                    // Si existe, incrementar y reintentar
                    $secuencial++;
                    continue;
                }

                return $numero;

            } catch (\Illuminate\Database\QueryException $e) {
                // Si hay deadlock, esperar un poco y reintentar
                if ($e->getCode() == '40001' || stripos($e->getMessage(), 'deadlock') !== false) {
                    $intento++;
                    usleep(100000 * $intento); // Esperar 100ms, 200ms, 300ms, etc.
                    continue;
                }

                // Si es otro error, lanzarlo
                throw $e;
            }
        }

        // Si después de todos los intentos no se generó, usar timestamp como fallback
        return sprintf('COMP%s-%s', $fecha, substr(microtime(true) * 10000, -6));
    }
}
