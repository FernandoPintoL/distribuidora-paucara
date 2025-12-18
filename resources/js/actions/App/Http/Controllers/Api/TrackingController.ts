import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\TrackingController::obtenerUbicaciones
 * @see app/Http/Controllers/Api/TrackingController.php:16
 * @route '/api/tracking/entregas/{id}/ubicaciones'
 */
export const obtenerUbicaciones = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerUbicaciones.url(args, options),
    method: 'get',
})

obtenerUbicaciones.definition = {
    methods: ["get","head"],
    url: '/api/tracking/entregas/{id}/ubicaciones',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\TrackingController::obtenerUbicaciones
 * @see app/Http/Controllers/Api/TrackingController.php:16
 * @route '/api/tracking/entregas/{id}/ubicaciones'
 */
obtenerUbicaciones.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return obtenerUbicaciones.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\TrackingController::obtenerUbicaciones
 * @see app/Http/Controllers/Api/TrackingController.php:16
 * @route '/api/tracking/entregas/{id}/ubicaciones'
 */
obtenerUbicaciones.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerUbicaciones.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\TrackingController::obtenerUbicaciones
 * @see app/Http/Controllers/Api/TrackingController.php:16
 * @route '/api/tracking/entregas/{id}/ubicaciones'
 */
obtenerUbicaciones.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerUbicaciones.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\TrackingController::ultimaUbicacion
 * @see app/Http/Controllers/Api/TrackingController.php:67
 * @route '/api/tracking/entregas/{id}/ultima-ubicacion'
 */
export const ultimaUbicacion = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ultimaUbicacion.url(args, options),
    method: 'get',
})

ultimaUbicacion.definition = {
    methods: ["get","head"],
    url: '/api/tracking/entregas/{id}/ultima-ubicacion',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\TrackingController::ultimaUbicacion
 * @see app/Http/Controllers/Api/TrackingController.php:67
 * @route '/api/tracking/entregas/{id}/ultima-ubicacion'
 */
ultimaUbicacion.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return ultimaUbicacion.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\TrackingController::ultimaUbicacion
 * @see app/Http/Controllers/Api/TrackingController.php:67
 * @route '/api/tracking/entregas/{id}/ultima-ubicacion'
 */
ultimaUbicacion.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ultimaUbicacion.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\TrackingController::ultimaUbicacion
 * @see app/Http/Controllers/Api/TrackingController.php:67
 * @route '/api/tracking/entregas/{id}/ultima-ubicacion'
 */
ultimaUbicacion.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ultimaUbicacion.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\TrackingController::calcularETA
 * @see app/Http/Controllers/Api/TrackingController.php:119
 * @route '/api/tracking/entregas/{id}/calcular-eta'
 */
export const calcularETA = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: calcularETA.url(args, options),
    method: 'post',
})

calcularETA.definition = {
    methods: ["post"],
    url: '/api/tracking/entregas/{id}/calcular-eta',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\TrackingController::calcularETA
 * @see app/Http/Controllers/Api/TrackingController.php:119
 * @route '/api/tracking/entregas/{id}/calcular-eta'
 */
calcularETA.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return calcularETA.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\TrackingController::calcularETA
 * @see app/Http/Controllers/Api/TrackingController.php:119
 * @route '/api/tracking/entregas/{id}/calcular-eta'
 */
calcularETA.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: calcularETA.url(args, options),
    method: 'post',
})
const TrackingController = { obtenerUbicaciones, ultimaUbicacion, calcularETA }

export default TrackingController