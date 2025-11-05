<?php

namespace App\Http\Controllers;

use App\Models\Ruta;
use App\Models\RutaDetalle;
use App\Models\Zona;
use App\Models\Empleado;
use App\Services\RutaAsignacionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Exception;
use Illuminate\Support\Facades\DB;

class RutaController extends Controller
{
    protected $rutaService;

    public function __construct(RutaAsignacionService $rutaService)
    {
        $this->rutaService = $rutaService;
        $this->middleware('permission:envios.index')->only(['index']);
        $this->middleware('permission:envios.create')->only(['create', 'store', 'generar']);
        $this->middleware('permission:envios.edit')->only(['edit', 'update', 'iniciar', 'completar']);
    }

    /**
     * Listar rutas del día
     */
    public function index(Request $request)
    {
        $query = Ruta::with(['zona', 'chofer.user', 'vehiculo'])
            ->orderBy('fecha_ruta', 'desc')
            ->orderBy('codigo', 'desc');

        // Filtro por fecha
        if ($request->has('fecha') && $request->fecha) {
            $query->whereDate('fecha_ruta', $request->fecha);
        } else {
            // Por defecto, mostrar de hoy
            $query->whereDate('fecha_ruta', today());
        }

        // Filtro por zona
        if ($request->has('zona_id') && $request->zona_id) {
            $query->where('zona_id', $request->zona_id);
        }

        // Filtro por estado
        if ($request->has('estado') && $request->estado) {
            $query->where('estado', $request->estado);
        }

        // Filtro por chofer
        if ($request->has('chofer_id') && $request->chofer_id) {
            $query->where('chofer_id', $request->chofer_id);
        }

        $rutas = $query->paginate(15);

        $zonas = Zona::activas()->get(['id', 'nombre', 'codigo']);
        $choferes = Empleado::whereHasRole('Chofer')
            ->activos()
            ->with('user')
            ->get(['id']);

        return Inertia::render('rutas/index', [
            'rutas' => $rutas,
            'zonas' => $zonas,
            'choferes' => $choferes,
            'filters' => $request->only(['fecha', 'zona_id', 'estado', 'chofer_id']),
        ]);
    }

    /**
     * Generar rutas automáticas para hoy
     */
    public function generar(Request $request)
    {
        try {
            $opciones = [
                'fecha' => $request->get('fecha', today()),
                'choferes' => $request->get('choferes_por_zona', []),
            ];

            DB::transaction(function () use ($opciones) {
                $rutasCreadas = $this->rutaService->crearRutasDelDia($opciones);

                session()->flash('success', "Se crearon {$rutasCreadas->count()} rutas automáticamente.");
            });

            return redirect()->route('rutas.index');
        } catch (Exception $e) {
            return back()->withErrors(['error' => "Error: " . $e->getMessage()]);
        }
    }

    /**
     * Ver detalles de una ruta
     */
    public function show(Ruta $ruta)
    {
        $ruta->load(['zona', 'chofer.user', 'vehiculo', 'detalles.cliente']);

        $progreso = $ruta->obtenerProgreso();
        $estadisticas = [
            'progreso' => $progreso,
            'duracion' => $ruta->hora_salida && $ruta->hora_llegada
                ? $ruta->hora_llegada->diffInMinutes($ruta->hora_salida)
                : null,
        ];

        return Inertia::render('rutas/show', [
            'ruta' => $ruta,
            'estadisticas' => $estadisticas,
        ]);
    }

    /**
     * Iniciar ruta
     */
    public function iniciar(Ruta $ruta)
    {
        try {
            $this->rutaService->iniciarRuta($ruta);

            return back()->with('success', 'Ruta iniciada correctamente.');
        } catch (Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Completar ruta
     */
    public function completar(Ruta $ruta)
    {
        try {
            $this->rutaService->completarRuta($ruta);

            return back()->with('success', 'Ruta completada correctamente.');
        } catch (Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Registrar entrega
     */
    public function registrarEntrega(Request $request, RutaDetalle $detalle)
    {
        $request->validate([
            'estado' => 'required|in:entregado,no_entregado,reprogramado',
            'razon' => 'required_if:estado,no_entregado,reprogramado|string',
            'foto' => 'nullable|image|max:5120',
            'firma' => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($request, $detalle) {
                $datos = $request->only(['estado', 'razon']);

                if ($request->hasFile('foto')) {
                    $path = $request->file('foto')->store('entregas', 'public');
                    $datos['foto_entrega'] = $path;
                }

                if ($request->has('firma') && $request->firma) {
                    $datos['firma_cliente'] = $request->firma;
                }

                $this->rutaService->registrarEntrega($detalle, $datos);
            });

            return back()->with('success', 'Entrega registrada correctamente.');
        } catch (Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Cancelar ruta
     */
    public function cancelar(Request $request, Ruta $ruta)
    {
        $request->validate([
            'motivo' => 'required|string|max:500',
        ]);

        if ($ruta->estado !== 'planificada') {
            return back()->withErrors(['error' => 'Solo se pueden cancelar rutas planificadas.']);
        }

        $ruta->update([
            'estado' => 'cancelada',
            'observaciones' => $request->motivo,
        ]);

        // Revertir estado de envíos
        $ruta->detalles()->update(['estado' => 'pendiente']);

        return back()->with('success', 'Ruta cancelada correctamente.');
    }

    /**
     * Crear ruta manual
     */
    public function create()
    {
        $zonas = Zona::activas()->get(['id', 'nombre', 'codigo']);
        $choferes = Empleado::whereHasRole('Chofer')
            ->activos()
            ->with('user')
            ->get();

        return Inertia::render('rutas/create', [
            'zonas' => $zonas,
            'choferes' => $choferes,
        ]);
    }

    /**
     * Guardar ruta manual
     */
    public function store(Request $request)
    {
        $request->validate([
            'zona_id' => 'required|exists:zonas,id',
            'chofer_id' => 'required|exists:empleados,id',
            'fecha_ruta' => 'required|date',
            'detalles' => 'required|array|min:1',
            'detalles.*.cliente_id' => 'required|exists:clientes,id',
            'detalles.*.secuencia' => 'required|integer|min:1',
        ]);

        try {
            DB::transaction(function () use ($request) {
                $ruta = Ruta::create([
                    'codigo' => Ruta::generarCodigo(Zona::findOrFail($request->zona_id)),
                    'fecha_ruta' => $request->fecha_ruta,
                    'zona_id' => $request->zona_id,
                    'chofer_id' => $request->chofer_id,
                    'estado' => 'planificada',
                    'creado_por' => auth()->id(),
                ]);

                foreach ($request->detalles as $detalle) {
                    RutaDetalle::create([
                        'ruta_id' => $ruta->id,
                        'cliente_id' => $detalle['cliente_id'],
                        'secuencia' => $detalle['secuencia'],
                        'direccion_entrega' => $detalle['direccion'] ?? '',
                        'estado' => 'pendiente',
                    ]);
                }

                $ruta->recalcularParadas();
            });

            return redirect()->route('rutas.index')->with('success', 'Ruta creada correctamente.');
        } catch (Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()])->withInput();
        }
    }
}
