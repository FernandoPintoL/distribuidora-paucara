<?php
namespace App\Http\Controllers;

use App\Models\AperturaCaja;
use App\Models\Cliente;
use App\Models\CuentaPorCobrar;
use App\Models\MovimientoCaja;
use App\Models\Pago;
use App\Models\TipoOperacionCaja;
use App\Models\TipoPago;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CuentaPorCobrarController extends Controller
{
    public function index(Request $request)
    {
        // ✅ CORREGIDO: Cargar cliente directamente + cliente de venta para mostrar ambos tipos
        $query = CuentaPorCobrar::with(['cliente', 'venta.cliente', 'pagos.tipoPago'])
            ->when($request->estado, function ($q) use ($request) {
                $q->where('estado', $request->estado);
            })
            ->when($request->cliente_id, function ($q) use ($request) {
                $q->where('cliente_id', $request->cliente_id);
            })
            ->when($request->q, function ($q) use ($request) {
                $q->where(function ($subQ) use ($request) {
                    $subQ->whereHas('venta', function ($ventaQ) use ($request) {
                        $ventaQ->where('numero', 'LIKE', "%{$request->q}%");
                    })->orWhereHas('cliente', function ($clienteQ) use ($request) {
                        $clienteQ->where('nombre', 'LIKE', "%{$request->q}%")
                            ->orWhere('codigo_cliente', 'LIKE', "%{$request->q}%");
                    });
                });
            })
            ->when($request->fecha_vencimiento_desde && $request->fecha_vencimiento_hasta, function ($q) use ($request) {
                $q->whereBetween('fecha_vencimiento', [$request->fecha_vencimiento_desde, $request->fecha_vencimiento_hasta]);
            })
            ->when($request->solo_vencidas, function ($q) {
                $q->where('fecha_vencimiento', '<', now())
                    ->where('estado', '!=', 'PAGADO');
            });

        // Sorting - ✅ ACTUALIZADO: Ordenar por ID descendente por defecto
        $sortField = $request->get('sort', 'id');
        $sortOrder = $request->get('order', 'desc');
        $query->orderBy($sortField, $sortOrder);

        $cuentas = $query->paginate(15)->withQueryString();

        // Estadísticas
        $estadisticas = [
            'monto_total_pendiente' => CuentaPorCobrar::where('estado', '!=', 'PAGADO')->sum('saldo_pendiente'),
            'cuentas_vencidas'      => CuentaPorCobrar::where('estado', '!=', 'PAGADO')
                ->where('fecha_vencimiento', '<', now())->count(),
            'monto_total_vencido'   => CuentaPorCobrar::where('estado', '!=', 'PAGADO')
                ->where('fecha_vencimiento', '<', now())->sum('saldo_pendiente'),
            'total_mes'             => CuentaPorCobrar::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)->sum('monto_original'),
            'promedio_dias_pago'    => 0,
        ];

        return Inertia::render('ventas/cuentas-por-cobrar/index', [
            'cuentasPorCobrar' => [
                'cuentas_por_cobrar' => [
                    'data'         => $cuentas->items(),
                    'current_page' => $cuentas->currentPage(),
                    'last_page'    => $cuentas->lastPage(),
                    'per_page'     => $cuentas->perPage(),
                    'total'        => $cuentas->total(),
                    'links'        => $cuentas->linkCollection()->toArray(),
                ],
                'filtros'            => $request->only(['estado', 'cliente_id', 'q', 'fecha_vencimiento_desde', 'fecha_vencimiento_hasta', 'solo_vencidas']),
                'estadisticas'       => $estadisticas,
                'datosParaFiltros'   => [
                    'clientes' => Cliente::select('id', 'nombre', 'codigo_cliente')->get(),
                ],
            ],
        ]);
    }

    public function show(CuentaPorCobrar $cuentaPorCobrar)
    {
        $cuentaPorCobrar->load(['venta.cliente', 'venta.detalles.producto', 'pagos.tipoPago', 'pagos.usuario']);

        return Inertia::render('ventas/cuentas-por-cobrar/show', [
            'cuenta' => $cuentaPorCobrar,
        ]);
    }

    public function checkCajaAbierta(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            if (! $user) {
                return response()->json([
                    'tiene_caja_abierta' => false,
                    'mensaje'            => 'Usuario no autenticado',
                ], 200);
            }

            // Buscar caja abierta del usuario
            $apertura = AperturaCaja::where('user_id', $user->id)
                ->whereDoesntHave('cierre')
                ->with('caja', 'usuario')
                ->latest('fecha')
                ->first();

            if ($apertura) {
                $es_de_hoy  = $apertura->fecha->isToday();
                $dias_atras = $es_de_hoy ? 0 : now()->diffInDays($apertura->fecha);

                return response()->json([
                    'tiene_caja_abierta' => true,
                    'es_de_hoy'          => $es_de_hoy,
                    'dias_atras'         => $dias_atras,
                    'caja_nombre'        => $apertura->caja?->nombre,
                    'usuario_caja'       => $apertura->usuario?->name,
                    'mensaje'            => 'Caja abierta correctamente',
                ], 200);
            }

            return response()->json([
                'tiene_caja_abierta' => false,
                'mensaje'            => 'No hay caja abierta. Abre una caja antes de registrar pagos.',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error verificando caja abierta', [
                'error'   => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'tiene_caja_abierta' => false,
                'mensaje'            => 'Error verificando estado de caja',
            ], 500);
        }
    }

    public function registrarPago(Request $request, CuentaPorCobrar $cuentaPorCobrar): JsonResponse
    {
        try {
            Log::info('📝 [PAGO CUENTAS POR COBRAR] Iniciando registro de pago', [
                'cuenta_id'  => $cuentaPorCobrar->id,
                'usuario_id' => Auth::id(),
            ]);

            // Validar datos
            $validated = $request->validate([
                'monto'                => 'required|numeric|min:0.01',
                'tipo_pago_id'         => [
                    'required',
                    'integer',
                    function ($attribute, $value, $fail) {
                        $tipoPago = TipoPago::find($value);
                        if (! $tipoPago) {
                            $fail('El tipo de pago seleccionado no existe.');
                        }
                    },
                ],
                'fecha_pago'           => 'required|date',
                'numero_recibo'        => 'nullable|string',
                'numero_transferencia' => 'nullable|string',
                'numero_cheque'        => 'nullable|string',
                'observaciones'        => 'nullable|string',
            ]);

            // Verificar caja abierta
            $apertura = AperturaCaja::where('user_id', Auth::id())
                ->whereDoesntHave('cierre')
                ->latest('fecha')
                ->first();

            if (! $apertura) {
                return response()->json([
                    'message' => 'No hay caja abierta. Abre una caja antes de registrar pagos.',
                ], 422);
            }

            // Ejecutar en transacción
            $pago = DB::transaction(function () use ($validated, $cuentaPorCobrar, $apertura) {
                // Crear registro de pago
                $pago = Pago::create([
                    'numero_pago'          => Pago::generarNumeroPago(),
                    'cuenta_por_cobrar_id' => $cuentaPorCobrar->id,
                    'monto'                => $validated['monto'],
                    'tipo_pago_id'         => $validated['tipo_pago_id'],
                    'fecha'                => now(),
                    'fecha_pago'           => $validated['fecha_pago'],
                    'numero_recibo'        => $validated['numero_recibo'],
                    'numero_transferencia' => $validated['numero_transferencia'],
                    'numero_cheque'        => $validated['numero_cheque'],
                    'observaciones'        => $validated['observaciones'],
                    'usuario_id'           => Auth::id(),
                    'estado'               => 'REGISTRADO',
                ]);

                // Registrar movimiento de caja (INGRESO)
                $tipoOperacion = TipoOperacionCaja::where('codigo', 'PAGO')->firstOrFail();
                $tipoPago      = TipoPago::find($validated['tipo_pago_id']);

                MovimientoCaja::create([
                    'caja_id'           => $apertura->caja_id,
                    'tipo_operacion_id' => $tipoOperacion->id,
                    'numero_documento'  => $cuentaPorCobrar->venta?->numero ?? "CuentaPorCobrar#{$cuentaPorCobrar->id}",
                    'observaciones' => $validated['observaciones'] ?? "Pago de cuenta por cobrar #{$cuentaPorCobrar->id}", // ✅ CORREGIDO: Usar observaciones del usuario
                    'monto'        => $validated['monto'], // POSITIVO para ingresos
                    'fecha'        => $validated['fecha_pago'],
                    'user_id'      => Auth::id(),
                    'tipo_pago_id' => $validated['tipo_pago_id'],
                    'pago_id'      => $pago->id, // ✅ Registrar el ID del pago
                ]);

                // Actualizar saldo pendiente
                $nuevoSaldo = $cuentaPorCobrar->saldo_pendiente - $validated['monto'];
                $cuentaPorCobrar->update([
                    'saldo_pendiente' => max(0, $nuevoSaldo),
                    'estado'          => $nuevoSaldo <= 0 ? 'PAGADO' : 'PARCIAL',
                ]);

                Log::info('✅ [PAGO CUENTAS POR COBRAR] Pago registrado exitosamente', [
                    'pago_id'     => $pago->id,
                    'cuenta_id'   => $cuentaPorCobrar->id,
                    'monto'       => $validated['monto'],
                    'nuevo_saldo' => $nuevoSaldo,
                ]);

                return $pago;
            });

            return response()->json([
                'success' => true,
                'message' => 'Pago registrado exitosamente',
                'data'    => [
                    'pago'   => $pago,
                    'cuenta' => $cuentaPorCobrar->fresh(),
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('❌ [PAGO CUENTAS POR COBRAR] Error registrando pago', [
                'cuenta_id'  => $cuentaPorCobrar->id,
                'error'      => $e->getMessage(),
                'usuario_id' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Error al registrar el pago: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function anularPago(Request $request, CuentaPorCobrar $cuentaPorCobrar, Pago $pago): JsonResponse
    {
        try {
            Log::info('🗑️ [ANULAR PAGO CUENTAS POR COBRAR] Iniciando anulación', [
                'pago_id' => $pago->id,
                'cuenta_id' => $cuentaPorCobrar->id,
                'usuario_id' => Auth::id(),
            ]);

            // Verificar permisos
            if (!auth()->user()->hasRole(['admin', 'Admin'])) {
                return response()->json(['message' => 'No tienes permiso'], 403);
            }

            // Validar que el pago pertenece a la cuenta
            if ($pago->cuenta_por_cobrar_id !== $cuentaPorCobrar->id) {
                return response()->json(['message' => 'El pago no pertenece a esta cuenta'], 422);
            }

            $motivo = $request->input('motivo', 'Sin motivo especificado');

            // Ejecutar en transacción
            DB::transaction(function () use ($pago, $cuentaPorCobrar, $motivo) {
                // Revertir movimiento de caja
                if ($pago->movimientoCaja) {
                    $movOriginal = $pago->movimientoCaja;
                    $tipoAnulacion = TipoOperacionCaja::where('codigo', 'ANULACION')->firstOrFail();

                    MovimientoCaja::create([
                        'caja_id' => $movOriginal->caja_id,
                        'tipo_operacion_id' => $tipoAnulacion->id,
                        'numero_documento' => $cuentaPorCobrar->venta?->numero ?? "CuentaPorCobrar#{$cuentaPorCobrar->id}",
                        'observaciones' => "REVERSIÓN por anulación de pago #{$pago->id}",
                        'monto' => abs($movOriginal->monto) * -1, // NEGATIVO (inverso del ingreso)
                        'fecha' => now(),
                        'user_id' => Auth::id(),
                    ]);
                }

                // Actualizar saldo de la cuenta (restaurar lo que se restó)
                $nuevoSaldo = $cuentaPorCobrar->saldo_pendiente + $pago->monto;
                $cuentaPorCobrar->update([
                    'saldo_pendiente' => $nuevoSaldo,
                    'estado' => $nuevoSaldo >= $cuentaPorCobrar->monto_original ? 'PENDIENTE' : 'PARCIAL',
                ]);

                // Marcar pago como anulado
                $pago->update([
                    'estado' => 'ANULADO',
                ]);

                Log::info('✅ [ANULAR PAGO CUENTAS POR COBRAR] Pago anulado exitosamente', [
                    'pago_id' => $pago->id,
                    'cuenta_id' => $cuentaPorCobrar->id,
                    'monto' => $pago->monto,
                    'nuevo_saldo' => $nuevoSaldo,
                    'motivo' => $motivo,
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Pago anulado exitosamente',
                'data' => [
                    'pago' => $pago->fresh(),
                    'cuenta' => $cuentaPorCobrar->fresh(),
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('❌ [ANULAR PAGO CUENTAS POR COBRAR] Error anulando pago', [
                'pago_id' => $pago->id,
                'cuenta_id' => $cuentaPorCobrar->id,
                'error' => $e->getMessage(),
                'usuario_id' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Error al anular el pago: ' . $e->getMessage(),
            ], 500);
        }
    }
}
