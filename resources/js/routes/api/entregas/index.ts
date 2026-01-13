import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:277
 * @route '/api/entregas'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/entregas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:277
 * @route '/api/entregas'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:277
 * @route '/api/entregas'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})
const entregas = {
    store,
}

export default entregas