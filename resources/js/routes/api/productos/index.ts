import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ProductoController::buscar
 * @see app/Http/Controllers/ProductoController.php:1148
 * @route '/api/productos/buscar'
 */
export const buscar = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: buscar.url(options),
    method: 'get',
})

buscar.definition = {
    methods: ["get","head"],
    url: '/api/productos/buscar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductoController::buscar
 * @see app/Http/Controllers/ProductoController.php:1148
 * @route '/api/productos/buscar'
 */
buscar.url = (options?: RouteQueryOptions) => {
    return buscar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::buscar
 * @see app/Http/Controllers/ProductoController.php:1148
 * @route '/api/productos/buscar'
 */
buscar.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: buscar.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProductoController::buscar
 * @see app/Http/Controllers/ProductoController.php:1148
 * @route '/api/productos/buscar'
 */
buscar.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: buscar.url(options),
    method: 'head',
})
const productos = {
    buscar,
}

export default productos