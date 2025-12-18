import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\InventarioInicialController::index
 * @see app/Http/Controllers/InventarioInicialController.php:20
 * @route '/inventario/inventario-inicial'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/inventario/inventario-inicial',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioInicialController::index
 * @see app/Http/Controllers/InventarioInicialController.php:20
 * @route '/inventario/inventario-inicial'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioInicialController::index
 * @see app/Http/Controllers/InventarioInicialController.php:20
 * @route '/inventario/inventario-inicial'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioInicialController::index
 * @see app/Http/Controllers/InventarioInicialController.php:20
 * @route '/inventario/inventario-inicial'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\InventarioInicialController::store
 * @see app/Http/Controllers/InventarioInicialController.php:61
 * @route '/inventario/inventario-inicial'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/inventario/inventario-inicial',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventarioInicialController::store
 * @see app/Http/Controllers/InventarioInicialController.php:61
 * @route '/inventario/inventario-inicial'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioInicialController::store
 * @see app/Http/Controllers/InventarioInicialController.php:61
 * @route '/inventario/inventario-inicial'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})
const InventarioInicialController = { index, store }

export default InventarioInicialController