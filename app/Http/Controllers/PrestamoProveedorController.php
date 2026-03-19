<?php

namespace App\Http\Controllers;

use App\Models\PrestamoProveedor;
use App\Services\Prestamos\PrestamoProveedorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PrestamoProveedorController extends Controller
{
    public function __construct(private PrestamoProveedorService $prestamoService)
    {
    }

    /**
     * GET /api/prestamos-proveedor
     * Listar préstamos de proveedores
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = PrestamoProveedor::with(['prestable', 'proveedor', 'devoluciones']);

            // Filtro por proveedor
            if ($request->has('proveedor_id')) {
                $query->where('proveedor_id', $request->integer('proveedor_id'));
            }

            // Filtro por estado
            if ($request->has('estado')) {
                $query->where('estado', $request->string('estado'));
            }

            // Filtro por tipo (compra/préstamo)
            if ($request->has('es_compra')) {
                $query->where('es_compra', $request->boolean('es_compra'));
            }

            $prestamos = $query->orderByDesc('fecha_prestamo')->paginate($request->integer('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $prestamos,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error listando préstamos de proveedor', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Error listando préstamos'], 500);
        }
    }

    /**
     * POST /api/prestamos-proveedor
     * Registrar nuevo préstamo/compra de proveedor
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'prestable_id' => 'required|exists:prestables,id',
                'proveedor_id' => 'required|exists:proveedores,id',
                'cantidad' => 'required|integer|min:1',
                'es_compra' => 'required|boolean',
                'precio_unitario' => 'required_if:es_compra,true|nullable|numeric|min:0',
                'numero_documento' => 'nullable|string|max:255',
                'fecha_prestamo' => 'required|date',
                'fecha_esperada_devolucion' => 'nullable|date|after_or_equal:fecha_prestamo',
            ]);

            $prestamo = $this->prestamoService->crearPrestamo($validated);

            if (!$prestamo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error creando préstamo',
                ], 500);
            }

            return response()->json([
                'success' => true,
                'data' => $prestamo->load(['prestable', 'proveedor']),
                'message' => 'Préstamo registrado exitosamente',
            ], 201);
        } catch (\Exception $e) {
            Log::error('❌ Error creando préstamo de proveedor', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * GET /api/prestamos-proveedor/{prestamo}
     * Ver detalles del préstamo
     */
    public function show(PrestamoProveedor $prestamo): JsonResponse
    {
        try {
            $prestamo->load(['prestable', 'proveedor', 'devoluciones']);
            $resumen = $this->prestamoService->obtenerResumen($prestamo->id);

            return response()->json([
                'success' => true,
                'data' => $prestamo,
                'resumen' => $resumen,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error obteniendo préstamo', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Error obteniendo préstamo'], 500);
        }
    }

    /**
     * POST /api/prestamos-proveedor/{prestamo}/devolver
     * Registrar devolución al proveedor
     */
    public function registrarDevolucion(Request $request, PrestamoProveedor $prestamo): JsonResponse
    {
        try {
            $validated = $request->validate([
                'cantidad_devuelta' => 'required|integer|min:1',
                'observaciones' => 'nullable|string',
                'fecha_devolucion' => 'required|date',
            ]);

            // Validar cantidad
            $cantidadYaDevuelta = $prestamo->devoluciones()->sum('cantidad_devuelta');
            if ($cantidadYaDevuelta + $validated['cantidad_devuelta'] > $prestamo->cantidad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cantidad a devolver excede lo adeudado',
                ], 422);
            }

            $devolución = $this->prestamoService->registrarDevolucion(array_merge(
                $validated,
                ['prestamo_proveedor_id' => $prestamo->id]
            ));

            if (!$devolución) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error registrando devolución',
                ], 500);
            }

            return response()->json([
                'success' => true,
                'data' => $devolución,
                'message' => 'Devolución registrada exitosamente',
            ], 201);
        } catch (\Exception $e) {
            Log::error('❌ Error registrando devolución', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * GET /api/prestamos-proveedor/proveedor/{proveedorId}/activos
     * Listar préstamos activos de un proveedor
     */
    public function obtenerActivosProveedor(int $proveedorId): JsonResponse
    {
        try {
            $activos = $this->prestamoService->obtenerPrestamosActivos($proveedorId);

            return response()->json([
                'success' => true,
                'data' => $activos,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error obteniendo préstamos activos', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Error obteniendo préstamos'], 500);
        }
    }

    /**
     * GET /api/prestamos-proveedor/proveedor/{proveedorId}/deuda
     * Obtener deuda total con un proveedor
     */
    public function obtenerDeuda(int $proveedorId): JsonResponse
    {
        try {
            $deuda = $this->prestamoService->obtenerDeudaTotal($proveedorId);

            return response()->json([
                'success' => true,
                'deuda_total' => $deuda,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error obteniendo deuda', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Error obteniendo deuda'], 500);
        }
    }
}
