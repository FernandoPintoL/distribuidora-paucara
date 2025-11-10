import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CuentaPorPagarController::index
* @see app/Http/Controllers/CuentaPorPagarController.php:11
* @route '/compras/cuentas-por-pagar'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/compras/cuentas-por-pagar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CuentaPorPagarController::index
* @see app/Http/Controllers/CuentaPorPagarController.php:11
* @route '/compras/cuentas-por-pagar'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorPagarController::index
* @see app/Http/Controllers/CuentaPorPagarController.php:11
* @route '/compras/cuentas-por-pagar'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::index
* @see app/Http/Controllers/CuentaPorPagarController.php:11
* @route '/compras/cuentas-por-pagar'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::index
* @see app/Http/Controllers/CuentaPorPagarController.php:11
* @route '/compras/cuentas-por-pagar'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::index
* @see app/Http/Controllers/CuentaPorPagarController.php:11
* @route '/compras/cuentas-por-pagar'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::index
* @see app/Http/Controllers/CuentaPorPagarController.php:11
* @route '/compras/cuentas-por-pagar'
*/
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\CuentaPorPagarController::exportMethod
* @see app/Http/Controllers/CuentaPorPagarController.php:95
* @route '/compras/cuentas-por-pagar/export'
*/
export const exportMethod = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

exportMethod.definition = {
    methods: ["get","head"],
    url: '/compras/cuentas-por-pagar/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CuentaPorPagarController::exportMethod
* @see app/Http/Controllers/CuentaPorPagarController.php:95
* @route '/compras/cuentas-por-pagar/export'
*/
exportMethod.url = (options?: RouteQueryOptions) => {
    return exportMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorPagarController::exportMethod
* @see app/Http/Controllers/CuentaPorPagarController.php:95
* @route '/compras/cuentas-por-pagar/export'
*/
exportMethod.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::exportMethod
* @see app/Http/Controllers/CuentaPorPagarController.php:95
* @route '/compras/cuentas-por-pagar/export'
*/
exportMethod.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::exportMethod
* @see app/Http/Controllers/CuentaPorPagarController.php:95
* @route '/compras/cuentas-por-pagar/export'
*/
const exportMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::exportMethod
* @see app/Http/Controllers/CuentaPorPagarController.php:95
* @route '/compras/cuentas-por-pagar/export'
*/
exportMethodForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::exportMethod
* @see app/Http/Controllers/CuentaPorPagarController.php:95
* @route '/compras/cuentas-por-pagar/export'
*/
exportMethodForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

exportMethod.form = exportMethodForm

/**
* @see \App\Http\Controllers\CuentaPorPagarController::show
* @see app/Http/Controllers/CuentaPorPagarController.php:73
* @route '/compras/cuentas-por-pagar/{cuenta}/show'
*/
export const show = (args: { cuenta: number | { id: number } } | [cuenta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/compras/cuentas-por-pagar/{cuenta}/show',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CuentaPorPagarController::show
* @see app/Http/Controllers/CuentaPorPagarController.php:73
* @route '/compras/cuentas-por-pagar/{cuenta}/show'
*/
show.url = (args: { cuenta: number | { id: number } } | [cuenta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cuenta: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { cuenta: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            cuenta: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        cuenta: typeof args.cuenta === 'object'
        ? args.cuenta.id
        : args.cuenta,
    }

    return show.definition.url
            .replace('{cuenta}', parsedArgs.cuenta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorPagarController::show
* @see app/Http/Controllers/CuentaPorPagarController.php:73
* @route '/compras/cuentas-por-pagar/{cuenta}/show'
*/
show.get = (args: { cuenta: number | { id: number } } | [cuenta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::show
* @see app/Http/Controllers/CuentaPorPagarController.php:73
* @route '/compras/cuentas-por-pagar/{cuenta}/show'
*/
show.head = (args: { cuenta: number | { id: number } } | [cuenta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::show
* @see app/Http/Controllers/CuentaPorPagarController.php:73
* @route '/compras/cuentas-por-pagar/{cuenta}/show'
*/
const showForm = (args: { cuenta: number | { id: number } } | [cuenta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::show
* @see app/Http/Controllers/CuentaPorPagarController.php:73
* @route '/compras/cuentas-por-pagar/{cuenta}/show'
*/
showForm.get = (args: { cuenta: number | { id: number } } | [cuenta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::show
* @see app/Http/Controllers/CuentaPorPagarController.php:73
* @route '/compras/cuentas-por-pagar/{cuenta}/show'
*/
showForm.head = (args: { cuenta: number | { id: number } } | [cuenta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\CuentaPorPagarController::actualizarEstado
* @see app/Http/Controllers/CuentaPorPagarController.php:82
* @route '/compras/cuentas-por-pagar/{cuenta}/estado'
*/
export const actualizarEstado = (args: { cuenta: number | { id: number } } | [cuenta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: actualizarEstado.url(args, options),
    method: 'patch',
})

actualizarEstado.definition = {
    methods: ["patch"],
    url: '/compras/cuentas-por-pagar/{cuenta}/estado',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\CuentaPorPagarController::actualizarEstado
* @see app/Http/Controllers/CuentaPorPagarController.php:82
* @route '/compras/cuentas-por-pagar/{cuenta}/estado'
*/
actualizarEstado.url = (args: { cuenta: number | { id: number } } | [cuenta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cuenta: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { cuenta: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            cuenta: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        cuenta: typeof args.cuenta === 'object'
        ? args.cuenta.id
        : args.cuenta,
    }

    return actualizarEstado.definition.url
            .replace('{cuenta}', parsedArgs.cuenta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorPagarController::actualizarEstado
* @see app/Http/Controllers/CuentaPorPagarController.php:82
* @route '/compras/cuentas-por-pagar/{cuenta}/estado'
*/
actualizarEstado.patch = (args: { cuenta: number | { id: number } } | [cuenta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: actualizarEstado.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::actualizarEstado
* @see app/Http/Controllers/CuentaPorPagarController.php:82
* @route '/compras/cuentas-por-pagar/{cuenta}/estado'
*/
const actualizarEstadoForm = (args: { cuenta: number | { id: number } } | [cuenta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: actualizarEstado.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::actualizarEstado
* @see app/Http/Controllers/CuentaPorPagarController.php:82
* @route '/compras/cuentas-por-pagar/{cuenta}/estado'
*/
actualizarEstadoForm.patch = (args: { cuenta: number | { id: number } } | [cuenta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: actualizarEstado.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

actualizarEstado.form = actualizarEstadoForm

const CuentaPorPagarController = { index, exportMethod, show, actualizarEstado, export: exportMethod }

export default CuentaPorPagarController