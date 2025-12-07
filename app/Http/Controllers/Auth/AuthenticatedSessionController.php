<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // ✅ Generar token SANCTUM para WebSocket
        $token = auth()->user()->createToken('api-token')->plainTextToken;

        // ✅ Guardar el token en sesión para pasarlo al dashboard via Inertia
        $request->session()->put('sanctum_token', $token);

        // ✅ CAMBIO IMPORTANTE: Redirigir a dashboard-redirect en lugar de dashboard
        // El backend (DashboardRouterService) decidirá a qué dashboard debe ir el usuario
        // basado en sus roles. El frontend NO tiene lógica de negocios.
        return redirect()->intended(route('dashboard-redirect', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
