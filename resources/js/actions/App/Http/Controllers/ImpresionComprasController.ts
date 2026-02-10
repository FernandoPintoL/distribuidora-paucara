import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ImpresionComprasController::imprimir
 * @see app/Http/Controllers/ImpresionComprasController.php:15
 * @route '/compras/imprimir'
 */
export const imprimir = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir.url(options),
    method: 'get',
})

imprimir.definition = {
    methods: ["get","head"],
    url: '/compras/imprimir',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ImpresionComprasController::imprimir
 * @see app/Http/Controllers/ImpresionComprasController.php:15
 * @route '/compras/imprimir'
 */
imprimir.url = (options?: RouteQueryOptions) => {
    return imprimir.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ImpresionComprasController::imprimir
 * @see app/Http/Controllers/ImpresionComprasController.php:15
 * @route '/compras/imprimir'
 */
imprimir.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ImpresionComprasController::imprimir
 * @see app/Http/Controllers/ImpresionComprasController.php:15
 * @route '/compras/imprimir'
 */
imprimir.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imprimir.url(options),
    method: 'head',
})
const ImpresionComprasController = { imprimir }

export default ImpresionComprasController