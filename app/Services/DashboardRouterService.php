<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Auth;

/**
 * Servicio que determina a qué dashboard debe ir cada usuario
 * EL BACKEND ES LA ÚNICA FUENTE DE VERDAD
 *
 * El frontend NO tiene lógica de negocios, solo muestra lo que el backend decide
 */
class DashboardRouterService
{
    /**
     * Mapeo de roles a rutas de dashboard
     * ESTO ES LA ÚNICA FUENTE DE VERDAD PARA RUTEO
     */
    private array $roleRoutes = [
        'super_admin' => '/admin/dashboard',      // Super admin ve dashboard general
        'admin' => '/admin/dashboard',            // Admin ve dashboard general
        'comprador' => '/compras/dashboard',      // Comprador ve dashboard de compras
        'preventista' => '/preventista/dashboard', // Preventista ve su dashboard
        'chofer' => '/chofer/dashboard',          // Chofer ve dashboard de logística/rutas
        'logistica' => '/logistica/dashboard',    // Logística manager ve dashboard logística
        'gestor_almacen' => '/almacen/dashboard', // Gestor almacén ve dashboard almacén
        'vendedor' => '/vendedor/dashboard',      // Vendedor ve dashboard POS
        'cajero' => '/vendedor/dashboard',        // Cajero ve lo mismo que vendedor
        'contabilidad' => '/contabilidad/dashboard', // Contabilidad ve dashboard financiero
    ];

    /**
     * Obtener la ruta del dashboard para el usuario actual
     *
     * LÓGICA:
     * 1. Si tiene multiple roles, usar el de mayor prioridad
     * 2. Si no tiene rol conocido, usar dashboard por defecto
     * 3. El frontend solo redirige a la URL que el backend retorna
     */
    public function getDashboardRoute(User $user = null): string
    {
        $user = $user ?? Auth::user();

        if (!$user) {
            return '/dashboard'; // Fallback
        }

        // Obtener roles del usuario en orden
        $roles = $user->getRoleNames()->toArray();

        // Si no tiene roles, dashboard genérico
        if (empty($roles)) {
            return '/dashboard';
        }

        // PRIORIDAD DE ROLES (si tiene múltiples, usar el de mayor importancia)
        $prioridad = [
            'super_admin' => 100,
            'admin' => 99,
            'comprador' => 50,
            'logistica' => 48,
            'gestor_almacen' => 47,
            'contabilidad' => 46,
            'preventista' => 45,
            'vendedor' => 40,
            'cajero' => 40,
            'chofer' => 30,
        ];

        // Encontrar el rol con mayor prioridad
        $rolPrincipal = null;
        $maxPrioridad = -1;

        foreach ($roles as $rol) {
            // ✅ IMPORTANTE: Normalizar el nombre del rol a minúsculas para comparación
            $rolNormalizado = strtolower($rol);
            $p = $prioridad[$rolNormalizado] ?? 0;
            if ($p > $maxPrioridad) {
                $maxPrioridad = $p;
                $rolPrincipal = $rolNormalizado;
            }
        }

        // Retornar la ruta basada en el rol principal
        return $this->roleRoutes[$rolPrincipal] ?? '/dashboard';
    }

    /**
     * Obtener solo el nombre de la ruta (sin la ruta completa)
     * Útil para debugging
     */
    public function getDashboardName(User $user = null): string
    {
        $ruta = $this->getDashboardRoute($user);
        $partes = explode('/', trim($ruta, '/'));
        return $partes[0] ?? 'dashboard';
    }

    /**
     * Obtener información de redirección (para debugging)
     */
    public function getRedirectInfo(User $user = null): array
    {
        $user = $user ?? Auth::user();
        $ruta = $this->getDashboardRoute($user);
        $nombre = $this->getDashboardName($user);

        return [
            'usuario_id' => $user->id ?? null,
            'usuario_email' => $user->email ?? null,
            'roles' => $user->getRoleNames()->toArray() ?? [],
            'dashboard_url' => $ruta,
            'dashboard_nombre' => $nombre,
        ];
    }

    /**
     * Verificar si el usuario necesita redirección especial
     * Retorna true si no está en su dashboard correcto
     */
    public function needsRedirect(User $user = null): bool
    {
        $user = $user ?? Auth::user();
        $routeActual = request()->path();
        $routeCorrecta = trim($this->getDashboardRoute($user), '/');

        return $routeActual !== $routeCorrecta;
    }

    /**
     * Actualizar el mapeo de roles en tiempo de ejecución
     * Útil para cambios dinámicos
     */
    public function updateRoleRoute(string $rol, string $ruta): void
    {
        $this->roleRoutes[$rol] = $ruta;
    }

    /**
     * Obtener todos los mapeos (para debugging)
     */
    public function getAllRoleRoutes(): array
    {
        return $this->roleRoutes;
    }
}
