<?php
namespace App\Http\Controllers;

use App\DTOs\Venta\CrearProformaDTO;
use App\Exceptions\DomainException;
use App\Exceptions\Stock\StockInsuficientException;
use App\Exceptions\Venta\EstadoInvalidoException;
use App\Http\Requests\StoreProformaRequest;
use App\Http\Traits\ApiInertiaUnifiedResponse;
use App\Models\Almacen;
use App\Models\Cliente;
use App\Models\Producto;
use App\Models\Proforma;
use App\Services\Venta\ProformaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

/**
 * ProformaController - REFACTORIZADO (THIN Controller Pattern)
 *
 * RESPONSABILIDADES:
 * ✓ Manejo de HTTP (request/response)
 * ✓ Validación de formulario
 * ✓ Adaptación de respuestas (Web vs API)
 *
 * NO RESPONSABILIDADES:
 * ✗ Lógica de negocio (eso es ProformaService)
 * ✗ Acceso directo a DB
 */
class ProformaController extends Controller
{
    use ApiInertiaUnifiedResponse;

    public function __construct(
        private ProformaService $proformaService,
        private \App\Services\ImpresionService $impresionService,
    ) {
        $this->middleware('permission:proformas.index')->only('index');
        $this->middleware('permission:proformas.show')->only('show');
        $this->middleware('permission:proformas.create')->only('create', 'store');
    }

    /**
     * Listar proformas
     */
    public function index(Request $request): JsonResponse | InertiaResponse
    {
        try {
            $filtros = [
                'estado'     => $request->input('estado'),
                'cliente_id' => $request->input('cliente_id'),
            ];

            $proformasPaginadas = $this->proformaService->listar(
                perPage: $request->input('per_page', 15),
                filtros: array_filter($filtros)
            );

            return $this->respondPaginated(
                $proformasPaginadas,
                'proformas/Index',
                ['proformas' => $proformasPaginadas, 'filtros' => $filtros]
            );

        } catch (\Exception $e) {
            return $this->respondError('Error al obtener proformas');
        }
    }

    /**
     * Mostrar formulario de creación
     */
    public function create(): InertiaResponse
    {
        return Inertia::render('proformas/create', [
            'clientes'  => Cliente::activos()->select('id', 'nombre', 'nit')->get(),
            'productos' => Producto::activos()->select('id', 'nombre', 'codigo_barras')->get(),
            'almacenes' => Almacen::activos()->select('id', 'nombre')->get(),
        ]);
    }

    /**
     * Crear una proforma
     *
     * FLUJO:
     * 1. Validar datos (Form Request)
     * 2. Crear DTO
     * 3. ProformaService::crear() → RESERVA stock
     * 4. Retornar respuesta
     */
    public function store(StoreProformaRequest $request): JsonResponse | RedirectResponse
    {
        try {
            $usuarioAutenticado = auth()->id();

            // ✅ Verificar que hay usuario autenticado
            if (!$usuarioAutenticado) {
                return $this->respondError(
                    'Usuario no autenticado. No se puede crear proforma sin usuario.',
                    statusCode: 401
                );
            }

            $dto = CrearProformaDTO::fromRequest($request);

            Log::info('📋 [ProformaController::store] Creando proforma', [
                'usuario_autenticado_id' => $usuarioAutenticado,
                'cliente_id'             => $dto->cliente_id,
                'dto_usuario_id'         => $dto->usuario_id,
                'timestamp'              => now()->toIso8601String(),
            ]);

            $proformaDTO = $this->proformaService->crear($dto);

            Log::info('✅ [ProformaController::store] Proforma creada exitosamente', [
                'proforma_id'            => $proformaDTO->id,
                'usuario_creador_id'     => $usuarioAutenticado,
                'usuario_autenticado_id' => $usuarioAutenticado,
                'timestamp'              => now()->toIso8601String(),
            ]);

            return $this->respondSuccess(
                data: $proformaDTO,
                message: 'Proforma creada exitosamente',
                redirectTo: route('proformas.show', $proformaDTO->id),
                statusCode: 201,
            );

        } catch (StockInsuficientException $e) {
            return $this->respondError(
                message: $e->getMessage(),
                errors: $e->getErrors(),
                statusCode: 422,
            );

        } catch (DomainException $e) {
            return $this->respondError($e->getMessage());

        } catch (\Exception $e) {
            Log::error('Error al crear proforma', [
                'error' => $e->getMessage(),
            ]);

            return $this->respondError('Error al crear proforma');
        }
    }

    /**
     * Mostrar detalle de proforma
     */
    public function show(string $id): JsonResponse | InertiaResponse | RedirectResponse
    {
        try {
            $proformaDTO = $this->proformaService->obtener((int) $id);

            return $this->respondShow(
                data: $proformaDTO,
                inertiaComponent: 'proformas/Show',
            );

        } catch (\Exception $e) {
            return $this->respondNotFound('Proforma no encontrada');
        }
    }

    /**
     * Aprobar una proforma
     *
     * POST /proformas/{id}/aprobar
     *
     * Mantiene la reserva de stock (no la consume)
     *
     * ✅ RETORNA SIEMPRE JSON (sin redirecciones)
     */
    public function aprobar(string $id): JsonResponse
    {
        try {
            $proformaDTO = $this->proformaService->aprobar((int) $id);

            // ✅ SIEMPRE retornar JSON, sin redirectTo
            return response()->json([
                'success' => true,
                'message' => 'Proforma aprobada',
                'data' => $proformaDTO->toArray(),
            ], 200);

        } catch (EstadoInvalidoException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error al aprobar proforma', [
                'proforma_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error al aprobar proforma',
            ], 500);
        }
    }

    /**
     * Rechazar una proforma
     *
     * POST /proformas/{id}/rechazar
     *
     * Libera la reserva de stock
     *
     * ✅ RETORNA SIEMPRE JSON (sin redirecciones)
     */
    public function rechazar(string $id): JsonResponse
    {
        try {
            $motivo = request()->input('motivo', '');
            $proformaDTO = $this->proformaService->rechazar((int) $id, $motivo);

            // ✅ SIEMPRE retornar JSON, sin redirectTo
            return response()->json([
                'success' => true,
                'message' => 'Proforma rechazada',
                'data' => $proformaDTO->toArray(),
            ], 200);

        } catch (DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error al rechazar proforma', [
                'proforma_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error al rechazar proforma',
            ], 500);
        }
    }

    /**
     * Convertir proforma a venta
     *
     * POST /proformas/{id}/convertir-venta
     *
     * FLUJO:
     * 1. ProformaService::convertirAVenta()
     * 2. Adentro: VentaService::crear() consume reserva
     * 3. Retorna VentaResponseDTO
     */
    public function convertirAVenta(string $id): JsonResponse | RedirectResponse
    {
        try {
            Log::info('🔄 [ProformaController::convertirAVenta] Iniciando conversión de proforma', [
                'proforma_id' => $id,
                'timestamp'   => now()->toIso8601String(),
            ]);

            $ventaDTO = $this->proformaService->convertirAVenta((int) $id);

            Log::info('✅ [ProformaController::convertirAVenta] Conversión exitosa', [
                'proforma_id'  => $id,
                'venta_id'     => $ventaDTO->id,
                'venta_numero' => $ventaDTO->numero,
                'timestamp'    => now()->toIso8601String(),
            ]);

            // ✅ SIEMPRE retornar JSON puro, sin redirecciones HTTP
            // El frontend maneja la redirección usando el campo redirect_to
            return response()->json([
                'success'     => true,
                'message'     => 'Proforma convertida a venta exitosamente',
                'data'        => $ventaDTO->toArray(),
                'redirect_to' => route('ventas.show', $ventaDTO->id),
            ], 200);

        } catch (\App\Exceptions\Proforma\ReservasExpirasException $e) {
            Log::warning('⚠️ [ProformaController::convertirAVenta] Reservas expiradas', [
                'proforma_id'        => $id,
                'reservas_expiradas' => $e->getReservasExpiradas(),
                'error'              => $e->getMessage(),
                'timestamp'          => now()->toIso8601String(),
            ]);

            // Retornar respuesta especial para reservas expiradas con opción de renovación
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'code'    => 'RESERVAS_EXPIRADAS',
                'action'  => 'renovar_reservas',
                'data'    => [
                    'proforma_id'         => $e->getProformaId(),
                    'reservas_expiradas'  => $e->getReservasExpiradas(),
                    'endpoint_renovacion' => route('proformas.renovar-reservas', $id),
                    'instrucciones'       => 'Usa el endpoint de renovación para extender las reservas 7 días más',
                ],
            ], 422);

        } catch (EstadoInvalidoException $e) {
            Log::warning('⚠️ [ProformaController::convertirAVenta] Estado inválido', [
                'proforma_id' => $id,
                'error'       => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error al convertir proforma a venta', [
                'proforma_id' => $id,
                'error'       => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error al convertir la proforma a venta',
            ], 500);
        }
    }

    /**
     * ✅ NUEVO ENDPOINT SIMPLIFICADO: Procesar proforma (aprobar + convertir en un solo paso)
     *
     * POST /proformas/{id}/procesar-venta
     *
     * Flujo simplificado:
     * 1. Valida que proforma esté en estado PENDIENTE
     * 2. Convierte directamente a venta (sin paso de aprobación manual)
     * 3. Retorna la venta creada
     */
    public function procesarVenta(string $id): JsonResponse
    {
        try {
            Log::info('🔄 [ProformaController::procesarVenta] Iniciando procesamiento simplificado', [
                'proforma_id' => $id,
                'timestamp'   => now()->toIso8601String(),
            ]);

            $proforma = Proforma::findOrFail((int) $id);

            // ✅ IDEMPOTENTE: Si ya está CONVERTIDA, obtener la venta asociada y retornar
            if ($proforma->estado === 'CONVERTIDA') {
                Log::info('ℹ️  [ProformaController::procesarVenta] Proforma ya CONVERTIDA, retornando venta asociada', [
                    'proforma_id' => $id,
                    'proforma_numero' => $proforma->numero,
                ]);

                $venta = $proforma->venta;
                if (!$venta) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Proforma convertida pero venta no encontrada',
                        'code'    => 'VENTA_NO_ENCONTRADA',
                    ], 422);
                }

                $ventaDTO = \App\DTOs\Venta\VentaResponseDTO::fromModel($venta);

                return response()->json([
                    'success'     => true,
                    'message'     => 'Proforma ya convertida a venta (operación idempotente)',
                    'data'        => $ventaDTO->toArray(),
                    'redirect_to' => route('ventas.show', $ventaDTO->id),
                ], 200);
            }

            // Si no está convertida, proceder con la conversión
            $ventaDTO = $this->proformaService->convertirAVenta((int) $id);

            Log::info('✅ [ProformaController::procesarVenta] Proforma procesada exitosamente', [
                'proforma_id'  => $id,
                'venta_id'     => $ventaDTO->id,
                'venta_numero' => $ventaDTO->numero,
                'timestamp'    => now()->toIso8601String(),
            ]);

            return response()->json([
                'success'     => true,
                'message'     => '✅ Proforma convertida a venta exitosamente',
                'data'        => $ventaDTO->toArray(),
                'redirect_to' => route('ventas.show', $ventaDTO->id),
            ], 200);

        } catch (\App\Exceptions\Proforma\ReservasExpirasException $e) {
            Log::warning('⚠️ [ProformaController::procesarVenta] Reservas expiradas', [
                'proforma_id' => $id,
                'error'       => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'code'    => 'RESERVAS_EXPIRADAS',
            ], 422);

        } catch (EstadoInvalidoException $e) {
            Log::warning('⚠️ [ProformaController::procesarVenta] Estado inválido', [
                'proforma_id' => $id,
                'error'       => $e->getMessage(),
            ]);
            return $this->respondError($e->getMessage(), statusCode: 422);

        } catch (\Exception $e) {
            Log::error('❌ [ProformaController::procesarVenta] Error', [
                'proforma_id' => $id,
                'error'       => $e->getMessage(),
            ]);
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * Renovar reservas expiradas de una proforma
     *
     * POST /proformas/{id}/renovar-reservas
     *
     * FLUJO:
     * 1. Valida que la proforma exista
     * 2. Valida que tenga reservas expiradas
     * 3. Llama a renovarReservas() en el modelo
     * 4. Retorna respuesta con status actualizado
     */
    public function renovarReservas(string $id): JsonResponse | RedirectResponse
    {
        try {
            Log::info('🔄 [ProformaController::renovarReservas] Iniciando renovación de reservas', [
                'proforma_id' => $id,
                'timestamp'   => now()->toIso8601String(),
            ]);

            $proforma = Proforma::findOrFail((int) $id);

            // Validar permisos
            // Permitir si:
            // 1. Es administrador
            // 2. Es cliente y la proforma es suya
            // 3. Es cualquier empleado de la distribuidora (can view proformas)
            $user          = auth()->user();
            $isOwnProforma = $proforma->cliente_id === $user->cliente_id;
            $isAdmin       = $user->hasRole('Admin');

            // Si llega aquí es porque pudo ver/acceder a la proforma
            // Si es cliente y no es suya, rechazar
            if ($user->hasRole('cliente') && ! $isOwnProforma) {
                return $this->respondForbidden('No tienes permiso para renovar reservas de esta proforma');
            }

            // Validar que tenga reservas expiradas
            if (! $proforma->tieneReservasExpiradas()) {
                Log::warning('⚠️ Intento de renovar proforma sin reservas expiradas', [
                    'proforma_id' => $id,
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Esta proforma no tiene reservas expiradas que renovar',
                    'code'    => 'NO_EXPIRED_RESERVATIONS',
                ], 422);
            }

            // Renovar las reservas
            $proforma->renovarReservas();

            Log::info('✅ [ProformaController::renovarReservas] Renovación exitosa', [
                'proforma_id'     => $id,
                'proforma_numero' => $proforma->numero,
                'timestamp'       => now()->toIso8601String(),
            ]);

            // Retornar respuesta con información actualizada
            return response()->json([
                'success' => true,
                'message' => 'Reservas renovadas exitosamente',
                'data'    => [
                    'proforma_id'      => $proforma->id,
                    'proforma_numero'  => $proforma->numero,
                    'reservas_activas' => $proforma->reservasActivas()->count(),
                ],
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('⚠️ [ProformaController::renovarReservas] Proforma no encontrada', [
                'proforma_id' => $id,
            ]);
            return $this->respondNotFound('Proforma no encontrada');

        } catch (\Exception $e) {
            Log::error('❌ [ProformaController::renovarReservas] Error general', [
                'proforma_id' => $id,
                'error'       => $e->getMessage(),
                'error_class' => get_class($e),
                'file'        => $e->getFile(),
                'line'        => $e->getLine(),
                'trace'       => $e->getTraceAsString(),
                'timestamp'   => now()->toIso8601String(),
            ]);
            return $this->respondError('Error al renovar reservas: ' . $e->getMessage());
        }
    }

    /**
     * Extender validez de proforma
     *
     * POST /proformas/{id}/extender
     */
    public function extenderValidez(string $id): JsonResponse | RedirectResponse
    {
        try {
            $dias = (int) request()->input('dias', 15);

            if ($dias <= 0) {
                throw new \InvalidArgumentException('Días debe ser mayor a 0');
            }

            $proformaDTO = $this->proformaService->extenderValidez((int) $id, $dias);

            return $this->respondSuccess(
                data: $proformaDTO,
                message: "Validez extendida {$dias} días",
                redirectTo: route('proformas.show', $id),
            );

        } catch (\InvalidArgumentException $e) {
            return $this->respondError($e->getMessage(), statusCode: 422);

        } catch (\Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }

    // ==========================================
    // MÉTODOS DE IMPRESIÓN
    // ==========================================

    /**
     * Imprimir proforma en formato especificado
     *
     * GET /proformas/{proforma}/imprimir?formato=A4&accion=download
     *
     * @param \App\Models\Proforma $proforma
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function imprimir(\App\Models\Proforma $proforma, Request $request)
    {
        try {
            $formato = $request->input('formato', 'A4');      // A4, TICKET_80, TICKET_58
            $accion  = $request->input('accion', 'download'); // download | stream

            // Generar PDF usando el servicio
            $pdf = $this->impresionService->imprimirProforma($proforma, $formato);

            $nombreArchivo = "proforma_{$proforma->numero}_{$formato}.pdf";

            // Retornar según acción solicitada
            return $accion === 'stream'
                ? $pdf->stream($nombreArchivo)
                : $pdf->download($nombreArchivo);

        } catch (\Exception $e) {
            Log::error('Error al imprimir proforma', [
                'proforma_id' => $proforma->id,
                'formato'     => $request->input('formato'),
                'error'       => $e->getMessage(),
            ]);

            return $this->respondError('Error al generar PDF: ' . $e->getMessage());
        }
    }

    /**
     * Preview de impresión (retorna HTML)
     *
     * GET /proformas/{proforma}/preview?formato=A4
     *
     * Útil para debugging o vista previa en navegador
     */
    public function preview(\App\Models\Proforma $proforma, Request $request)
    {
        try {
            $formato = $request->input('formato', 'A4');

            // Obtener plantilla correspondiente
            $plantilla = \App\Models\PlantillaImpresion::obtenerDefault('proforma', $formato);

            if (! $plantilla) {
                abort(404, "No existe plantilla para proforma con formato {$formato}");
            }

            $empresa = \App\Models\Empresa::principal();

            // Cargar relaciones necesarias
            $proforma->load([
                'cliente',
                'detalles.producto',
                'usuarioCreador',
                'usuarioAprobador',
                'moneda',
            ]);

            // Retornar vista Blade directamente (sin PDF)
            return view($plantilla->vista_blade, [
                'documento'       => $proforma,
                'empresa'         => $empresa,
                'plantilla'       => $plantilla,
                'fecha_impresion' => now(),
                'usuario'         => auth()->user(),
                'opciones'        => [
                    'porcentaje_impuesto' => 13,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error al generar preview de proforma', [
                'proforma_id' => $proforma->id,
                'formato'     => $request->input('formato'),
                'error'       => $e->getMessage(),
            ]);

            return response()->view('errors.500', ['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Obtener formatos de impresión disponibles
     *
     * GET /proformas/formatos-disponibles
     *
     * @return JsonResponse
     */
    public function formatosDisponibles(): JsonResponse
    {
        try {
            $formatos = $this->impresionService->obtenerFormatosDisponibles('proforma');

            return response()->json([
                'success' => true,
                'data'    => $formatos,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener formatos disponibles',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de proformas para dashboard
     *
     * GET /api/proformas/estadisticas
     *
     * @return JsonResponse
     */
    public function estadisticas(Request $request): JsonResponse
    {
        try {
            // Usar el modelo Proforma directamente para queries simples de estadísticas
            $proformaModel = Proforma::class;

            $stats = [
                'total'             => $proformaModel::count(),
                'por_estado'        => [
                    'pendiente'  => $proformaModel::whereHas('estadoLogistica', function ($q) {$q->where('codigo', 'PENDIENTE')->where('categoria', 'proforma');})->count(),
                    'aprobada'   => $proformaModel::whereHas('estadoLogistica', function ($q) {$q->where('codigo', 'APROBADA')->where('categoria', 'proforma');})->count(),
                    'rechazada'  => $proformaModel::whereHas('estadoLogistica', function ($q) {$q->where('codigo', 'RECHAZADA')->where('categoria', 'proforma');})->count(),
                    'convertida' => $proformaModel::whereHas('estadoLogistica', function ($q) {$q->where('codigo', 'CONVERTIDA')->where('categoria', 'proforma');})->count(),
                    'vencida'    => $proformaModel::whereHas('estadoLogistica', function ($q) {$q->where('codigo', 'VENCIDA')->where('categoria', 'proforma');})->count(),
                ],
                'montos_por_estado' => [
                    'pendiente'  => $proformaModel::whereHas('estadoLogistica', function ($q) {$q->where('codigo', 'PENDIENTE')->where('categoria', 'proforma');})->sum('total'),
                    'aprobada'   => $proformaModel::whereHas('estadoLogistica', function ($q) {$q->where('codigo', 'APROBADA')->where('categoria', 'proforma');})->sum('total'),
                    'convertida' => $proformaModel::whereHas('estadoLogistica', function ($q) {$q->where('codigo', 'CONVERTIDA')->where('categoria', 'proforma');})->sum('total'),
                ],
                'alertas'           => [
                    'vencidas'   => $proformaModel::whereHas('estadoLogistica', function ($q) {$q->where('codigo', 'VENCIDA')->where('categoria', 'proforma');})->count(),
                    'por_vencer' => $proformaModel::whereHas('estadoLogistica', function ($q) {$q->where('codigo', 'PENDIENTE')->where('categoria', 'proforma');})
                        ->where('fecha_vencimiento', '<=', now()->addDays(2))
                        ->count(),
                ],
                'monto_total'       => $proformaModel::sum('total'),
            ];

            return response()->json(['success' => true, 'data' => $stats]);

        } catch (\Exception $e) {
            Log::error('Error al obtener estadísticas de proformas', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
