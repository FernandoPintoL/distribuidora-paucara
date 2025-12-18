import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
import modulosSidebar from './modulos-sidebar'
import proformas from './proformas'
import ventas from './ventas'
import envios from './envios'
import compras from './compras'
import productos from './productos'
import proveedores from './proveedores'
import cajas from './cajas'
import dashboard from './dashboard'
/**
* @see \App\Http\Controllers\ModuloSidebarController::modulosSidebar
 * @see app/Http/Controllers/ModuloSidebarController.php:173
 * @route '/api/modulos-sidebar'
 */
export const modulosSidebar = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: modulosSidebar.url(options),
    method: 'get',
})

modulosSidebar.definition = {
    methods: ["get","head"],
    url: '/api/modulos-sidebar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ModuloSidebarController::modulosSidebar
 * @see app/Http/Controllers/ModuloSidebarController.php:173
 * @route '/api/modulos-sidebar'
 */
modulosSidebar.url = (options?: RouteQueryOptions) => {
    return modulosSidebar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ModuloSidebarController::modulosSidebar
 * @see app/Http/Controllers/ModuloSidebarController.php:173
 * @route '/api/modulos-sidebar'
 */
modulosSidebar.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: modulosSidebar.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ModuloSidebarController::modulosSidebar
 * @see app/Http/Controllers/ModuloSidebarController.php:173
 * @route '/api/modulos-sidebar'
 */
modulosSidebar.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: modulosSidebar.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Auth\DashboardRedirectController::dashboardRedirect
 * @see app/Http/Controllers/Auth/DashboardRedirectController.php:62
 * @route '/api/dashboard-redirect'
 */
export const dashboardRedirect = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboardRedirect.url(options),
    method: 'get',
})

dashboardRedirect.definition = {
    methods: ["get","head"],
    url: '/api/dashboard-redirect',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\DashboardRedirectController::dashboardRedirect
 * @see app/Http/Controllers/Auth/DashboardRedirectController.php:62
 * @route '/api/dashboard-redirect'
 */
dashboardRedirect.url = (options?: RouteQueryOptions) => {
    return dashboardRedirect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\DashboardRedirectController::dashboardRedirect
 * @see app/Http/Controllers/Auth/DashboardRedirectController.php:62
 * @route '/api/dashboard-redirect'
 */
dashboardRedirect.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboardRedirect.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Auth\DashboardRedirectController::dashboardRedirect
 * @see app/Http/Controllers/Auth/DashboardRedirectController.php:62
 * @route '/api/dashboard-redirect'
 */
dashboardRedirect.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboardRedirect.url(options),
    method: 'head',
})
const api = {
    modulosSidebar,
dashboardRedirect,
proformas,
ventas,
envios,
compras,
productos,
proveedores,
cajas,
dashboard,
}

export default api