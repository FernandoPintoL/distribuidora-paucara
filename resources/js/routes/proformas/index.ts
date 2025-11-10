import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\ProformaController::index
* @see app/Http/Controllers/ProformaController.php:26
* @route '/proformas'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/proformas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProformaController::index
* @see app/Http/Controllers/ProformaController.php:26
* @route '/proformas'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::index
* @see app/Http/Controllers/ProformaController.php:26
* @route '/proformas'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProformaController::index
* @see app/Http/Controllers/ProformaController.php:26
* @route '/proformas'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProformaController::index
* @see app/Http/Controllers/ProformaController.php:26
* @route '/proformas'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProformaController::index
* @see app/Http/Controllers/ProformaController.php:26
* @route '/proformas'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProformaController::index
* @see app/Http/Controllers/ProformaController.php:26
* @route '/proformas'
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
* @see \App\Http\Controllers\ProformaController::show
* @see app/Http/Controllers/ProformaController.php:43
* @route '/proformas/{proforma}'
*/
export const show = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/proformas/{proforma}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProformaController::show
* @see app/Http/Controllers/ProformaController.php:43
* @route '/proformas/{proforma}'
*/
show.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { proforma: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            proforma: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        proforma: typeof args.proforma === 'object'
        ? args.proforma.id
        : args.proforma,
    }

    return show.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::show
* @see app/Http/Controllers/ProformaController.php:43
* @route '/proformas/{proforma}'
*/
show.get = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProformaController::show
* @see app/Http/Controllers/ProformaController.php:43
* @route '/proformas/{proforma}'
*/
show.head = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProformaController::show
* @see app/Http/Controllers/ProformaController.php:43
* @route '/proformas/{proforma}'
*/
const showForm = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProformaController::show
* @see app/Http/Controllers/ProformaController.php:43
* @route '/proformas/{proforma}'
*/
showForm.get = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProformaController::show
* @see app/Http/Controllers/ProformaController.php:43
* @route '/proformas/{proforma}'
*/
showForm.head = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\ProformaController::aprobar
* @see app/Http/Controllers/ProformaController.php:59
* @route '/proformas/{proforma}/aprobar'
*/
export const aprobar = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: aprobar.url(args, options),
    method: 'post',
})

aprobar.definition = {
    methods: ["post"],
    url: '/proformas/{proforma}/aprobar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProformaController::aprobar
* @see app/Http/Controllers/ProformaController.php:59
* @route '/proformas/{proforma}/aprobar'
*/
aprobar.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { proforma: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            proforma: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        proforma: typeof args.proforma === 'object'
        ? args.proforma.id
        : args.proforma,
    }

    return aprobar.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::aprobar
* @see app/Http/Controllers/ProformaController.php:59
* @route '/proformas/{proforma}/aprobar'
*/
aprobar.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: aprobar.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProformaController::aprobar
* @see app/Http/Controllers/ProformaController.php:59
* @route '/proformas/{proforma}/aprobar'
*/
const aprobarForm = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: aprobar.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProformaController::aprobar
* @see app/Http/Controllers/ProformaController.php:59
* @route '/proformas/{proforma}/aprobar'
*/
aprobarForm.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: aprobar.url(args, options),
    method: 'post',
})

aprobar.form = aprobarForm

/**
* @see \App\Http\Controllers\ProformaController::rechazar
* @see app/Http/Controllers/ProformaController.php:83
* @route '/proformas/{proforma}/rechazar'
*/
export const rechazar = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rechazar.url(args, options),
    method: 'post',
})

rechazar.definition = {
    methods: ["post"],
    url: '/proformas/{proforma}/rechazar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProformaController::rechazar
* @see app/Http/Controllers/ProformaController.php:83
* @route '/proformas/{proforma}/rechazar'
*/
rechazar.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { proforma: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            proforma: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        proforma: typeof args.proforma === 'object'
        ? args.proforma.id
        : args.proforma,
    }

    return rechazar.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::rechazar
* @see app/Http/Controllers/ProformaController.php:83
* @route '/proformas/{proforma}/rechazar'
*/
rechazar.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rechazar.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProformaController::rechazar
* @see app/Http/Controllers/ProformaController.php:83
* @route '/proformas/{proforma}/rechazar'
*/
const rechazarForm = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: rechazar.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProformaController::rechazar
* @see app/Http/Controllers/ProformaController.php:83
* @route '/proformas/{proforma}/rechazar'
*/
rechazarForm.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: rechazar.url(args, options),
    method: 'post',
})

rechazar.form = rechazarForm

/**
* @see \App\Http\Controllers\ProformaController::convertirVenta
* @see app/Http/Controllers/ProformaController.php:121
* @route '/proformas/{proforma}/convertir-venta'
*/
export const convertirVenta = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: convertirVenta.url(args, options),
    method: 'post',
})

convertirVenta.definition = {
    methods: ["post"],
    url: '/proformas/{proforma}/convertir-venta',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProformaController::convertirVenta
* @see app/Http/Controllers/ProformaController.php:121
* @route '/proformas/{proforma}/convertir-venta'
*/
convertirVenta.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { proforma: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            proforma: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        proforma: typeof args.proforma === 'object'
        ? args.proforma.id
        : args.proforma,
    }

    return convertirVenta.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::convertirVenta
* @see app/Http/Controllers/ProformaController.php:121
* @route '/proformas/{proforma}/convertir-venta'
*/
convertirVenta.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: convertirVenta.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProformaController::convertirVenta
* @see app/Http/Controllers/ProformaController.php:121
* @route '/proformas/{proforma}/convertir-venta'
*/
const convertirVentaForm = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: convertirVenta.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProformaController::convertirVenta
* @see app/Http/Controllers/ProformaController.php:121
* @route '/proformas/{proforma}/convertir-venta'
*/
convertirVentaForm.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: convertirVenta.url(args, options),
    method: 'post',
})

convertirVenta.form = convertirVentaForm

const proformas = {
    index,
    show,
    aprobar,
    rechazar,
    convertirVenta,
}

export default proformas