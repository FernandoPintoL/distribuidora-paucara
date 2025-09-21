import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ClienteController::indexApi
 * @see app/Http/Controllers/ClienteController.php:380
 * @route '/api/clientes'
 */
export const indexApi = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexApi.url(options),
    method: 'get',
})

indexApi.definition = {
    methods: ["get","head"],
    url: '/api/clientes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClienteController::indexApi
 * @see app/Http/Controllers/ClienteController.php:380
 * @route '/api/clientes'
 */
indexApi.url = (options?: RouteQueryOptions) => {
    return indexApi.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::indexApi
 * @see app/Http/Controllers/ClienteController.php:380
 * @route '/api/clientes'
 */
indexApi.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexApi.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::indexApi
 * @see app/Http/Controllers/ClienteController.php:380
 * @route '/api/clientes'
 */
indexApi.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: indexApi.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::indexApi
 * @see app/Http/Controllers/ClienteController.php:380
 * @route '/api/clientes'
 */
    const indexApiForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: indexApi.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::indexApi
 * @see app/Http/Controllers/ClienteController.php:380
 * @route '/api/clientes'
 */
        indexApiForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: indexApi.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::indexApi
 * @see app/Http/Controllers/ClienteController.php:380
 * @route '/api/clientes'
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
* @see \App\Http\Controllers\ClienteController::storeApi
 * @see app/Http/Controllers/ClienteController.php:413
 * @route '/api/clientes'
 */
export const storeApi = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeApi.url(options),
    method: 'post',
})

storeApi.definition = {
    methods: ["post"],
    url: '/api/clientes',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ClienteController::storeApi
 * @see app/Http/Controllers/ClienteController.php:413
 * @route '/api/clientes'
 */
storeApi.url = (options?: RouteQueryOptions) => {
    return storeApi.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::storeApi
 * @see app/Http/Controllers/ClienteController.php:413
 * @route '/api/clientes'
 */
storeApi.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeApi.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ClienteController::storeApi
 * @see app/Http/Controllers/ClienteController.php:413
 * @route '/api/clientes'
 */
    const storeApiForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeApi.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ClienteController::storeApi
 * @see app/Http/Controllers/ClienteController.php:413
 * @route '/api/clientes'
 */
        storeApiForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeApi.url(options),
            method: 'post',
        })
    
    storeApi.form = storeApiForm
/**
* @see \App\Http\Controllers\ClienteController::buscarApi
 * @see app/Http/Controllers/ClienteController.php:767
 * @route '/api/clientes/buscar'
 */
export const buscarApi = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: buscarApi.url(options),
    method: 'get',
})

buscarApi.definition = {
    methods: ["get","head"],
    url: '/api/clientes/buscar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClienteController::buscarApi
 * @see app/Http/Controllers/ClienteController.php:767
 * @route '/api/clientes/buscar'
 */
buscarApi.url = (options?: RouteQueryOptions) => {
    return buscarApi.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::buscarApi
 * @see app/Http/Controllers/ClienteController.php:767
 * @route '/api/clientes/buscar'
 */
buscarApi.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: buscarApi.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::buscarApi
 * @see app/Http/Controllers/ClienteController.php:767
 * @route '/api/clientes/buscar'
 */
buscarApi.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: buscarApi.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::buscarApi
 * @see app/Http/Controllers/ClienteController.php:767
 * @route '/api/clientes/buscar'
 */
    const buscarApiForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: buscarApi.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::buscarApi
 * @see app/Http/Controllers/ClienteController.php:767
 * @route '/api/clientes/buscar'
 */
        buscarApiForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: buscarApi.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::buscarApi
 * @see app/Http/Controllers/ClienteController.php:767
 * @route '/api/clientes/buscar'
 */
        buscarApiForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: buscarApi.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    buscarApi.form = buscarApiForm
/**
* @see \App\Http\Controllers\ClienteController::showApi
 * @see app/Http/Controllers/ClienteController.php:401
 * @route '/api/clientes/{cliente}'
 */
export const showApi = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showApi.url(args, options),
    method: 'get',
})

showApi.definition = {
    methods: ["get","head"],
    url: '/api/clientes/{cliente}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClienteController::showApi
 * @see app/Http/Controllers/ClienteController.php:401
 * @route '/api/clientes/{cliente}'
 */
showApi.url = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cliente: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cliente: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cliente: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cliente: typeof args.cliente === 'object'
                ? args.cliente.id
                : args.cliente,
                }

    return showApi.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::showApi
 * @see app/Http/Controllers/ClienteController.php:401
 * @route '/api/clientes/{cliente}'
 */
showApi.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showApi.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::showApi
 * @see app/Http/Controllers/ClienteController.php:401
 * @route '/api/clientes/{cliente}'
 */
showApi.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showApi.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::showApi
 * @see app/Http/Controllers/ClienteController.php:401
 * @route '/api/clientes/{cliente}'
 */
    const showApiForm = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: showApi.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::showApi
 * @see app/Http/Controllers/ClienteController.php:401
 * @route '/api/clientes/{cliente}'
 */
        showApiForm.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showApi.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::showApi
 * @see app/Http/Controllers/ClienteController.php:401
 * @route '/api/clientes/{cliente}'
 */
        showApiForm.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\ClienteController::updateApi
 * @see app/Http/Controllers/ClienteController.php:605
 * @route '/api/clientes/{cliente}'
 */
export const updateApi = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateApi.url(args, options),
    method: 'put',
})

updateApi.definition = {
    methods: ["put"],
    url: '/api/clientes/{cliente}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\ClienteController::updateApi
 * @see app/Http/Controllers/ClienteController.php:605
 * @route '/api/clientes/{cliente}'
 */
updateApi.url = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cliente: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cliente: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cliente: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cliente: typeof args.cliente === 'object'
                ? args.cliente.id
                : args.cliente,
                }

    return updateApi.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::updateApi
 * @see app/Http/Controllers/ClienteController.php:605
 * @route '/api/clientes/{cliente}'
 */
updateApi.put = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateApi.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\ClienteController::updateApi
 * @see app/Http/Controllers/ClienteController.php:605
 * @route '/api/clientes/{cliente}'
 */
    const updateApiForm = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateApi.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ClienteController::updateApi
 * @see app/Http/Controllers/ClienteController.php:605
 * @route '/api/clientes/{cliente}'
 */
        updateApiForm.put = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateApi.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateApi.form = updateApiForm
/**
* @see \App\Http\Controllers\ClienteController::destroyApi
 * @see app/Http/Controllers/ClienteController.php:736
 * @route '/api/clientes/{cliente}'
 */
export const destroyApi = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyApi.url(args, options),
    method: 'delete',
})

destroyApi.definition = {
    methods: ["delete"],
    url: '/api/clientes/{cliente}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ClienteController::destroyApi
 * @see app/Http/Controllers/ClienteController.php:736
 * @route '/api/clientes/{cliente}'
 */
destroyApi.url = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cliente: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cliente: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cliente: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cliente: typeof args.cliente === 'object'
                ? args.cliente.id
                : args.cliente,
                }

    return destroyApi.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::destroyApi
 * @see app/Http/Controllers/ClienteController.php:736
 * @route '/api/clientes/{cliente}'
 */
destroyApi.delete = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyApi.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\ClienteController::destroyApi
 * @see app/Http/Controllers/ClienteController.php:736
 * @route '/api/clientes/{cliente}'
 */
    const destroyApiForm = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroyApi.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ClienteController::destroyApi
 * @see app/Http/Controllers/ClienteController.php:736
 * @route '/api/clientes/{cliente}'
 */
        destroyApiForm.delete = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroyApi.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroyApi.form = destroyApiForm
/**
* @see \App\Http\Controllers\ClienteController::saldoCuentasPorCobrar
 * @see app/Http/Controllers/ClienteController.php:793
 * @route '/api/clientes/{cliente}/saldo-cuentas'
 */
export const saldoCuentasPorCobrar = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: saldoCuentasPorCobrar.url(args, options),
    method: 'get',
})

saldoCuentasPorCobrar.definition = {
    methods: ["get","head"],
    url: '/api/clientes/{cliente}/saldo-cuentas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClienteController::saldoCuentasPorCobrar
 * @see app/Http/Controllers/ClienteController.php:793
 * @route '/api/clientes/{cliente}/saldo-cuentas'
 */
saldoCuentasPorCobrar.url = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cliente: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cliente: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cliente: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cliente: typeof args.cliente === 'object'
                ? args.cliente.id
                : args.cliente,
                }

    return saldoCuentasPorCobrar.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::saldoCuentasPorCobrar
 * @see app/Http/Controllers/ClienteController.php:793
 * @route '/api/clientes/{cliente}/saldo-cuentas'
 */
saldoCuentasPorCobrar.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: saldoCuentasPorCobrar.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::saldoCuentasPorCobrar
 * @see app/Http/Controllers/ClienteController.php:793
 * @route '/api/clientes/{cliente}/saldo-cuentas'
 */
saldoCuentasPorCobrar.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: saldoCuentasPorCobrar.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::saldoCuentasPorCobrar
 * @see app/Http/Controllers/ClienteController.php:793
 * @route '/api/clientes/{cliente}/saldo-cuentas'
 */
    const saldoCuentasPorCobrarForm = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: saldoCuentasPorCobrar.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::saldoCuentasPorCobrar
 * @see app/Http/Controllers/ClienteController.php:793
 * @route '/api/clientes/{cliente}/saldo-cuentas'
 */
        saldoCuentasPorCobrarForm.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: saldoCuentasPorCobrar.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::saldoCuentasPorCobrar
 * @see app/Http/Controllers/ClienteController.php:793
 * @route '/api/clientes/{cliente}/saldo-cuentas'
 */
        saldoCuentasPorCobrarForm.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: saldoCuentasPorCobrar.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    saldoCuentasPorCobrar.form = saldoCuentasPorCobrarForm
/**
* @see \App\Http\Controllers\ClienteController::historialVentas
 * @see app/Http/Controllers/ClienteController.php:818
 * @route '/api/clientes/{cliente}/historial-ventas'
 */
export const historialVentas = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: historialVentas.url(args, options),
    method: 'get',
})

historialVentas.definition = {
    methods: ["get","head"],
    url: '/api/clientes/{cliente}/historial-ventas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClienteController::historialVentas
 * @see app/Http/Controllers/ClienteController.php:818
 * @route '/api/clientes/{cliente}/historial-ventas'
 */
historialVentas.url = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cliente: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cliente: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cliente: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cliente: typeof args.cliente === 'object'
                ? args.cliente.id
                : args.cliente,
                }

    return historialVentas.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::historialVentas
 * @see app/Http/Controllers/ClienteController.php:818
 * @route '/api/clientes/{cliente}/historial-ventas'
 */
historialVentas.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: historialVentas.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::historialVentas
 * @see app/Http/Controllers/ClienteController.php:818
 * @route '/api/clientes/{cliente}/historial-ventas'
 */
historialVentas.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: historialVentas.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::historialVentas
 * @see app/Http/Controllers/ClienteController.php:818
 * @route '/api/clientes/{cliente}/historial-ventas'
 */
    const historialVentasForm = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: historialVentas.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::historialVentas
 * @see app/Http/Controllers/ClienteController.php:818
 * @route '/api/clientes/{cliente}/historial-ventas'
 */
        historialVentasForm.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: historialVentas.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::historialVentas
 * @see app/Http/Controllers/ClienteController.php:818
 * @route '/api/clientes/{cliente}/historial-ventas'
 */
        historialVentasForm.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: historialVentas.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    historialVentas.form = historialVentasForm
/**
* @see \App\Http\Controllers\ClienteController::cambiarCredenciales
 * @see app/Http/Controllers/ClienteController.php:857
 * @route '/api/clientes/cambiar-credenciales'
 */
export const cambiarCredenciales = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cambiarCredenciales.url(options),
    method: 'post',
})

cambiarCredenciales.definition = {
    methods: ["post"],
    url: '/api/clientes/cambiar-credenciales',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ClienteController::cambiarCredenciales
 * @see app/Http/Controllers/ClienteController.php:857
 * @route '/api/clientes/cambiar-credenciales'
 */
cambiarCredenciales.url = (options?: RouteQueryOptions) => {
    return cambiarCredenciales.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::cambiarCredenciales
 * @see app/Http/Controllers/ClienteController.php:857
 * @route '/api/clientes/cambiar-credenciales'
 */
cambiarCredenciales.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cambiarCredenciales.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ClienteController::cambiarCredenciales
 * @see app/Http/Controllers/ClienteController.php:857
 * @route '/api/clientes/cambiar-credenciales'
 */
    const cambiarCredencialesForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cambiarCredenciales.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ClienteController::cambiarCredenciales
 * @see app/Http/Controllers/ClienteController.php:857
 * @route '/api/clientes/cambiar-credenciales'
 */
        cambiarCredencialesForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cambiarCredenciales.url(options),
            method: 'post',
        })
    
    cambiarCredenciales.form = cambiarCredencialesForm
/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:95
 * @route '/clientes'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/clientes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:95
 * @route '/clientes'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:95
 * @route '/clientes'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:95
 * @route '/clientes'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:95
 * @route '/clientes'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:95
 * @route '/clientes'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:95
 * @route '/clientes'
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
* @see \App\Http\Controllers\ClienteController::create
 * @see app/Http/Controllers/ClienteController.php:164
 * @route '/clientes/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/clientes/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClienteController::create
 * @see app/Http/Controllers/ClienteController.php:164
 * @route '/clientes/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::create
 * @see app/Http/Controllers/ClienteController.php:164
 * @route '/clientes/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::create
 * @see app/Http/Controllers/ClienteController.php:164
 * @route '/clientes/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::create
 * @see app/Http/Controllers/ClienteController.php:164
 * @route '/clientes/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::create
 * @see app/Http/Controllers/ClienteController.php:164
 * @route '/clientes/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::create
 * @see app/Http/Controllers/ClienteController.php:164
 * @route '/clientes/create'
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
* @see \App\Http\Controllers\ClienteController::store
 * @see app/Http/Controllers/ClienteController.php:181
 * @route '/clientes'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/clientes',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ClienteController::store
 * @see app/Http/Controllers/ClienteController.php:181
 * @route '/clientes'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::store
 * @see app/Http/Controllers/ClienteController.php:181
 * @route '/clientes'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ClienteController::store
 * @see app/Http/Controllers/ClienteController.php:181
 * @route '/clientes'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ClienteController::store
 * @see app/Http/Controllers/ClienteController.php:181
 * @route '/clientes'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\ClienteController::show
 * @see app/Http/Controllers/ClienteController.php:0
 * @route '/clientes/{cliente}'
 */
export const show = (args: { cliente: string | number } | [cliente: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/clientes/{cliente}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClienteController::show
 * @see app/Http/Controllers/ClienteController.php:0
 * @route '/clientes/{cliente}'
 */
show.url = (args: { cliente: string | number } | [cliente: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cliente: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    cliente: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cliente: args.cliente,
                }

    return show.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::show
 * @see app/Http/Controllers/ClienteController.php:0
 * @route '/clientes/{cliente}'
 */
show.get = (args: { cliente: string | number } | [cliente: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::show
 * @see app/Http/Controllers/ClienteController.php:0
 * @route '/clientes/{cliente}'
 */
show.head = (args: { cliente: string | number } | [cliente: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::show
 * @see app/Http/Controllers/ClienteController.php:0
 * @route '/clientes/{cliente}'
 */
    const showForm = (args: { cliente: string | number } | [cliente: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::show
 * @see app/Http/Controllers/ClienteController.php:0
 * @route '/clientes/{cliente}'
 */
        showForm.get = (args: { cliente: string | number } | [cliente: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::show
 * @see app/Http/Controllers/ClienteController.php:0
 * @route '/clientes/{cliente}'
 */
        showForm.head = (args: { cliente: string | number } | [cliente: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\ClienteController::edit
 * @see app/Http/Controllers/ClienteController.php:240
 * @route '/clientes/{cliente}/edit'
 */
export const edit = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/clientes/{cliente}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClienteController::edit
 * @see app/Http/Controllers/ClienteController.php:240
 * @route '/clientes/{cliente}/edit'
 */
edit.url = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cliente: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cliente: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cliente: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cliente: typeof args.cliente === 'object'
                ? args.cliente.id
                : args.cliente,
                }

    return edit.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::edit
 * @see app/Http/Controllers/ClienteController.php:240
 * @route '/clientes/{cliente}/edit'
 */
edit.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::edit
 * @see app/Http/Controllers/ClienteController.php:240
 * @route '/clientes/{cliente}/edit'
 */
edit.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::edit
 * @see app/Http/Controllers/ClienteController.php:240
 * @route '/clientes/{cliente}/edit'
 */
    const editForm = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::edit
 * @see app/Http/Controllers/ClienteController.php:240
 * @route '/clientes/{cliente}/edit'
 */
        editForm.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::edit
 * @see app/Http/Controllers/ClienteController.php:240
 * @route '/clientes/{cliente}/edit'
 */
        editForm.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
/**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:258
 * @route '/clientes/{cliente}'
 */
export const update = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/clientes/{cliente}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:258
 * @route '/clientes/{cliente}'
 */
update.url = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cliente: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cliente: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cliente: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cliente: typeof args.cliente === 'object'
                ? args.cliente.id
                : args.cliente,
                }

    return update.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:258
 * @route '/clientes/{cliente}'
 */
update.put = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:258
 * @route '/clientes/{cliente}'
 */
update.patch = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:258
 * @route '/clientes/{cliente}'
 */
    const updateForm = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:258
 * @route '/clientes/{cliente}'
 */
        updateForm.put = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:258
 * @route '/clientes/{cliente}'
 */
        updateForm.patch = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\ClienteController::destroy
 * @see app/Http/Controllers/ClienteController.php:359
 * @route '/clientes/{cliente}'
 */
export const destroy = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/clientes/{cliente}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ClienteController::destroy
 * @see app/Http/Controllers/ClienteController.php:359
 * @route '/clientes/{cliente}'
 */
destroy.url = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cliente: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cliente: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cliente: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cliente: typeof args.cliente === 'object'
                ? args.cliente.id
                : args.cliente,
                }

    return destroy.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::destroy
 * @see app/Http/Controllers/ClienteController.php:359
 * @route '/clientes/{cliente}'
 */
destroy.delete = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\ClienteController::destroy
 * @see app/Http/Controllers/ClienteController.php:359
 * @route '/clientes/{cliente}'
 */
    const destroyForm = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ClienteController::destroy
 * @see app/Http/Controllers/ClienteController.php:359
 * @route '/clientes/{cliente}'
 */
        destroyForm.delete = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const ClienteController = { indexApi, storeApi, buscarApi, showApi, updateApi, destroyApi, saldoCuentasPorCobrar, historialVentas, cambiarCredenciales, index, create, store, show, edit, update, destroy }

export default ClienteController