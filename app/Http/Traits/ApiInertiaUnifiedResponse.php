<?php

namespace App\Http\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

/**
 * Trait para respuestas unificadas (Web + API)
 *
 * Detecta automáticamente si el cliente es:
 * - Web (Inertia/React)
 * - API (JSON)
 * - WebSocket (JSON)
 *
 * Y retorna la respuesta apropiada.
 *
 * USAGE:
 * ------
 * use ApiInertiaUnifiedResponse;
 *
 * public function store(StoreRequest $request)
 * {
 *     try {
 *         $dto = CrearDTO::fromRequest($request);
 *         $resultado = $this->service->crear($dto);
 *         return $this->respondSuccess($resultado, 'Creado exitosamente', route('show', $resultado->id));
 *     } catch (DomainException $e) {
 *         return $this->respondError($e->getMessage(), $e->getErrors());
 *     }
 * }
 */
trait ApiInertiaUnifiedResponse
{
    /**
     * Respuesta exitosa
     *
     * @param mixed $data DTO o datos a retornar
     * @param string $message Mensaje de éxito
     * @param string|null $redirectTo URL para redirect (Web only)
     * @param int $statusCode HTTP status code
     */
    protected function respondSuccess(
        mixed $data = null,
        string $message = 'Operación exitosa',
        ?string $redirectTo = null,
        int $statusCode = 200,
    ): JsonResponse|RedirectResponse|InertiaResponse {
        // API/JSON
        if ($this->isApiRequest()) {
            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $data instanceof \App\DTOs\BaseDTO ? $data->toArray() : $data,
            ], $statusCode);
        }

        // Web (Inertia)
        if ($redirectTo) {
            return redirect($redirectTo)->with('success', $message);
        }

        return back()->with('success', $message);
    }

    /**
     * Respuesta de error
     *
     * @param string $message Mensaje de error
     * @param array $errors Errores detallados
     * @param int $statusCode HTTP status code
     */
    protected function respondError(
        string $message = 'Error en la operación',
        array $errors = [],
        int $statusCode = 422,
    ): JsonResponse|RedirectResponse {
        // API/JSON
        if ($this->isApiRequest()) {
            return response()->json([
                'success' => false,
                'message' => $message,
                'errors' => $errors,
            ], $statusCode);
        }

        // Web
        return back()
            ->withErrors(['error' => $message])
            ->withInput();
    }

    /**
     * Respuesta para listado paginado
     *
     * @param \Illuminate\Pagination\Paginator $paginated
     * @param string $inertiaComponent Componente Inertia (ej: 'Ventas/Index')
     * @param array $inertiaProps Props adicionales para Inertia
     */
    protected function respondPaginated(
        mixed $paginated,
        string $inertiaComponent,
        array $inertiaProps = [],
    ): JsonResponse|InertiaResponse {
        // API/JSON
        if ($this->isApiRequest()) {
            return response()->json([
                'success' => true,
                'data' => $paginated->items(),
                'pagination' => [
                    'total' => $paginated->total(),
                    'per_page' => $paginated->perPage(),
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'from' => $paginated->firstItem(),
                    'to' => $paginated->lastItem(),
                ],
            ]);
        }

        // Web (Inertia)
        return Inertia::render($inertiaComponent, array_merge(
            ['items' => $paginated],
            $inertiaProps,
        ));
    }

    /**
     * Respuesta para listado simple (sin paginación)
     */
    protected function respondList(
        array $data,
        string $inertiaComponent,
        array $inertiaProps = [],
    ): JsonResponse|InertiaResponse {
        // API/JSON
        if ($this->isApiRequest()) {
            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        }

        // Web
        return Inertia::render($inertiaComponent, array_merge(
            ['items' => $data],
            $inertiaProps,
        ));
    }

    /**
     * Respuesta para detalle
     */
    protected function respondShow(
        mixed $data,
        string $inertiaComponent = '',
        array $inertiaProps = [],
    ): JsonResponse|InertiaResponse {
        // API/JSON
        if ($this->isApiRequest()) {
            $responseData = $data instanceof \App\DTOs\BaseDTO
                ? $data->toArray()
                : $data->toArray();

            return response()->json([
                'success' => true,
                'data' => $responseData,
            ]);
        }

        // Web
        if ($inertiaComponent) {
            $props = $data instanceof \App\DTOs\BaseDTO
                ? $data->toArray()
                : $data->toArray();

            return Inertia::render($inertiaComponent, array_merge(
                ['item' => $props],
                $inertiaProps,
            ));
        }

        return back();
    }

    /**
     * Respuesta de eliminación
     */
    protected function respondDeleted(
        string $message = 'Elemento eliminado exitosamente',
        ?string $redirectTo = null,
    ): JsonResponse|RedirectResponse {
        // API/JSON
        if ($this->isApiRequest()) {
            return response()->json([
                'success' => true,
                'message' => $message,
            ], 200);
        }

        // Web
        if ($redirectTo) {
            return redirect($redirectTo)->with('success', $message);
        }

        return back()->with('success', $message);
    }

    /**
     * Respuesta 404
     */
    protected function respondNotFound(
        string $message = 'Recurso no encontrado',
    ): JsonResponse|RedirectResponse {
        // API/JSON
        if ($this->isApiRequest()) {
            return response()->json([
                'success' => false,
                'message' => $message,
            ], 404);
        }

        // Web
        return back()->with('error', $message);
    }

    /**
     * Respuesta 403 (No autorizado)
     */
    protected function respondForbidden(
        string $message = 'No autorizado',
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 403);
    }

    // ══════════════════════════════════════════════════════════
    // HELPERS - Detectar tipo de cliente
    // ══════════════════════════════════════════════════════════

    /**
     * ¿Es una petición API/JSON?
     */
    protected function isApiRequest(): bool
    {
        return request()->wantsJson() || request()->is('api/*');
    }

    /**
     * ¿Es una petición de Inertia (Web)?
     */
    protected function isInertiaRequest(): bool
    {
        return request()->header('X-Inertia') === 'true';
    }

    /**
     * ¿Es una petición de modal?
     */
    protected function isModalRequest(): bool
    {
        return request()->header('X-Modal-Request') === 'true' ||
               request()->has('modal');
    }
}
