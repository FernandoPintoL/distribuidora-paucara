<?php

namespace App\Http\Controllers;

use App\Models\PrestamoCliente;
use App\Services\ImpresionService;
use App\Services\Prestamos\PrestamoClienteService;
use App\Services\Prestamos\ValidacionPrestamosService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PrestamoClienteController extends Controller
{
    public function __construct(
        private PrestamoClienteService $prestamoService,
        private ValidacionPrestamosService $validacionService,
        private ImpresionService $impresionService,
    ) {
    }

    /**
     * GET /api/prestamos-cliente
     * Listar préstamos (filtrado por cliente o chofer)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = PrestamoCliente::with(['detalles.prestable', 'cliente', 'chofer', 'devoluciones']);

            // Filtro por cliente
            if ($request->has('cliente_id')) {
                $query->where('cliente_id', $request->integer('cliente_id'));
            }

            // Filtro por chofer
            if ($request->has('chofer_id')) {
                $query->where('chofer_id', $request->integer('chofer_id'));
            }

            // Filtro por estado
            if ($request->has('estado')) {
                $query->where('estado', $request->string('estado'));
            }

            $prestamos = $query->orderByDesc('fecha_prestamo')->paginate($request->integer('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $prestamos,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error listando préstamos', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Error listando préstamos'], 500);
        }
    }

    /**
     * POST /api/prestamos-cliente
     * Crear nuevo préstamo con múltiples detalles
     */
    public function store(Request $request): JsonResponse
    {
        try {
            Log::info('📨 Recibiendo solicitud de préstamo', [
                'datos' => $request->all(),
                'headers' => $request->headers->all()
            ]);

            // Validar datos
            $validacion = $this->validacionService->datosCreacionPrestamo($request->all());
            if (!$validacion['valido']) {
                Log::error('❌ Validación fallida al crear préstamo', [
                    'datos' => $request->all(),
                    'errores' => $validacion['errores']
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Datos inválidos: ' . implode(', ', $validacion['errores']),
                    'errores' => $validacion['errores'],
                ], 422);
            }

            // Validar stock para cada detalle - Usar almacén 3 para canastillas
            $almacenId = 3;
            $detalles = $request->input('detalles', []);

            Log::info('🏭 Validando stock para detalles', [
                'almacen_id' => $almacenId,
                'cantidad_detalles' => count($detalles)
            ]);

            foreach ($detalles as $i => $detalle) {
                $stockValido = $this->validacionService->puedoPrestar(
                    $detalle['prestable_id'],
                    $almacenId,
                    $detalle['cantidad']
                );

                if (!$stockValido['valido']) {
                    Log::warning('⚠️ Stock insuficiente en detalle ' . $i, ['mensaje' => $stockValido['mensaje']]);
                    return response()->json([
                        'success' => false,
                        'message' => "Detalle {$i}: " . $stockValido['mensaje'],
                    ], 422);
                }
            }

            Log::info('✅ Stock validado correctamente para todos los detalles');

            // Crear préstamo
            Log::info('💾 Creando préstamo');
            $prestamo = $this->prestamoService->crearPrestamo($request->all());

            if (!$prestamo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error creando préstamo',
                ], 500);
            }

            return response()->json([
                'success' => true,
                'data' => $prestamo->load(['detalles.prestable', 'cliente', 'chofer']),
                'message' => 'Préstamo creado exitosamente',
            ], 201);
        } catch (\Exception $e) {
            Log::error('❌ Error creando préstamo', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * GET /api/prestamos-cliente/{prestamo}
     * Ver detalles del préstamo
     */
    public function show(PrestamoCliente $prestamo): JsonResponse
    {
        try {
            $prestamo->load(['detalles.prestable', 'detalles.devoluciones', 'cliente', 'chofer', 'venta', 'devoluciones']);
            $resumen = $this->prestamoService->obtenerResumenPrestamo($prestamo->id);

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
     * PATCH /api/prestamos-cliente/{prestamo}
     * Actualizar préstamo (fecha esperada, garantía, observaciones)
     */
    public function update(Request $request, PrestamoCliente $prestamo): JsonResponse
    {
        try {
            Log::info('📝 Actualizando préstamo', [
                'prestamo_id' => $prestamo->id,
                'datos' => $request->all()
            ]);

            // Validar y actualizar solo campos permitidos
            $datosActualizacion = $request->validate([
                'fecha_esperada_devolucion' => 'nullable|date',
                'monto_garantia' => 'nullable|numeric|min:0',
                'observaciones' => 'nullable|string|max:1000',
            ]);

            // Actualizar el préstamo
            $prestamo->update($datosActualizacion);

            Log::info('✅ Préstamo actualizado', [
                'prestamo_id' => $prestamo->id,
                'cambios' => $datosActualizacion
            ]);

            return response()->json([
                'success' => true,
                'data' => $prestamo->load(['detalles.prestable', 'cliente', 'chofer']),
                'message' => 'Préstamo actualizado exitosamente',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('⚠️ Validación fallida al actualizar préstamo', [
                'errores' => $e->errors()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos',
                'errores' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('❌ Error actualizando préstamo', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/prestamos-cliente/{prestamo}/devolver
     * Registrar devolución por detalle
     */
    public function registrarDevolucion(Request $request, PrestamoCliente $prestamo): JsonResponse
    {
        try {
            // Validar datos de devolución
            $datosValidacion = $request->all();

            $validacion = $this->validacionService->datosDevolucion($datosValidacion);
            if (!$validacion['valido']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos de devolución inválidos',
                    'errores' => $validacion['errores'],
                ], 422);
            }

            // Validar que la cantidad devuelta no exceda la prestada
            $cantidadDevuelta = ($request->integer('cantidad_devuelta') ?? 0) +
                               ($request->integer('cantidad_dañada_parcial') ?? 0) +
                               ($request->integer('cantidad_dañada_total') ?? 0);

            $validacionDevolucio = $this->validacionService->puedoDevolver(
                $request->integer('prestamo_cliente_detalle_id'),
                $request->integer('cantidad_devuelta'),
                $request->integer('cantidad_dañada_parcial'),
                $request->integer('cantidad_dañada_total')
            );

            if (!$validacionDevolucio['valido']) {
                return response()->json([
                    'success' => false,
                    'message' => $validacionDevolucio['mensaje'],
                ], 422);
            }

            // Registrar devolución
            $devolución = $this->prestamoService->registrarDevolucion($request->all());

            if (!$devolución) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error registrando devolución',
                ], 500);
            }

            // Obtener el detalle para saber qué prestable es
            $detalle = $devolución->detallePrestamoCliente;

            // Obtener montos a cobrar por daño
            $montos = $this->validacionService->obtenerMontosDaño(
                $detalle->prestable_id,
                $request->integer('cantidad_dañada_parcial') ?? 0,
                $request->integer('cantidad_dañada_total') ?? 0
            );

            return response()->json([
                'success' => true,
                'data' => $devolución,
                'montos_cobrados' => $montos,
                'message' => 'Devolución registrada exitosamente',
            ], 201);
        } catch (\Exception $e) {
            Log::error('❌ Error registrando devolución', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * GET /api/prestamos-cliente/chofer/{choferId}/pendientes
     * Listar préstamos pendientes de devolver por chofer
     */
    public function obtenerPendientesChofer(int $choferId): JsonResponse
    {
        try {
            $pendientes = $this->prestamoService->obtenerPrestamosParaDevolver($choferId);

            return response()->json([
                'success' => true,
                'data' => $pendientes,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error obteniendo pendientes', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Error obteniendo pendientes'], 500);
        }
    }

    /**
     * GET /api/prestamos-cliente/cliente/{clienteId}/activos
     * Listar préstamos activos de un cliente
     */
    public function obtenerActivosCliente(int $clienteId): JsonResponse
    {
        try {
            $activos = $this->prestamoService->obtenerPrestamosActivos($clienteId);

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
     * GET /prestamos/clientes/{prestamo}/imprimir
     * Imprimir información del préstamo en PDF (formatos A4 y TICKET_80)
     */
    public function imprimir(PrestamoCliente $prestamo, Request $request)
    {
        $formato = $request->input('formato', 'A4');      // A4 | TICKET_80
        $accion  = $request->input('accion', 'download'); // download | stream

        // Cargar relaciones necesarias para la impresión
        $prestamo->load(['detalles.prestable', 'cliente', 'chofer', 'venta', 'devoluciones']);

        // Generar PDF usando el tipo de documento "prestamo_cliente"
        $pdf = $this->impresionService->generarPDF('prestamo_cliente', $prestamo, $formato);

        $nombreArchivo = "prestamo_cliente_{$prestamo->id}_{$formato}.pdf";

        return $accion === 'stream'
            ? $pdf->stream($nombreArchivo)
            : $pdf->download($nombreArchivo);
    }

    /**
     * POST /api/prestamos-cliente/{prestamo}/anular
     * Anular préstamo (cancela y devuelve stock)
     */
    public function anularPrestamo(Request $request, PrestamoCliente $prestamo): JsonResponse
    {
        try {
            Log::info('📝 Anulando préstamo', [
                'prestamo_id' => $prestamo->id,
                'datos' => $request->all()
            ]);

            // Validar datos
            $datosValidacion = $request->validate([
                'razon_anulacion' => 'nullable|string|max:500',
            ]);

            // Anular préstamo
            $prestamoAnulado = $this->prestamoService->anularPrestamo(
                $prestamo->id,
                $datosValidacion['razon_anulacion'] ?? null
            );

            if (!$prestamoAnulado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error anulando préstamo',
                ], 500);
            }

            Log::info('✅ Préstamo anulado correctamente', [
                'prestamo_id' => $prestamoAnulado->id,
            ]);

            return response()->json([
                'success' => true,
                'data' => $prestamoAnulado->load(['detalles.prestable', 'cliente', 'chofer']),
                'message' => 'Préstamo anulado exitosamente',
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('⚠️ Validación fallida al anular préstamo', [
                'errores' => $e->errors()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos',
                'errores' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('❌ Error anulando préstamo', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }
}
