import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresion
 * @see app/Http/Controllers/Api/StockApiController.php:19
 * @route '/api/stock/preparar-impresion'
 */
export const prepararImpresion = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: prepararImpresion.url(options),
    method: 'post',
})

prepararImpresion.definition = {
    methods: ["post"],
    url: '/api/stock/preparar-impresion',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresion
 * @see app/Http/Controllers/Api/StockApiController.php:19
 * @route '/api/stock/preparar-impresion'
 */
prepararImpresion.url = (options?: RouteQueryOptions) => {
    return prepararImpresion.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresion
 * @see app/Http/Controllers/Api/StockApiController.php:19
 * @route '/api/stock/preparar-impresion'
 */
prepararImpresion.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: prepararImpresion.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresion
 * @see app/Http/Controllers/Api/StockApiController.php:19
 * @route '/api/stock/preparar-impresion'
 */
    const prepararImpresionForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: prepararImpresion.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresion
 * @see app/Http/Controllers/Api/StockApiController.php:19
 * @route '/api/stock/preparar-impresion'
 */
        prepararImpresionForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: prepararImpresion.url(options),
            method: 'post',
        })
    
    prepararImpresion.form = prepararImpresionForm
/**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresionMovimientos
 * @see app/Http/Controllers/Api/StockApiController.php:55
 * @route '/api/stock/preparar-impresion-movimientos'
 */
export const prepararImpresionMovimientos = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: prepararImpresionMovimientos.url(options),
    method: 'post',
})

prepararImpresionMovimientos.definition = {
    methods: ["post"],
    url: '/api/stock/preparar-impresion-movimientos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresionMovimientos
 * @see app/Http/Controllers/Api/StockApiController.php:55
 * @route '/api/stock/preparar-impresion-movimientos'
 */
prepararImpresionMovimientos.url = (options?: RouteQueryOptions) => {
    return prepararImpresionMovimientos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresionMovimientos
 * @see app/Http/Controllers/Api/StockApiController.php:55
 * @route '/api/stock/preparar-impresion-movimientos'
 */
prepararImpresionMovimientos.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: prepararImpresionMovimientos.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresionMovimientos
 * @see app/Http/Controllers/Api/StockApiController.php:55
 * @route '/api/stock/preparar-impresion-movimientos'
 */
    const prepararImpresionMovimientosForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: prepararImpresionMovimientos.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresionMovimientos
 * @see app/Http/Controllers/Api/StockApiController.php:55
 * @route '/api/stock/preparar-impresion-movimientos'
 */
        prepararImpresionMovimientosForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: prepararImpresionMovimientos.url(options),
            method: 'post',
        })
    
    prepararImpresionMovimientos.form = prepararImpresionMovimientosForm
/**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresionVentas
 * @see app/Http/Controllers/Api/StockApiController.php:89
 * @route '/api/stock/preparar-impresion-ventas'
 */
export const prepararImpresionVentas = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: prepararImpresionVentas.url(options),
    method: 'post',
})

prepararImpresionVentas.definition = {
    methods: ["post"],
    url: '/api/stock/preparar-impresion-ventas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresionVentas
 * @see app/Http/Controllers/Api/StockApiController.php:89
 * @route '/api/stock/preparar-impresion-ventas'
 */
prepararImpresionVentas.url = (options?: RouteQueryOptions) => {
    return prepararImpresionVentas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresionVentas
 * @see app/Http/Controllers/Api/StockApiController.php:89
 * @route '/api/stock/preparar-impresion-ventas'
 */
prepararImpresionVentas.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: prepararImpresionVentas.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresionVentas
 * @see app/Http/Controllers/Api/StockApiController.php:89
 * @route '/api/stock/preparar-impresion-ventas'
 */
    const prepararImpresionVentasForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: prepararImpresionVentas.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresionVentas
 * @see app/Http/Controllers/Api/StockApiController.php:89
 * @route '/api/stock/preparar-impresion-ventas'
 */
        prepararImpresionVentasForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: prepararImpresionVentas.url(options),
            method: 'post',
        })
    
    prepararImpresionVentas.form = prepararImpresionVentasForm
/**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresionCompras
 * @see app/Http/Controllers/Api/StockApiController.php:123
 * @route '/api/stock/preparar-impresion-compras'
 */
export const prepararImpresionCompras = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: prepararImpresionCompras.url(options),
    method: 'post',
})

prepararImpresionCompras.definition = {
    methods: ["post"],
    url: '/api/stock/preparar-impresion-compras',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresionCompras
 * @see app/Http/Controllers/Api/StockApiController.php:123
 * @route '/api/stock/preparar-impresion-compras'
 */
prepararImpresionCompras.url = (options?: RouteQueryOptions) => {
    return prepararImpresionCompras.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresionCompras
 * @see app/Http/Controllers/Api/StockApiController.php:123
 * @route '/api/stock/preparar-impresion-compras'
 */
prepararImpresionCompras.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: prepararImpresionCompras.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresionCompras
 * @see app/Http/Controllers/Api/StockApiController.php:123
 * @route '/api/stock/preparar-impresion-compras'
 */
    const prepararImpresionComprasForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: prepararImpresionCompras.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresionCompras
 * @see app/Http/Controllers/Api/StockApiController.php:123
 * @route '/api/stock/preparar-impresion-compras'
 */
        prepararImpresionComprasForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: prepararImpresionCompras.url(options),
            method: 'post',
        })
    
    prepararImpresionCompras.form = prepararImpresionComprasForm
/**
* @see \App\Http\Controllers\Api\StockApiController::destroy
 * @see app/Http/Controllers/Api/StockApiController.php:157
 * @route '/api/stock/productos/{id}'
 */
export const destroy = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/stock/productos/{id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\StockApiController::destroy
 * @see app/Http/Controllers/Api/StockApiController.php:157
 * @route '/api/stock/productos/{id}'
 */
destroy.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\StockApiController::destroy
 * @see app/Http/Controllers/Api/StockApiController.php:157
 * @route '/api/stock/productos/{id}'
 */
destroy.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Api\StockApiController::destroy
 * @see app/Http/Controllers/Api/StockApiController.php:157
 * @route '/api/stock/productos/{id}'
 */
    const destroyForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\StockApiController::destroy
 * @see app/Http/Controllers/Api/StockApiController.php:157
 * @route '/api/stock/productos/{id}'
 */
        destroyForm.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const StockApiController = { prepararImpresion, prepararImpresionMovimientos, prepararImpresionVentas, prepararImpresionCompras, destroy }

export default StockApiController