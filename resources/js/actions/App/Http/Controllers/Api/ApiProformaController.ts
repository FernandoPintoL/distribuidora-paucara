import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ApiProformaController::index
 * @see app/Http/Controllers/Api/ApiProformaController.php:213
 * @route '/api/app/proformas'
 */
const index8e5404904beaaacada5639c9e20012eb = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index8e5404904beaaacada5639c9e20012eb.url(options),
    method: 'get',
})

index8e5404904beaaacada5639c9e20012eb.definition = {
    methods: ["get","head"],
    url: '/api/app/proformas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::index
 * @see app/Http/Controllers/Api/ApiProformaController.php:213
 * @route '/api/app/proformas'
 */
index8e5404904beaaacada5639c9e20012eb.url = (options?: RouteQueryOptions) => {
    return index8e5404904beaaacada5639c9e20012eb.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::index
 * @see app/Http/Controllers/Api/ApiProformaController.php:213
 * @route '/api/app/proformas'
 */
index8e5404904beaaacada5639c9e20012eb.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index8e5404904beaaacada5639c9e20012eb.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::index
 * @see app/Http/Controllers/Api/ApiProformaController.php:213
 * @route '/api/app/proformas'
 */
index8e5404904beaaacada5639c9e20012eb.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index8e5404904beaaacada5639c9e20012eb.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::index
 * @see app/Http/Controllers/Api/ApiProformaController.php:213
 * @route '/api/app/proformas'
 */
    const index8e5404904beaaacada5639c9e20012ebForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index8e5404904beaaacada5639c9e20012eb.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::index
 * @see app/Http/Controllers/Api/ApiProformaController.php:213
 * @route '/api/app/proformas'
 */
        index8e5404904beaaacada5639c9e20012ebForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index8e5404904beaaacada5639c9e20012eb.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiProformaController::index
 * @see app/Http/Controllers/Api/ApiProformaController.php:213
 * @route '/api/app/proformas'
 */
        index8e5404904beaaacada5639c9e20012ebForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index8e5404904beaaacada5639c9e20012eb.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index8e5404904beaaacada5639c9e20012eb.form = index8e5404904beaaacada5639c9e20012ebForm
    /**
* @see \App\Http\Controllers\Api\ApiProformaController::index
 * @see app/Http/Controllers/Api/ApiProformaController.php:213
 * @route '/api/app/cliente/proformas'
 */
const indexc175cf0673adc5a04733fddc997f2541 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexc175cf0673adc5a04733fddc997f2541.url(options),
    method: 'get',
})

indexc175cf0673adc5a04733fddc997f2541.definition = {
    methods: ["get","head"],
    url: '/api/app/cliente/proformas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::index
 * @see app/Http/Controllers/Api/ApiProformaController.php:213
 * @route '/api/app/cliente/proformas'
 */
indexc175cf0673adc5a04733fddc997f2541.url = (options?: RouteQueryOptions) => {
    return indexc175cf0673adc5a04733fddc997f2541.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::index
 * @see app/Http/Controllers/Api/ApiProformaController.php:213
 * @route '/api/app/cliente/proformas'
 */
indexc175cf0673adc5a04733fddc997f2541.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexc175cf0673adc5a04733fddc997f2541.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::index
 * @see app/Http/Controllers/Api/ApiProformaController.php:213
 * @route '/api/app/cliente/proformas'
 */
indexc175cf0673adc5a04733fddc997f2541.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: indexc175cf0673adc5a04733fddc997f2541.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::index
 * @see app/Http/Controllers/Api/ApiProformaController.php:213
 * @route '/api/app/cliente/proformas'
 */
    const indexc175cf0673adc5a04733fddc997f2541Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: indexc175cf0673adc5a04733fddc997f2541.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::index
 * @see app/Http/Controllers/Api/ApiProformaController.php:213
 * @route '/api/app/cliente/proformas'
 */
        indexc175cf0673adc5a04733fddc997f2541Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: indexc175cf0673adc5a04733fddc997f2541.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiProformaController::index
 * @see app/Http/Controllers/Api/ApiProformaController.php:213
 * @route '/api/app/cliente/proformas'
 */
        indexc175cf0673adc5a04733fddc997f2541Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: indexc175cf0673adc5a04733fddc997f2541.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    indexc175cf0673adc5a04733fddc997f2541.form = indexc175cf0673adc5a04733fddc997f2541Form

export const index = {
    '/api/app/proformas': index8e5404904beaaacada5639c9e20012eb,
    '/api/app/cliente/proformas': indexc175cf0673adc5a04733fddc997f2541,
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::store
 * @see app/Http/Controllers/Api/ApiProformaController.php:21
 * @route '/api/app/proformas'
 */
const store8e5404904beaaacada5639c9e20012eb = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store8e5404904beaaacada5639c9e20012eb.url(options),
    method: 'post',
})

store8e5404904beaaacada5639c9e20012eb.definition = {
    methods: ["post"],
    url: '/api/app/proformas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::store
 * @see app/Http/Controllers/Api/ApiProformaController.php:21
 * @route '/api/app/proformas'
 */
store8e5404904beaaacada5639c9e20012eb.url = (options?: RouteQueryOptions) => {
    return store8e5404904beaaacada5639c9e20012eb.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::store
 * @see app/Http/Controllers/Api/ApiProformaController.php:21
 * @route '/api/app/proformas'
 */
store8e5404904beaaacada5639c9e20012eb.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store8e5404904beaaacada5639c9e20012eb.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::store
 * @see app/Http/Controllers/Api/ApiProformaController.php:21
 * @route '/api/app/proformas'
 */
    const store8e5404904beaaacada5639c9e20012ebForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store8e5404904beaaacada5639c9e20012eb.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::store
 * @see app/Http/Controllers/Api/ApiProformaController.php:21
 * @route '/api/app/proformas'
 */
        store8e5404904beaaacada5639c9e20012ebForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store8e5404904beaaacada5639c9e20012eb.url(options),
            method: 'post',
        })
    
    store8e5404904beaaacada5639c9e20012eb.form = store8e5404904beaaacada5639c9e20012ebForm
    /**
* @see \App\Http\Controllers\Api\ApiProformaController::store
 * @see app/Http/Controllers/Api/ApiProformaController.php:21
 * @route '/api/proformas'
 */
const storeb8aa526a3518a568541711d2eb6719c7 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeb8aa526a3518a568541711d2eb6719c7.url(options),
    method: 'post',
})

storeb8aa526a3518a568541711d2eb6719c7.definition = {
    methods: ["post"],
    url: '/api/proformas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::store
 * @see app/Http/Controllers/Api/ApiProformaController.php:21
 * @route '/api/proformas'
 */
storeb8aa526a3518a568541711d2eb6719c7.url = (options?: RouteQueryOptions) => {
    return storeb8aa526a3518a568541711d2eb6719c7.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::store
 * @see app/Http/Controllers/Api/ApiProformaController.php:21
 * @route '/api/proformas'
 */
storeb8aa526a3518a568541711d2eb6719c7.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeb8aa526a3518a568541711d2eb6719c7.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::store
 * @see app/Http/Controllers/Api/ApiProformaController.php:21
 * @route '/api/proformas'
 */
    const storeb8aa526a3518a568541711d2eb6719c7Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeb8aa526a3518a568541711d2eb6719c7.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::store
 * @see app/Http/Controllers/Api/ApiProformaController.php:21
 * @route '/api/proformas'
 */
        storeb8aa526a3518a568541711d2eb6719c7Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeb8aa526a3518a568541711d2eb6719c7.url(options),
            method: 'post',
        })
    
    storeb8aa526a3518a568541711d2eb6719c7.form = storeb8aa526a3518a568541711d2eb6719c7Form

export const store = {
    '/api/app/proformas': store8e5404904beaaacada5639c9e20012eb,
    '/api/proformas': storeb8aa526a3518a568541711d2eb6719c7,
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::show
 * @see app/Http/Controllers/Api/ApiProformaController.php:195
 * @route '/api/app/proformas/{proforma}'
 */
export const show = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/app/proformas/{proforma}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::show
 * @see app/Http/Controllers/Api/ApiProformaController.php:195
 * @route '/api/app/proformas/{proforma}'
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
* @see \App\Http\Controllers\Api\ApiProformaController::show
 * @see app/Http/Controllers/Api/ApiProformaController.php:195
 * @route '/api/app/proformas/{proforma}'
 */
show.get = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::show
 * @see app/Http/Controllers/Api/ApiProformaController.php:195
 * @route '/api/app/proformas/{proforma}'
 */
show.head = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::show
 * @see app/Http/Controllers/Api/ApiProformaController.php:195
 * @route '/api/app/proformas/{proforma}'
 */
    const showForm = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::show
 * @see app/Http/Controllers/Api/ApiProformaController.php:195
 * @route '/api/app/proformas/{proforma}'
 */
        showForm.get = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiProformaController::show
 * @see app/Http/Controllers/Api/ApiProformaController.php:195
 * @route '/api/app/proformas/{proforma}'
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
* @see \App\Http\Controllers\Api\ApiProformaController::verificarEstado
 * @see app/Http/Controllers/Api/ApiProformaController.php:245
 * @route '/api/app/proformas/{proforma}/estado'
 */
export const verificarEstado = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verificarEstado.url(args, options),
    method: 'get',
})

verificarEstado.definition = {
    methods: ["get","head"],
    url: '/api/app/proformas/{proforma}/estado',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarEstado
 * @see app/Http/Controllers/Api/ApiProformaController.php:245
 * @route '/api/app/proformas/{proforma}/estado'
 */
verificarEstado.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return verificarEstado.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarEstado
 * @see app/Http/Controllers/Api/ApiProformaController.php:245
 * @route '/api/app/proformas/{proforma}/estado'
 */
verificarEstado.get = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verificarEstado.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarEstado
 * @see app/Http/Controllers/Api/ApiProformaController.php:245
 * @route '/api/app/proformas/{proforma}/estado'
 */
verificarEstado.head = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: verificarEstado.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarEstado
 * @see app/Http/Controllers/Api/ApiProformaController.php:245
 * @route '/api/app/proformas/{proforma}/estado'
 */
    const verificarEstadoForm = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: verificarEstado.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarEstado
 * @see app/Http/Controllers/Api/ApiProformaController.php:245
 * @route '/api/app/proformas/{proforma}/estado'
 */
        verificarEstadoForm.get = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: verificarEstado.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarEstado
 * @see app/Http/Controllers/Api/ApiProformaController.php:245
 * @route '/api/app/proformas/{proforma}/estado'
 */
        verificarEstadoForm.head = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: verificarEstado.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    verificarEstado.form = verificarEstadoForm
/**
* @see \App\Http\Controllers\Api\ApiProformaController::confirmarProforma
 * @see app/Http/Controllers/Api/ApiProformaController.php:1240
 * @route '/api/app/proformas/{proforma}/confirmar'
 */
export const confirmarProforma = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarProforma.url(args, options),
    method: 'post',
})

confirmarProforma.definition = {
    methods: ["post"],
    url: '/api/app/proformas/{proforma}/confirmar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::confirmarProforma
 * @see app/Http/Controllers/Api/ApiProformaController.php:1240
 * @route '/api/app/proformas/{proforma}/confirmar'
 */
confirmarProforma.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return confirmarProforma.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::confirmarProforma
 * @see app/Http/Controllers/Api/ApiProformaController.php:1240
 * @route '/api/app/proformas/{proforma}/confirmar'
 */
confirmarProforma.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarProforma.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::confirmarProforma
 * @see app/Http/Controllers/Api/ApiProformaController.php:1240
 * @route '/api/app/proformas/{proforma}/confirmar'
 */
    const confirmarProformaForm = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: confirmarProforma.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::confirmarProforma
 * @see app/Http/Controllers/Api/ApiProformaController.php:1240
 * @route '/api/app/proformas/{proforma}/confirmar'
 */
        confirmarProformaForm.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: confirmarProforma.url(args, options),
            method: 'post',
        })
    
    confirmarProforma.form = confirmarProformaForm
/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarReservas
 * @see app/Http/Controllers/Api/ApiProformaController.php:518
 * @route '/api/app/proformas/{proforma}/reservas'
 */
export const verificarReservas = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verificarReservas.url(args, options),
    method: 'get',
})

verificarReservas.definition = {
    methods: ["get","head"],
    url: '/api/app/proformas/{proforma}/reservas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarReservas
 * @see app/Http/Controllers/Api/ApiProformaController.php:518
 * @route '/api/app/proformas/{proforma}/reservas'
 */
verificarReservas.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return verificarReservas.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarReservas
 * @see app/Http/Controllers/Api/ApiProformaController.php:518
 * @route '/api/app/proformas/{proforma}/reservas'
 */
verificarReservas.get = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verificarReservas.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarReservas
 * @see app/Http/Controllers/Api/ApiProformaController.php:518
 * @route '/api/app/proformas/{proforma}/reservas'
 */
verificarReservas.head = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: verificarReservas.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarReservas
 * @see app/Http/Controllers/Api/ApiProformaController.php:518
 * @route '/api/app/proformas/{proforma}/reservas'
 */
    const verificarReservasForm = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: verificarReservas.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarReservas
 * @see app/Http/Controllers/Api/ApiProformaController.php:518
 * @route '/api/app/proformas/{proforma}/reservas'
 */
        verificarReservasForm.get = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: verificarReservas.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarReservas
 * @see app/Http/Controllers/Api/ApiProformaController.php:518
 * @route '/api/app/proformas/{proforma}/reservas'
 */
        verificarReservasForm.head = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: verificarReservas.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    verificarReservas.form = verificarReservasForm
/**
* @see \App\Http\Controllers\Api\ApiProformaController::extenderReservas
 * @see app/Http/Controllers/Api/ApiProformaController.php:545
 * @route '/api/app/proformas/{proforma}/extender-reservas'
 */
export const extenderReservas = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: extenderReservas.url(args, options),
    method: 'post',
})

extenderReservas.definition = {
    methods: ["post"],
    url: '/api/app/proformas/{proforma}/extender-reservas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::extenderReservas
 * @see app/Http/Controllers/Api/ApiProformaController.php:545
 * @route '/api/app/proformas/{proforma}/extender-reservas'
 */
extenderReservas.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return extenderReservas.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::extenderReservas
 * @see app/Http/Controllers/Api/ApiProformaController.php:545
 * @route '/api/app/proformas/{proforma}/extender-reservas'
 */
extenderReservas.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: extenderReservas.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::extenderReservas
 * @see app/Http/Controllers/Api/ApiProformaController.php:545
 * @route '/api/app/proformas/{proforma}/extender-reservas'
 */
    const extenderReservasForm = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: extenderReservas.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::extenderReservas
 * @see app/Http/Controllers/Api/ApiProformaController.php:545
 * @route '/api/app/proformas/{proforma}/extender-reservas'
 */
        extenderReservasForm.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: extenderReservas.url(args, options),
            method: 'post',
        })
    
    extenderReservas.form = extenderReservasForm
/**
* @see \App\Http\Controllers\Api\ApiProformaController::crearPedidoDesdeApp
 * @see app/Http/Controllers/Api/ApiProformaController.php:590
 * @route '/api/app/pedidos'
 */
export const crearPedidoDesdeApp = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearPedidoDesdeApp.url(options),
    method: 'post',
})

crearPedidoDesdeApp.definition = {
    methods: ["post"],
    url: '/api/app/pedidos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::crearPedidoDesdeApp
 * @see app/Http/Controllers/Api/ApiProformaController.php:590
 * @route '/api/app/pedidos'
 */
crearPedidoDesdeApp.url = (options?: RouteQueryOptions) => {
    return crearPedidoDesdeApp.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::crearPedidoDesdeApp
 * @see app/Http/Controllers/Api/ApiProformaController.php:590
 * @route '/api/app/pedidos'
 */
crearPedidoDesdeApp.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearPedidoDesdeApp.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::crearPedidoDesdeApp
 * @see app/Http/Controllers/Api/ApiProformaController.php:590
 * @route '/api/app/pedidos'
 */
    const crearPedidoDesdeAppForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: crearPedidoDesdeApp.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::crearPedidoDesdeApp
 * @see app/Http/Controllers/Api/ApiProformaController.php:590
 * @route '/api/app/pedidos'
 */
        crearPedidoDesdeAppForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: crearPedidoDesdeApp.url(options),
            method: 'post',
        })
    
    crearPedidoDesdeApp.form = crearPedidoDesdeAppForm
/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerDetallePedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:978
 * @route '/api/app/pedidos/{id}'
 */
export const obtenerDetallePedido = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerDetallePedido.url(args, options),
    method: 'get',
})

obtenerDetallePedido.definition = {
    methods: ["get","head"],
    url: '/api/app/pedidos/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerDetallePedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:978
 * @route '/api/app/pedidos/{id}'
 */
obtenerDetallePedido.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return obtenerDetallePedido.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerDetallePedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:978
 * @route '/api/app/pedidos/{id}'
 */
obtenerDetallePedido.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerDetallePedido.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerDetallePedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:978
 * @route '/api/app/pedidos/{id}'
 */
obtenerDetallePedido.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerDetallePedido.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerDetallePedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:978
 * @route '/api/app/pedidos/{id}'
 */
    const obtenerDetallePedidoForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerDetallePedido.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerDetallePedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:978
 * @route '/api/app/pedidos/{id}'
 */
        obtenerDetallePedidoForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerDetallePedido.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerDetallePedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:978
 * @route '/api/app/pedidos/{id}'
 */
        obtenerDetallePedidoForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerDetallePedido.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerDetallePedido.form = obtenerDetallePedidoForm
/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerEstadoPedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:1105
 * @route '/api/app/pedidos/{id}/estado'
 */
export const obtenerEstadoPedido = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerEstadoPedido.url(args, options),
    method: 'get',
})

obtenerEstadoPedido.definition = {
    methods: ["get","head"],
    url: '/api/app/pedidos/{id}/estado',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerEstadoPedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:1105
 * @route '/api/app/pedidos/{id}/estado'
 */
obtenerEstadoPedido.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return obtenerEstadoPedido.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerEstadoPedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:1105
 * @route '/api/app/pedidos/{id}/estado'
 */
obtenerEstadoPedido.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerEstadoPedido.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerEstadoPedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:1105
 * @route '/api/app/pedidos/{id}/estado'
 */
obtenerEstadoPedido.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerEstadoPedido.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerEstadoPedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:1105
 * @route '/api/app/pedidos/{id}/estado'
 */
    const obtenerEstadoPedidoForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerEstadoPedido.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerEstadoPedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:1105
 * @route '/api/app/pedidos/{id}/estado'
 */
        obtenerEstadoPedidoForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerEstadoPedido.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerEstadoPedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:1105
 * @route '/api/app/pedidos/{id}/estado'
 */
        obtenerEstadoPedidoForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerEstadoPedido.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerEstadoPedido.form = obtenerEstadoPedidoForm
/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerUltimoCarrito
 * @see app/Http/Controllers/Api/ApiProformaController.php:1586
 * @route '/api/carritos/usuario/{usuarioId}/ultimo'
 */
export const obtenerUltimoCarrito = (args: { usuarioId: string | number } | [usuarioId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerUltimoCarrito.url(args, options),
    method: 'get',
})

obtenerUltimoCarrito.definition = {
    methods: ["get","head"],
    url: '/api/carritos/usuario/{usuarioId}/ultimo',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerUltimoCarrito
 * @see app/Http/Controllers/Api/ApiProformaController.php:1586
 * @route '/api/carritos/usuario/{usuarioId}/ultimo'
 */
obtenerUltimoCarrito.url = (args: { usuarioId: string | number } | [usuarioId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { usuarioId: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    usuarioId: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        usuarioId: args.usuarioId,
                }

    return obtenerUltimoCarrito.definition.url
            .replace('{usuarioId}', parsedArgs.usuarioId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerUltimoCarrito
 * @see app/Http/Controllers/Api/ApiProformaController.php:1586
 * @route '/api/carritos/usuario/{usuarioId}/ultimo'
 */
obtenerUltimoCarrito.get = (args: { usuarioId: string | number } | [usuarioId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerUltimoCarrito.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerUltimoCarrito
 * @see app/Http/Controllers/Api/ApiProformaController.php:1586
 * @route '/api/carritos/usuario/{usuarioId}/ultimo'
 */
obtenerUltimoCarrito.head = (args: { usuarioId: string | number } | [usuarioId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerUltimoCarrito.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerUltimoCarrito
 * @see app/Http/Controllers/Api/ApiProformaController.php:1586
 * @route '/api/carritos/usuario/{usuarioId}/ultimo'
 */
    const obtenerUltimoCarritoForm = (args: { usuarioId: string | number } | [usuarioId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerUltimoCarrito.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerUltimoCarrito
 * @see app/Http/Controllers/Api/ApiProformaController.php:1586
 * @route '/api/carritos/usuario/{usuarioId}/ultimo'
 */
        obtenerUltimoCarritoForm.get = (args: { usuarioId: string | number } | [usuarioId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerUltimoCarrito.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerUltimoCarrito
 * @see app/Http/Controllers/Api/ApiProformaController.php:1586
 * @route '/api/carritos/usuario/{usuarioId}/ultimo'
 */
        obtenerUltimoCarritoForm.head = (args: { usuarioId: string | number } | [usuarioId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerUltimoCarrito.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerUltimoCarrito.form = obtenerUltimoCarritoForm
/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarStock
 * @see app/Http/Controllers/Api/ApiProformaController.php:467
 * @route '/api/app/verificar-stock'
 */
export const verificarStock = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verificarStock.url(options),
    method: 'post',
})

verificarStock.definition = {
    methods: ["post"],
    url: '/api/app/verificar-stock',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarStock
 * @see app/Http/Controllers/Api/ApiProformaController.php:467
 * @route '/api/app/verificar-stock'
 */
verificarStock.url = (options?: RouteQueryOptions) => {
    return verificarStock.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarStock
 * @see app/Http/Controllers/Api/ApiProformaController.php:467
 * @route '/api/app/verificar-stock'
 */
verificarStock.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verificarStock.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarStock
 * @see app/Http/Controllers/Api/ApiProformaController.php:467
 * @route '/api/app/verificar-stock'
 */
    const verificarStockForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: verificarStock.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarStock
 * @see app/Http/Controllers/Api/ApiProformaController.php:467
 * @route '/api/app/verificar-stock'
 */
        verificarStockForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: verificarStock.url(options),
            method: 'post',
        })
    
    verificarStock.form = verificarStockForm
/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerProductosDisponibles
 * @see app/Http/Controllers/Api/ApiProformaController.php:262
 * @route '/api/app/productos-disponibles'
 */
export const obtenerProductosDisponibles = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerProductosDisponibles.url(options),
    method: 'get',
})

obtenerProductosDisponibles.definition = {
    methods: ["get","head"],
    url: '/api/app/productos-disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerProductosDisponibles
 * @see app/Http/Controllers/Api/ApiProformaController.php:262
 * @route '/api/app/productos-disponibles'
 */
obtenerProductosDisponibles.url = (options?: RouteQueryOptions) => {
    return obtenerProductosDisponibles.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerProductosDisponibles
 * @see app/Http/Controllers/Api/ApiProformaController.php:262
 * @route '/api/app/productos-disponibles'
 */
obtenerProductosDisponibles.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerProductosDisponibles.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerProductosDisponibles
 * @see app/Http/Controllers/Api/ApiProformaController.php:262
 * @route '/api/app/productos-disponibles'
 */
obtenerProductosDisponibles.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerProductosDisponibles.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerProductosDisponibles
 * @see app/Http/Controllers/Api/ApiProformaController.php:262
 * @route '/api/app/productos-disponibles'
 */
    const obtenerProductosDisponiblesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerProductosDisponibles.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerProductosDisponibles
 * @see app/Http/Controllers/Api/ApiProformaController.php:262
 * @route '/api/app/productos-disponibles'
 */
        obtenerProductosDisponiblesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerProductosDisponibles.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerProductosDisponibles
 * @see app/Http/Controllers/Api/ApiProformaController.php:262
 * @route '/api/app/productos-disponibles'
 */
        obtenerProductosDisponiblesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerProductosDisponibles.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerProductosDisponibles.form = obtenerProductosDisponiblesForm
/**
* @see \App\Http\Controllers\Api\ApiProformaController::listarParaDashboard
 * @see app/Http/Controllers/Api/ApiProformaController.php:428
 * @route '/api/proformas'
 */
export const listarParaDashboard = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: listarParaDashboard.url(options),
    method: 'get',
})

listarParaDashboard.definition = {
    methods: ["get","head"],
    url: '/api/proformas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::listarParaDashboard
 * @see app/Http/Controllers/Api/ApiProformaController.php:428
 * @route '/api/proformas'
 */
listarParaDashboard.url = (options?: RouteQueryOptions) => {
    return listarParaDashboard.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::listarParaDashboard
 * @see app/Http/Controllers/Api/ApiProformaController.php:428
 * @route '/api/proformas'
 */
listarParaDashboard.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: listarParaDashboard.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::listarParaDashboard
 * @see app/Http/Controllers/Api/ApiProformaController.php:428
 * @route '/api/proformas'
 */
listarParaDashboard.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: listarParaDashboard.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::listarParaDashboard
 * @see app/Http/Controllers/Api/ApiProformaController.php:428
 * @route '/api/proformas'
 */
    const listarParaDashboardForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: listarParaDashboard.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::listarParaDashboard
 * @see app/Http/Controllers/Api/ApiProformaController.php:428
 * @route '/api/proformas'
 */
        listarParaDashboardForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: listarParaDashboard.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ApiProformaController::listarParaDashboard
 * @see app/Http/Controllers/Api/ApiProformaController.php:428
 * @route '/api/proformas'
 */
        listarParaDashboardForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: listarParaDashboard.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    listarParaDashboard.form = listarParaDashboardForm
/**
* @see \App\Http\Controllers\Api\ApiProformaController::aprobar
 * @see app/Http/Controllers/Api/ApiProformaController.php:301
 * @route '/api/proformas/{proforma}/aprobar'
 */
export const aprobar = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: aprobar.url(args, options),
    method: 'post',
})

aprobar.definition = {
    methods: ["post"],
    url: '/api/proformas/{proforma}/aprobar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::aprobar
 * @see app/Http/Controllers/Api/ApiProformaController.php:301
 * @route '/api/proformas/{proforma}/aprobar'
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
* @see \App\Http\Controllers\Api\ApiProformaController::aprobar
 * @see app/Http/Controllers/Api/ApiProformaController.php:301
 * @route '/api/proformas/{proforma}/aprobar'
 */
aprobar.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: aprobar.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::aprobar
 * @see app/Http/Controllers/Api/ApiProformaController.php:301
 * @route '/api/proformas/{proforma}/aprobar'
 */
    const aprobarForm = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: aprobar.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::aprobar
 * @see app/Http/Controllers/Api/ApiProformaController.php:301
 * @route '/api/proformas/{proforma}/aprobar'
 */
        aprobarForm.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: aprobar.url(args, options),
            method: 'post',
        })
    
    aprobar.form = aprobarForm
/**
* @see \App\Http\Controllers\Api\ApiProformaController::rechazar
 * @see app/Http/Controllers/Api/ApiProformaController.php:392
 * @route '/api/proformas/{proforma}/rechazar'
 */
export const rechazar = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rechazar.url(args, options),
    method: 'post',
})

rechazar.definition = {
    methods: ["post"],
    url: '/api/proformas/{proforma}/rechazar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::rechazar
 * @see app/Http/Controllers/Api/ApiProformaController.php:392
 * @route '/api/proformas/{proforma}/rechazar'
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
* @see \App\Http\Controllers\Api\ApiProformaController::rechazar
 * @see app/Http/Controllers/Api/ApiProformaController.php:392
 * @route '/api/proformas/{proforma}/rechazar'
 */
rechazar.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rechazar.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::rechazar
 * @see app/Http/Controllers/Api/ApiProformaController.php:392
 * @route '/api/proformas/{proforma}/rechazar'
 */
    const rechazarForm = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rechazar.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::rechazar
 * @see app/Http/Controllers/Api/ApiProformaController.php:392
 * @route '/api/proformas/{proforma}/rechazar'
 */
        rechazarForm.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rechazar.url(args, options),
            method: 'post',
        })
    
    rechazar.form = rechazarForm
/**
* @see \App\Http\Controllers\Api\ApiProformaController::convertirAVenta
 * @see app/Http/Controllers/Api/ApiProformaController.php:1434
 * @route '/api/proformas/{proforma}/convertir-venta'
 */
export const convertirAVenta = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: convertirAVenta.url(args, options),
    method: 'post',
})

convertirAVenta.definition = {
    methods: ["post"],
    url: '/api/proformas/{proforma}/convertir-venta',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::convertirAVenta
 * @see app/Http/Controllers/Api/ApiProformaController.php:1434
 * @route '/api/proformas/{proforma}/convertir-venta'
 */
convertirAVenta.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return convertirAVenta.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::convertirAVenta
 * @see app/Http/Controllers/Api/ApiProformaController.php:1434
 * @route '/api/proformas/{proforma}/convertir-venta'
 */
convertirAVenta.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: convertirAVenta.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::convertirAVenta
 * @see app/Http/Controllers/Api/ApiProformaController.php:1434
 * @route '/api/proformas/{proforma}/convertir-venta'
 */
    const convertirAVentaForm = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: convertirAVenta.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::convertirAVenta
 * @see app/Http/Controllers/Api/ApiProformaController.php:1434
 * @route '/api/proformas/{proforma}/convertir-venta'
 */
        convertirAVentaForm.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: convertirAVenta.url(args, options),
            method: 'post',
        })
    
    convertirAVenta.form = convertirAVentaForm
const ApiProformaController = { index, store, show, verificarEstado, confirmarProforma, verificarReservas, extenderReservas, crearPedidoDesdeApp, obtenerDetallePedido, obtenerEstadoPedido, obtenerUltimoCarrito, verificarStock, obtenerProductosDisponibles, listarParaDashboard, aprobar, rechazar, convertirAVenta }

export default ApiProformaController