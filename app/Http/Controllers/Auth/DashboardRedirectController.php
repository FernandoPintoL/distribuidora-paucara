<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Support\Facades\Auth;

/**
 * Controlador de redirección post-login
 *
 * RESPONSABILIDAD ÚNICA: Redirigir al usuario a su dashboard correcto
 * Basado 100% en las decisiones del backend (DashboardService)
 *
 * El frontend NO tiene lógica de negocios
 */
class DashboardRedirectController extends Controller
{
    public function __construct(
        private DashboardService $dashboardService
    ) {}

    /**
     * Redirigir al dashboard correcto para el usuario autenticado
     *
     * Flujo:
     * 1. Usuario hace login → Login request procesa credenciales
     * 2. Si login es exitoso → Usuario es autenticado
     * 3. Usuario es redirigido a /dashboard-redirect
     * 4. Este controlador pregunta al backend: "¿A dónde debo ir?"
     * 5. Backend retorna URL basada en roles del usuario
     * 6. Frontend redirige a esa URL
     *
     * IMPORTANTE: El frontend es "tonto", solo obedece lo que el backend decide
     */
    public function redirect()
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        // Obtener la ruta correcta desde el backend
        // EL BACKEND DECIDE, NO EL FRONTEND
        $dashboardUrl = $this->dashboardService->getDashboardRoute($user);

        // Log para debugging
        \Log::info('Dashboard redirect', $this->dashboardService->getRedirectInfo($user));

        return redirect()->to($dashboardUrl);
    }

    /**
     * Endpoint API para obtener la ruta de redirección
     * Usado por el frontend (hook useDashboardRoute) para saber a qué dashboard ir
     *
     * Frontend hace:
     * GET /api/dashboard-redirect
     * Respuesta: { "redirect_url": "/vendedor/dashboard", "dashboard_name": "vendedor" }
     */
    public function getRedirectApi()
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'No autenticado'], 401);
        }

        return response()->json([
            'success' => true,
            'redirect_url' => $this->dashboardService->getDashboardRoute($user),
            'dashboard_name' => $this->dashboardService->getDashboardName($user),
        ]);
    }
}
