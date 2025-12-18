import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
import envios from './envios'
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
 * @see routes/web.php:313
 * @route '/logistica/entregas-asignadas'
 */
export const entregasAsignadas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: entregasAsignadas.url(options),
    method: 'get',
})

entregasAsignadas.definition = {
    methods: ["get","head"],
    url: '/logistica/entregas-asignadas',
} satisfies RouteDefinition<["get","head"]>

/**
 * @see routes/web.php:313
 * @route '/logistica/entregas-asignadas'
 */
entregasAsignadas.url = (options?: RouteQueryOptions) => {
    return entregasAsignadas.definition.url + queryParams(options)
}

/**
 * @see routes/web.php:313
 * @route '/logistica/entregas-asignadas'
 */
entregasAsignadas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: entregasAsignadas.url(options),
    method: 'get',
})
/**
 * @see routes/web.php:313
 * @route '/logistica/entregas-asignadas'
 */
entregasAsignadas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: entregasAsignadas.url(options),
    method: 'head',
})

/**
 * @see routes/web.php:314
 * @route '/logistica/entregas-en-transito'
 */
export const entregasEnTransito = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: entregasEnTransito.url(options),
    method: 'get',
})

entregasEnTransito.definition = {
    methods: ["get","head"],
    url: '/logistica/entregas-en-transito',
} satisfies RouteDefinition<["get","head"]>

/**
 * @see routes/web.php:314
 * @route '/logistica/entregas-en-transito'
 */
entregasEnTransito.url = (options?: RouteQueryOptions) => {
    return entregasEnTransito.definition.url + queryParams(options)
}

/**
 * @see routes/web.php:314
 * @route '/logistica/entregas-en-transito'
 */
entregasEnTransito.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: entregasEnTransito.url(options),
    method: 'get',
})
/**
 * @see routes/web.php:314
 * @route '/logistica/entregas-en-transito'
 */
entregasEnTransito.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: entregasEnTransito.url(options),
    method: 'head',
})

/**
 * @see routes/web.php:315
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
 * @see routes/web.php:315
 * @route '/logistica/proformas-pendientes'
 */
proformasPendientes.url = (options?: RouteQueryOptions) => {
    return proformasPendientes.definition.url + queryParams(options)
}

/**
 * @see routes/web.php:315
 * @route '/logistica/proformas-pendientes'
 */
proformasPendientes.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: proformasPendientes.url(options),
    method: 'get',
})
/**
 * @see routes/web.php:315
 * @route '/logistica/proformas-pendientes'
 */
proformasPendientes.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: proformasPendientes.url(options),
    method: 'head',
})
const logistica = {
    dashboard,
entregasAsignadas,
entregasEnTransito,
proformasPendientes,
envios,
}

export default logistica