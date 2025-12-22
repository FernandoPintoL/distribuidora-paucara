import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import envios from './envios'
import entregas from './entregas'
/**
* @see \App\Http\Controllers\Web\LogisticaController::dashboard
 * @see app/Http/Controllers/Web/LogisticaController.php:14
 * @route '/logistica/dashboard'
 */
export const dashboard = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

dashboard.definition = {
    methods: ["get","head"],
    url: '/logistica/dashboard',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Web\LogisticaController::dashboard
 * @see app/Http/Controllers/Web/LogisticaController.php:14
 * @route '/logistica/dashboard'
 */
dashboard.url = (options?: RouteQueryOptions) => {
    return dashboard.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Web\LogisticaController::dashboard
 * @see app/Http/Controllers/Web/LogisticaController.php:14
 * @route '/logistica/dashboard'
 */
dashboard.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Web\LogisticaController::dashboard
 * @see app/Http/Controllers/Web/LogisticaController.php:14
 * @route '/logistica/dashboard'
 */
dashboard.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboard.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Web\LogisticaController::dashboard
 * @see app/Http/Controllers/Web/LogisticaController.php:14
 * @route '/logistica/dashboard'
 */
    const dashboardForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: dashboard.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Web\LogisticaController::dashboard
 * @see app/Http/Controllers/Web/LogisticaController.php:14
 * @route '/logistica/dashboard'
 */
        dashboardForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboard.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Web\LogisticaController::dashboard
 * @see app/Http/Controllers/Web/LogisticaController.php:14
 * @route '/logistica/dashboard'
 */
        dashboardForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboard.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    dashboard.form = dashboardForm
/**
 * @see routes/web.php:341
 * @route '/logistica/proformas-pendientes'
 */
export const proformasPendientes = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: proformasPendientes.url(options),
    method: 'get',
})

proformasPendientes.definition = {
    methods: ["get","head"],
    url: '/logistica/proformas-pendientes',
} satisfies RouteDefinition<["get","head"]>

/**
 * @see routes/web.php:341
 * @route '/logistica/proformas-pendientes'
 */
proformasPendientes.url = (options?: RouteQueryOptions) => {
    return proformasPendientes.definition.url + queryParams(options)
}

/**
 * @see routes/web.php:341
 * @route '/logistica/proformas-pendientes'
 */
proformasPendientes.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: proformasPendientes.url(options),
    method: 'get',
})
/**
 * @see routes/web.php:341
 * @route '/logistica/proformas-pendientes'
 */
proformasPendientes.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: proformasPendientes.url(options),
    method: 'head',
})

    /**
 * @see routes/web.php:341
 * @route '/logistica/proformas-pendientes'
 */
    const proformasPendientesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: proformasPendientes.url(options),
        method: 'get',
    })

            /**
 * @see routes/web.php:341
 * @route '/logistica/proformas-pendientes'
 */
        proformasPendientesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: proformasPendientes.url(options),
            method: 'get',
        })
            /**
 * @see routes/web.php:341
 * @route '/logistica/proformas-pendientes'
 */
        proformasPendientesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: proformasPendientes.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    proformasPendientes.form = proformasPendientesForm
const logistica = {
    dashboard,
proformasPendientes,
envios,
entregas,
}

export default logistica