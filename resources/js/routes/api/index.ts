import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import proformas from './proformas'
import ventas from './ventas'
import envios from './envios'
import compras from './compras'
import productos from './productos'
import proveedores from './proveedores'
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
* @see \App\Http\Controllers\ModuloSidebarController::modulosSidebar
 * @see app/Http/Controllers/ModuloSidebarController.php:173
 * @route '/api/modulos-sidebar'
 */
    const modulosSidebarForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: modulosSidebar.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ModuloSidebarController::modulosSidebar
 * @see app/Http/Controllers/ModuloSidebarController.php:173
 * @route '/api/modulos-sidebar'
 */
        modulosSidebarForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: modulosSidebar.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ModuloSidebarController::modulosSidebar
 * @see app/Http/Controllers/ModuloSidebarController.php:173
 * @route '/api/modulos-sidebar'
 */
        modulosSidebarForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: modulosSidebar.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    modulosSidebar.form = modulosSidebarForm
const api = {
    modulosSidebar,
proformas,
ventas,
envios,
compras,
productos,
proveedores,
dashboard,
}

export default api