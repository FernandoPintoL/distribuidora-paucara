<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGastoRequest;
use App\Models\MovimientoCaja;
use App\Models\TipoOperacionCaja;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class GastoController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:cajas.gastos.index')->only('index');
        $this->middleware('permission:cajas.gastos.create')->only(['create', 'store']);
    }

    public function index(Request $request)
    {
        $query = MovimientoCaja::with(['tipoOperacion', 'usuario', 'caja'])
            ->whereHas('tipoOperacion', fn($q) => $q->where('codigo', 'GASTO'))
            ->when($request->fecha_desde, fn($q) => $q->whereDate('fecha', '>=', $request->fecha_desde))
            ->when($request->fecha_hasta, fn($q) => $q->whereDate('fecha', '<=', $request->fecha_hasta))
            ->when($request->q, function ($q) use ($request) {
                $q->where('descripcion', 'LIKE', "%{$request->q}%")
                  ->orWhere('numero_documento', 'LIKE', "%{$request->q}%");
            });

        $gastos = $query->orderBy('fecha', 'desc')->paginate(15)->withQueryString();

        $estadisticas = [
            'total_mes' => MovimientoCaja::whereHas('tipoOperacion', fn($q) => $q->where('codigo', 'GASTO'))
                ->whereMonth('fecha', now()->month)
                ->whereYear('fecha', now()->year)
                ->sum(DB::raw('ABS(monto)')),
            'cantidad_mes' => MovimientoCaja::whereHas('tipoOperacion', fn($q) => $q->where('codigo', 'GASTO'))
                ->whereMonth('fecha', now()->month)
                ->whereYear('fecha', now()->year)
                ->count(),
        ];

        return Inertia::render('cajas/gastos/index', [
            'gastos' => $gastos,
            'filtros' => $request->only(['fecha_desde', 'fecha_hasta', 'q']),
            'estadisticas' => $estadisticas,
        ]);
    }

    public function create()
    {
        $user = Auth::user();
        $cajaAbierta = $user->empleado?->cajaAbierta();

        if (!$cajaAbierta) {
            return redirect()->route('cajas.index')
                ->with('error', 'Debe abrir una caja antes de registrar gastos');
        }

        return Inertia::render('cajas/gastos/create', [
            'caja_abierta' => $cajaAbierta,
            'categorias' => [
                'TRANSPORTE' => 'Transporte',
                'LIMPIEZA' => 'Limpieza',
                'MANTENIMIENTO' => 'Mantenimiento',
                'SERVICIOS' => 'Servicios',
                'VARIOS' => 'Varios',
            ],
        ]);
    }

    public function store(StoreGastoRequest $request)
    {
        try {
            $user = Auth::user();
            $cajaAbierta = $user->empleado->cajaAbierta();

            if (!$cajaAbierta) {
                return back()->withErrors(['caja' => 'No tiene caja abierta']);
            }

            $tipoOperacion = TipoOperacionCaja::where('codigo', 'GASTO')->firstOrFail();

            $movimiento = MovimientoCaja::create([
                'caja_id' => $cajaAbierta->id,
                'tipo_operacion_id' => $tipoOperacion->id,
                'numero_documento' => $request->numero_comprobante,
                'descripcion' => "[{$request->categoria}] {$request->descripcion}",
                'monto' => -abs($request->monto),
                'fecha' => now(),
                'user_id' => Auth::id(),
                'observaciones' => $request->observaciones,
            ]);

            Log::info("✅ Gasto registrado", [
                'movimiento_id' => $movimiento->id,
                'monto' => $request->monto,
            ]);

            return redirect()->route('cajas.gastos.index')
                ->with('success', 'Gasto registrado correctamente');

        } catch (\Exception $e) {
            Log::error("❌ Error registrando gasto: " . $e->getMessage());
            return back()->withErrors(['error' => 'Error al registrar gasto'])->withInput();
        }
    }
}
