<?php

namespace App\Http\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

trait UnifiedResponseTrait
{
    /**
     * Determina si la request es para API (Flutter/móvil)
     */
    protected function isApiRequest(?Request $request = null): bool
    {
        $request = $request ?? request();

        // Si es una petición de Inertia, NO es una petición de API
        // Inertia puede enviar el header como string 'true' o boolean true
        if ($request->hasHeader('X-Inertia')) {
            return false;
        }

        // Si viene de una ruta web explícita, no es API
        if ($request->is('clientes/*') || $request->is('clientes')) {
            return false;
        }

        return $request->is('api/*')
            || $request->hasHeader('X-API-Request')
            || $request->hasHeader('X-Flutter-Request')
            || str_contains($request->header('User-Agent', ''), 'Flutter');
    }

    /**
     * Respuesta unificada para operaciones exitosas
     */
    protected function successResponse(
        string $message = 'Operación exitosa',
        mixed $data = null,
        string $redirectRoute = null,
        array $redirectParams = [],
        int $statusCode = 200
    ): JsonResponse|RedirectResponse {
        if ($this->isApiRequest()) {
            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $data,
            ], $statusCode);
        }

        // Para Inertia (web)
        $redirect = $redirectRoute
            ? redirect()->route($redirectRoute, $redirectParams)
            : back();

        return $redirect->with('success', $message);
    }

    /**
     * Respuesta unificada para errores
     */
    protected function errorResponse(
        string $message = 'Ha ocurrido un error',
        mixed $errors = null,
        string $redirectRoute = null,
        array $redirectParams = [],
        int $statusCode = 400
    ): JsonResponse|RedirectResponse {
        if ($this->isApiRequest()) {
            return response()->json([
                'success' => false,
                'message' => $message,
                'errors' => $errors,
            ], $statusCode);
        }

        // Para Inertia (web)
        $redirect = $redirectRoute
            ? redirect()->route($redirectRoute, $redirectParams)
            : back();

        if ($errors) {
            return $redirect->withErrors($errors)->withInput();
        }

        return $redirect->with('error', $message);
    }

    /**
     * Respuesta unificada para validaciones
     */
    protected function validationErrorResponse(
        array $errors,
        string $message = 'Errores de validación'
    ): JsonResponse|RedirectResponse {
        return $this->errorResponse($message, $errors, null, [], 422);
    }

    /**
     * Respuesta unificada para mostrar datos (index, show)
     */
    protected function dataResponse(
        string $component,
        array $data = [],
        string $title = null
    ): JsonResponse|InertiaResponse {
        if ($this->isApiRequest()) {
            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        }

        // Para Inertia (web)
        $response = Inertia::render($component, $data);

        if ($title) {
            $response->with('title', $title);
        }

        return $response;
    }

    /**
     * Respuesta para recursos creados/actualizados
     */
    protected function resourceResponse(
        mixed $resource,
        string $message,
        string $redirectRoute = null,
        array $redirectParams = [],
        int $statusCode = 200
    ): JsonResponse|RedirectResponse {
        if ($this->isApiRequest()) {
            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $resource,
            ], $statusCode);
        }

        // Para Inertia (web)
        $redirect = $redirectRoute
            ? redirect()->route($redirectRoute, $redirectParams)
            : back();

        return $redirect->with('success', $message);
    }

    /**
     * Respuesta para eliminaciones
     */
    protected function deleteResponse(
        string $message = 'Elemento eliminado exitosamente',
        string $redirectRoute = null,
        array $redirectParams = []
    ): JsonResponse|RedirectResponse {
        if ($this->isApiRequest()) {
            return response()->json([
                'success' => true,
                'message' => $message,
            ]);
        }

        // Para Inertia (web)
        $redirect = $redirectRoute
            ? redirect()->route($redirectRoute, $redirectParams)
            : back();

        return $redirect->with('success', $message);
    }

    /**
     * Respuesta para no encontrado (404)
     */
    protected function notFoundResponse(
        string $message = 'Recurso no encontrado'
    ): JsonResponse|RedirectResponse {
        return $this->errorResponse($message, null, null, [], 404);
    }

    /**
     * Respuesta para no autorizado (403)
     */
    protected function forbiddenResponse(
        string $message = 'No tienes permisos para realizar esta acción'
    ): JsonResponse|RedirectResponse {
        return $this->errorResponse($message, null, null, [], 403);
    }

    /**
     * Manejo unificado de excepciones en controladores
     */
    protected function handleException(
        \Exception $e,
        string $operation = 'operación',
        string $redirectRoute = null
    ): JsonResponse|RedirectResponse {
        Log::error("Error en {$operation}: " . $e->getMessage(), [
            'exception' => $e,
            'user_id' => Auth::id(),
            'request' => request()->all()
        ]);

        $message = config('app.debug')
            ? $e->getMessage()
            : "Error al realizar {$operation}";

        return $this->errorResponse($message, null, $redirectRoute, [], 500);
    }

    /**
     * Respuesta paginada unificada
     */
    protected function paginatedResponse(
        $paginatedData,
        string $component = null,
        string $dataKey = 'data',
        array $additionalData = []
    ): JsonResponse|InertiaResponse {
        if ($this->isApiRequest()) {
            return response()->json([
                'success' => true,
                'data' => $paginatedData->items(),
                'pagination' => [
                    'current_page' => $paginatedData->currentPage(),
                    'last_page' => $paginatedData->lastPage(),
                    'per_page' => $paginatedData->perPage(),
                    'total' => $paginatedData->total(),
                    'from' => $paginatedData->firstItem(),
                    'to' => $paginatedData->lastItem(),
                ],
                'links' => [
                    'first' => $paginatedData->url(1),
                    'last' => $paginatedData->url($paginatedData->lastPage()),
                    'prev' => $paginatedData->previousPageUrl(),
                    'next' => $paginatedData->nextPageUrl(),
                ]
            ]);
        }

        // Para Inertia (web)
        if (!$component) {
            throw new \InvalidArgumentException('Component name required for Inertia response');
        }

        return Inertia::render($component, array_merge([
            $dataKey => $paginatedData,
        ], $additionalData));
    }
}