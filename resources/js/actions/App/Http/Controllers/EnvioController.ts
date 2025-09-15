import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\EnvioController::enviosCliente
 * @see app/Http/Controllers/EnvioController.php:462
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
 * @see app/Http/Controllers/EnvioController.php:462
 * @route '/api/app/cliente/envios'
 */
enviosCliente.url = (options?: RouteQueryOptions) => {
    return enviosCliente.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::enviosCliente
 * @see app/Http/Controllers/EnvioController.php:462
 * @route '/api/app/cliente/envios'
 */
enviosCliente.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: enviosCliente.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::enviosCliente
 * @see app/Http/Controllers/EnvioController.php:462
 * @route '/api/app/cliente/envios'
 */
enviosCliente.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: enviosCliente.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::enviosCliente
 * @see app/Http/Controllers/EnvioController.php:462
 * @route '/api/app/cliente/envios'
 */
    const enviosClienteForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: enviosCliente.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::enviosCliente
 * @see app/Http/Controllers/EnvioController.php:462
 * @route '/api/app/cliente/envios'
 */
        enviosClienteForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: enviosCliente.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::enviosCliente
 * @see app/Http/Controllers/EnvioController.php:462
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
 * @see app/Http/Controllers/EnvioController.php:482
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
 * @see app/Http/Controllers/EnvioController.php:482
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
 * @see app/Http/Controllers/EnvioController.php:482
 * @route '/api/app/envios/{envio}/seguimiento'
 */
seguimientoApi.get = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: seguimientoApi.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::seguimientoApi
 * @see app/Http/Controllers/EnvioController.php:482
 * @route '/api/app/envios/{envio}/seguimiento'
 */
seguimientoApi.head = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: seguimientoApi.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::seguimientoApi
 * @see app/Http/Controllers/EnvioController.php:482
 * @route '/api/app/envios/{envio}/seguimiento'
 */
    const seguimientoApiForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: seguimientoApi.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::seguimientoApi
 * @see app/Http/Controllers/EnvioController.php:482
 * @route '/api/app/envios/{envio}/seguimiento'
 */
        seguimientoApiForm.get = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: seguimientoApi.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::seguimientoApi
 * @see app/Http/Controllers/EnvioController.php:482
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
 * @see app/Http/Controllers/EnvioController.php:508
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
 * @see app/Http/Controllers/EnvioController.php:508
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
 * @see app/Http/Controllers/EnvioController.php:508
 * @route '/api/app/envios/{envio}/ubicacion'
 */
actualizarUbicacion.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarUbicacion.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::actualizarUbicacion
 * @see app/Http/Controllers/EnvioController.php:508
 * @route '/api/app/envios/{envio}/ubicacion'
 */
    const actualizarUbicacionForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: actualizarUbicacion.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::actualizarUbicacion
 * @see app/Http/Controllers/EnvioController.php:508
 * @route '/api/app/envios/{envio}/ubicacion'
 */
        actualizarUbicacionForm.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: actualizarUbicacion.url(args, options),
            method: 'post',
        })
    
    actualizarUbicacion.form = actualizarUbicacionForm
/**
* @see \App\Http\Controllers\EnvioController::dashboardStats
 * @see app/Http/Controllers/EnvioController.php:364
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
 * @see app/Http/Controllers/EnvioController.php:364
 * @route '/api/logistica/dashboard/stats'
 */
dashboardStats.url = (options?: RouteQueryOptions) => {
    return dashboardStats.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::dashboardStats
 * @see app/Http/Controllers/EnvioController.php:364
 * @route '/api/logistica/dashboard/stats'
 */
dashboardStats.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboardStats.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::dashboardStats
 * @see app/Http/Controllers/EnvioController.php:364
 * @route '/api/logistica/dashboard/stats'
 */
dashboardStats.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboardStats.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::dashboardStats
 * @see app/Http/Controllers/EnvioController.php:364
 * @route '/api/logistica/dashboard/stats'
 */
    const dashboardStatsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: dashboardStats.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::dashboardStats
 * @see app/Http/Controllers/EnvioController.php:364
 * @route '/api/logistica/dashboard/stats'
 */
        dashboardStatsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboardStats.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::dashboardStats
 * @see app/Http/Controllers/EnvioController.php:364
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
 * @see app/Http/Controllers/EnvioController.php:19
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
 * @see app/Http/Controllers/EnvioController.php:19
 * @route '/api/envios'
 */
index761e3cc54565afeeec1d7f1a88eae79a.url = (options?: RouteQueryOptions) => {
    return index761e3cc54565afeeec1d7f1a88eae79a.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:19
 * @route '/api/envios'
 */
index761e3cc54565afeeec1d7f1a88eae79a.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index761e3cc54565afeeec1d7f1a88eae79a.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:19
 * @route '/api/envios'
 */
index761e3cc54565afeeec1d7f1a88eae79a.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index761e3cc54565afeeec1d7f1a88eae79a.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:19
 * @route '/api/envios'
 */
    const index761e3cc54565afeeec1d7f1a88eae79aForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index761e3cc54565afeeec1d7f1a88eae79a.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:19
 * @route '/api/envios'
 */
        index761e3cc54565afeeec1d7f1a88eae79aForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index761e3cc54565afeeec1d7f1a88eae79a.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:19
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
 * @see app/Http/Controllers/EnvioController.php:19
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
 * @see app/Http/Controllers/EnvioController.php:19
 * @route '/envios'
 */
index0e0282185c02bf06412c7bc696eb340c.url = (options?: RouteQueryOptions) => {
    return index0e0282185c02bf06412c7bc696eb340c.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:19
 * @route '/envios'
 */
index0e0282185c02bf06412c7bc696eb340c.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index0e0282185c02bf06412c7bc696eb340c.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:19
 * @route '/envios'
 */
index0e0282185c02bf06412c7bc696eb340c.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index0e0282185c02bf06412c7bc696eb340c.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:19
 * @route '/envios'
 */
    const index0e0282185c02bf06412c7bc696eb340cForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index0e0282185c02bf06412c7bc696eb340c.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:19
 * @route '/envios'
 */
        index0e0282185c02bf06412c7bc696eb340cForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index0e0282185c02bf06412c7bc696eb340c.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:19
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
 * @see app/Http/Controllers/EnvioController.php:383
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
 * @see app/Http/Controllers/EnvioController.php:383
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
 * @see app/Http/Controllers/EnvioController.php:383
 * @route '/api/envios/{envio}/seguimiento'
 */
seguimiento.get = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: seguimiento.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::seguimiento
 * @see app/Http/Controllers/EnvioController.php:383
 * @route '/api/envios/{envio}/seguimiento'
 */
seguimiento.head = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: seguimiento.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::seguimiento
 * @see app/Http/Controllers/EnvioController.php:383
 * @route '/api/envios/{envio}/seguimiento'
 */
    const seguimientoForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: seguimiento.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::seguimiento
 * @see app/Http/Controllers/EnvioController.php:383
 * @route '/api/envios/{envio}/seguimiento'
 */
        seguimientoForm.get = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: seguimiento.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::seguimiento
 * @see app/Http/Controllers/EnvioController.php:383
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
 * @see app/Http/Controllers/EnvioController.php:399
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
 * @see app/Http/Controllers/EnvioController.php:399
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
 * @see app/Http/Controllers/EnvioController.php:399
 * @route '/api/envios/{envio}/estado'
 */
actualizarEstado.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarEstado.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::actualizarEstado
 * @see app/Http/Controllers/EnvioController.php:399
 * @route '/api/envios/{envio}/estado'
 */
    const actualizarEstadoForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: actualizarEstado.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::actualizarEstado
 * @see app/Http/Controllers/EnvioController.php:399
 * @route '/api/envios/{envio}/estado'
 */
        actualizarEstadoForm.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: actualizarEstado.url(args, options),
            method: 'post',
        })
    
    actualizarEstado.form = actualizarEstadoForm
/**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:303
 * @route '/envios/api/vehiculos-disponibles'
 */
export const obtenerVehiculosDisponibles = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerVehiculosDisponibles.url(options),
    method: 'get',
})

obtenerVehiculosDisponibles.definition = {
    methods: ["get","head"],
    url: '/envios/api/vehiculos-disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:303
 * @route '/envios/api/vehiculos-disponibles'
 */
obtenerVehiculosDisponibles.url = (options?: RouteQueryOptions) => {
    return obtenerVehiculosDisponibles.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:303
 * @route '/envios/api/vehiculos-disponibles'
 */
obtenerVehiculosDisponibles.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerVehiculosDisponibles.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:303
 * @route '/envios/api/vehiculos-disponibles'
 */
obtenerVehiculosDisponibles.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerVehiculosDisponibles.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:303
 * @route '/envios/api/vehiculos-disponibles'
 */
    const obtenerVehiculosDisponiblesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerVehiculosDisponibles.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:303
 * @route '/envios/api/vehiculos-disponibles'
 */
        obtenerVehiculosDisponiblesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerVehiculosDisponibles.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::obtenerVehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:303
 * @route '/envios/api/vehiculos-disponibles'
 */
        obtenerVehiculosDisponiblesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerVehiculosDisponibles.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerVehiculosDisponibles.form = obtenerVehiculosDisponiblesForm
/**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:312
 * @route '/envios/api/choferes-disponibles'
 */
export const obtenerChoferesDisponibles = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerChoferesDisponibles.url(options),
    method: 'get',
})

obtenerChoferesDisponibles.definition = {
    methods: ["get","head"],
    url: '/envios/api/choferes-disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:312
 * @route '/envios/api/choferes-disponibles'
 */
obtenerChoferesDisponibles.url = (options?: RouteQueryOptions) => {
    return obtenerChoferesDisponibles.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:312
 * @route '/envios/api/choferes-disponibles'
 */
obtenerChoferesDisponibles.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerChoferesDisponibles.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:312
 * @route '/envios/api/choferes-disponibles'
 */
obtenerChoferesDisponibles.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerChoferesDisponibles.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:312
 * @route '/envios/api/choferes-disponibles'
 */
    const obtenerChoferesDisponiblesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerChoferesDisponibles.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:312
 * @route '/envios/api/choferes-disponibles'
 */
        obtenerChoferesDisponiblesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerChoferesDisponibles.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::obtenerChoferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:312
 * @route '/envios/api/choferes-disponibles'
 */
        obtenerChoferesDisponiblesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerChoferesDisponibles.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerChoferesDisponibles.form = obtenerChoferesDisponiblesForm
/**
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:30
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
 * @see app/Http/Controllers/EnvioController.php:30
 * @route '/envios/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:30
 * @route '/envios/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:30
 * @route '/envios/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:30
 * @route '/envios/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:30
 * @route '/envios/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:30
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
 * @see app/Http/Controllers/EnvioController.php:60
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
 * @see app/Http/Controllers/EnvioController.php:60
 * @route '/envios'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::store
 * @see app/Http/Controllers/EnvioController.php:60
 * @route '/envios'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::store
 * @see app/Http/Controllers/EnvioController.php:60
 * @route '/envios'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::store
 * @see app/Http/Controllers/EnvioController.php:60
 * @route '/envios'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\EnvioController::programar
 * @see app/Http/Controllers/EnvioController.php:116
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
 * @see app/Http/Controllers/EnvioController.php:116
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
 * @see app/Http/Controllers/EnvioController.php:116
 * @route '/envios/ventas/{venta}/programar'
 */
programar.post = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: programar.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::programar
 * @see app/Http/Controllers/EnvioController.php:116
 * @route '/envios/ventas/{venta}/programar'
 */
    const programarForm = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: programar.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::programar
 * @see app/Http/Controllers/EnvioController.php:116
 * @route '/envios/ventas/{venta}/programar'
 */
        programarForm.post = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: programar.url(args, options),
            method: 'post',
        })
    
    programar.form = programarForm
/**
* @see \App\Http\Controllers\EnvioController::iniciarPreparacion
 * @see app/Http/Controllers/EnvioController.php:165
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
 * @see app/Http/Controllers/EnvioController.php:165
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
 * @see app/Http/Controllers/EnvioController.php:165
 * @route '/envios/{envio}/iniciar-preparacion'
 */
iniciarPreparacion.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: iniciarPreparacion.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::iniciarPreparacion
 * @see app/Http/Controllers/EnvioController.php:165
 * @route '/envios/{envio}/iniciar-preparacion'
 */
    const iniciarPreparacionForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: iniciarPreparacion.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::iniciarPreparacion
 * @see app/Http/Controllers/EnvioController.php:165
 * @route '/envios/{envio}/iniciar-preparacion'
 */
        iniciarPreparacionForm.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: iniciarPreparacion.url(args, options),
            method: 'post',
        })
    
    iniciarPreparacion.form = iniciarPreparacionForm
/**
* @see \App\Http\Controllers\EnvioController::confirmarSalida
 * @see app/Http/Controllers/EnvioController.php:198
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
 * @see app/Http/Controllers/EnvioController.php:198
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
 * @see app/Http/Controllers/EnvioController.php:198
 * @route '/envios/{envio}/confirmar-salida'
 */
confirmarSalida.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarSalida.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::confirmarSalida
 * @see app/Http/Controllers/EnvioController.php:198
 * @route '/envios/{envio}/confirmar-salida'
 */
    const confirmarSalidaForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: confirmarSalida.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::confirmarSalida
 * @see app/Http/Controllers/EnvioController.php:198
 * @route '/envios/{envio}/confirmar-salida'
 */
        confirmarSalidaForm.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: confirmarSalida.url(args, options),
            method: 'post',
        })
    
    confirmarSalida.form = confirmarSalidaForm
/**
* @see \App\Http\Controllers\EnvioController::confirmarEntrega
 * @see app/Http/Controllers/EnvioController.php:219
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
 * @see app/Http/Controllers/EnvioController.php:219
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
 * @see app/Http/Controllers/EnvioController.php:219
 * @route '/envios/{envio}/confirmar-entrega'
 */
confirmarEntrega.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarEntrega.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::confirmarEntrega
 * @see app/Http/Controllers/EnvioController.php:219
 * @route '/envios/{envio}/confirmar-entrega'
 */
    const confirmarEntregaForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: confirmarEntrega.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::confirmarEntrega
 * @see app/Http/Controllers/EnvioController.php:219
 * @route '/envios/{envio}/confirmar-entrega'
 */
        confirmarEntregaForm.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: confirmarEntrega.url(args, options),
            method: 'post',
        })
    
    confirmarEntrega.form = confirmarEntregaForm
/**
* @see \App\Http\Controllers\EnvioController::cancelar
 * @see app/Http/Controllers/EnvioController.php:268
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
 * @see app/Http/Controllers/EnvioController.php:268
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
 * @see app/Http/Controllers/EnvioController.php:268
 * @route '/envios/{envio}/cancelar'
 */
cancelar.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelar.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::cancelar
 * @see app/Http/Controllers/EnvioController.php:268
 * @route '/envios/{envio}/cancelar'
 */
    const cancelarForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelar.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::cancelar
 * @see app/Http/Controllers/EnvioController.php:268
 * @route '/envios/{envio}/cancelar'
 */
        cancelarForm.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelar.url(args, options),
            method: 'post',
        })
    
    cancelar.form = cancelarForm
/**
* @see \App\Http\Controllers\EnvioController::show
 * @see app/Http/Controllers/EnvioController.php:101
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
 * @see app/Http/Controllers/EnvioController.php:101
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
 * @see app/Http/Controllers/EnvioController.php:101
 * @route '/envios/{envio}'
 */
show.get = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::show
 * @see app/Http/Controllers/EnvioController.php:101
 * @route '/envios/{envio}'
 */
show.head = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::show
 * @see app/Http/Controllers/EnvioController.php:101
 * @route '/envios/{envio}'
 */
    const showForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::show
 * @see app/Http/Controllers/EnvioController.php:101
 * @route '/envios/{envio}'
 */
        showForm.get = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::show
 * @see app/Http/Controllers/EnvioController.php:101
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
const EnvioController = { enviosCliente, seguimientoApi, actualizarUbicacion, dashboardStats, index, seguimiento, actualizarEstado, obtenerVehiculosDisponibles, obtenerChoferesDisponibles, create, store, programar, iniciarPreparacion, confirmarSalida, confirmarEntrega, cancelar, show }

export default EnvioController