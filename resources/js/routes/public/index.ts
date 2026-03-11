import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\PublicStockController::precios
 * @see app/Http/Controllers/PublicStockController.php:23
 * @route '/public/precios'
 */
export const precios = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: precios.url(options),
    method: 'get',
})

precios.definition = {
    methods: ["get","head"],
    url: '/public/precios',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PublicStockController::precios
 * @see app/Http/Controllers/PublicStockController.php:23
 * @route '/public/precios'
 */
precios.url = (options?: RouteQueryOptions) => {
    return precios.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PublicStockController::precios
 * @see app/Http/Controllers/PublicStockController.php:23
 * @route '/public/precios'
 */
precios.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: precios.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PublicStockController::precios
 * @see app/Http/Controllers/PublicStockController.php:23
 * @route '/public/precios'
 */
precios.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: precios.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PublicStockController::precios
 * @see app/Http/Controllers/PublicStockController.php:23
 * @route '/public/precios'
 */
    const preciosForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: precios.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PublicStockController::precios
 * @see app/Http/Controllers/PublicStockController.php:23
 * @route '/public/precios'
 */
        preciosForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: precios.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PublicStockController::precios
 * @see app/Http/Controllers/PublicStockController.php:23
 * @route '/public/precios'
 */
        preciosForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: precios.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    precios.form = preciosForm
const publicMethod = {
    precios,
}

export default publicMethod