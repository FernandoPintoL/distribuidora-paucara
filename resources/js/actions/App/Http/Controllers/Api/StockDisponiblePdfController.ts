import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\StockDisponiblePdfController::generar
 * @see app/Http/Controllers/Api/StockDisponiblePdfController.php:34
 * @route '/api/app/stock/pdf'
 */
export const generar = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: generar.url(options),
    method: 'get',
})

generar.definition = {
    methods: ["get","head"],
    url: '/api/app/stock/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\StockDisponiblePdfController::generar
 * @see app/Http/Controllers/Api/StockDisponiblePdfController.php:34
 * @route '/api/app/stock/pdf'
 */
generar.url = (options?: RouteQueryOptions) => {
    return generar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\StockDisponiblePdfController::generar
 * @see app/Http/Controllers/Api/StockDisponiblePdfController.php:34
 * @route '/api/app/stock/pdf'
 */
generar.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: generar.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\StockDisponiblePdfController::generar
 * @see app/Http/Controllers/Api/StockDisponiblePdfController.php:34
 * @route '/api/app/stock/pdf'
 */
generar.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: generar.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\StockDisponiblePdfController::generar
 * @see app/Http/Controllers/Api/StockDisponiblePdfController.php:34
 * @route '/api/app/stock/pdf'
 */
    const generarForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: generar.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\StockDisponiblePdfController::generar
 * @see app/Http/Controllers/Api/StockDisponiblePdfController.php:34
 * @route '/api/app/stock/pdf'
 */
        generarForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: generar.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\StockDisponiblePdfController::generar
 * @see app/Http/Controllers/Api/StockDisponiblePdfController.php:34
 * @route '/api/app/stock/pdf'
 */
        generarForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: generar.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    generar.form = generarForm
const StockDisponiblePdfController = { generar }

export default StockDisponiblePdfController