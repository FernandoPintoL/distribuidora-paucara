import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Prestamos\StockController::stock
 * @see app/Http/Controllers/Prestamos/StockController.php:16
 * @route '/prestamos/stock'
 */
export const stock = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stock.url(options),
    method: 'get',
})

stock.definition = {
    methods: ["get","head"],
    url: '/prestamos/stock',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Prestamos\StockController::stock
 * @see app/Http/Controllers/Prestamos/StockController.php:16
 * @route '/prestamos/stock'
 */
stock.url = (options?: RouteQueryOptions) => {
    return stock.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Prestamos\StockController::stock
 * @see app/Http/Controllers/Prestamos/StockController.php:16
 * @route '/prestamos/stock'
 */
stock.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stock.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Prestamos\StockController::stock
 * @see app/Http/Controllers/Prestamos/StockController.php:16
 * @route '/prestamos/stock'
 */
stock.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: stock.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Prestamos\StockController::stock
 * @see app/Http/Controllers/Prestamos/StockController.php:16
 * @route '/prestamos/stock'
 */
    const stockForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: stock.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Prestamos\StockController::stock
 * @see app/Http/Controllers/Prestamos/StockController.php:16
 * @route '/prestamos/stock'
 */
        stockForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stock.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Prestamos\StockController::stock
 * @see app/Http/Controllers/Prestamos/StockController.php:16
 * @route '/prestamos/stock'
 */
        stockForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stock.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    stock.form = stockForm
const StockController = { stock }

export default StockController