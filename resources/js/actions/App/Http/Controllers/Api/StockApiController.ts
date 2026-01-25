import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresion
 * @see app/Http/Controllers/Api/StockApiController.php:17
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
 * @see app/Http/Controllers/Api/StockApiController.php:17
 * @route '/api/stock/preparar-impresion'
 */
prepararImpresion.url = (options?: RouteQueryOptions) => {
    return prepararImpresion.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresion
 * @see app/Http/Controllers/Api/StockApiController.php:17
 * @route '/api/stock/preparar-impresion'
 */
prepararImpresion.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: prepararImpresion.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresion
 * @see app/Http/Controllers/Api/StockApiController.php:17
 * @route '/api/stock/preparar-impresion'
 */
    const prepararImpresionForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: prepararImpresion.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\StockApiController::prepararImpresion
 * @see app/Http/Controllers/Api/StockApiController.php:17
 * @route '/api/stock/preparar-impresion'
 */
        prepararImpresionForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: prepararImpresion.url(options),
            method: 'post',
        })
    
    prepararImpresion.form = prepararImpresionForm
const StockApiController = { prepararImpresion }

export default StockApiController