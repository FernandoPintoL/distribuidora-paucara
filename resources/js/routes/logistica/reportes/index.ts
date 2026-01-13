import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ReporteCargoListController::index
 * @see app/Http/Controllers/ReporteCargoListController.php:31
 * @route '/logistica/reportes'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/logistica/reportes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteCargoListController::index
 * @see app/Http/Controllers/ReporteCargoListController.php:31
 * @route '/logistica/reportes'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteCargoListController::index
 * @see app/Http/Controllers/ReporteCargoListController.php:31
 * @route '/logistica/reportes'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteCargoListController::index
 * @see app/Http/Controllers/ReporteCargoListController.php:31
 * @route '/logistica/reportes'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})
const reportes = {
    index,
}

export default reportes