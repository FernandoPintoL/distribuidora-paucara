<?php
namespace App\Http\Controllers;

use App\Models\CuentaPorPagar;
use App\Models\Proveedor;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CuentaPorPagarController extends Controller
{
    public function index(Request $request)
    {
        $query = CuentaPorPagar::with(['compra.proveedor'])
            ->when($request->estado, function ($q) use ($request) {
                $q->where('estado', $request->estado);
            })
            ->when($request->proveedor_id, function ($q) use ($request) {
                $q->whereHas('compra', function ($subQ) use ($request) {
                    $subQ->where('proveedor_id', $request->proveedor_id);
                });
            })
            ->when($request->search, function ($q) use ($request) {
                $q->whereHas('compra', function ($subQ) use ($request) {
                    $subQ->where('numero_factura', 'LIKE', "%{$request->search}%")
                        ->orWhereHas('proveedor', function ($provQ) use ($request) {
                            $provQ->where('nombre', 'LIKE', "%{$request->search}%");
                        });
                });
            })
            ->when($request->fecha_desde && $request->fecha_hasta, function ($q) use ($request) {
                $q->whereBetween('fecha_vencimiento', [$request->fecha_desde, $request->fecha_hasta]);
            });

        // Sorting
        $sortField = $request->get('sort', 'fecha_vencimiento');
        $sortOrder = $request->get('order', 'asc');
        $query->orderBy($sortField, $sortOrder);

        $cuentas = $query->paginate(15)->withQueryString();

        // Estadísticas
        $estadisticas = [
            'monto_total_pendiente' => CuentaPorPagar::where('estado', '!=', 'PAGADO')->sum('saldo_pendiente'),
            'cuentas_vencidas'      => CuentaPorPagar::where('estado', '!=', 'PAGADO')
                ->where('fecha_vencimiento', '<', now())->count(),
            'monto_total_vencido'   => CuentaPorPagar::where('estado', '!=', 'PAGADO')
                ->where('fecha_vencimiento', '<', now())->sum('saldo_pendiente'),
            'total_mes'             => CuentaPorPagar::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)->sum('monto_original'),
            'promedio_dias_pago'    => 0, // Calcular promedio de días de pago si es necesario
        ];

        return Inertia::render('compras/cuentas-por-pagar/index', [
            'cuentasPorPagar' => [
                'cuentas_por_pagar' => [
                    'data'         => $cuentas->items(),
                    'current_page' => $cuentas->currentPage(),
                    'last_page'    => $cuentas->lastPage(),
                    'per_page'     => $cuentas->perPage(),
                    'total'        => $cuentas->total(),
                    'links'        => $cuentas->linkCollection()->toArray(),
                ],
                'filtros'           => $request->only(['estado', 'proveedor_id', 'search', 'fecha_desde', 'fecha_hasta']),
                'estadisticas'      => $estadisticas,
                'datosParaFiltros'  => [
                    'proveedores' => Proveedor::select('id', 'nombre')->get(),
                    'tipos_pago'  => [], // Agregar tipos de pago si es necesario
                ],
            ],
        ]);
    }

    public function show(CuentaPorPagar $cuenta)
    {
        $cuenta->load(['compra.proveedor', 'compra.detalles.producto', 'pagos.tipoPago']);

        return Inertia::render('compras/cuentas-por-pagar/show', [
            'cuenta' => $cuenta,
        ]);
    }

    public function actualizarEstado(Request $request, CuentaPorPagar $cuenta)
    {
        $request->validate([
            'estado' => 'required|in:PENDIENTE,PARCIAL,PAGADO,VENCIDO',
        ]);

        $cuenta->update([
            'estado' => $request->estado,
        ]);

        return back()->with('success', 'Estado actualizado correctamente.');
    }

    public function export(Request $request)
    {
        $query = CuentaPorPagar::with(['compra.proveedor'])
            ->when($request->estado, function ($q) use ($request) {
                $q->where('estado', $request->estado);
            })
            ->when($request->proveedor_id, function ($q) use ($request) {
                $q->whereHas('compra', function ($subQ) use ($request) {
                    $subQ->where('proveedor_id', $request->proveedor_id);
                });
            });

        $cuentas = $query->get();

        // Aquí implementarías la exportación a Excel
        // Por ahora retornamos los datos como JSON para testing
        return response()->json($cuentas);
    }
}
