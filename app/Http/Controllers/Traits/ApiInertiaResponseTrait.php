<?php

namespace App\Http\Controllers\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

trait ApiInertiaResponseTrait
{
    /**
     * Detecta si la petición viene de una API externa (Flutter, Postman, etc.)
     */
    protected function isApiRequest(Request $request): bool
    {
        // Si es una petición de Inertia, NO es una petición de API
        if ($this->isInertiaRequest($request)) {
            return false;
        }

        // Verificar headers específicos de API
        return $request->expectsJson() ||
        $request->header('Accept') === 'application/json' ||
        $request->header('Content-Type') === 'application/json' ||
        str_contains($request->header('Accept', ''), 'application/json');
    }

    /**
     * Detecta si la petición viene de Inertia.js
     */
    protected function isInertiaRequest(Request $request): bool
    {
        return $request->header('X-Inertia') === 'true';
    }

    /**
     * Detecta si la petición viene de un modal
     */
    protected function isModalRequest(Request $request): bool
    {
        return $request->input('modal') === 'true' ||
        $request->input('modal') === true ||
        $request->header('X-Modal-Request') === 'true';
    }

    /**
     * Devuelve una respuesta apropiada según el tipo de petición
     */
    protected function respondWith(
        Request $request,
        array $data,
        ?string $successMessage = null,
        ?string $redirectRoute = null,
        array $redirectParams = []
    ): Response {
        if ($this->isApiRequest($request)) {
            return $this->apiResponse($data, $successMessage);
        }

        if ($this->isModalRequest($request)) {
            return $this->modalResponse($data, $successMessage);
        }

        // Respuesta por defecto para Inertia.js
        return $this->inertiaResponse($data, $successMessage, $redirectRoute, $redirectParams);
    }

    /**
     * Respuesta para API externa (Flutter, etc.)
     */
    protected function apiResponse(array $data, ?string $message = null): JsonResponse
    {
        $response = [
            'success' => true,
            'data' => $data,
        ];

        if ($message) {
            $response['message'] = $message;
        }

        return response()->json($response);
    }

    /**
     * Respuesta para modales (Inertia.js)
     */
    protected function modalResponse(array $data, ?string $message = null): JsonResponse
    {
        $response = [
            'success' => true,
            'data' => $data,
        ];

        if ($message) {
            $response['message'] = $message;
        }

        return response()->json($response, 200, [
            'X-Inertia-Location' => false, // Evitar que Inertia intercepte la respuesta
        ]);
    }

    /**
     * Respuesta para Inertia.js (páginas web)
     */
    protected function inertiaResponse(
        array $data,
        ?string $message = null,
        ?string $redirectRoute = null,
        array $redirectParams = []
    ): RedirectResponse {
        if ($redirectRoute) {
            $redirect = redirect()->route($redirectRoute, $redirectParams);
            if ($message) {
                $redirect->with('success', $message);
            }

            return $redirect;
        }

        // Si no hay ruta de redirección, devolver a la página anterior
        $redirect = redirect()->back();
        if ($message) {
            $redirect->with('success', $message);
        }

        return $redirect;
    }

    /**
     * Respuesta de error para API
     */
    protected function apiError(string $message, array $errors = [], int $statusCode = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $statusCode);
    }

    /**
     * Respuesta de error para Inertia.js
     */
    protected function inertiaError(Request $request, string $message, array $errors = []): RedirectResponse
    {
        return redirect()->back()
            ->withErrors($errors)
            ->with('error', $message);
    }

    /**
     * Método helper para operaciones CRUD comunes
     */
    protected function handleCrudOperation(
        Request $request,
        callable $operation,
        string $successMessage,
        ?string $redirectRoute = null,
        array $redirectParams = []
    ): Response {
        try {
            $result = $operation();

            if ($this->isApiRequest($request) || $this->isModalRequest($request)) {
                return $this->respondWith($request, $result, $successMessage);
            }

            return $this->respondWith($request, $result, $successMessage, $redirectRoute, $redirectParams);

        } catch (\Exception $e) {
            if ($this->isApiRequest($request)) {
                return $this->apiError($e->getMessage());
            }

            return $this->inertiaError($request, $e->getMessage());
        }
    }
}
