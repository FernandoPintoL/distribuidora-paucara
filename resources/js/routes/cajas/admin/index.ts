import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
import cajas from './cajas'
import gastos from './gastos'
import auditoria from './auditoria'
/**
* @see \App\Http\Controllers\CajaController::dashboard
 * @see app/Http/Controllers/CajaController.php:451
 * @route '/cajas/admin/dashboard'
 */
export const dashboard = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

dashboard.definition = {
    methods: ["get","head"],
    url: '/cajas/admin/dashboard',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CajaController::dashboard
 * @see app/Http/Controllers/CajaController.php:451
 * @route '/cajas/admin/dashboard'
 */
dashboard.url = (options?: RouteQueryOptions) => {
    return dashboard.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::dashboard
 * @see app/Http/Controllers/CajaController.php:451
 * @route '/cajas/admin/dashboard'
 */
dashboard.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CajaController::dashboard
 * @see app/Http/Controllers/CajaController.php:451
 * @route '/cajas/admin/dashboard'
 */
dashboard.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboard.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CajaController::reportes
 * @see app/Http/Controllers/CajaController.php:524
 * @route '/cajas/admin/reportes'
 */
export const reportes = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportes.url(options),
    method: 'get',
})

reportes.definition = {
    methods: ["get","head"],
    url: '/cajas/admin/reportes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CajaController::reportes
 * @see app/Http/Controllers/CajaController.php:524
 * @route '/cajas/admin/reportes'
 */
reportes.url = (options?: RouteQueryOptions) => {
    return reportes.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::reportes
 * @see app/Http/Controllers/CajaController.php:524
 * @route '/cajas/admin/reportes'
 */
reportes.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportes.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CajaController::reportes
 * @see app/Http/Controllers/CajaController.php:524
 * @route '/cajas/admin/reportes'
 */
reportes.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reportes.url(options),
    method: 'head',
})
const admin = {
    dashboard,
cajas,
reportes,
gastos,
auditoria,
}

export default admin