import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\InventarioController::form
 * @see app/Http/Controllers/InventarioController.php:432
 * @route '/inventario/ajuste'
 */
export const form = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: form.url(options),
    method: 'get',
})

form.definition = {
    methods: ["get","head"],
    url: '/inventario/ajuste',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::form
 * @see app/Http/Controllers/InventarioController.php:432
 * @route '/inventario/ajuste'
 */
form.url = (options?: RouteQueryOptions) => {
    return form.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::form
 * @see app/Http/Controllers/InventarioController.php:432
 * @route '/inventario/ajuste'
 */
form.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: form.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::form
 * @see app/Http/Controllers/InventarioController.php:432
 * @route '/inventario/ajuste'
 */
form.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: form.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\InventarioController::procesar
 * @see app/Http/Controllers/InventarioController.php:456
 * @route '/inventario/ajuste'
 */
export const procesar = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: procesar.url(options),
    method: 'post',
})

procesar.definition = {
    methods: ["post"],
    url: '/inventario/ajuste',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventarioController::procesar
 * @see app/Http/Controllers/InventarioController.php:456
 * @route '/inventario/ajuste'
 */
procesar.url = (options?: RouteQueryOptions) => {
    return procesar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::procesar
 * @see app/Http/Controllers/InventarioController.php:456
 * @route '/inventario/ajuste'
 */
procesar.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: procesar.url(options),
    method: 'post',
})
const ajuste = {
    form,
procesar,
}

export default ajuste