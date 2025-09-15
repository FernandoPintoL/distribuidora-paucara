import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AsientoContableController::indexApi
 * @see app/Http/Controllers/AsientoContableController.php:64
 * @route '/api/contabilidad/asientos'
 */
export const indexApi = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexApi.url(options),
    method: 'get',
})

indexApi.definition = {
    methods: ["get","head"],
    url: '/api/contabilidad/asientos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AsientoContableController::indexApi
 * @see app/Http/Controllers/AsientoContableController.php:64
 * @route '/api/contabilidad/asientos'
 */
indexApi.url = (options?: RouteQueryOptions) => {
    return indexApi.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AsientoContableController::indexApi
 * @see app/Http/Controllers/AsientoContableController.php:64
 * @route '/api/contabilidad/asientos'
 */
indexApi.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexApi.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AsientoContableController::indexApi
 * @see app/Http/Controllers/AsientoContableController.php:64
 * @route '/api/contabilidad/asientos'
 */
indexApi.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: indexApi.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AsientoContableController::indexApi
 * @see app/Http/Controllers/AsientoContableController.php:64
 * @route '/api/contabilidad/asientos'
 */
    const indexApiForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: indexApi.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AsientoContableController::indexApi
 * @see app/Http/Controllers/AsientoContableController.php:64
 * @route '/api/contabilidad/asientos'
 */
        indexApiForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: indexApi.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AsientoContableController::indexApi
 * @see app/Http/Controllers/AsientoContableController.php:64
 * @route '/api/contabilidad/asientos'
 */
        indexApiForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: indexApi.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    indexApi.form = indexApiForm
/**
* @see \App\Http\Controllers\AsientoContableController::showApi
 * @see app/Http/Controllers/AsientoContableController.php:91
 * @route '/api/contabilidad/asientos/{asientoContable}'
 */
export const showApi = (args: { asientoContable: number | { id: number } } | [asientoContable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showApi.url(args, options),
    method: 'get',
})

showApi.definition = {
    methods: ["get","head"],
    url: '/api/contabilidad/asientos/{asientoContable}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AsientoContableController::showApi
 * @see app/Http/Controllers/AsientoContableController.php:91
 * @route '/api/contabilidad/asientos/{asientoContable}'
 */
showApi.url = (args: { asientoContable: number | { id: number } } | [asientoContable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { asientoContable: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { asientoContable: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    asientoContable: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        asientoContable: typeof args.asientoContable === 'object'
                ? args.asientoContable.id
                : args.asientoContable,
                }

    return showApi.definition.url
            .replace('{asientoContable}', parsedArgs.asientoContable.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AsientoContableController::showApi
 * @see app/Http/Controllers/AsientoContableController.php:91
 * @route '/api/contabilidad/asientos/{asientoContable}'
 */
showApi.get = (args: { asientoContable: number | { id: number } } | [asientoContable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showApi.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AsientoContableController::showApi
 * @see app/Http/Controllers/AsientoContableController.php:91
 * @route '/api/contabilidad/asientos/{asientoContable}'
 */
showApi.head = (args: { asientoContable: number | { id: number } } | [asientoContable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showApi.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AsientoContableController::showApi
 * @see app/Http/Controllers/AsientoContableController.php:91
 * @route '/api/contabilidad/asientos/{asientoContable}'
 */
    const showApiForm = (args: { asientoContable: number | { id: number } } | [asientoContable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: showApi.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AsientoContableController::showApi
 * @see app/Http/Controllers/AsientoContableController.php:91
 * @route '/api/contabilidad/asientos/{asientoContable}'
 */
        showApiForm.get = (args: { asientoContable: number | { id: number } } | [asientoContable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showApi.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AsientoContableController::showApi
 * @see app/Http/Controllers/AsientoContableController.php:91
 * @route '/api/contabilidad/asientos/{asientoContable}'
 */
        showApiForm.head = (args: { asientoContable: number | { id: number } } | [asientoContable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showApi.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    showApi.form = showApiForm
/**
* @see \App\Http\Controllers\AsientoContableController::index
 * @see app/Http/Controllers/AsientoContableController.php:15
 * @route '/contabilidad/asientos'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/contabilidad/asientos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AsientoContableController::index
 * @see app/Http/Controllers/AsientoContableController.php:15
 * @route '/contabilidad/asientos'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AsientoContableController::index
 * @see app/Http/Controllers/AsientoContableController.php:15
 * @route '/contabilidad/asientos'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AsientoContableController::index
 * @see app/Http/Controllers/AsientoContableController.php:15
 * @route '/contabilidad/asientos'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AsientoContableController::index
 * @see app/Http/Controllers/AsientoContableController.php:15
 * @route '/contabilidad/asientos'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AsientoContableController::index
 * @see app/Http/Controllers/AsientoContableController.php:15
 * @route '/contabilidad/asientos'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AsientoContableController::index
 * @see app/Http/Controllers/AsientoContableController.php:15
 * @route '/contabilidad/asientos'
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
* @see \App\Http\Controllers\AsientoContableController::show
 * @see app/Http/Controllers/AsientoContableController.php:50
 * @route '/contabilidad/asientos/{asientoContable}'
 */
export const show = (args: { asientoContable: number | { id: number } } | [asientoContable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/contabilidad/asientos/{asientoContable}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AsientoContableController::show
 * @see app/Http/Controllers/AsientoContableController.php:50
 * @route '/contabilidad/asientos/{asientoContable}'
 */
show.url = (args: { asientoContable: number | { id: number } } | [asientoContable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { asientoContable: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { asientoContable: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    asientoContable: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        asientoContable: typeof args.asientoContable === 'object'
                ? args.asientoContable.id
                : args.asientoContable,
                }

    return show.definition.url
            .replace('{asientoContable}', parsedArgs.asientoContable.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AsientoContableController::show
 * @see app/Http/Controllers/AsientoContableController.php:50
 * @route '/contabilidad/asientos/{asientoContable}'
 */
show.get = (args: { asientoContable: number | { id: number } } | [asientoContable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AsientoContableController::show
 * @see app/Http/Controllers/AsientoContableController.php:50
 * @route '/contabilidad/asientos/{asientoContable}'
 */
show.head = (args: { asientoContable: number | { id: number } } | [asientoContable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AsientoContableController::show
 * @see app/Http/Controllers/AsientoContableController.php:50
 * @route '/contabilidad/asientos/{asientoContable}'
 */
    const showForm = (args: { asientoContable: number | { id: number } } | [asientoContable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AsientoContableController::show
 * @see app/Http/Controllers/AsientoContableController.php:50
 * @route '/contabilidad/asientos/{asientoContable}'
 */
        showForm.get = (args: { asientoContable: number | { id: number } } | [asientoContable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AsientoContableController::show
 * @see app/Http/Controllers/AsientoContableController.php:50
 * @route '/contabilidad/asientos/{asientoContable}'
 */
        showForm.head = (args: { asientoContable: number | { id: number } } | [asientoContable: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\AsientoContableController::libroMayor
 * @see app/Http/Controllers/AsientoContableController.php:103
 * @route '/contabilidad/reportes/libro-mayor'
 */
export const libroMayor = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: libroMayor.url(options),
    method: 'get',
})

libroMayor.definition = {
    methods: ["get","head"],
    url: '/contabilidad/reportes/libro-mayor',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AsientoContableController::libroMayor
 * @see app/Http/Controllers/AsientoContableController.php:103
 * @route '/contabilidad/reportes/libro-mayor'
 */
libroMayor.url = (options?: RouteQueryOptions) => {
    return libroMayor.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AsientoContableController::libroMayor
 * @see app/Http/Controllers/AsientoContableController.php:103
 * @route '/contabilidad/reportes/libro-mayor'
 */
libroMayor.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: libroMayor.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AsientoContableController::libroMayor
 * @see app/Http/Controllers/AsientoContableController.php:103
 * @route '/contabilidad/reportes/libro-mayor'
 */
libroMayor.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: libroMayor.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AsientoContableController::libroMayor
 * @see app/Http/Controllers/AsientoContableController.php:103
 * @route '/contabilidad/reportes/libro-mayor'
 */
    const libroMayorForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: libroMayor.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AsientoContableController::libroMayor
 * @see app/Http/Controllers/AsientoContableController.php:103
 * @route '/contabilidad/reportes/libro-mayor'
 */
        libroMayorForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: libroMayor.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AsientoContableController::libroMayor
 * @see app/Http/Controllers/AsientoContableController.php:103
 * @route '/contabilidad/reportes/libro-mayor'
 */
        libroMayorForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: libroMayor.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    libroMayor.form = libroMayorForm
/**
* @see \App\Http\Controllers\AsientoContableController::balanceComprobacion
 * @see app/Http/Controllers/AsientoContableController.php:169
 * @route '/contabilidad/reportes/balance-comprobacion'
 */
export const balanceComprobacion = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: balanceComprobacion.url(options),
    method: 'get',
})

balanceComprobacion.definition = {
    methods: ["get","head"],
    url: '/contabilidad/reportes/balance-comprobacion',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AsientoContableController::balanceComprobacion
 * @see app/Http/Controllers/AsientoContableController.php:169
 * @route '/contabilidad/reportes/balance-comprobacion'
 */
balanceComprobacion.url = (options?: RouteQueryOptions) => {
    return balanceComprobacion.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AsientoContableController::balanceComprobacion
 * @see app/Http/Controllers/AsientoContableController.php:169
 * @route '/contabilidad/reportes/balance-comprobacion'
 */
balanceComprobacion.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: balanceComprobacion.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AsientoContableController::balanceComprobacion
 * @see app/Http/Controllers/AsientoContableController.php:169
 * @route '/contabilidad/reportes/balance-comprobacion'
 */
balanceComprobacion.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: balanceComprobacion.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AsientoContableController::balanceComprobacion
 * @see app/Http/Controllers/AsientoContableController.php:169
 * @route '/contabilidad/reportes/balance-comprobacion'
 */
    const balanceComprobacionForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: balanceComprobacion.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AsientoContableController::balanceComprobacion
 * @see app/Http/Controllers/AsientoContableController.php:169
 * @route '/contabilidad/reportes/balance-comprobacion'
 */
        balanceComprobacionForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: balanceComprobacion.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AsientoContableController::balanceComprobacion
 * @see app/Http/Controllers/AsientoContableController.php:169
 * @route '/contabilidad/reportes/balance-comprobacion'
 */
        balanceComprobacionForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: balanceComprobacion.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    balanceComprobacion.form = balanceComprobacionForm
const AsientoContableController = { indexApi, showApi, index, show, libroMayor, balanceComprobacion }

export default AsientoContableController