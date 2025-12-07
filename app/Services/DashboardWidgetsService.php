<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

/**
 * Servicio para determinar qué widgets y datos debe cargar el dashboard
 * Basado en los roles y permisos del usuario actual
 */
class DashboardWidgetsService
{
    protected array $config;
    protected User $user;

    public function __construct()
    {
        $this->config = config('dashboard-widgets') ?? $this->getDefaultConfig();
    }

    /**
     * Configuración por defecto si no carga desde archivo
     */
    private function getDefaultConfig(): array
    {
        return [
            'role_modules' => [
                'super_admin' => ['general', 'compras', 'logistica', 'inventario', 'contabilidad'],
                'admin' => ['general', 'compras', 'logistica', 'inventario', 'contabilidad'],
                'comprador' => ['general', 'compras'],
                'preventista' => ['general', 'preventista'],
                'chofer' => ['general', 'chofer'],
                'logistica' => ['general', 'logistica'],
                'gestor_almacen' => ['general', 'almacen', 'inventario'],
                'vendedor' => ['general', 'vendedor'],
                'cajero' => ['general', 'vendedor'],
                'contabilidad' => ['general', 'contabilidad'],
            ],
            'modules' => [
                'general' => [
                    'required_permissions' => [],
                    'widgets' => ['metricas_principales', 'metricas_secundarias', 'grafico_ventas'],
                ],
                'preventista' => [
                    'required_permissions' => ['preventista.manage'],
                    'widgets' => ['mis_clientes', 'comisiones', 'proformas_pendientes'],
                ],
                'compras' => [
                    'required_permissions' => ['compras.manage'],
                    'widgets' => ['metricas_compras'],
                ],
                'logistica' => [
                    'required_permissions' => ['logistica.manage'],
                    'widgets' => ['metricas_logistica'],
                ],
            ],
        ];
    }

    /**
     * Obtener módulos permitidos para el usuario autenticado
     */
    public function getModulosPermitidos(User $user = null): array
    {
        $user = $user ?? Auth::user();

        if (!$user) {
            return [];
        }

        // Caché por usuario para no recalcular en cada request
        return Cache::remember(
            "dashboard_modulos_usuario_{$user->id}",
            now()->addHours(1),
            function () use ($user) {
                $roleNames = $user->getRoleNames()->toArray();
                $modulosPermitidos = [];

                // Obtener módulos asignados a los roles del usuario
                foreach ($roleNames as $roleName) {
                    $roleModules = $this->config['role_modules'][$roleName] ?? [];
                    $modulosPermitidos = array_merge($modulosPermitidos, $roleModules);
                }

                // Eliminar duplicados y ordenar
                $modulosPermitidos = array_unique($modulosPermitidos);

                // Validar que el usuario tenga los permisos requeridos
                return array_filter($modulosPermitidos, function ($modulo) use ($user) {
                    return $this->usuarioTienePermisoModulo($user, $modulo);
                });
            }
        );
    }

    /**
     * Verificar si el usuario tiene permisos para un módulo específico
     */
    public function usuarioTienePermisoModulo(User $user, string $modulo): bool
    {
        if (!isset($this->config['modules'][$modulo])) {
            return false;
        }

        $moduloConfig = $this->config['modules'][$modulo];
        $permisosRequeridos = $moduloConfig['required_permissions'] ?? [];

        // Si no hay permisos requeridos, está disponible para todos
        if (empty($permisosRequeridos)) {
            return true;
        }

        // Verificar que tenga al menos uno de los permisos
        foreach ($permisosRequeridos as $permiso) {
            if ($user->can($permiso)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Obtener widgets que debe renderizar para los módulos permitidos
     */
    public function getWidgetsAMostrar(User $user = null): array
    {
        $user = $user ?? Auth::user();
        $modulosPermitidos = $this->getModulosPermitidos($user);

        $widgetsAMostrar = [];

        foreach ($modulosPermitidos as $modulo) {
            if (!isset($this->config['modules'][$modulo])) {
                continue;
            }

            $widgets = $this->config['modules'][$modulo]['widgets'] ?? [];
            $widgetsAMostrar[$modulo] = $widgets;
        }

        return $widgetsAMostrar;
    }

    /**
     * Obtener solo los widgets sin agrupar por módulo (lista plana)
     */
    public function getWidgetsPlanos(User $user = null): array
    {
        $widgets = $this->getWidgetsAMostrar($user);
        $planos = [];

        foreach ($widgets as $modulo => $widgetsDelModulo) {
            $planos = array_merge($planos, $widgetsDelModulo);
        }

        return array_unique($planos);
    }

    /**
     * Obtener servicios necesarios para los widgets del usuario
     * Útil para saber qué datos fetchar desde el backend
     */
    public function getServiciosNecesarios(User $user = null): array
    {
        $user = $user ?? Auth::user();
        $modulosPermitidos = $this->getModulosPermitidos($user);

        $servicios = [];

        foreach ($modulosPermitidos as $modulo) {
            if (!isset($this->config['modules'][$modulo])) {
                continue;
            }

            $moduloServicios = $this->config['modules'][$modulo]['services'] ?? [];
            $servicios = array_merge($servicios, $moduloServicios);
        }

        return array_unique($servicios);
    }

    /**
     * Obtener configuración de un widget específico
     */
    public function getWidgetConfig(string $widget): ?array
    {
        return $this->config['widget_config'][$widget] ?? null;
    }

    /**
     * Obtener toda la estructura de widgets para el dashboard
     * Incluye módulos, widgets por módulo, y configuración
     */
    public function getDashboardStructure(User $user = null): array
    {
        $user = $user ?? Auth::user();

        return [
            'modulos_permitidos' => $this->getModulosPermitidos($user),
            'widgets_por_modulo' => $this->getWidgetsAMostrar($user),
            'widgets_planos' => $this->getWidgetsPlanos($user),
            'servicios_necesarios' => $this->getServiciosNecesarios($user),
            'roles_usuario' => $user->getRoleNames()->toArray(),
            'permisos_usuario' => $user->getAllPermissions()->pluck('name')->toArray(),
        ];
    }

    /**
     * Limpiar caché de módulos para un usuario (útil cuando cambia roles)
     */
    public function limpiarCacheUsuario(User $user): void
    {
        Cache::forget("dashboard_modulos_usuario_{$user->id}");
    }

    /**
     * Obtener módulos como array llave-valor para frontend
     * Útil para debugging/logging
     */
    public function getModulosInfo(): array
    {
        return array_map(function ($modulo, $config) {
            return [
                'id' => $modulo,
                'widgets_count' => count($config['widgets'] ?? []),
                'required_permissions' => $config['required_permissions'] ?? [],
            ];
        }, array_keys($this->config['modules']), array_values($this->config['modules']));
    }
}
