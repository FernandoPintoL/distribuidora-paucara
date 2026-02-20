<?php
namespace App\Http\Controllers;

use App\Models\AperturaCaja;
use App\Models\AuditoriaCaja;
use App\Models\Caja;
use App\Models\CierreCaja;
use App\Models\CierreDiarioGeneral;
use App\Models\ComprobanteMovimiento;
use App\Models\EstadoCierre;
use App\Models\MovimientoCaja;
use App\Models\TipoOperacionCaja;
use App\Services\CierreCajaService;
use App\Services\ExcelExportService;
use App\Services\MovimientoCajaService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CajaController extends Controller
{
    private ExcelExportService $excelExportService;
    private MovimientoCajaService $movimientoCajaService;
    private CierreCajaService $cierreCajaService;

    public function __construct(ExcelExportService $excelExportService, MovimientoCajaService $movimientoCajaService, CierreCajaService $cierreCajaService)
    {
        $this->excelExportService    = $excelExportService;
        $this->movimientoCajaService = $movimientoCajaService;
        $this->cierreCajaService     = $cierreCajaService;

        $this->middleware('permission:cajas.index')->only('index');
        $this->middleware('permission:cajas.show')->only('estadoCajas');
        $this->middleware('permission:cajas.abrir')->only('abrirCaja');
        $this->middleware('permission:cajas.cerrar')->only('cerrarCaja');
        $this->middleware('permission:cajas.transacciones')->only('movimientosDia', 'movimientosApertura');
        $this->middleware('permission:cajas.corregir')->only('corregirCierre');
    }

    /**
     * Mostrar dashboard de cajas
     *
     * ✅ MODIFICADO: Soporta tres contextos:
     * 1. $aperturaCaja viene (vía route model binding): mostrar esa apertura específica (admin)
     * 2. $userId viene: mostrar caja actual del usuario (admin viendo cualquier usuario)
     * 3. Ni aperturaCaja ni userId: mostrar caja del usuario autenticado (personal)
     */
    public function index(AperturaCaja $aperturaCaja = null, $userId = null)
    {
        $usuarioAutenticado = Auth::user();

        // ✅ NUEVO: Determinar el contexto y usuario destino
        if ($aperturaCaja) {
            // Admin viendo caja de otro usuario vía apertura específica
            if ($aperturaCaja->user_id !== $usuarioAutenticado->id) {
                abort_unless(
                    $usuarioAutenticado->hasRole(['admin', 'Admin', 'Super Admin']),
                    403,
                    'No tienes permiso para ver las cajas de otros usuarios'
                );
            }
            $usuarioDestino = $aperturaCaja->usuario;
            $cajaAbiertaHoy = $aperturaCaja;
        } elseif ($userId) {
            // Admin viendo caja de otro usuario vía user_id (sin importar apertura)
            if ($userId !== $usuarioAutenticado->id) {
                abort_unless(
                    $usuarioAutenticado->hasRole(['admin', 'Admin', 'Super Admin']),
                    403,
                    'No tienes permiso para ver las cajas de otros usuarios'
                );
            }
            $usuarioDestino = \App\Models\User::findOrFail($userId);
            $cajaAbiertaHoy = AperturaCaja::where('user_id', $usuarioDestino->id)
                ->whereDoesntHave('cierre')
                ->with(['caja', 'cierre'])
                ->latest('fecha')
                ->first();
        } else {
            // Usuario viendo su propia caja
            $usuarioDestino = $usuarioAutenticado;
            $cajaAbiertaHoy = AperturaCaja::where('user_id', $usuarioDestino->id)
                ->whereDoesntHave('cierre')
                ->with(['caja', 'cierre'])
                ->latest('fecha')
                ->first();
        }

        // Obtener cajas disponibles del usuario destino
        $cajas = Caja::where('user_id', $usuarioDestino->id)
            ->activas()
            ->get();

        // Obtener movimientos de la apertura si hay caja abierta
        $movimientosHoy = [];
        if ($cajaAbiertaHoy) {
            $movimientosHoy = MovimientoCaja::where('caja_id', $cajaAbiertaHoy->caja_id)
                ->where('user_id', $usuarioDestino->id)
                ->where('fecha', '>=', $cajaAbiertaHoy->fecha)
                ->with(['tipoOperacion', 'tipoPago', 'comprobantes', 'usuario', 'venta' => function($q) {
                    $q->select('id', 'numero', 'estado_documento_id', 'tipo_entrega'); // ✅ Cargar tipo_entrega
                }, 'venta.estadoDocumento']) // ✅ Cargar estado_documento con venta
                ->orderBy('id', 'desc')  // ✅ ACTUALIZADO: Ordenar por ID descendente
                ->get()
                // ✅ NUEVO: Filtrar movimientos - Excluir CREDITO si no están APROBADOS
                ->filter(function($mov) {
                    // Si es VENTA o CREDITO, solo incluir si están APROBADAS
                    if (in_array($mov->tipoOperacion?->codigo, ['VENTA', 'CREDITO'])) {
                        return $mov->venta?->estadoDocumento?->codigo === 'APROBADO';
                    }
                    // Otros tipos (PAGO, GASTOS, etc.) se incluyen siempre
                    return true;
                })
                ->values(); // ✅ Reindexar array después de filter
        }

        // Obtener historial de aperturas del usuario destino
        $historicoAperturas = AperturaCaja::where('user_id', $usuarioDestino->id)
            ->with(['caja', 'cierre'])
            ->orderBy('id', 'desc')  // ✅ ACTUALIZADO: Ordenar por ID descendente
            ->limit(50)
            ->get()
            ->map(function ($apertura) {
                return [
                    'id'                     => $apertura->id,
                    'caja_id'                => $apertura->caja_id,
                    'caja_nombre'            => $apertura->caja->nombre ?? 'Sin caja',
                    'fecha_apertura'         => $apertura->fecha,
                    'monto_apertura'         => $apertura->monto_apertura,
                    'observaciones_apertura' => $apertura->observaciones,
                    'fecha_cierre'           => $apertura->cierre?->created_at,
                    'monto_esperado'         => $apertura->cierre?->monto_esperado,
                    'monto_real'             => $apertura->cierre?->monto_real,
                    'diferencia'             => $apertura->cierre?->diferencia,
                    'observaciones_cierre'   => $apertura->cierre?->observaciones,
                    'estado'                 => $apertura->cierre ? 'Cerrada' : 'Abierta',
                    'estado_cierre'          => $apertura->cierre?->estado,
                ];
            });

        // ✅ Obtener tipos de operación clasificados (ENTRADA/SALIDA/AJUSTE)
        $tiposOperacionClasificados = TipoOperacionCaja::obtenerTiposClasificados();

        // Para compatibilidad: mantener array plano de todos los tipos
        $tiposOperacion = collect($tiposOperacionClasificados)
            ->flatten()
            ->values()
            ->all();

        // ✅ NUEVO: Obtener tipos de pago disponibles
        $tiposPago = \App\Models\TipoPago::all(['id', 'codigo', 'nombre']);

        // ✅ REFACTORIZADO: Simplificado - Solo enviar datos esenciales al frontend
        $datosResumen = null;

        // ✅ CORREGIDO (2026-02-11): Calcular SIEMPRE si hay caja (incluso sin movimientos)
        if ($cajaAbiertaHoy) {
            $datosCalculados = $this->cierreCajaService->calcularDatos($cajaAbiertaHoy);

            // Extraer sumatorias principales
            $montoApertura = (float) $cajaAbiertaHoy->monto_apertura;
            $totalVentas = (float) $datosCalculados['totalVentas'];  // Todas las ventas APROBADAS
            $ventasAnuladas = (float) $datosCalculados['datosReferenciales']['anulaciones'];
            $pagosCredito = (float) $datosCalculados['detalleEfectivo']['pagos_credito'];

            // ✅ NUEVO: Calcular TODAS las ventas a crédito DE ESTA CAJA (pagadas + pendientes)
            $ventasCreditoTotales = (float) $this->cierreCajaService->calcularVentasCreditoDeCaja($cajaAbiertaHoy);

            // ✅ CORREGIDO (2026-02-11): Usar sumatorias individuales en lugar de salidas_reales
            // Calcular ingresos y egresos (sin contar créditos, compras, anuladas)
            $sumatorialGastos = (float) ($datosCalculados['sumatorialGastos'] ?? 0);
            $sumatorialPagosSueldo = (float) ($datosCalculados['sumatorialPagosSueldo'] ?? 0);
            $sumatorialAnticipos = (float) ($datosCalculados['sumatorialAnticipos'] ?? 0);

            $totalIngresos = $totalVentas + $pagosCredito;  // Ventas APROBADAS + Pagos CxC
            $totalEgresos = $sumatorialGastos + $sumatorialPagosSueldo + $sumatorialAnticipos;  // GASTOS + PAGO_SUELDO + ANTICIPO
            $efectivoEsperado = $montoApertura + $totalIngresos - $totalEgresos;

            // Construir listado de ventas por tipo de pago (solo aprobadas)
            $ventasPorTipoPago = [];
            $movimientosPorTipo = $datosCalculados['movimientosPorTipoPago'] ?? [];
            foreach ($movimientosPorTipo as $tipo => $datos) {
                $ventasPorTipoPago[] = [
                    'tipo'  => $tipo,
                    'total' => (float) ($datos['total'] ?? 0),
                    'cantidad' => (int) ($datos['cantidad'] ?? 0),
                ];
            }

            // ✅ NUEVO: Construir listado de pagos a crédito por tipo de pago
            $pagosCreditoPorTipoPago = $datosCalculados['pagosCreditoPorTipoPago'] ?? [];

            // ✅ NUEVO: Calcular sumatoria de pagos a crédito por tipo de pago
            $sumatoriaPagosCreditoPorTipo = [];
            $totalPagosCreditoPorTipos = 0;
            foreach ($pagosCreditoPorTipoPago as $pago) {
                $sumatoriaPagosCreditoPorTipo[] = [
                    'tipo'  => $pago['tipo'] ?? 'Sin tipo',
                    'total' => (float) ($pago['total'] ?? 0),
                    'cantidad' => (int) ($pago['cantidad'] ?? 0),
                ];
                $totalPagosCreditoPorTipos += (float) ($pago['total'] ?? 0);
            }

            // ✅ Obtener anulaciones del servicio (referencial)
            $sumatorialAnulaciones = (float) ($datosCalculados['sumatorialAnulaciones'] ?? 0);

            $datosResumen = [
                'apertura'              => $montoApertura,
                'totalVentas'           => $totalVentas,           // Suma TODAS las ventas aprobadas
                'ventasAnuladas'        => $ventasAnuladas,        // Suma separada de anuladas (referencial)
                'pagosCredito'          => $pagosCredito,          // Suma de pagos de CxC
                'ventasCreditoTotales'  => $ventasCreditoTotales,  // ✅ NUEVO: TODAS las ventas a crédito (histórico)
                'totalSalidas'          => $totalEgresos,          // Suma TODAS las salidas (GASTOS + SUELDOS + ANTICIPOS)
                'totalIngresos'         => $totalIngresos,         // Ventas + Pagos CxC
                'totalEgresos'          => $totalEgresos,          // GASTOS + PAGO_SUELDO + ANTICIPO
                'efectivoEsperado'      => $efectivoEsperado,      // Apertura + Ingresos - Egresos
                'ventasPorTipoPago'     => $ventasPorTipoPago,     // Desglose de ventas por tipo de pago
                'pagosCreditoPorTipoPago' => $sumatoriaPagosCreditoPorTipo,  // Desglose de pagos de crédito por tipo de pago
                'totalPagosCreditoPorTipos' => (float) $totalPagosCreditoPorTipos,  // ✅ NUEVO: Sumatoria total de pagos por tipos
                // ✅ NUEVO: Desglose de salidas
                'sumatorialGastos'      => $sumatorialGastos,
                'sumatorialPagosSueldo' => $sumatorialPagosSueldo,
                'sumatorialAnticipos'   => $sumatorialAnticipos,
                'sumatorialAnulaciones' => $sumatorialAnulaciones,
            ];

            Log::info('💰 [CajaController] Resumen de caja calculado', [
                'apertura_id'       => $cajaAbiertaHoy->id,
                'totalVentas'       => $totalVentas,
                'ventasAnuladas'    => $ventasAnuladas,
                'pagosCredito'      => $pagosCredito,
                'totalEgresos'      => $totalEgresos,
                'efectivoEsperado'  => $efectivoEsperado,
            ]);
        }

        return Inertia::render('Cajas/Index', [
            'cajas'                     => $cajas,
            'cajaAbiertaHoy'            => $cajaAbiertaHoy,
            'movimientosHoy'            => $movimientosHoy,
            'historicoAperturas'        => $historicoAperturas,
            'tiposOperacion'            => $tiposOperacion,
            'tiposOperacionClasificados' => $tiposOperacionClasificados,
            'tiposPago'                 => $tiposPago,
            'usuarioDestino'            => $usuarioDestino,
            'datosResumen'              => $datosResumen,  // ✅ Datos simplificados de caja
            // ✅ NUEVO: Propiedades desanidadas de datosResumen para compatibilidad con frontend
            'ventasPorTipoPago'         => $datosResumen ? $datosResumen['ventasPorTipoPago'] ?? [] : [],
            'ventasTotales'             => $datosResumen ? $datosResumen['totalVentas'] ?? 0 : 0,
            'ventasAnuladas'            => $datosResumen ? $datosResumen['ventasAnuladas'] ?? 0 : 0,
            'ventasCredito'             => $datosResumen ? $datosResumen['pagosCredito'] ?? 0 : 0,
            'ventasCreditoTotales'      => $datosResumen ? $datosResumen['ventasCreditoTotales'] ?? 0 : 0,  // ✅ NUEVO
        ]);
    }

    /**
     * Abrir caja para el día actual
     * ✅ MODIFICADO: Soporta abrir caja del usuario o de otro usuario (si es admin)
     */
    public function abrirCaja(Request $request, $userId = null)
    {
        $request->validate([
            'caja_id'        => 'required|exists:cajas,id',
            'monto_apertura' => 'required|numeric|min:0',
            'observaciones'  => 'nullable|string|max:500',
        ]);

        $usuarioAutenticado = Auth::user();
        $usuarioDestino     = $userId ? \App\Models\User::findOrFail($userId) : $usuarioAutenticado;

        // ✅ VALIDACIÓN: Si es otro usuario, debe ser admin
        if ($userId && $usuarioDestino->id !== $usuarioAutenticado->id) {
            abort_unless(
                $usuarioAutenticado->hasRole(['admin', 'Admin', 'Super Admin']),
                403,
                'No tienes permiso para gestionar cajas de otros usuarios'
            );
        }

        try {
            DB::beginTransaction();

            // ✅ MODIFICADO: Permitir múltiples aperturas/cierres por día
            // Solo valida que no haya una caja abierta SIN CERRAR (sin importar la fecha)
            $cajaAbiertaSinCerrar = AperturaCaja::where('user_id', $usuarioDestino->id)
                ->whereDoesntHave('cierre')
                ->first();

            if ($cajaAbiertaSinCerrar) {
                return back()->withErrors([
                    'caja' => 'El usuario ya tiene una caja abierta sin cerrar. Ciérrala primero.',
                ]);
            }

            // Verificar que la caja esté disponible
            $caja = Caja::findOrFail($request->caja_id);

            if (! $caja->activa) {
                return back()->withErrors([
                    'caja' => 'La caja seleccionada no está activa.',
                ]);
            }

            // Crear apertura de caja
            $apertura = AperturaCaja::create([
                'caja_id'        => $request->caja_id,
                'user_id'        => $usuarioDestino->id,
                'fecha'          => now(),
                'monto_apertura' => $request->monto_apertura,
                'observaciones'  => $request->observaciones,
            ]);

            // Crear movimiento inicial si hay monto de apertura
            if ($request->monto_apertura > 0) {
                $tipoOperacion = TipoOperacionCaja::where('codigo', 'APERTURA')->first();

                if ($tipoOperacion) {
                    MovimientoCaja::create([
                        'caja_id'           => $request->caja_id,
                        'tipo_operacion_id' => $tipoOperacion->id,
                        'numero_documento'  => 'APERTURA-' . date('Ymd') . '-' . $usuarioDestino->id,
                        'descripcion'       => 'Apertura de caja - ' . $caja->nombre,
                        'monto'             => $request->monto_apertura,
                        'fecha'             => now(),
                        'user_id'           => $usuarioDestino->id,
                    ]);
                }
            }

            DB::commit();

            Log::info('Caja abierta exitosamente', [
                'user_id'        => $usuarioDestino->id,
                'caja_id'        => $request->caja_id,
                'monto_apertura' => $request->monto_apertura,
                'abierta_por'    => $usuarioAutenticado->id,
            ]);

            return back()->with('success', 'Caja abierta exitosamente.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error abriendo caja: ' . $e->getMessage());

            return back()->withErrors([
                'caja' => 'Error al abrir la caja. Intenta nuevamente.',
            ]);
        }
    }

    /**
     * Cerrar caja del día actual
     * ✅ MODIFICADO: Soporta cerrar caja del usuario o de otro usuario (si es admin)
     */
    public function cerrarCaja(Request $request, $userId = null)
    {
        $request->validate([
            'monto_real'    => 'required|numeric|min:0',
            'observaciones' => 'nullable|string|max:500',
            'fecha_cierre'  => 'nullable|date',
        ]);

        $usuarioAutenticado = Auth::user();
        $usuarioDestino     = $userId ? \App\Models\User::findOrFail($userId) : $usuarioAutenticado;

        // ✅ VALIDACIÓN: Si es otro usuario, debe ser admin
        if ($userId && $usuarioDestino->id !== $usuarioAutenticado->id) {
            abort_unless(
                $usuarioAutenticado->hasRole(['admin', 'Admin', 'Super Admin']),
                403,
                'No tienes permiso para gestionar cajas de otros usuarios'
            );
        }

        try {
            DB::beginTransaction();

            // ✅ MODIFICADO: Buscar caja abierta más reciente (sin importar la fecha)
            // No limitar a "hoy" para permitir cerrar cajas abiertas en días anteriores
            $apertura = AperturaCaja::where('user_id', $usuarioDestino->id)
                ->whereDoesntHave('cierre')
                ->latest('fecha')
                ->first();

            if (! $apertura) {
                return back()->withErrors([
                    'caja' => 'No hay una caja abierta para cerrar.',
                ]);
            }

            // ✅ NUEVO: Permitir cerrar en fecha pasada (para cajas abiertas en días anteriores)
            $fechaCierre = $request->fecha_cierre ?
            Carbon::createFromFormat('Y-m-d', $request->fecha_cierre)->endOfDay() :
            now();

            // ✅ MEJORADO: Usar CierreCajaService para calcular solo dinero REAL en caja
            // (no incluye ventas anuladas, créditos sin aplicar, etc.)
            $cierreCajaService = new CierreCajaService();
            $datosCalculados = $cierreCajaService->calcularDatos($apertura);
            $montoEsperado = $datosCalculados['efectivoEsperado']['total'] ?? 0;

            Log::info('💰 [cerrarCaja] Monto esperado calculado', [
                'apertura_id' => $apertura->id,
                'monto_esperado' => $montoEsperado,
                'detalle' => [
                    'apertura' => $datosCalculados['efectivoEsperado']['apertura'] ?? 0,
                    'ventas_efectivo' => $datosCalculados['efectivoEsperado']['ventas_efectivo'] ?? 0,
                    'pagos_credito' => $datosCalculados['efectivoEsperado']['pagos_credito'] ?? 0,
                    'gastos' => $datosCalculados['efectivoEsperado']['gastos'] ?? 0,
                ]
            ]);

            // Calcular diferencia
            $diferencia = $request->monto_real - $montoEsperado;

            // Obtener estado PENDIENTE
            $estadoPendiente = \App\Models\EstadoCierre::obtenerIdPendiente();

            // Crear cierre de caja en estado PENDIENTE
            $cierre = CierreCaja::create([
                'caja_id'          => $apertura->caja_id,
                'user_id'          => $usuarioDestino->id,
                'apertura_caja_id' => $apertura->id,
                'fecha'            => $fechaCierre,
                'monto_esperado'   => $montoEsperado,
                'monto_real'       => $request->monto_real,
                'diferencia'       => $diferencia,
                'observaciones'    => $request->observaciones,
                'estado_cierre_id' => $estadoPendiente,
            ]);

            // Si hay diferencia, crear movimiento de ajuste
            if ($diferencia != 0) {
                $tipoOperacion = TipoOperacionCaja::where('codigo', 'AJUSTE')->first();

                if ($tipoOperacion) {
                    MovimientoCaja::create([
                        'caja_id'           => $apertura->caja_id,
                        'tipo_operacion_id' => $tipoOperacion->id,
                        'numero_documento'  => 'AJUSTE-' . date('Ymd') . '-' . $usuarioDestino->id,
                        'descripcion'       => 'Ajuste por diferencia en cierre - ' . ($diferencia > 0 ? 'Sobrante' : 'Faltante'),
                        'monto'             => $diferencia,
                        'fecha'             => now(),
                        'user_id'           => $usuarioDestino->id,
                    ]);
                }
            }

            DB::commit();

            // Notificar a admins de nuevo cierre pendiente
            try {
                app(\App\Services\WebSocket\CajaWebSocketService::class)
                    ->notifyCierrePendiente($cierre->fresh(['usuario', 'caja']));
            } catch (\Exception $e) {
                Log::warning('Error notificando cierre pendiente', ['cierre_id' => $cierre->id]);
            }

            Log::info('Caja cerrada exitosamente', [
                'user_id'        => $usuarioDestino->id,
                'caja_id'        => $apertura->caja_id,
                'monto_esperado' => $montoEsperado,
                'monto_real'     => $request->monto_real,
                'diferencia'     => $diferencia,
                'cerrada_por'    => $usuarioAutenticado->id,
            ]);

            // ✅ MEJORADO: Retornar JSON (sin redireccionar) para permitir abrir OutputSelectionModal
            return response()->json([
                'success' => true,
                'message' => 'Caja cerrada exitosamente. Pendiente de verificación. Diferencia: ' . number_format($diferencia, 2) . ' Bs.',
                'cierre_id' => $cierre->id,
                'apertura_id' => $apertura->id,
                'diferencia' => $diferencia,
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error cerrando caja: ' . $e->getMessage());

            // ✅ MEJORADO: Retornar JSON en lugar de redireccionar
            return response()->json([
                'success' => false,
                'message' => 'Error al cerrar la caja. Intenta nuevamente.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ NUEVO: Obtener datos calculados de cierre de caja para el modal
     *
     * GET /api/cajas/{id}/datos-cierre
     *
     * Retorna TODOS los datos necesarios para el CierreCajaModal.tsx
     * usando CierreCajaService para centralizar los cálculos
     *
     * @param AperturaCaja $aperturaCaja
     * @return \Illuminate\Http\JsonResponse
     */
    public function obtenerDatosCierre(AperturaCaja $aperturaCaja)
    {
        try {
            Log::info('🟦 [obtenerDatosCierre] INICIO', ['apertura_id' => $aperturaCaja->id]);

            // ✅ Usar CierreCajaService para obtener TODOS los datos
            // Nota: Si no existe cierre aún (modal abierto sin cerrar), se calcula con la apertura actual
            $cierreCajaService = new CierreCajaService();
            $datos             = $cierreCajaService->calcularDatos($aperturaCaja);

            Log::info('🟦 [obtenerDatosCierre] Datos calculados correctamente');

            return response()->json([
                'success' => true,
                'data'    => [
                    // Información básica
                    'apertura_id'                 => $aperturaCaja->id,
                    'caja_nombre'                 => $aperturaCaja->caja->nombre,
                    'fecha_apertura'              => $aperturaCaja->fecha,
                    'fecha_cierre'                => $aperturaCaja->cierre?->created_at,

                    // Sumatorias de ventas
                    'sumatoria_ventas_total'      => (float) ($datos['sumatorialVentas'] ?? 0),
                    'sumatoria_ventas_efectivo'   => (float) ($datos['sumatorialVentasEfectivo'] ?? 0),
                    'sumatoria_ventas_credito'    => (float) ($datos['sumatorialVentasCredito'] ?? 0),
                    'sumatoria_ventas_anuladas'   => (float) ($datos['sumatorialVentasAnuladas'] ?? 0),

                    // Otros totales
                    'sumatoria_gastos'            => (float) ($datos['sumatorialGastos'] ?? 0),
                    'sumatoria_pagos_sueldo'      => (float) ($datos['sumatorialPagosSueldo'] ?? 0),
                    'sumatoria_anticipos'         => (float) ($datos['sumatorialAnticipos'] ?? 0),
                    'sumatoria_anulaciones'       => (float) ($datos['sumatorialAnulaciones'] ?? 0),
                    'monto_pagos_creditos'        => (float) ($datos['montoPagosCreditos'] ?? 0),

                    // Agrupaciones (para desglose)
                    'movimientos_agrupados'       => collect($datos['movimientosAgrupados'])
                        ->map(function ($items, $tipo) {
                            return [
                                'tipo'     => $tipo,
                                'total'    => (float) $items->sum('monto'),
                                'cantidad' => (int) $items->count(),
                            ];
                        })
                        ->values()
                        ->toArray(),
                    'movimientos_por_tipo_pago'   => $datos['movimientosPorTipoPago'] ?? [],
                    'ventas_por_tipo_pago'        => $datos['ventasPorTipoPago'] ?? [],
                    'ventas_por_estado'           => $datos['ventasPorEstado'] ?? [],
                    'pagos_credito_por_tipo_pago' => $datos['pagosCreditoPorTipoPago'] ?? [],
                    'gastos_por_tipo_pago'        => $datos['gastosPorTipoPago'] ?? [],

                    // Efectivo esperado
                    'efectivo_esperado'           => $datos['efectivoEsperado'] ?? [],

                    // Rangos
                    'rango_ventas_ids'            => $datos['rangoVentasIds'] ?? [],
                    'rango_creditos'              => $datos['rangoCreditos'] ?? [],
                    'rango_pagos'                 => $datos['rangoPagos'] ?? [],

                    // Totales básicos
                    'total_ingresos'              => (float) ($datos['totalIngresos'] ?? 0),
                    'total_egresos'               => (float) ($datos['totalEgresos'] ?? 0),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('🔴 [obtenerDatosCierre] ERROR', [
                'apertura_id' => $aperturaCaja->id,
                'error'       => $e->getMessage(),
                'trace'       => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error obteniendo datos de cierre',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener estado actual de cajas
     */
    public function estadoCajas()
    {
        $cajas = Caja::activas()
            ->with(['aperturas' => function ($query) {
                $query->whereDate('fecha', today())
                    ->with(['usuario', 'cierre']);
            }])
            ->get()
            ->map(function ($caja) {
                $aperturaHoy = $caja->aperturas->first();

                return [
                    'id'             => $caja->id,
                    'nombre'         => $caja->nombre,
                    'ubicacion'      => $caja->ubicacion,
                    'esta_abierta'   => $aperturaHoy && ! $aperturaHoy->cierre,
                    'usuario_actual' => $aperturaHoy?->usuario?->name,
                    'monto_apertura' => $aperturaHoy?->monto_apertura,
                    'hora_apertura'  => $aperturaHoy?->created_at?->format('H:i'),
                    'hora_cierre'    => $aperturaHoy?->cierre?->created_at?->format('H:i'),
                ];
            });

        return response()->json($cajas);
    }

    /**
     * Obtener movimientos de caja del día
     * ✅ MODIFICADO: Soporta obtener movimientos del usuario o de otro usuario (si es admin)
     */
    public function movimientosDia(Request $request, $userId = null)
    {
        $usuarioAutenticado = Auth::user();
        $usuarioDestino     = $userId ? \App\Models\User::findOrFail($userId) : $usuarioAutenticado;

        // ✅ VALIDACIÓN: Si es otro usuario, debe ser admin
        if ($userId && $usuarioDestino->id !== $usuarioAutenticado->id) {
            abort_unless(
                $usuarioAutenticado->hasRole(['admin', 'Admin', 'Super Admin']),
                403,
                'No tienes permiso para gestionar cajas de otros usuarios'
            );
        }

        $fecha = $request->get('fecha', today());

        $apertura = AperturaCaja::where('user_id', $usuarioDestino->id)
            ->whereDate('fecha', $fecha)
            ->first();

        if (! $apertura) {
            return response()->json([
                'movimientos' => [],
                'total'       => 0,
                'apertura'    => null,
            ]);
        }

        $movimientos = MovimientoCaja::where('caja_id', $apertura->caja_id)
            ->where('user_id', $usuarioDestino->id)
            ->whereDate('fecha', $fecha)
            ->with('tipoOperacion')
            ->orderBy('fecha', 'desc')
            ->get();

        return response()->json([
            'movimientos' => $movimientos,
            'total'       => $movimientos->sum('monto'),
            'apertura'    => $apertura,
        ]);
    }

    /**
     * Obtener movimientos de una apertura histórica
     *
     * Parámetros:
     * - aperturaId: ID de la AperturaCaja
     */
    public function movimientosApertura($aperturaId)
    {
        $usuarioAutenticado = Auth::user();

        // Obtener la apertura
        $apertura = AperturaCaja::findOrFail($aperturaId);

        // ✅ VALIDACIÓN: El usuario debe ser el propietario o admin
        if ($apertura->user_id !== $usuarioAutenticado->id && ! $usuarioAutenticado->hasRole(['admin', 'Admin', 'Super Admin'])) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        // Calcular fecha fin: fecha de cierre si existe, si no, ahora mismo
        $fechaFin = $apertura->cierre ? $apertura->cierre->created_at : now();

        // Obtener movimientos desde apertura hasta cierre
        $movimientos = MovimientoCaja::where('caja_id', $apertura->caja_id)
            ->where('user_id', $apertura->user_id)
            ->whereBetween('fecha', [$apertura->fecha, $fechaFin])
            ->with('tipoOperacion')
            ->orderBy('fecha', 'asc')
            ->get();

        return response()->json([
            'movimientos' => $movimientos,
            'total'       => $movimientos->sum('monto'),
            'apertura'    => $apertura,
            'count'       => $movimientos->count(),
        ]);
    }

    /**
     * Calcular monto esperado en caja
     * ✅ MODIFICADO: Acepta fecha de cierre para permitir cerrar cajas de días anteriores
     */
    /**
     * ❌ DEPRECADO: Esta función fue reemplazada por CierreCajaService::calcularEfectivoEsperado()
     *
     * El cálculo anterior era INCORRECTO porque sumaba TODOS los movimientos sin considerar:
     * - Ventas anuladas (no debería contar)
     * - Ventas a crédito sin pago (no hay dinero físico)
     * - Otros movimientos no representativos
     *
     * La nueva función en CierreCajaService solo suma el dinero REAL que debería estar en caja:
     * apertura + ventas_aprobadas_efectivo + pagos_credito_efectivo - gastos
     *
     * @deprecated Use CierreCajaService::calcularEfectivoEsperado() instead
     */
    private function calcularMontoEsperado(AperturaCaja $apertura, $fechaCierre = null): float
    {
        // Si no se proporciona fecha de cierre, usar ahora
        if (! $fechaCierre) {
            $fechaCierre = now();
        }

        // Monto inicial
        $montoEsperado = $apertura->monto_apertura;

        // ✅ NUEVO: Sumar todos los movimientos desde la apertura hasta la fecha de cierre
        // No limitar a "hoy" para permitir cerrar cajas de días anteriores
        $totalMovimientos = MovimientoCaja::where('caja_id', $apertura->caja_id)
            ->where('user_id', $apertura->user_id)
            ->whereBetween('fecha', [$apertura->fecha, $fechaCierre])
            ->sum('monto');

        return $montoEsperado + $totalMovimientos;
    }

    /**
     * ADMIN: Dashboard de todas las cajas
     */
    public function dashboard()
    {
        $cajas = Caja::with(['usuario'])->get();

        // ✅ MEJORADO: Obtener apertura más reciente de CADA CAJA (sin importar si es de hoy)
        // Esto detecta cajas abiertas desde días anteriores que aún no han sido cerradas
        $aperturasMasRecientes = AperturaCaja::with(['cierre.estadoCierre'])
            ->whereDoesntHave('cierre') // Solo aperturas SIN cierre (abiertas)
            ->orderBy('fecha', 'desc')
            ->get()
            ->groupBy('caja_id')
            ->map(fn($grupo) => $grupo->first()); // Tomar la más reciente por caja

        // ✅ NUEVO: Obtener aperturas de HOY para la tabla (pueden estar cerradas o abiertas)
        $aperturasDiarias = AperturaCaja::whereDate('fecha', today())
            ->with(['cierre.estadoCierre'])
            ->get();

        // ✅ NUEVO: Fusionar aperturas - priorizar aperturas sin cerrar
        $aperturasColleccion = $aperturasMasRecientes->union($aperturasDiarias)->unique('id');

        // ✅ NUEVO: Calcular métricas ANTES de transformar a arrays
        $cajas_abiertas = $aperturasColleccion->filter(fn($a) => ! $a->cierre)->count();

        // ✅ NUEVO: Obtener información de cierres pendientes por usuario
        $cierresPendientesPorUsuario = CierreCaja::where('estado_cierre_id', \App\Models\EstadoCierre::obtenerIdPendiente())
            ->groupBy('user_id')
            ->selectRaw('user_id, COUNT(*) as cantidad')
            ->get()
            ->keyBy('user_id');

        // ✅ NUEVO: Enriquecer cajas con información de cierres pendientes
        $cajasEnriquecidas = $cajas->map(function ($caja) use ($cierresPendientesPorUsuario) {
            $cierresPendientes = $cierresPendientesPorUsuario->get($caja->user_id);
            return [
                'id'                 => $caja->id,
                'user_id'            => $caja->user_id,
                'nombre'             => $caja->nombre,
                'ubicacion'          => $caja->ubicacion,
                'usuario'            => $caja->usuario,
                'cierres_pendientes' => $cierresPendientes ? $cierresPendientes->cantidad : 0,
            ];
        });

        // ✅ NUEVO: Transformar aperturas para incluir estado del cierre (DESPUÉS de calcular métricas)
        $aperturas_hoy = $aperturasColleccion->map(function ($apertura) {
            return [
                'id'             => $apertura->id,
                'caja_id'        => $apertura->caja_id,
                'user_id'        => $apertura->user_id,
                'monto_apertura' => $apertura->monto_apertura,
                'fecha'          => $apertura->fecha,
                'created_at'     => $apertura->created_at,
                'cierre'         => $apertura->cierre ? [
                    'id'           => $apertura->cierre->id,
                    'monto_real'   => $apertura->cierre->monto_real,
                    'diferencia'   => $apertura->cierre->diferencia,
                    'fecha_cierre' => $apertura->cierre->fecha,
                    'estado'       => $apertura->cierre->estadoCierre?->nombre,
                    'created_at'   => $apertura->cierre->created_at,
                ] : null,
            ];
        });

        $metricas = [
            'total_cajas'            => $cajas->count(),
            'cajas_abiertas'         => $cajas_abiertas,
            'total_ingresos'         => MovimientoCaja::whereDate('fecha', today())
                ->where('monto', '>', 0)
                ->sum('monto'),
            'total_egresos'          => abs(MovimientoCaja::whereDate('fecha', today())
                    ->where('monto', '<', 0)
                    ->sum('monto')),
            'diferencias_detectadas' => CierreCaja::whereDate('fecha', today())
                ->where('diferencia', '!=', 0)
                ->count(),
        ];

        return Inertia::render('Cajas/Dashboard', [
            'cajas'         => $cajasEnriquecidas->values(),
            'aperturas_hoy' => $aperturas_hoy->values(), // ✅ Convertir Collection a array
            'metricas'      => $metricas,
        ]);
    }

    /**
     * Detalle de caja de un usuario
     * ✅ MODIFICADO: Desde admin puede ver cajas de otros usuarios
     */
    public function detalle($userId)
    {
        $usuarioAutenticado = Auth::user();
        $usuarioDestino     = \App\Models\User::findOrFail($userId);

        // ✅ VALIDACIÓN: Si es otro usuario, debe ser admin
        if ($usuarioDestino->id !== $usuarioAutenticado->id) {
            abort_unless(
                $usuarioAutenticado->hasRole(['admin', 'Admin', 'Super Admin']),
                403,
                'No tienes permiso para ver cajas de otros usuarios'
            );
        }

        // Obtener cajas del usuario
        $cajas = Caja::where('user_id', $usuarioDestino->id)
            ->activas()
            ->get();

        // Obtener aperturas del usuario
        $aperturas = AperturaCaja::where('user_id', $usuarioDestino->id)
            ->with(['caja', 'cierre'])
            ->orderBy('fecha', 'desc')
            ->limit(30)
            ->get();

        // Obtener movimientos hoy del usuario
        $movimientosHoy = MovimientoCaja::where('user_id', $usuarioDestino->id)
            ->whereDate('fecha', today())
            ->with(['tipoOperacion', 'tipoPago', 'caja', 'usuario', 'venta' => function($q) {
                $q->select('id', 'numero', 'estado_documento_id', 'tipo_entrega'); // ✅ Cargar tipo_entrega
            }, 'venta.estadoDocumento']) // ✅ Cargar estado_documento con venta
            ->orderBy('id', 'desc')  // ✅ ACTUALIZADO: Ordenar por ID descendente
            ->get()
            // ✅ NUEVO: Filtrar movimientos - Excluir CREDITO si no están APROBADOS
            ->filter(function($mov) {
                // Si es VENTA o CREDITO, solo incluir si están APROBADAS
                if (in_array($mov->tipoOperacion?->codigo, ['VENTA', 'CREDITO'])) {
                    return $mov->venta?->estadoDocumento?->codigo === 'APROBADO';
                }
                // Otros tipos (PAGO, GASTOS, etc.) se incluyen siempre
                return true;
            })
            ->values(); // ✅ Reindexar array después de filter

        return Inertia::render('Cajas/Detalle', [
            'usuario'        => $usuarioDestino,
            'cajas'          => $cajas,
            'aperturas'      => $aperturas,
            'movimientosHoy' => $movimientosHoy,
        ]);
    }

    /**
     * ADMIN: Reportes de cajas
     */
    public function reportes(Request $request)
    {
        $fecha_inicio = $request->get('fecha_inicio', today()->subDays(30)->toDateString());
        $fecha_fin    = $request->get('fecha_fin', today()->toDateString());

        // Obtener discrepancias en el período
        $discrepancias = CierreCaja::whereBetween('fecha', [$fecha_inicio, $fecha_fin])
            ->with(['apertura.usuario', 'apertura.caja'])
            ->where('diferencia', '!=', 0)
            ->orderBy('fecha', 'desc')
            ->get()
            ->map(function ($cierre) {
                return [
                    'id'             => $cierre->id,
                    'caja_id'        => $cierre->apertura->caja_id,
                    'usuario'        => $cierre->apertura->usuario->name,
                    'fecha'          => $cierre->fecha,
                    'monto_apertura' => $cierre->apertura->monto_apertura,
                    'monto_cierre'   => $cierre->monto_real,
                    'diferencia'     => $cierre->diferencia,
                    'observaciones'  => $cierre->observaciones,
                ];
            });

        // Resumen diario por usuario
        $resumen_diario = CierreCaja::whereBetween('fecha', [$fecha_inicio, $fecha_fin])
            ->with(['apertura.usuario'])
            ->get()
            ->groupBy(function ($item) {
                return $item->apertura->usuario->id . '-' . $item->fecha->format('Y-m-d');
            })
            ->map(function ($grupo) {
                $primer = $grupo->first();
                return [
                    'fecha'            => $primer->fecha->format('Y-m-d'),
                    'usuario'          => $primer->apertura->usuario->name,
                    'total_apertura'   => $grupo->sum('apertura.monto_apertura'),
                    'total_ingresos'   => $grupo->sum('monto_real'),
                    'total_egresos'    => 0,
                    'diferencia_total' => $grupo->sum('diferencia'),
                ];
            });

        $estadisticas = [
            'total_discrepancias'           => $discrepancias->count(),
            'discrepancias_positivas'       => $discrepancias->filter(fn($d) => $d['diferencia'] > 0)->count(),
            'discrepancias_negativas'       => $discrepancias->filter(fn($d) => $d['diferencia'] < 0)->count(),
            'diferencia_total'              => $discrepancias->sum('diferencia'),
            'promedio_discrepancia'         => $discrepancias->count() > 0 ? $discrepancias->sum('diferencia') / $discrepancias->count() : 0,
            'usuario_con_mas_discrepancias' => $discrepancias->groupBy('usuario')
                ->map(fn($g) => $g->count())
                ->max() ? key($discrepancias->groupBy('usuario')
                    ->map(fn($g) => $g->count())
                    ->toArray()) : 'N/A',
        ];

        return Inertia::render('Cajas/Reportes', [
            'discrepancias'  => $discrepancias,
            'resumen_diario' => $resumen_diario->values(),
            'estadisticas'   => $estadisticas,
            'fecha_inicio'   => $fecha_inicio,
            'fecha_fin'      => $fecha_fin,
        ]);
    }

    /**
     * Corregir un cierre de caja rechazado
     */
    public function corregirCierre(Request $request, $id)
    {
        $request->validate([
            'monto_real'    => 'required|numeric|min:0',
            'observaciones' => 'nullable|string|max:500',
        ]);

        $user   = Auth::user();
        $cierre = CierreCaja::findOrFail($id);

        // Verificar que el usuario sea el dueño del cierre
        if ($cierre->user_id !== $user->id) {
            return back()->withErrors([
                'cierre' => 'No estás autorizado para corregir este cierre.',
            ]);
        }

        // Verificar que el cierre esté en estado RECHAZADA
        if ($cierre->estado !== CierreCaja::RECHAZADA) {
            return back()->withErrors([
                'cierre' => 'Solo puedes corregir cierres rechazados.',
            ]);
        }

        if ($cierre->corregir($user, $request->monto_real, $request->observaciones)) {
            return back()->with('success', 'Cierre corregido exitosamente. Pendiente de nueva verificación.');
        }

        return back()->withErrors([
            'cierre' => 'Error al corregir el cierre. Intenta nuevamente.',
        ]);
    }

    /**
     * ADMIN: Consolidar caja de un usuario
     * ✅ NUEVO: Cierra todos los cierres pendientes de un usuario y genera un resumen
     */
    public function consolidarCaja(Request $request, $userId)
    {
        $usuarioAutenticado = Auth::user();
        $usuarioDestino     = \App\Models\User::findOrFail($userId);

        // ✅ VALIDACIÓN: Solo admin/super-admin puede consolidar cajas
        abort_unless(
            $usuarioAutenticado->hasRole(['admin', 'Admin', 'Super Admin']),
            403,
            'No tienes permiso para consolidar cajas'
        );

        try {
            DB::beginTransaction();

            // Obtener todos los cierres pendientes del usuario con todas las relaciones
            $cierresPendientes = CierreCaja::where('user_id', $usuarioDestino->id)
                ->where('estado_cierre_id', \App\Models\EstadoCierre::obtenerIdPendiente())
                ->with(['apertura', 'caja', 'estadoCierre', 'verificador'])
                ->get();

            if ($cierresPendientes->isEmpty()) {
                return back()->withErrors([
                    'cierre' => 'No hay cierres pendientes para consolidar.',
                ]);
            }

            $totalMontoEsperado = 0;
            $totalMontoReal     = 0;
            $totalDiferencia    = 0;
            $estadoConsolidada  = \App\Models\EstadoCierre::obtenerIdConsolidada();

            // Procesar cada cierre pendiente
            foreach ($cierresPendientes as $cierre) {
                $totalMontoEsperado += $cierre->monto_esperado;
                $totalMontoReal     += $cierre->monto_real;
                $totalDiferencia    += $cierre->diferencia;

                // Cambiar estado a CONSOLIDADA
                $cierre->update([
                    'estado_cierre_id' => $estadoConsolidada,
                    'fecha_aprobacion' => now(),
                ]);

                Log::info('Cierre aprobado en consolidación', [
                    'cierre_id'    => $cierre->id,
                    'usuario_id'   => $usuarioDestino->id,
                    'aprobado_por' => $usuarioAutenticado->id,
                ]);
            }

            DB::commit();

            Log::info('Cajas consolidadas exitosamente', [
                'usuario_id'         => $usuarioDestino->id,
                'cierres_procesados' => $cierresPendientes->count(),
                'monto_total'        => $totalMontoReal,
                'diferencia_total'   => $totalDiferencia,
                'consolidado_por'    => $usuarioAutenticado->id,
            ]);

            $mensaje = "✅ Cajas consolidadas exitosamente\n{$cierresPendientes->count()} cierre(s) consolidado(s)\nDiferencia total: " . number_format($totalDiferencia, 2) . ' Bs.';

            return back()->with('success', $mensaje);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error consolidando cajas: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id'   => $usuarioDestino->id,
            ]);

            return back()->withErrors([
                'cierre' => $e->getMessage() ?: 'Error al consolidar cajas. Intenta nuevamente.',
            ]);
        }
    }

    /**
     * ✅ NUEVO: Cierre Diario General Manual - Con Consolidación Automática (JSON)
     *
     * Versión que retorna JSON para uso con Inertia Router
     * Cierra TODAS las cajas activas que tengan aperturas sin cierre
     * (incluyendo las abiertas desde días anteriores)
     * Y las consolida automáticamente sin intervención manual
     *
     * Flujo:
     * 1. Obtiene todas las cajas con activa=true
     * 2. Para cada caja, busca aperturas sin cierre
     * 3. Crea CierreCaja en estado PENDIENTE
     * 4. Inmediatamente los consolida (→ CONSOLIDADA)
     * 5. Registra auditoría de toda la operación
     * 6. Retorna reporte en props de Inertia
     *
     * Solo admins pueden ejecutar
     * Endpoint: POST /cajas/admin/cierre-diario-json
     */
    public function cierreDiarioGeneralJson(Request $request)
    {
        $usuarioAutenticado = Auth::user();

        // ✅ VALIDACIÓN: Solo admin/super-admin puede hacer cierre general
        if (! $usuarioAutenticado->hasRole(['admin', 'Admin', 'Super Admin'])) {
            return back()->withErrors([
                'cierre' => 'No tienes permiso para realizar el cierre diario general',
            ]);
        }

        try {
            DB::beginTransaction();

            $reporte = [
                'fecha_ejecucion'              => now(),
                'ejecutado_por'                => $usuarioAutenticado->name,
                'cajas_procesadas'             => [],
                'cajas_sin_apertura_abierta'   => [],
                'total_cajas_cerradas'         => 0,
                'total_cajas_con_discrepancia' => 0,
                'total_diferencias'            => 0,
                'total_monto_esperado'         => 0,
                'total_monto_real'             => 0,
                'errores'                      => [],
            ];

            // Obtener todas las cajas activas
            $cajasActivas = Caja::where('activa', true)
                ->with(['usuario', 'aperturas'])
                ->get();

            // Procesar cada caja
            foreach ($cajasActivas as $caja) {
                try {
                    // Buscar aperturas sin cierre (incluyendo días anteriores)
                    $aperturasAbiertas = AperturaCaja::where('caja_id', $caja->id)
                        ->whereDoesntHave('cierre')
                        ->orderBy('fecha', 'asc')
                        ->get();

                    if ($aperturasAbiertas->isEmpty()) {
                        $reporte['cajas_sin_apertura_abierta'][] = [
                            'caja_id'     => $caja->id,
                            'caja_nombre' => $caja->nombre,
                            'usuario'     => $caja->usuario->name ?? 'Sin asignar',
                            'razon'       => 'No hay aperturas sin cierre',
                        ];
                        continue;
                    }

                    // Procesar cada apertura abierta
                    foreach ($aperturasAbiertas as $apertura) {
                        // ✅ Usar CierreCajaService para calcular monto esperado (dinero REAL en caja)
                        $cierreCajaService = new CierreCajaService();
                        $datosCalculados = $cierreCajaService->calcularDatos($apertura);
                        $montoEsperado = $datosCalculados['efectivoEsperado']['total'] ?? 0;

                        // El monto real será igual al esperado (sin diferencias)
                        $montoReal  = $montoEsperado;
                        $diferencia = 0;

                        // Obtener estado PENDIENTE
                        $estadoPendiente = EstadoCierre::obtenerIdPendiente();

                        // Crear cierre de caja
                        $cierre = CierreCaja::create([
                            'caja_id'          => $caja->id,
                            'user_id'          => $apertura->user_id,
                            'apertura_caja_id' => $apertura->id,
                            'fecha'            => now(),
                            'monto_esperado'   => $montoEsperado,
                            'monto_real'       => $montoReal,
                            'diferencia'       => $diferencia,
                            'observaciones'    => 'Cierre automático diario general',
                            'estado_cierre_id' => $estadoPendiente,
                        ]);

                        // ✅ INMEDIATAMENTE consolidar el cierre (Opción B)
                        $cierre->consolidar($usuarioAutenticado, 'Consolidado automáticamente en cierre diario general');

                        // Registrar auditoría
                        AuditoriaCaja::create([
                            'user_id'             => $usuarioAutenticado->id,
                            'caja_id'             => $caja->id,
                            'apertura_caja_id'    => $apertura->id,
                            'accion'              => 'CIERRE_DIARIO_GENERAL',
                            'operacion_intentada' => 'POST /cajas/admin/cierre-diario-json',
                            'exitosa'             => true,
                            'detalle_operacion'   => [
                                'monto_esperado' => (float) $montoEsperado,
                                'monto_real'     => (float) $montoReal,
                                'diferencia'     => (float) $diferencia,
                                'tipo_cierre'    => 'AUTOMÁTICO_CONSOLIDADO',
                            ],
                            'ip_address'          => $request->ip(),
                            'user_agent'          => $request->userAgent(),
                        ]);

                        // Agregar al reporte
                        $reporte['cajas_procesadas'][] = [
                            'caja_id'        => $caja->id,
                            'caja_nombre'    => $caja->nombre,
                            'usuario'        => $apertura->usuario->name ?? 'Sin asignar',
                            'apertura_fecha' => $apertura->fecha->format('Y-m-d H:i:s'),
                            'monto_esperado' => (float) $montoEsperado,
                            'monto_real'     => (float) $montoReal,
                            'diferencia'     => (float) $diferencia,
                            'estado'         => 'CONSOLIDADA',
                        ];

                        $reporte['total_cajas_cerradas']++;
                        $reporte['total_monto_esperado'] += $montoEsperado;
                        $reporte['total_monto_real']     += $montoReal;
                        $reporte['total_diferencias']    += $diferencia;

                        if ($diferencia != 0) {
                            $reporte['total_cajas_con_discrepancia']++;
                        }
                    }

                } catch (\Exception $e) {
                    $reporte['errores'][] = [
                        'caja_id'     => $caja->id,
                        'caja_nombre' => $caja->nombre,
                        'error'       => $e->getMessage(),
                    ];
                    Log::error('Error en cierre diario general para caja', [
                        'caja_id' => $caja->id,
                        'error'   => $e->getMessage(),
                    ]);
                }
            }

            DB::commit();

            // ✅ Guardar historial del cierre diario general
            CierreDiarioGeneral::crearDelReporte($usuarioAutenticado, $reporte, $request);

            // Log final
            Log::info('Cierre diario general ejecutado exitosamente', [
                'ejecutado_por'     => $usuarioAutenticado->id,
                'cajas_cerradas'    => $reporte['total_cajas_cerradas'],
                'total_diferencias' => $reporte['total_diferencias'],
            ]);

            // Retornar con Inertia (transmite el reporte en props)
            return back()->with('cierre_reporte', $reporte);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error en cierre diario general: ' . $e->getMessage(), [
                'exception'  => $e,
                'usuario_id' => $usuarioAutenticado->id,
            ]);

            return back()->withErrors([
                'cierre' => 'Error al ejecutar cierre diario general. ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * ✅ NUEVO: Cierre Diario General Manual - Con Consolidación Automática
     *
     * Cierra TODAS las cajas activas que tengan aperturas sin cierre
     * (incluyendo las abiertas desde días anteriores)
     * Y las consolida automáticamente sin intervención manual
     *
     * Flujo:
     * 1. Obtiene todas las cajas con activa=true
     * 2. Para cada caja, busca aperturas sin cierre
     * 3. Crea CierreCaja en estado PENDIENTE
     * 4. Inmediatamente los consolida (→ CONSOLIDADA)
     * 5. Registra auditoría de toda la operación
     * 6. Retorna reporte detallado
     *
     * Solo admins pueden ejecutar
     * Endpoint: POST /cajas/admin/cierre-diario
     */
    public function cierreDiarioGeneral(Request $request)
    {
        $usuarioAutenticado = Auth::user();

        // ✅ VALIDACIÓN: Solo admin/super-admin puede hacer cierre general
        abort_unless(
            $usuarioAutenticado->hasRole(['admin', 'Admin', 'Super Admin']),
            403,
            'No tienes permiso para realizar el cierre diario general'
        );

        try {
            DB::beginTransaction();

            $reporte = [
                'fecha_ejecucion'              => now(),
                'ejecutado_por'                => $usuarioAutenticado->name,
                'cajas_procesadas'             => [],
                'cajas_sin_apertura_abierta'   => [],
                'total_cajas_cerradas'         => 0,
                'total_cajas_con_discrepancia' => 0,
                'total_diferencias'            => 0,
                'total_monto_esperado'         => 0,
                'total_monto_real'             => 0,
                'errores'                      => [],
            ];

            // Obtener todas las cajas activas
            $cajasActivas = Caja::where('activa', true)
                ->with(['usuario', 'aperturas'])
                ->get();

            // Procesar cada caja
            foreach ($cajasActivas as $caja) {
                try {
                    // Buscar aperturas sin cierre (incluyendo días anteriores)
                    $aperturasAbiertas = AperturaCaja::where('caja_id', $caja->id)
                        ->whereDoesntHave('cierre')
                        ->orderBy('fecha', 'asc')
                        ->get();

                    if ($aperturasAbiertas->isEmpty()) {
                        $reporte['cajas_sin_apertura_abierta'][] = [
                            'caja_id'     => $caja->id,
                            'caja_nombre' => $caja->nombre,
                            'usuario'     => $caja->usuario->name ?? 'Sin asignar',
                            'razon'       => 'No hay aperturas sin cierre',
                        ];
                        continue;
                    }

                    // Procesar cada apertura abierta
                    foreach ($aperturasAbiertas as $apertura) {
                        // ✅ Usar CierreCajaService para calcular monto esperado (dinero REAL en caja)
                        $cierreCajaService = new CierreCajaService();
                        $datosCalculados = $cierreCajaService->calcularDatos($apertura);
                        $montoEsperado = $datosCalculados['efectivoEsperado']['total'] ?? 0;

                        // El monto real será igual al esperado (sin diferencias)
                        $montoReal  = $montoEsperado;
                        $diferencia = 0;

                        // Obtener estado PENDIENTE
                        $estadoPendiente = EstadoCierre::obtenerIdPendiente();

                        // Crear cierre de caja
                        $cierre = CierreCaja::create([
                            'caja_id'          => $caja->id,
                            'user_id'          => $apertura->user_id,
                            'apertura_caja_id' => $apertura->id,
                            'fecha'            => now(),
                            'monto_esperado'   => $montoEsperado,
                            'monto_real'       => $montoReal,
                            'diferencia'       => $diferencia,
                            'observaciones'    => 'Cierre automático diario general',
                            'estado_cierre_id' => $estadoPendiente,
                        ]);

                        // ✅ INMEDIATAMENTE consolidar el cierre (Opción B)
                        $cierre->consolidar($usuarioAutenticado, 'Consolidado automáticamente en cierre diario general');

                        // Registrar auditoría
                        AuditoriaCaja::create([
                            'user_id'             => $usuarioAutenticado->id,
                            'caja_id'             => $caja->id,
                            'apertura_caja_id'    => $apertura->id,
                            'accion'              => 'CIERRE_DIARIO_GENERAL',
                            'operacion_intentada' => 'POST /cajas/admin/cierre-diario',
                            'exitosa'             => true,
                            'detalle_operacion'   => [
                                'monto_esperado' => (float) $montoEsperado,
                                'monto_real'     => (float) $montoReal,
                                'diferencia'     => (float) $diferencia,
                                'tipo_cierre'    => 'AUTOMÁTICO_CONSOLIDADO',
                            ],
                            'ip_address'          => $request->ip(),
                            'user_agent'          => $request->userAgent(),
                        ]);

                        // Agregar al reporte
                        $reporte['cajas_procesadas'][] = [
                            'caja_id'        => $caja->id,
                            'caja_nombre'    => $caja->nombre,
                            'usuario'        => $apertura->usuario->name ?? 'Sin asignar',
                            'apertura_fecha' => $apertura->fecha->format('Y-m-d H:i:s'),
                            'monto_esperado' => (float) $montoEsperado,
                            'monto_real'     => (float) $montoReal,
                            'diferencia'     => (float) $diferencia,
                            'estado'         => 'CONSOLIDADA',
                        ];

                        $reporte['total_cajas_cerradas']++;
                        $reporte['total_monto_esperado'] += $montoEsperado;
                        $reporte['total_monto_real']     += $montoReal;
                        $reporte['total_diferencias']    += $diferencia;

                        if ($diferencia != 0) {
                            $reporte['total_cajas_con_discrepancia']++;
                        }
                    }

                } catch (\Exception $e) {
                    $reporte['errores'][] = [
                        'caja_id'     => $caja->id,
                        'caja_nombre' => $caja->nombre,
                        'error'       => $e->getMessage(),
                    ];
                    Log::error('Error en cierre diario general para caja', [
                        'caja_id' => $caja->id,
                        'error'   => $e->getMessage(),
                    ]);
                }
            }

            DB::commit();

            // Log final
            Log::info('Cierre diario general ejecutado exitosamente', [
                'ejecutado_por'     => $usuarioAutenticado->id,
                'cajas_cerradas'    => $reporte['total_cajas_cerradas'],
                'total_diferencias' => $reporte['total_diferencias'],
            ]);

            $mensaje = "✅ Cierre diario general completado\n" .
            $reporte['total_cajas_cerradas'] . " caja(s) cerrada(s) y consolidada(s)\n" .
            "Diferencia total: " . number_format($reporte['total_diferencias'], 2) . " Bs.";

            return back()->with('success', $mensaje)
                ->with('reporte_cierre', $reporte);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error en cierre diario general: ' . $e->getMessage(), [
                'exception'  => $e,
                'usuario_id' => $usuarioAutenticado->id,
            ]);

            return back()->withErrors([
                'cierre' => 'Error al ejecutar cierre diario general. ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Registrar movimiento genérico de caja
     * Soporta GASTOS, COMPRA, AJUSTE y otros tipos
     */
    public function registrarMovimiento(Request $request)
    {
        $request->validate([
            'tipo_operacion_id' => 'required|exists:tipo_operacion_caja,id',
            'tipo_pago_id'      => 'nullable|exists:tipos_pago,id',
            'monto'             => 'required|numeric|min:0.01',
            'numero_documento'  => 'nullable|string|max:50',
            'categoria'         => 'nullable|in:TRANSPORTE,LIMPIEZA,MANTENIMIENTO,SERVICIOS,VARIOS,SUELDO,BONO,COMISIÓN,LIQUIDACIÓN,ADELANTO,PRÉSTAMO,OTROS',
            'observaciones'     => 'nullable|string|max:500',
            'comprobante'       => 'nullable|file|mimes:jpeg,png,webp,pdf|max:10240', // 10MB
        ]);

        try {
            DB::beginTransaction();

            $user = Auth::user();

            // Verificar que hay caja abierta
            $cajaAbierta = AperturaCaja::where('user_id', $user->id)
                ->whereDoesntHave('cierre')
                ->latest('fecha')
                ->first();

            if (! $cajaAbierta) {
                return back()->withErrors([
                    'caja' => 'Debe tener una caja abierta para registrar movimientos',
                ]);
            }

            $tipoOperacion = TipoOperacionCaja::findOrFail($request->tipo_operacion_id);

            // ✅ Determinar el signo del monto según el tipo de operación
            $monto = $request->monto;
            if (in_array($tipoOperacion->codigo, ['GASTOS', 'COMPRA', 'PAGO_SUELDO', 'ANTICIPO', 'ANULACION'])) {
                $monto = -abs($monto); // Egresos son negativos
            } else {
                $monto = abs($monto); // Ingresos son positivos
            }

            // ✅ Construir observaciones con categoría según tipo de operación
            $observaciones = $request->observaciones ?? '';
            if (in_array($tipoOperacion->codigo, ['GASTOS', 'PAGO_SUELDO', 'ANTICIPO']) && $request->categoria) {
                $observaciones = "[{$request->categoria}] {$observaciones}";
            }

            // Crear movimiento
            $movimiento = MovimientoCaja::create([
                'caja_id'           => $cajaAbierta->caja_id,
                'tipo_operacion_id' => $request->tipo_operacion_id,
                'tipo_pago_id'      => $request->tipo_pago_id,
                'numero_documento'  => $request->numero_documento,
                'descripcion'       => $tipoOperacion->nombre,
                'monto'             => $monto,
                'fecha'             => now(),
                'user_id'           => $user->id,
                'observaciones'     => $observaciones,
            ]);

            // Guardar comprobante si se proporcionó
            if ($request->hasFile('comprobante')) {
                $archivo = $request->file('comprobante');
                $hash    = hash_file('sha256', $archivo->getRealPath());

                // Crear ruta del archivo: comprobantes/YYYY/MM/DD/hash.extension
                $directorio    = 'comprobantes/' . now()->format('Y/m/d');
                $nombreArchivo = $hash . '.' . $archivo->getClientOriginalExtension();

                // Guardar archivo
                $ruta = Storage::disk('public')->putFileAs($directorio, $archivo, $nombreArchivo);

                // Crear registro de comprobante
                ComprobanteMovimiento::create([
                    'movimiento_caja_id' => $movimiento->id,
                    'user_id'            => $user->id,
                    'ruta_archivo'       => $ruta,
                    'nombre_original'    => $archivo->getClientOriginalName(),
                    'tipo_archivo'       => $archivo->getClientMimeType(),
                    'tamaño'             => $archivo->getSize(),
                    'hash'               => $hash,
                ]);

                Log::info("✅ Comprobante guardado", [
                    'movimiento_id' => $movimiento->id,
                    'archivo'       => $nombreArchivo,
                    'tamaño'        => $archivo->getSize(),
                ]);
            }

            DB::commit();

            Log::info("✅ Movimiento registrado", [
                'movimiento_id'   => $movimiento->id,
                'tipo'            => $tipoOperacion->codigo,
                'monto'           => $monto,
                'usuario'         => $user->name,
                'con_comprobante' => $request->hasFile('comprobante'),
            ]);

            // ✅ NUEVO: Retornar con el ID del movimiento en la URL para capturarlo en el frontend
            return back()
                ->with('success', "Movimiento de {$tipoOperacion->nombre} registrado correctamente")
                ->with('movimiento_id', $movimiento->id); // ✅ Pasar ID del movimiento

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("❌ Error registrando movimiento: " . $e->getMessage());
            return back()->withErrors([
                'error' => 'Error al registrar movimiento: ' . $e->getMessage(),
            ])->withInput();
        }
    }

    /**
     * ✅ NUEVO: Registrar movimiento (versión JSON para impresión inmediata)
     * POST /cajas/movimientos-json
     */
    public function registrarMovimientoJson(Request $request)
    {
        $request->validate([
            'tipo_operacion_id' => 'required|exists:tipo_operacion_caja,id',
            'tipo_pago_id'      => 'nullable|exists:tipos_pago,id',
            'monto'             => 'required|numeric|min:0.01',
            'numero_documento'  => 'nullable|string|max:50',
            'categoria'         => 'nullable|in:TRANSPORTE,LIMPIEZA,MANTENIMIENTO,SERVICIOS,ALIMENTACION_DESAYUNO,ALIMENTACION_ALMUERZO,ALIMENTACION_CENA,ALIMENTACION_REFRIGERIO,ALIMENTACION_OTROS,VARIOS,SUELDO,BONO,COMISIÓN,LIQUIDACIÓN,ADELANTO,PRÉSTAMO,OTROS',
            'observaciones'     => 'nullable|string|max:500',
            'comprobante'       => 'nullable|file|mimes:jpeg,png,webp,pdf|max:10240', // 10MB
        ]);

        try {
            DB::beginTransaction();

            $user = Auth::user();

            // Verificar que hay caja abierta
            $cajaAbierta = AperturaCaja::where('user_id', $user->id)
                ->whereDoesntHave('cierre')
                ->latest('fecha')
                ->first();

            if (! $cajaAbierta) {
                return response()->json([
                    'success' => false,
                    'message' => 'Debe tener una caja abierta para registrar movimientos',
                ], 400);
            }

            $tipoOperacion = TipoOperacionCaja::findOrFail($request->tipo_operacion_id);

            // ✅ Determinar el signo del monto según el tipo de operación
            $monto = $request->monto;
            if (in_array($tipoOperacion->codigo, ['GASTOS', 'COMPRA', 'PAGO_SUELDO', 'ANTICIPO', 'ANULACION'])) {
                $monto = -abs($monto); // Egresos son negativos
            } else {
                $monto = abs($monto); // Ingresos son positivos
            }

            // ✅ Construir observaciones con categoría según tipo de operación
            $observaciones = $request->observaciones ?? '';
            if (in_array($tipoOperacion->codigo, ['GASTOS', 'PAGO_SUELDO', 'ANTICIPO']) && $request->categoria) {
                $observaciones = "[{$request->categoria}] {$observaciones}";
            }

            // Crear movimiento
            $movimiento = MovimientoCaja::create([
                'caja_id'           => $cajaAbierta->caja_id,
                'tipo_operacion_id' => $request->tipo_operacion_id,
                'tipo_pago_id'      => $request->tipo_pago_id,
                'numero_documento'  => $request->numero_documento,
                'descripcion'       => $tipoOperacion->nombre,
                'monto'             => $monto,
                'fecha'             => now(),
                'user_id'           => $user->id,
                'observaciones'     => $observaciones,
            ]);

            // Guardar comprobante si se proporcionó
            if ($request->hasFile('comprobante')) {
                $archivo = $request->file('comprobante');
                $hash    = hash_file('sha256', $archivo->getRealPath());
                $directorio    = 'comprobantes/' . now()->format('Y/m/d');
                $nombreArchivo = $hash . '.' . $archivo->getClientOriginalExtension();
                $ruta = Storage::disk('public')->putFileAs($directorio, $archivo, $nombreArchivo);

                ComprobanteMovimiento::create([
                    'movimiento_caja_id' => $movimiento->id,
                    'user_id'            => $user->id,
                    'ruta_archivo'       => $ruta,
                    'nombre_original'    => $archivo->getClientOriginalName(),
                    'tipo_archivo'       => $archivo->getClientMimeType(),
                    'tamaño'             => $archivo->getSize(),
                    'hash'               => $hash,
                ]);
            }

            DB::commit();

            Log::info("✅ Movimiento registrado (JSON)", [
                'movimiento_id'   => $movimiento->id,
                'tipo'            => $tipoOperacion->codigo,
                'monto'           => $monto,
                'usuario'         => $user->name,
            ]);

            // ✅ NUEVO: Retornar JSON con el ID del movimiento para impresión inmediata
            return response()->json([
                'success'       => true,
                'message'       => "Movimiento de {$tipoOperacion->nombre} registrado correctamente",
                'movimiento_id' => $movimiento->id,
                'tipo_operacion' => [
                    'id'     => $tipoOperacion->id,
                    'nombre' => $tipoOperacion->nombre,
                    'codigo' => $tipoOperacion->codigo,
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("❌ Error registrando movimiento (JSON): " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar movimiento: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Imprimir cierre de caja en diferentes formatos
     *
     * ✅ NUEVO: Genera impresión de cierre de caja
     * - Formatos: A4, TICKET_58, TICKET_80
     * - Acciones: download (PDF), stream (vista previa)
     */
    public function imprimirCierre(AperturaCaja $aperturaCaja, Request $request)
    {
        $this->authorize('cajas.cerrar');

        $formato = $request->query('formato', 'TICKET_80');
        $accion  = $request->query('accion', 'stream');
        $fuente  = $request->query('fuente', 'consolas');

        // Validar que la caja tenga cierre
        if (! $aperturaCaja->cierre) {
            return back()->withErrors(['error' => 'Esta caja aún no ha sido cerrada']);
        }

        // ✅ Usar CierreCajaService para obtener TODOS los datos calculados
        $cierreCajaService = new CierreCajaService();
        $datos             = $cierreCajaService->calcularDatos($aperturaCaja);

        // Usar ImpresionService para generar el PDF
        $impresionService = app(\App\Services\ImpresionService::class);
        $pdf              = $impresionService->generarPDF('cierre_caja', $datos, $formato, ['fuente' => $fuente]);

        if ($accion === 'stream') {
            return $pdf->stream();
        }

        return $pdf->download('cierre-caja-' . $aperturaCaja->id . '.pdf');
    }

    /**
     * ✅ NUEVO: Exportar cierre de caja a Excel
     * - GET /cajas/{aperturaCaja}/cierre/exportar-excel
     */
    public function exportarExcelCierre(AperturaCaja $aperturaCaja)
    {
        $this->authorize('cajas.cerrar');

        \Log::info('📊 [CajaController::exportarExcelCierre] Exportando cierre de caja a Excel', [
            'apertura_id' => $aperturaCaja->id,
            'caja_id'     => $aperturaCaja->caja_id,
            'user_id'     => auth()->id(),
        ]);

        try {
            // Validar que la caja tenga cierre
            if (!$aperturaCaja->cierre) {
                return back()->withErrors(['error' => 'Esta caja aún no ha sido cerrada']);
            }

            // Usar CierreCajaService para obtener todos los datos
            $cierreCajaService = new CierreCajaService();
            $datos = $cierreCajaService->calcularDatos($aperturaCaja);

            // Obtener usuario
            $usuario = $aperturaCaja->usuario ?? auth()->user();

            // Preparar datos para Excel
            $datosExcel = [
                'apertura' => $aperturaCaja,
                'cierre' => $aperturaCaja->cierre,
                'usuario' => $usuario,
                'caja' => $aperturaCaja->caja,
                'datos' => $datos,
            ];

            // Usar ExcelExportService para generar el archivo
            $excelFile = $this->excelExportService->exportarCierreCaja($datosExcel);

            return $excelFile ?? back()->with('error', 'Error al generar archivo Excel');
        } catch (\Exception $e) {
            \Log::error('❌ [CajaController::exportarExcelCierre] Error', [
                'error'        => $e->getMessage(),
                'apertura_id'  => $aperturaCaja->id,
                'trace'        => $e->getTraceAsString(),
            ]);
            return back()->with('error', 'Error al generar Excel: ' . $e->getMessage());
        }
    }

    /**
     * Imprimir movimientos del día en formato A4
     *
     * ✅ NUEVO: Genera reporte de movimientos del día
     * - Formato: A4
     * - Acciones: download (PDF), stream (vista previa)
     */
    public function imprimirMovimientos(AperturaCaja $aperturaCaja, Request $request)
    {
        $this->authorize('cajas.transacciones');

        $formato = $request->query('formato', 'A4');
        $accion  = $request->query('accion', 'download');
        $fuente  = $request->query('fuente', 'consolas');

        // Obtener movimientos
        $movimientos = MovimientoCaja::where('caja_id', $aperturaCaja->caja_id)
            ->where('fecha', '>=', $aperturaCaja->fecha)
            ->when($aperturaCaja->cierre, function ($query) use ($aperturaCaja) {
                return $query->where('fecha', '<=', $aperturaCaja->cierre->created_at);
            })
            ->with(['tipoOperacion', 'comprobantes'])
            ->orderBy('fecha', 'asc')
            ->get();

        // Agrupar por tipo
        $movimientosAgrupados = $movimientos->groupBy(function ($mov) {
            return $mov->tipoOperacion->nombre;
        });

        // Calcular totales
        $totalDia      = $movimientos->sum('monto');
        $totalIngresos = $movimientos->where('monto', '>', 0)->sum('monto');
        $totalEgresos  = abs($movimientos->where('monto', '<', 0)->sum('monto'));

        // Preparar datos para el servicio
        $datos = [
            'apertura'             => $aperturaCaja,
            'movimientos'          => $movimientos,
            'movimientosAgrupados' => $movimientosAgrupados,
            'totalDia'             => $totalDia,
            'totalIngresos'        => $totalIngresos,
            'totalEgresos'         => $totalEgresos,
        ];

        // Usar ImpresionService para generar el PDF
        $impresionService = app(\App\Services\ImpresionService::class);
        $pdf              = $impresionService->generarPDF('movimientos_caja', $datos, $formato, ['fuente' => $fuente]);

        if ($accion === 'stream') {
            return $pdf->stream();
        }

        return $pdf->download('movimientos-caja-' . $aperturaCaja->id . '.pdf');
    }

    /**
     * Exportar caja a Excel con formato profesional
     * GET /cajas/{caja}/movimientos/exportar-excel
     */
    public function exportarExcel(Caja $caja)
    {
        Log::info('📊 [CajaController::exportarExcel] Exportando caja a Excel', [
            'caja_id' => $caja->id,
            'user_id' => auth()->id(),
        ]);

        try {
            return $this->excelExportService->exportarCaja($caja);
        } catch (\Exception $e) {
            Log::error('❌ [CajaController::exportarExcel] Error', [
                'error'   => $e->getMessage(),
                'caja_id' => $caja->id,
            ]);
            return back()->with('error', 'Error al generar Excel: ' . $e->getMessage());
        }
    }

    /**
     * Exportar caja a PDF
     * GET /cajas/{caja}/movimientos/exportar-pdf
     */
    public function exportarPdf(Caja $caja, Request $request)
    {
        Log::info('📄 [CajaController::exportarPdf] Exportando caja a PDF', [
            'caja_id' => $caja->id,
            'user_id' => auth()->id(),
        ]);

        $formato = $request->input('formato', 'A4');

        try {
            // Buscar la apertura de caja
            $aperturaCaja = AperturaCaja::where('caja_id', $caja->id)
                ->latest()
                ->first();

            if (! $aperturaCaja) {
                return back()->with('error', 'No se encontró la apertura de caja');
            }

            return $this->imprimirMovimientosCaja($aperturaCaja, new Request([
                'formato' => $formato,
                'accion'  => 'download',
            ]));
        } catch (\Exception $e) {
            Log::error('❌ [CajaController::exportarPdf] Error', [
                'error'   => $e->getMessage(),
                'caja_id' => $caja->id,
            ]);
            return back()->with('error', 'Error al generar PDF: ' . $e->getMessage());
        }
    }

    /**
     * Imprimir un movimiento individual en diferentes formatos
     *
     * ✅ NUEVO: Genera impresión de un movimiento específico
     * - Formatos: TICKET_58, TICKET_80, A4
     * - Acciones: download (PDF), stream (vista previa)
     */
    public function imprimirMovimiento(MovimientoCaja $movimiento, Request $request)
    {
        $this->authorize('cajas.transacciones');

        // Cargar relaciones necesarias para las plantillas
        $movimiento->load(['tipoOperacion', 'tipoPago', 'usuario']);

        $formato = $request->query('formato', 'A4');
        $accion  = $request->query('accion', 'download');

        // Obtener la apertura de caja del movimiento
        $apertura = AperturaCaja::where('caja_id', $movimiento->caja_id)
            ->where('fecha', '<=', $movimiento->fecha)
            ->orderBy('fecha', 'desc')
            ->first();

        if (!$apertura) {
            return back()->withErrors(['error' => 'No se encontró la apertura de caja para este movimiento']);
        }

        $usuario = $movimiento->usuario ?? Auth::user();

        // Preparar datos para la vista
        $datos = [
            'movimiento'      => $movimiento,
            'apertura'        => $apertura,
            'usuario'         => $usuario,
            'fecha_impresion' => now(),
        ];

        // Usar ImpresionService para generar el PDF
        $impresionService = app(\App\Services\ImpresionService::class);
        $pdf              = $impresionService->generarPDF('movimiento_individual', $datos, $formato);

        if ($accion === 'stream') {
            return $pdf->stream();
        }

        return $pdf->download('movimiento-caja-' . $movimiento->id . '.pdf');
    }

    /**
     * Eliminar un movimiento de caja
     * ✅ NUEVO: Solo permite eliminar GASTOS, PAGO_SUELDO, ANTICIPO
     */
    public function eliminarMovimiento(MovimientoCaja $movimiento)
    {
        $this->authorize('cajas.transacciones');

        try {
            // ✅ VALIDACIÓN: Solo permitir eliminar ciertos tipos
            $tiposEliminables = ['GASTOS', 'PAGO_SUELDO', 'ANTICIPO'];
            $tipoCodigo = $movimiento->tipoOperacion->codigo;

            if (!in_array($tipoCodigo, $tiposEliminables)) {
                return response()->json([
                    'success' => false,
                    'message' => "No se puede eliminar movimientos de tipo {$movimiento->tipoOperacion->nombre}. Solo se pueden eliminar GASTOS, PAGOS DE SUELDO o ANTICIPOS.",
                ], 403);
            }

            // ✅ Registrar información del movimiento antes de eliminar (para auditoría)
            $movimientoData = [
                'id' => $movimiento->id,
                'tipo' => $movimiento->tipoOperacion->nombre,
                'monto' => $movimiento->monto,
                'descripcion' => $movimiento->observaciones,
                'usuario_id' => $movimiento->user_id,
                'fecha' => $movimiento->fecha,
            ];

            Log::info('🗑️ [CajaController::eliminarMovimiento] Eliminando movimiento', $movimientoData);

            // ✅ Eliminar el movimiento
            $movimiento->delete();

            Log::info('✅ [CajaController::eliminarMovimiento] Movimiento eliminado exitosamente', $movimientoData);

            return response()->json([
                'success' => true,
                'message' => "Movimiento de {$movimiento->tipoOperacion->nombre} eliminado exitosamente.",
            ]);
        } catch (\Exception $e) {
            Log::error('❌ [CajaController::eliminarMovimiento] Error al eliminar movimiento', [
                'movimiento_id' => $movimiento->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el movimiento: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Convertir logo a base64 para embebimiento en PDF
     *
     * @param string|null $logoUrl URL del logo
     * @return string|null Data URI con imagen codificada en base64
     */
}
