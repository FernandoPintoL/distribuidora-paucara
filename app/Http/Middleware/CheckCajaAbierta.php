<?php
namespace App\Http\Middleware;

use App\Exceptions\Caja\CajaNoAbiertaException;
use App\Models\AuditoriaCaja;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware: Validar que el usuario tiene caja abierta
 *
 * Responsabilidades:
 * ✅ Verificar que usuario tiene rol con acceso a cajas
 * ✅ Verificar que tiene caja abierta HOY
 * ✅ Permitir caja del día anterior si:
 *    - Está abierta (no cerrada)
 *    - Es antes de las 6:00 AM del día siguiente (configurable)
 * ✅ Almacenar contexto de caja en request->attributes
 * ✅ Rechazar operación con mensaje claro si no hay caja
 * ✅ Registrar TODOS los intentos en auditoría (exitosos y fallidos)
 *
 * Responde con:
 * - JSON para API
 * - Redirect para Web
 */
class CheckCajaAbierta
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Solo verificar si el usuario está autenticado
        if (! Auth::check()) {
            return $next($request);
        }

        $user = Auth::user();

        // 1. Verificar si el usuario es empleado con rol de Cajero
        $esCajero = $user->empleado && $user->empleado->esCajero();

        // 2. Verificar si es administrador
        $esAdmin = $user->hasRole(['admin', 'administrador', 'super-admin', 'Super Admin', 'Admin']);

        // Si no es cajero ni administrador, permitir acceso
        if (! $esCajero && ! $esAdmin) {
            return $next($request);
        }

        // 3. Obtener caja abierta actual
        if ($esCajero) {
            $cajaAbierta = $user->empleado->cajaAbierta();
        } else {
            // Para administradores, obtener caja abierta del día (de cualquier usuario o una genérica del admin)
            // ✅ NUEVO: Los administradores pueden crear ventas si hay una caja abierta cualquiera del día
            // Una apertura está abierta si NO tiene un cierre (usa scope Abiertas)
            $cajaAbierta = \App\Models\AperturaCaja::delDia()
                ->abiertas()
                ->with('caja')
                ->latest()
                ->first();
        }

        if ($cajaAbierta) {
            // Hay caja abierta, permitir acceso
            $request->attributes->set('caja_id', $cajaAbierta->caja_id);
            $request->attributes->set('apertura_caja_id', $cajaAbierta->id);

            return $next($request);
        }

        // 3. No hay caja abierta - Detectar si es ruta web de ventas o bloqueo duro
        $isWebVentasRoute = !$request->expectsJson()
            && str_starts_with($request->path(), 'ventas');

        if ($isWebVentasRoute) {
            return $this->respondCajaNoAbiertaSoftWarning($request, $next);
        }

        // Bloqueo duro para todo lo demás (API y otros módulos)
        return $this->respondCajaNoAbierta($request);
    }

    /**
     * Responder con advertencia suave para rutas web de ventas sin caja
     * ✅ Permite acceso pero muestra advertencia en toast + banner
     * ✅ Registra acceso con modo 'soft-warning' en auditoría
     */
    private function respondCajaNoAbiertaSoftWarning(Request $request, Closure $next): Response
    {
        $user = Auth::user();
        $operacion = $request->method() . ' ' . $request->path();

        // Registrar acceso sin caja con modo suave
        try {
            AuditoriaCaja::registrarAccesoSinCaja(
                user: $user,
                operacion: $operacion,
                ip: $request->ip() ?? 'unknown',
                userAgent: $request->userAgent() ?? 'unknown',
                modo: 'soft-warning'
            );
        } catch (\Exception $e) {
            Log::error("Error registrando auditoría de acceso sin caja: " . $e->getMessage());
        }

        // Flash warning para frontend
        $request->session()->flash('caja_warning', [
            'mensaje' => 'No tienes una caja abierta. Te recomendamos abrir una caja para registrar ventas.',
            'tipo' => 'sin_caja',
            'mostrar_toast' => true,
        ]);

        // Permitir acceso
        return $next($request);
    }

    /**
     * Responder cuando no hay caja abierta
     * ✅ Registra intento en auditoría
     */
    private function respondCajaNoAbierta(Request $request): Response
    {
        $user      = Auth::user();
        $operacion = $request->method() . ' ' . $request->path();

        // ✅ REGISTRAR INTENTO EN AUDITORÍA
        try {
            AuditoriaCaja::registrarIntentoSinCaja(
                user: $user,
                operacion: $operacion,
                ip: $request->ip() ?? 'unknown',
                userAgent: $request->userAgent() ?? 'unknown',
                detalles: [
                    'tipo'   => $this->obtenerTipoOperacion($request),
                    'ruta'   => $request->path(),
                    'metodo' => $request->method(),
                ]
            );

            // Verificar si hay múltiples intentos sospechosos
            if (AuditoriaCaja::esOperacionSospechosa($user, minutosAtras: 5)) {
                Log::warning("⚠️ ACTIVIDAD SOSPECHOSA: Usuario {$user->id} ({$user->email}) ha realizado múltiples intentos sin caja en los últimos 5 minutos", [
                    'ip'        => $request->ip(),
                    'operacion' => $operacion,
                ]);
            }
        } catch (\Exception $e) {
            Log::error("Error registrando auditoría de caja: " . $e->getMessage());
        }

        $exception = CajaNoAbiertaException::conDetalles(
            operacion: $operacion,
            usuarioId: $user->id,
            extra: [
                'timestamp' => now()->toIso8601String(),
                'ip'        => $request->ip(),
            ]
        );

        // Responder según tipo de cliente
        if ($request->expectsJson()) {
            // API: Responder con JSON
            return response()->json(
                $exception->toResponse(),
                $exception->getHttpStatusCode()
            );
        }

        // Web: Redirigir a página de cajas con mensaje
        return redirect()
            ->route('cajas.index')
            ->with('error', $exception->getMessage())
            ->with('caja_info', [
                'operacion' => $operacion,
                'hora'      => now()->format('H:i:s'),
            ]);
    }

    /**
     * Obtener tipo de operación desde la ruta
     */
    private function obtenerTipoOperacion(Request $request): string
    {
        $path = $request->path();

        if (strpos($path, 'ventas') !== false) {
            return 'VENTA';
        } elseif (strpos($path, 'compras') !== false) {
            return 'COMPRA';
        } elseif (strpos($path, 'pagos') !== false) {
            return 'PAGO';
        }

        return 'DESCONOCIDO';
    }
}
