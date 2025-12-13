import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\EnvioController::enviosCliente
 * @see app/Http/Controllers/EnvioController.php:746
 * @route '/api/app/cliente/envios'
 */
export const enviosCliente = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: enviosCliente.url(options),
    method: 'get',
})

enviosCliente.definition = {
    methods: ["get","head"],
    url: '/api/app/cliente/envios',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::enviosCliente
 * @see app/Http/Controllers/EnvioController.php:746
 * @route '/api/app/cliente/envios'
 */
enviosCliente.url = (options?: RouteQueryOptions) => {
    return enviosCliente.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::enviosCliente
 * @see app/Http/Controllers/EnvioController.php:746
 * @route '/api/app/cliente/envios'
 */
enviosCliente.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: enviosCliente.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::enviosCliente
 * @see app/Http/Controllers/EnvioController.php:746
 * @route '/api/app/cliente/envios'
 */
enviosCliente.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: enviosCliente.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::enviosCliente
 * @see app/Http/Controllers/EnvioController.php:746
 * @route '/api/app/cliente/envios'
 */
    const enviosClienteForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: enviosCliente.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::enviosCliente
 * @see app/Http/Controllers/EnvioController.php:746
 * @route '/api/app/cliente/envios'
 */
        enviosClienteForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: enviosCliente.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::enviosCliente
 * @see app/Http/Controllers/EnvioController.php:746
 * @route '/api/app/cliente/envios'
 */
        enviosClienteForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: enviosCliente.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    enviosCliente.form = enviosClienteForm
/**
* @see \App\Http\Controllers\EnvioController::seguimientoApi
 * @see app/Http/Controllers/EnvioController.php:770
 * @route '/api/app/envios/{envio}/seguimiento'
 */
export const seguimientoApi = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: seguimientoApi.url(args, options),
    method: 'get',
})

seguimientoApi.definition = {
    methods: ["get","head"],
    url: '/api/app/envios/{envio}/seguimiento',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::seguimientoApi
 * @see app/Http/Controllers/EnvioController.php:770
 * @route '/api/app/envios/{envio}/seguimiento'
 */
seguimientoApi.url = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { envio: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { envio: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    envio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        envio: typeof args.envio === 'object'
                ? args.envio.id
                : args.envio,
                }

    return seguimientoApi.definition.url
            .replace('{envio}', parsedArgs.envio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::seguimientoApi
 * @see app/Http/Controllers/EnvioController.php:770
 * @route '/api/app/envios/{envio}/seguimiento'
 */
seguimientoApi.get = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: seguimientoApi.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::seguimientoApi
 * @see app/Http/Controllers/EnvioController.php:770
 * @route '/api/app/envios/{envio}/seguimiento'
 */
seguimientoApi.head = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: seguimientoApi.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::seguimientoApi
 * @see app/Http/Controllers/EnvioController.php:770
 * @route '/api/app/envios/{envio}/seguimiento'
 */
    const seguimientoApiForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: seguimientoApi.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::seguimientoApi
 * @see app/Http/Controllers/EnvioController.php:770
 * @route '/api/app/envios/{envio}/seguimiento'
 */
        seguimientoApiForm.get = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: seguimientoApi.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::seguimientoApi
 * @see app/Http/Controllers/EnvioController.php:770
 * @route '/api/app/envios/{envio}/seguimiento'
 */
        seguimientoApiForm.head = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: seguimientoApi.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    seguimientoApi.form = seguimientoApiForm
/**
* @see \App\Http\Controllers\EnvioController::actualizarUbicacion
 * @see app/Http/Controllers/EnvioController.php:796
 * @route '/api/app/envios/{envio}/ubicacion'
 */
export const actualizarUbicacion = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarUbicacion.url(args, options),
    method: 'post',
})

actualizarUbicacion.definition = {
    methods: ["post"],
    url: '/api/app/envios/{envio}/ubicacion',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EnvioController::actualizarUbicacion
 * @see app/Http/Controllers/EnvioController.php:796
 * @route '/api/app/envios/{envio}/ubicacion'
 */
actualizarUbicacion.url = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { envio: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { envio: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    envio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        envio: typeof args.envio === 'object'
                ? args.envio.id
                : args.envio,
                }

    return actualizarUbicacion.definition.url
            .replace('{envio}', parsedArgs.envio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::actualizarUbicacion
 * @see app/Http/Controllers/EnvioController.php:796
 * @route '/api/app/envios/{envio}/ubicacion'
 */
actualizarUbicacion.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarUbicacion.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::actualizarUbicacion
 * @see app/Http/Controllers/EnvioController.php:796
 * @route '/api/app/envios/{envio}/ubicacion'
 */
    const actualizarUbicacionForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: actualizarUbicacion.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::actualizarUbicacion
 * @see app/Http/Controllers/EnvioController.php:796
 * @route '/api/app/envios/{envio}/ubicacion'
 */
        actualizarUbicacionForm.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: actualizarUbicacion.url(args, options),
            method: 'post',
        })
    
    actualizarUbicacion.form = actualizarUbicacionForm
/**
* @see \App\Http\Controllers\EnvioController::rechazarEntrega
 * @see app/Http/Controllers/EnvioController.php:303
 * @route '/api/app/envios/{envio}/rechazar'
 */
export const rechazarEntrega = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: rechazarEntrega.url(args, options),
    method: 'put',
})

rechazarEntrega.definition = {
    methods: ["put"],
    url: '/api/app/envios/{envio}/rechazar',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\EnvioController::rechazarEntrega
 * @see app/Http/Controllers/EnvioController.php:303
 * @route '/api/app/envios/{envio}/rechazar'
 */
rechazarEntrega.url = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { envio: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { envio: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    envio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        envio: typeof args.envio === 'object'
                ? args.envio.id
                : args.envio,
                }

    return rechazarEntrega.definition.url
            .replace('{envio}', parsedArgs.envio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::rechazarEntrega
 * @see app/Http/Controllers/EnvioController.php:303
 * @route '/api/app/envios/{envio}/rechazar'
 */
rechazarEntrega.put = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: rechazarEntrega.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\EnvioController::rechazarEntrega
 * @see app/Http/Controllers/EnvioController.php:303
 * @route '/api/app/envios/{envio}/rechazar'
 */
    const rechazarEntregaForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rechazarEntrega.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::rechazarEntrega
 * @see app/Http/Controllers/EnvioController.php:303
 * @route '/api/app/envios/{envio}/rechazar'
 */
        rechazarEntregaForm.put = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rechazarEntrega.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    rechazarEntrega.form = rechazarEntregaForm
/**
* @see \App\Http\Controllers\EnvioController::dashboardStats
 * @see app/Http/Controllers/EnvioController.php:535
 * @route '/api/logistica/dashboard/stats'
 */
export const dashboardStats = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboardStats.url(options),
    method: 'get',
})

dashboardStats.definition = {
    methods: ["get","head"],
    url: '/api/logistica/dashboard/stats',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::dashboardStats
 * @see app/Http/Controllers/EnvioController.php:535
 * @route '/api/logistica/dashboard/stats'
 */
dashboardStats.url = (options?: RouteQueryOptions) => {
    return dashboardStats.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::dashboardStats
 * @see app/Http/Controllers/EnvioController.php:535
 * @route '/api/logistica/dashboard/stats'
 */
dashboardStats.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboardStats.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::dashboardStats
 * @see app/Http/Controllers/EnvioController.php:535
 * @route '/api/logistica/dashboard/stats'
 */
dashboardStats.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboardStats.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::dashboardStats
 * @see app/Http/Controllers/EnvioController.php:535
 * @route '/api/logistica/dashboard/stats'
 */
    const dashboardStatsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: dashboardStats.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::dashboardStats
 * @see app/Http/Controllers/EnvioController.php:535
 * @route '/api/logistica/dashboard/stats'
 */
        dashboardStatsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboardStats.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::dashboardStats
 * @see app/Http/Controllers/EnvioController.php:535
 * @route '/api/logistica/dashboard/stats'
 */
        dashboardStatsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboardStats.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    dashboardStats.form = dashboardStatsForm
/**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:27
 * @route '/api/envios'
 */
const index761e3cc54565afeeec1d7f1a88eae79a = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index761e3cc54565afeeec1d7f1a88eae79a.url(options),
    method: 'get',
})

index761e3cc54565afeeec1d7f1a88eae79a.definition = {
    methods: ["get","head"],
    url: '/api/envios',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:27
 * @route '/api/envios'
 */
index761e3cc54565afeeec1d7f1a88eae79a.url = (options?: RouteQueryOptions) => {
    return index761e3cc54565afeeec1d7f1a88eae79a.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:27
 * @route '/api/envios'
 */
index761e3cc54565afeeec1d7f1a88eae79a.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index761e3cc54565afeeec1d7f1a88eae79a.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:27
 * @route '/api/envios'
 */
index761e3cc54565afeeec1d7f1a88eae79a.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index761e3cc54565afeeec1d7f1a88eae79a.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:27
 * @route '/api/envios'
 */
    const index761e3cc54565afeeec1d7f1a88eae79aForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index761e3cc54565afeeec1d7f1a88eae79a.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:27
 * @route '/api/envios'
 */
        index761e3cc54565afeeec1d7f1a88eae79aForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index761e3cc54565afeeec1d7f1a88eae79a.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:27
 * @route '/api/envios'
 */
        index761e3cc54565afeeec1d7f1a88eae79aForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index761e3cc54565afeeec1d7f1a88eae79a.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index761e3cc54565afeeec1d7f1a88eae79a.form = index761e3cc54565afeeec1d7f1a88eae79aForm
    /**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:27
 * @route '/envios'
 */
const index0e0282185c02bf06412c7bc696eb340c = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index0e0282185c02bf06412c7bc696eb340c.url(options),
    method: 'get',
})

index0e0282185c02bf06412c7bc696eb340c.definition = {
    methods: ["get","head"],
    url: '/envios',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:27
 * @route '/envios'
 */
index0e0282185c02bf06412c7bc696eb340c.url = (options?: RouteQueryOptions) => {
    return index0e0282185c02bf06412c7bc696eb340c.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:27
 * @route '/envios'
 */
index0e0282185c02bf06412c7bc696eb340c.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index0e0282185c02bf06412c7bc696eb340c.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:27
 * @route '/envios'
 */
index0e0282185c02bf06412c7bc696eb340c.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index0e0282185c02bf06412c7bc696eb340c.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:27
 * @route '/envios'
 */
    const index0e0282185c02bf06412c7bc696eb340cForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index0e0282185c02bf06412c7bc696eb340c.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:27
 * @route '/envios'
 */
        index0e0282185c02bf06412c7bc696eb340cForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index0e0282185c02bf06412c7bc696eb340c.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:27
 * @route '/envios'
 */
        index0e0282185c02bf06412c7bc696eb340cForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index0e0282185c02bf06412c7bc696eb340c.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index0e0282185c02bf06412c7bc696eb340c.form = index0e0282185c02bf06412c7bc696eb340cForm

export const index = {
    '/api/envios': index761e3cc54565afeeec1d7f1a88eae79a,
    '/envios': index0e0282185c02bf06412c7bc696eb340c,
}

/**
* @see \App\Http\Controllers\EnvioController::seguimiento
 * @see app/Http/Controllers/EnvioController.php:667
 * @route '/api/envios/{envio}/seguimiento'
 */
export const seguimiento = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: seguimiento.url(args, options),
    method: 'get',
})

seguimiento.definition = {
    methods: ["get","head"],
    url: '/api/envios/{envio}/seguimiento',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::seguimiento
 * @see app/Http/Controllers/EnvioController.php:667
 * @route '/api/envios/{envio}/seguimiento'
 */
seguimiento.url = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { envio: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { envio: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    envio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        envio: typeof args.envio === 'object'
                ? args.envio.id
                : args.envio,
                }

    return seguimiento.definition.url
            .replace('{envio}', parsedArgs.envio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::seguimiento
 * @see app/Http/Controllers/EnvioController.php:667
 * @route '/api/envios/{envio}/seguimiento'
 */
seguimiento.get = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: seguimiento.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::seguimiento
 * @see app/Http/Controllers/EnvioController.php:667
 * @route '/api/envios/{envio}/seguimiento'
 */
seguimiento.head = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: seguimiento.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::seguimiento
 * @see app/Http/Controllers/EnvioController.php:667
 * @route '/api/envios/{envio}/seguimiento'
 */
    const seguimientoForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: seguimiento.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::seguimiento
 * @see app/Http/Controllers/EnvioController.php:667
 * @route '/api/envios/{envio}/seguimiento'
 */
        seguimientoForm.get = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: seguimiento.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::seguimiento
 * @see app/Http/Controllers/EnvioController.php:667
 * @route '/api/envios/{envio}/seguimiento'
 */
        seguimientoForm.head = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: seguimiento.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    seguimiento.form = seguimientoForm
/**
* @see \App\Http\Controllers\EnvioController::actualizarEstado
 * @see app/Http/Controllers/EnvioController.php:683
 * @route '/api/envios/{envio}/estado'
 */
export const actualizarEstado = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarEstado.url(args, options),
    method: 'post',
})

actualizarEstado.definition = {
    methods: ["post"],
    url: '/api/envios/{envio}/estado',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EnvioController::actualizarEstado
 * @see app/Http/Controllers/EnvioController.php:683
 * @route '/api/envios/{envio}/estado'
 */
actualizarEstado.url = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { envio: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { envio: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    envio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        envio: typeof args.envio === 'object'
                ? args.envio.id
                : args.envio,
                }

    return actualizarEstado.definition.url
            .replace('{envio}', parsedArgs.envio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::actualizarEstado
 * @see app/Http/Controllers/EnvioController.php:683
 * @route '/api/envios/{envio}/estado'
 */
actualizarEstado.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarEstado.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::actualizarEstado
 * @see app/Http/Controllers/EnvioController.php:683
 * @route '/api/envios/{envio}/estado'
 */
    const actualizarEstadoForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: actualizarEstado.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::actualizarEstado
 * @see app/Http/Controllers/EnvioController.php:683
 * @route '/api/envios/{envio}/estado'
 */
        actualizarEstadoForm.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: actualizarEstado.url(args, options),
            method: 'post',
        })
    
    actualizarEstado.form = actualizarEstadoForm
/**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/api/recursos/vehiculos/disponibles'
 */
const obtenerVehiculosDisponibles7754d9cb16e92886ad757434405f9890 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerVehiculosDisponibles7754d9cb16e92886ad757434405f9890.url(options),
    method: 'get',
})

obtenerVehiculosDisponibles7754d9cb16e92886ad757434405f9890.definition = {
    methods: ["get","head"],
    url: '/api/recursos/vehiculos/disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/api/recursos/vehiculos/disponibles'
 */
obtenerVehiculosDisponibles7754d9cb16e92886ad757434405f9890.url = (options?: RouteQueryOptions) => {
    return obtenerVehiculosDisponibles7754d9cb16e92886ad757434405f9890.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/api/recursos/vehiculos/disponibles'
 */
obtenerVehiculosDisponibles7754d9cb16e92886ad757434405f9890.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerVehiculosDisponibles7754d9cb16e92886ad757434405f9890.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/api/recursos/vehiculos/disponibles'
 */
obtenerVehiculosDisponibles7754d9cb16e92886ad757434405f9890.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerVehiculosDisponibles7754d9cb16e92886ad757434405f9890.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/api/recursos/vehiculos/disponibles'
 */
    const obtenerVehiculosDisponibles7754d9cb16e92886ad757434405f9890Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerVehiculosDisponibles7754d9cb16e92886ad757434405f9890.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/api/recursos/vehiculos/disponibles'
 */
        obtenerVehiculosDisponibles7754d9cb16e92886ad757434405f9890Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerVehiculosDisponibles7754d9cb16e92886ad757434405f9890.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/api/recursos/vehiculos/disponibles'
 */
        obtenerVehiculosDisponibles7754d9cb16e92886ad757434405f9890Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerVehiculosDisponibles7754d9cb16e92886ad757434405f9890.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerVehiculosDisponibles7754d9cb16e92886ad757434405f9890.form = obtenerVehiculosDisponibles7754d9cb16e92886ad757434405f9890Form
    /**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/api/vehiculos/disponibles'
 */
const obtenerVehiculosDisponiblesf27ab6e1cc516923a0aa5e68d3e32b63 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerVehiculosDisponiblesf27ab6e1cc516923a0aa5e68d3e32b63.url(options),
    method: 'get',
})

obtenerVehiculosDisponiblesf27ab6e1cc516923a0aa5e68d3e32b63.definition = {
    methods: ["get","head"],
    url: '/api/vehiculos/disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/api/vehiculos/disponibles'
 */
obtenerVehiculosDisponiblesf27ab6e1cc516923a0aa5e68d3e32b63.url = (options?: RouteQueryOptions) => {
    return obtenerVehiculosDisponiblesf27ab6e1cc516923a0aa5e68d3e32b63.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/api/vehiculos/disponibles'
 */
obtenerVehiculosDisponiblesf27ab6e1cc516923a0aa5e68d3e32b63.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerVehiculosDisponiblesf27ab6e1cc516923a0aa5e68d3e32b63.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/api/vehiculos/disponibles'
 */
obtenerVehiculosDisponiblesf27ab6e1cc516923a0aa5e68d3e32b63.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerVehiculosDisponiblesf27ab6e1cc516923a0aa5e68d3e32b63.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/api/vehiculos/disponibles'
 */
    const obtenerVehiculosDisponiblesf27ab6e1cc516923a0aa5e68d3e32b63Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerVehiculosDisponiblesf27ab6e1cc516923a0aa5e68d3e32b63.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/api/vehiculos/disponibles'
 */
        obtenerVehiculosDisponiblesf27ab6e1cc516923a0aa5e68d3e32b63Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerVehiculosDisponiblesf27ab6e1cc516923a0aa5e68d3e32b63.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/api/vehiculos/disponibles'
 */
        obtenerVehiculosDisponiblesf27ab6e1cc516923a0aa5e68d3e32b63Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerVehiculosDisponiblesf27ab6e1cc516923a0aa5e68d3e32b63.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerVehiculosDisponiblesf27ab6e1cc516923a0aa5e68d3e32b63.form = obtenerVehiculosDisponiblesf27ab6e1cc516923a0aa5e68d3e32b63Form
    /**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/envios/api/vehiculos-disponibles'
 */
const obtenerVehiculosDisponibles5f22b8c738f355d0f4539e8d63535101 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerVehiculosDisponibles5f22b8c738f355d0f4539e8d63535101.url(options),
    method: 'get',
})

obtenerVehiculosDisponibles5f22b8c738f355d0f4539e8d63535101.definition = {
    methods: ["get","head"],
    url: '/envios/api/vehiculos-disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/envios/api/vehiculos-disponibles'
 */
obtenerVehiculosDisponibles5f22b8c738f355d0f4539e8d63535101.url = (options?: RouteQueryOptions) => {
    return obtenerVehiculosDisponibles5f22b8c738f355d0f4539e8d63535101.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/envios/api/vehiculos-disponibles'
 */
obtenerVehiculosDisponibles5f22b8c738f355d0f4539e8d63535101.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerVehiculosDisponibles5f22b8c738f355d0f4539e8d63535101.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/envios/api/vehiculos-disponibles'
 */
obtenerVehiculosDisponibles5f22b8c738f355d0f4539e8d63535101.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerVehiculosDisponibles5f22b8c738f355d0f4539e8d63535101.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/envios/api/vehiculos-disponibles'
 */
    const obtenerVehiculosDisponibles5f22b8c738f355d0f4539e8d63535101Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerVehiculosDisponibles5f22b8c738f355d0f4539e8d63535101.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/envios/api/vehiculos-disponibles'
 */
        obtenerVehiculosDisponibles5f22b8c738f355d0f4539e8d63535101Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerVehiculosDisponibles5f22b8c738f355d0f4539e8d63535101.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:414
 * @route '/envios/api/vehiculos-disponibles'
 */
        obtenerVehiculosDisponibles5f22b8c738f355d0f4539e8d63535101Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerVehiculosDisponibles5f22b8c738f355d0f4539e8d63535101.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerVehiculosDisponibles5f22b8c738f355d0f4539e8d63535101.form = obtenerVehiculosDisponibles5f22b8c738f355d0f4539e8d63535101Form

export const obtenerVehiculosDisponibles = {
    '/api/recursos/vehiculos/disponibles': obtenerVehiculosDisponibles7754d9cb16e92886ad757434405f9890,
    '/api/vehiculos/disponibles': obtenerVehiculosDisponiblesf27ab6e1cc516923a0aa5e68d3e32b63,
    '/envios/api/vehiculos-disponibles': obtenerVehiculosDisponibles5f22b8c738f355d0f4539e8d63535101,
}

/**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/api/recursos/choferes/disponibles'
 */
const obtenerChoferesDisponibles295ff334f2ed72fb2346d5472a1d22cc = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerChoferesDisponibles295ff334f2ed72fb2346d5472a1d22cc.url(options),
    method: 'get',
})

obtenerChoferesDisponibles295ff334f2ed72fb2346d5472a1d22cc.definition = {
    methods: ["get","head"],
    url: '/api/recursos/choferes/disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/api/recursos/choferes/disponibles'
 */
obtenerChoferesDisponibles295ff334f2ed72fb2346d5472a1d22cc.url = (options?: RouteQueryOptions) => {
    return obtenerChoferesDisponibles295ff334f2ed72fb2346d5472a1d22cc.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/api/recursos/choferes/disponibles'
 */
obtenerChoferesDisponibles295ff334f2ed72fb2346d5472a1d22cc.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerChoferesDisponibles295ff334f2ed72fb2346d5472a1d22cc.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/api/recursos/choferes/disponibles'
 */
obtenerChoferesDisponibles295ff334f2ed72fb2346d5472a1d22cc.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerChoferesDisponibles295ff334f2ed72fb2346d5472a1d22cc.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/api/recursos/choferes/disponibles'
 */
    const obtenerChoferesDisponibles295ff334f2ed72fb2346d5472a1d22ccForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerChoferesDisponibles295ff334f2ed72fb2346d5472a1d22cc.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/api/recursos/choferes/disponibles'
 */
        obtenerChoferesDisponibles295ff334f2ed72fb2346d5472a1d22ccForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerChoferesDisponibles295ff334f2ed72fb2346d5472a1d22cc.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/api/recursos/choferes/disponibles'
 */
        obtenerChoferesDisponibles295ff334f2ed72fb2346d5472a1d22ccForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerChoferesDisponibles295ff334f2ed72fb2346d5472a1d22cc.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerChoferesDisponibles295ff334f2ed72fb2346d5472a1d22cc.form = obtenerChoferesDisponibles295ff334f2ed72fb2346d5472a1d22ccForm
    /**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/api/choferes/disponibles'
 */
const obtenerChoferesDisponiblesa070cb338051f181feec15fb5ed361b1 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerChoferesDisponiblesa070cb338051f181feec15fb5ed361b1.url(options),
    method: 'get',
})

obtenerChoferesDisponiblesa070cb338051f181feec15fb5ed361b1.definition = {
    methods: ["get","head"],
    url: '/api/choferes/disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/api/choferes/disponibles'
 */
obtenerChoferesDisponiblesa070cb338051f181feec15fb5ed361b1.url = (options?: RouteQueryOptions) => {
    return obtenerChoferesDisponiblesa070cb338051f181feec15fb5ed361b1.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/api/choferes/disponibles'
 */
obtenerChoferesDisponiblesa070cb338051f181feec15fb5ed361b1.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerChoferesDisponiblesa070cb338051f181feec15fb5ed361b1.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/api/choferes/disponibles'
 */
obtenerChoferesDisponiblesa070cb338051f181feec15fb5ed361b1.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerChoferesDisponiblesa070cb338051f181feec15fb5ed361b1.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/api/choferes/disponibles'
 */
    const obtenerChoferesDisponiblesa070cb338051f181feec15fb5ed361b1Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerChoferesDisponiblesa070cb338051f181feec15fb5ed361b1.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/api/choferes/disponibles'
 */
        obtenerChoferesDisponiblesa070cb338051f181feec15fb5ed361b1Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerChoferesDisponiblesa070cb338051f181feec15fb5ed361b1.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/api/choferes/disponibles'
 */
        obtenerChoferesDisponiblesa070cb338051f181feec15fb5ed361b1Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerChoferesDisponiblesa070cb338051f181feec15fb5ed361b1.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerChoferesDisponiblesa070cb338051f181feec15fb5ed361b1.form = obtenerChoferesDisponiblesa070cb338051f181feec15fb5ed361b1Form
    /**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/envios/api/choferes-disponibles'
 */
const obtenerChoferesDisponibles3339e25693ca32e00101f547d40933ba = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerChoferesDisponibles3339e25693ca32e00101f547d40933ba.url(options),
    method: 'get',
})

obtenerChoferesDisponibles3339e25693ca32e00101f547d40933ba.definition = {
    methods: ["get","head"],
    url: '/envios/api/choferes-disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/envios/api/choferes-disponibles'
 */
obtenerChoferesDisponibles3339e25693ca32e00101f547d40933ba.url = (options?: RouteQueryOptions) => {
    return obtenerChoferesDisponibles3339e25693ca32e00101f547d40933ba.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/envios/api/choferes-disponibles'
 */
obtenerChoferesDisponibles3339e25693ca32e00101f547d40933ba.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerChoferesDisponibles3339e25693ca32e00101f547d40933ba.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/envios/api/choferes-disponibles'
 */
obtenerChoferesDisponibles3339e25693ca32e00101f547d40933ba.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerChoferesDisponibles3339e25693ca32e00101f547d40933ba.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/envios/api/choferes-disponibles'
 */
    const obtenerChoferesDisponibles3339e25693ca32e00101f547d40933baForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerChoferesDisponibles3339e25693ca32e00101f547d40933ba.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/envios/api/choferes-disponibles'
 */
        obtenerChoferesDisponibles3339e25693ca32e00101f547d40933baForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerChoferesDisponibles3339e25693ca32e00101f547d40933ba.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:431
 * @route '/envios/api/choferes-disponibles'
 */
        obtenerChoferesDisponibles3339e25693ca32e00101f547d40933baForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerChoferesDisponibles3339e25693ca32e00101f547d40933ba.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerChoferesDisponibles3339e25693ca32e00101f547d40933ba.form = obtenerChoferesDisponibles3339e25693ca32e00101f547d40933baForm

export const obtenerChoferesDisponibles = {
    '/api/recursos/choferes/disponibles': obtenerChoferesDisponibles295ff334f2ed72fb2346d5472a1d22cc,
    '/api/choferes/disponibles': obtenerChoferesDisponiblesa070cb338051f181feec15fb5ed361b1,
    '/envios/api/choferes-disponibles': obtenerChoferesDisponibles3339e25693ca32e00101f547d40933ba,
}

/**
* @see \App\Http\Controllers\EnvioController::exportPdf
 * @see app/Http/Controllers/EnvioController.php:856
 * @route '/envios/export/pdf'
 */
export const exportPdf = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportPdf.url(options),
    method: 'get',
})

exportPdf.definition = {
    methods: ["get","head"],
    url: '/envios/export/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::exportPdf
 * @see app/Http/Controllers/EnvioController.php:856
 * @route '/envios/export/pdf'
 */
exportPdf.url = (options?: RouteQueryOptions) => {
    return exportPdf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::exportPdf
 * @see app/Http/Controllers/EnvioController.php:856
 * @route '/envios/export/pdf'
 */
exportPdf.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportPdf.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::exportPdf
 * @see app/Http/Controllers/EnvioController.php:856
 * @route '/envios/export/pdf'
 */
exportPdf.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportPdf.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::exportPdf
 * @see app/Http/Controllers/EnvioController.php:856
 * @route '/envios/export/pdf'
 */
    const exportPdfForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportPdf.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::exportPdf
 * @see app/Http/Controllers/EnvioController.php:856
 * @route '/envios/export/pdf'
 */
        exportPdfForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportPdf.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::exportPdf
 * @see app/Http/Controllers/EnvioController.php:856
 * @route '/envios/export/pdf'
 */
        exportPdfForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportPdf.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    exportPdf.form = exportPdfForm
/**
* @see \App\Http\Controllers\EnvioController::exportExcel
 * @see app/Http/Controllers/EnvioController.php:871
 * @route '/envios/export/excel'
 */
export const exportExcel = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportExcel.url(options),
    method: 'get',
})

exportExcel.definition = {
    methods: ["get","head"],
    url: '/envios/export/excel',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::exportExcel
 * @see app/Http/Controllers/EnvioController.php:871
 * @route '/envios/export/excel'
 */
exportExcel.url = (options?: RouteQueryOptions) => {
    return exportExcel.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::exportExcel
 * @see app/Http/Controllers/EnvioController.php:871
 * @route '/envios/export/excel'
 */
exportExcel.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportExcel.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::exportExcel
 * @see app/Http/Controllers/EnvioController.php:871
 * @route '/envios/export/excel'
 */
exportExcel.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportExcel.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::exportExcel
 * @see app/Http/Controllers/EnvioController.php:871
 * @route '/envios/export/excel'
 */
    const exportExcelForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportExcel.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::exportExcel
 * @see app/Http/Controllers/EnvioController.php:871
 * @route '/envios/export/excel'
 */
        exportExcelForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportExcel.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::exportExcel
 * @see app/Http/Controllers/EnvioController.php:871
 * @route '/envios/export/excel'
 */
        exportExcelForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportExcel.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    exportExcel.form = exportExcelForm
/**
* @see \App\Http\Controllers\EnvioController::exportEntregasRechazadas
 * @see app/Http/Controllers/EnvioController.php:883
 * @route '/envios/export/rechazadas'
 */
export const exportEntregasRechazadas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportEntregasRechazadas.url(options),
    method: 'get',
})

exportEntregasRechazadas.definition = {
    methods: ["get","head"],
    url: '/envios/export/rechazadas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::exportEntregasRechazadas
 * @see app/Http/Controllers/EnvioController.php:883
 * @route '/envios/export/rechazadas'
 */
exportEntregasRechazadas.url = (options?: RouteQueryOptions) => {
    return exportEntregasRechazadas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::exportEntregasRechazadas
 * @see app/Http/Controllers/EnvioController.php:883
 * @route '/envios/export/rechazadas'
 */
exportEntregasRechazadas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportEntregasRechazadas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::exportEntregasRechazadas
 * @see app/Http/Controllers/EnvioController.php:883
 * @route '/envios/export/rechazadas'
 */
exportEntregasRechazadas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportEntregasRechazadas.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::exportEntregasRechazadas
 * @see app/Http/Controllers/EnvioController.php:883
 * @route '/envios/export/rechazadas'
 */
    const exportEntregasRechazadasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportEntregasRechazadas.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::exportEntregasRechazadas
 * @see app/Http/Controllers/EnvioController.php:883
 * @route '/envios/export/rechazadas'
 */
        exportEntregasRechazadasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportEntregasRechazadas.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::exportEntregasRechazadas
 * @see app/Http/Controllers/EnvioController.php:883
 * @route '/envios/export/rechazadas'
 */
        exportEntregasRechazadasForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportEntregasRechazadas.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    exportEntregasRechazadas.form = exportEntregasRechazadasForm
/**
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:73
 * @route '/envios/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/envios/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:73
 * @route '/envios/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:73
 * @route '/envios/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:73
 * @route '/envios/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:73
 * @route '/envios/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:73
 * @route '/envios/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:73
 * @route '/envios/create'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\EnvioController::store
 * @see app/Http/Controllers/EnvioController.php:103
 * @route '/envios'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/envios',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EnvioController::store
 * @see app/Http/Controllers/EnvioController.php:103
 * @route '/envios'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::store
 * @see app/Http/Controllers/EnvioController.php:103
 * @route '/envios'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::store
 * @see app/Http/Controllers/EnvioController.php:103
 * @route '/envios'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::store
 * @see app/Http/Controllers/EnvioController.php:103
 * @route '/envios'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\EnvioController::programar
 * @see app/Http/Controllers/EnvioController.php:148
 * @route '/envios/ventas/{venta}/programar'
 */
export const programar = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: programar.url(args, options),
    method: 'post',
})

programar.definition = {
    methods: ["post"],
    url: '/envios/ventas/{venta}/programar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EnvioController::programar
 * @see app/Http/Controllers/EnvioController.php:148
 * @route '/envios/ventas/{venta}/programar'
 */
programar.url = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { venta: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: typeof args.venta === 'object'
                ? args.venta.id
                : args.venta,
                }

    return programar.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::programar
 * @see app/Http/Controllers/EnvioController.php:148
 * @route '/envios/ventas/{venta}/programar'
 */
programar.post = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: programar.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::programar
 * @see app/Http/Controllers/EnvioController.php:148
 * @route '/envios/ventas/{venta}/programar'
 */
    const programarForm = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: programar.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::programar
 * @see app/Http/Controllers/EnvioController.php:148
 * @route '/envios/ventas/{venta}/programar'
 */
        programarForm.post = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: programar.url(args, options),
            method: 'post',
        })
    
    programar.form = programarForm
/**
* @see \App\Http\Controllers\EnvioController::iniciarPreparacion
 * @see app/Http/Controllers/EnvioController.php:197
 * @route '/envios/{envio}/iniciar-preparacion'
 */
export const iniciarPreparacion = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: iniciarPreparacion.url(args, options),
    method: 'post',
})

iniciarPreparacion.definition = {
    methods: ["post"],
    url: '/envios/{envio}/iniciar-preparacion',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EnvioController::iniciarPreparacion
 * @see app/Http/Controllers/EnvioController.php:197
 * @route '/envios/{envio}/iniciar-preparacion'
 */
iniciarPreparacion.url = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { envio: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { envio: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    envio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        envio: typeof args.envio === 'object'
                ? args.envio.id
                : args.envio,
                }

    return iniciarPreparacion.definition.url
            .replace('{envio}', parsedArgs.envio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::iniciarPreparacion
 * @see app/Http/Controllers/EnvioController.php:197
 * @route '/envios/{envio}/iniciar-preparacion'
 */
iniciarPreparacion.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: iniciarPreparacion.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::iniciarPreparacion
 * @see app/Http/Controllers/EnvioController.php:197
 * @route '/envios/{envio}/iniciar-preparacion'
 */
    const iniciarPreparacionForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: iniciarPreparacion.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::iniciarPreparacion
 * @see app/Http/Controllers/EnvioController.php:197
 * @route '/envios/{envio}/iniciar-preparacion'
 */
        iniciarPreparacionForm.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: iniciarPreparacion.url(args, options),
            method: 'post',
        })
    
    iniciarPreparacion.form = iniciarPreparacionForm
/**
* @see \App\Http\Controllers\EnvioController::confirmarSalida
 * @see app/Http/Controllers/EnvioController.php:233
 * @route '/envios/{envio}/confirmar-salida'
 */
export const confirmarSalida = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarSalida.url(args, options),
    method: 'post',
})

confirmarSalida.definition = {
    methods: ["post"],
    url: '/envios/{envio}/confirmar-salida',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EnvioController::confirmarSalida
 * @see app/Http/Controllers/EnvioController.php:233
 * @route '/envios/{envio}/confirmar-salida'
 */
confirmarSalida.url = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { envio: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { envio: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    envio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        envio: typeof args.envio === 'object'
                ? args.envio.id
                : args.envio,
                }

    return confirmarSalida.definition.url
            .replace('{envio}', parsedArgs.envio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::confirmarSalida
 * @see app/Http/Controllers/EnvioController.php:233
 * @route '/envios/{envio}/confirmar-salida'
 */
confirmarSalida.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarSalida.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::confirmarSalida
 * @see app/Http/Controllers/EnvioController.php:233
 * @route '/envios/{envio}/confirmar-salida'
 */
    const confirmarSalidaForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: confirmarSalida.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::confirmarSalida
 * @see app/Http/Controllers/EnvioController.php:233
 * @route '/envios/{envio}/confirmar-salida'
 */
        confirmarSalidaForm.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: confirmarSalida.url(args, options),
            method: 'post',
        })
    
    confirmarSalida.form = confirmarSalidaForm
/**
* @see \App\Http\Controllers\EnvioController::confirmarEntrega
 * @see app/Http/Controllers/EnvioController.php:257
 * @route '/envios/{envio}/confirmar-entrega'
 */
export const confirmarEntrega = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarEntrega.url(args, options),
    method: 'post',
})

confirmarEntrega.definition = {
    methods: ["post"],
    url: '/envios/{envio}/confirmar-entrega',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EnvioController::confirmarEntrega
 * @see app/Http/Controllers/EnvioController.php:257
 * @route '/envios/{envio}/confirmar-entrega'
 */
confirmarEntrega.url = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { envio: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { envio: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    envio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        envio: typeof args.envio === 'object'
                ? args.envio.id
                : args.envio,
                }

    return confirmarEntrega.definition.url
            .replace('{envio}', parsedArgs.envio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::confirmarEntrega
 * @see app/Http/Controllers/EnvioController.php:257
 * @route '/envios/{envio}/confirmar-entrega'
 */
confirmarEntrega.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarEntrega.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::confirmarEntrega
 * @see app/Http/Controllers/EnvioController.php:257
 * @route '/envios/{envio}/confirmar-entrega'
 */
    const confirmarEntregaForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: confirmarEntrega.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::confirmarEntrega
 * @see app/Http/Controllers/EnvioController.php:257
 * @route '/envios/{envio}/confirmar-entrega'
 */
        confirmarEntregaForm.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: confirmarEntrega.url(args, options),
            method: 'post',
        })
    
    confirmarEntrega.form = confirmarEntregaForm
/**
* @see \App\Http\Controllers\EnvioController::cancelar
 * @see app/Http/Controllers/EnvioController.php:380
 * @route '/envios/{envio}/cancelar'
 */
export const cancelar = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelar.url(args, options),
    method: 'post',
})

cancelar.definition = {
    methods: ["post"],
    url: '/envios/{envio}/cancelar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EnvioController::cancelar
 * @see app/Http/Controllers/EnvioController.php:380
 * @route '/envios/{envio}/cancelar'
 */
cancelar.url = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { envio: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { envio: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    envio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        envio: typeof args.envio === 'object'
                ? args.envio.id
                : args.envio,
                }

    return cancelar.definition.url
            .replace('{envio}', parsedArgs.envio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::cancelar
 * @see app/Http/Controllers/EnvioController.php:380
 * @route '/envios/{envio}/cancelar'
 */
cancelar.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelar.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::cancelar
 * @see app/Http/Controllers/EnvioController.php:380
 * @route '/envios/{envio}/cancelar'
 */
    const cancelarForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelar.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::cancelar
 * @see app/Http/Controllers/EnvioController.php:380
 * @route '/envios/{envio}/cancelar'
 */
        cancelarForm.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelar.url(args, options),
            method: 'post',
        })
    
    cancelar.form = cancelarForm
/**
* @see \App\Http\Controllers\EnvioController::show
 * @see app/Http/Controllers/EnvioController.php:133
 * @route '/envios/{envio}'
 */
export const show = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/envios/{envio}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::show
 * @see app/Http/Controllers/EnvioController.php:133
 * @route '/envios/{envio}'
 */
show.url = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { envio: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { envio: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    envio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        envio: typeof args.envio === 'object'
                ? args.envio.id
                : args.envio,
                }

    return show.definition.url
            .replace('{envio}', parsedArgs.envio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::show
 * @see app/Http/Controllers/EnvioController.php:133
 * @route '/envios/{envio}'
 */
show.get = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::show
 * @see app/Http/Controllers/EnvioController.php:133
 * @route '/envios/{envio}'
 */
show.head = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::show
 * @see app/Http/Controllers/EnvioController.php:133
 * @route '/envios/{envio}'
 */
    const showForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::show
 * @see app/Http/Controllers/EnvioController.php:133
 * @route '/envios/{envio}'
 */
        showForm.get = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::show
 * @see app/Http/Controllers/EnvioController.php:133
 * @route '/envios/{envio}'
 */
        showForm.head = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const EnvioController = { enviosCliente, seguimientoApi, actualizarUbicacion, rechazarEntrega, dashboardStats, index, seguimiento, actualizarEstado, obtenerVehiculosDisponibles, obtenerChoferesDisponibles, exportPdf, exportExcel, exportEntregasRechazadas, create, store, programar, iniciarPreparacion, confirmarSalida, confirmarEntrega, cancelar, show }

export default EnvioController