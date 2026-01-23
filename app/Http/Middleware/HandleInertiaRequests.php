<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\AperturaCaja;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        // ✅ Obtener estado de caja del usuario para mostrar en NavHeader
        $cajaStatus = $this->getCajaStatus($request->user());

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
                'roles' => $request->user() ? $request->user()->getRoleNames() : [],
                // Optimización: Solo cargar permisos cuando sea necesario
                'permissions' => $request->user() ? $this->getEssentialPermissions($request->user()) : [],
                // ✅ Compartir token SANCTUM para WebSocket
                'sanctumToken' => $request->session()->get('sanctum_token'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            // ✅ Estado de caja disponible en todas las páginas
            'caja_status' => $cajaStatus,
        ];
    }

    /**
     * Obtener todos los permisos del usuario para compartir con el frontend
     */
    private function getEssentialPermissions($user): array
    {
        // Obtener todos los permisos del usuario directamente desde la BD
        // Esto es más escalable y no requiere mantenimiento manual
        return $user->getAllPermissions()->pluck('name')->toArray();
    }

    /**
     * ✅ Obtener estado de caja del usuario actual
     * Se proporciona en TODAS las páginas para que el NavHeader pueda mostrar si hay caja abierta
     */
    private function getCajaStatus($user): array
    {
        if (!$user) {
            return [
                'tiene_caja_abierta' => false,
                'caja_id' => null,
                'numero_caja' => null,
                'monto_actual' => null,
                'apertura_id' => null,
            ];
        }

        // Buscar apertura de caja abierta hoy
        $cajaAbiertaHoy = AperturaCaja::where('user_id', $user->id)
            ->whereDate('fecha', today())
            ->with(['caja'])
            ->first();

        return [
            'tiene_caja_abierta' => $cajaAbiertaHoy !== null,
            'caja_id' => $cajaAbiertaHoy?->caja_id,
            'numero_caja' => $cajaAbiertaHoy?->caja?->nombre,
            'monto_actual' => $cajaAbiertaHoy?->monto_apertura,
            'apertura_id' => $cajaAbiertaHoy?->id,
        ];
    }
}
