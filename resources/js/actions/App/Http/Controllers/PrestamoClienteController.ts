import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PrestamoClienteController::index
 * @see app/Http/Controllers/PrestamoClienteController.php:26
 * @route '/api/prestamos-cliente'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/prestamos-cliente',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestamoClienteController::index
 * @see app/Http/Controllers/PrestamoClienteController.php:26
 * @route '/api/prestamos-cliente'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamoClienteController::index
 * @see app/Http/Controllers/PrestamoClienteController.php:26
 * @route '/api/prestamos-cliente'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestamoClienteController::index
 * @see app/Http/Controllers/PrestamoClienteController.php:26
 * @route '/api/prestamos-cliente'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestamoClienteController::index
 * @see app/Http/Controllers/PrestamoClienteController.php:26
 * @route '/api/prestamos-cliente'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestamoClienteController::index
 * @see app/Http/Controllers/PrestamoClienteController.php:26
 * @route '/api/prestamos-cliente'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestamoClienteController::index
 * @see app/Http/Controllers/PrestamoClienteController.php:26
 * @route '/api/prestamos-cliente'
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
* @see \App\Http\Controllers\PrestamoClienteController::store
 * @see app/Http/Controllers/PrestamoClienteController.php:62
 * @route '/api/prestamos-cliente'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/prestamos-cliente',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PrestamoClienteController::store
 * @see app/Http/Controllers/PrestamoClienteController.php:62
 * @route '/api/prestamos-cliente'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamoClienteController::store
 * @see app/Http/Controllers/PrestamoClienteController.php:62
 * @route '/api/prestamos-cliente'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PrestamoClienteController::store
 * @see app/Http/Controllers/PrestamoClienteController.php:62
 * @route '/api/prestamos-cliente'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PrestamoClienteController::store
 * @see app/Http/Controllers/PrestamoClienteController.php:62
 * @route '/api/prestamos-cliente'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\PrestamoClienteController::show
 * @see app/Http/Controllers/PrestamoClienteController.php:134
 * @route '/api/prestamos-cliente/{prestamo}'
 */
export const show = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/prestamos-cliente/{prestamo}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestamoClienteController::show
 * @see app/Http/Controllers/PrestamoClienteController.php:134
 * @route '/api/prestamos-cliente/{prestamo}'
 */
show.url = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { prestamo: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { prestamo: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    prestamo: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        prestamo: typeof args.prestamo === 'object'
                ? args.prestamo.id
                : args.prestamo,
                }

    return show.definition.url
            .replace('{prestamo}', parsedArgs.prestamo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamoClienteController::show
 * @see app/Http/Controllers/PrestamoClienteController.php:134
 * @route '/api/prestamos-cliente/{prestamo}'
 */
show.get = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestamoClienteController::show
 * @see app/Http/Controllers/PrestamoClienteController.php:134
 * @route '/api/prestamos-cliente/{prestamo}'
 */
show.head = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestamoClienteController::show
 * @see app/Http/Controllers/PrestamoClienteController.php:134
 * @route '/api/prestamos-cliente/{prestamo}'
 */
    const showForm = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestamoClienteController::show
 * @see app/Http/Controllers/PrestamoClienteController.php:134
 * @route '/api/prestamos-cliente/{prestamo}'
 */
        showForm.get = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestamoClienteController::show
 * @see app/Http/Controllers/PrestamoClienteController.php:134
 * @route '/api/prestamos-cliente/{prestamo}'
 */
        showForm.head = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\PrestamoClienteController::registrarDevolucion
 * @see app/Http/Controllers/PrestamoClienteController.php:155
 * @route '/api/prestamos-cliente/{prestamo}/devolver'
 */
export const registrarDevolucion = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarDevolucion.url(args, options),
    method: 'post',
})

registrarDevolucion.definition = {
    methods: ["post"],
    url: '/api/prestamos-cliente/{prestamo}/devolver',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PrestamoClienteController::registrarDevolucion
 * @see app/Http/Controllers/PrestamoClienteController.php:155
 * @route '/api/prestamos-cliente/{prestamo}/devolver'
 */
registrarDevolucion.url = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { prestamo: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { prestamo: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    prestamo: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        prestamo: typeof args.prestamo === 'object'
                ? args.prestamo.id
                : args.prestamo,
                }

    return registrarDevolucion.definition.url
            .replace('{prestamo}', parsedArgs.prestamo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamoClienteController::registrarDevolucion
 * @see app/Http/Controllers/PrestamoClienteController.php:155
 * @route '/api/prestamos-cliente/{prestamo}/devolver'
 */
registrarDevolucion.post = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarDevolucion.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PrestamoClienteController::registrarDevolucion
 * @see app/Http/Controllers/PrestamoClienteController.php:155
 * @route '/api/prestamos-cliente/{prestamo}/devolver'
 */
    const registrarDevolucionForm = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: registrarDevolucion.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PrestamoClienteController::registrarDevolucion
 * @see app/Http/Controllers/PrestamoClienteController.php:155
 * @route '/api/prestamos-cliente/{prestamo}/devolver'
 */
        registrarDevolucionForm.post = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: registrarDevolucion.url(args, options),
            method: 'post',
        })
    
    registrarDevolucion.form = registrarDevolucionForm
/**
* @see \App\Http\Controllers\PrestamoClienteController::obtenerPendientesChofer
 * @see app/Http/Controllers/PrestamoClienteController.php:226
 * @route '/api/prestamos-cliente/chofer/{choferId}/pendientes'
 */
export const obtenerPendientesChofer = (args: { choferId: string | number } | [choferId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerPendientesChofer.url(args, options),
    method: 'get',
})

obtenerPendientesChofer.definition = {
    methods: ["get","head"],
    url: '/api/prestamos-cliente/chofer/{choferId}/pendientes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestamoClienteController::obtenerPendientesChofer
 * @see app/Http/Controllers/PrestamoClienteController.php:226
 * @route '/api/prestamos-cliente/chofer/{choferId}/pendientes'
 */
obtenerPendientesChofer.url = (args: { choferId: string | number } | [choferId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { choferId: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    choferId: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        choferId: args.choferId,
                }

    return obtenerPendientesChofer.definition.url
            .replace('{choferId}', parsedArgs.choferId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamoClienteController::obtenerPendientesChofer
 * @see app/Http/Controllers/PrestamoClienteController.php:226
 * @route '/api/prestamos-cliente/chofer/{choferId}/pendientes'
 */
obtenerPendientesChofer.get = (args: { choferId: string | number } | [choferId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerPendientesChofer.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestamoClienteController::obtenerPendientesChofer
 * @see app/Http/Controllers/PrestamoClienteController.php:226
 * @route '/api/prestamos-cliente/chofer/{choferId}/pendientes'
 */
obtenerPendientesChofer.head = (args: { choferId: string | number } | [choferId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerPendientesChofer.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestamoClienteController::obtenerPendientesChofer
 * @see app/Http/Controllers/PrestamoClienteController.php:226
 * @route '/api/prestamos-cliente/chofer/{choferId}/pendientes'
 */
    const obtenerPendientesChoferForm = (args: { choferId: string | number } | [choferId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerPendientesChofer.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestamoClienteController::obtenerPendientesChofer
 * @see app/Http/Controllers/PrestamoClienteController.php:226
 * @route '/api/prestamos-cliente/chofer/{choferId}/pendientes'
 */
        obtenerPendientesChoferForm.get = (args: { choferId: string | number } | [choferId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerPendientesChofer.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestamoClienteController::obtenerPendientesChofer
 * @see app/Http/Controllers/PrestamoClienteController.php:226
 * @route '/api/prestamos-cliente/chofer/{choferId}/pendientes'
 */
        obtenerPendientesChoferForm.head = (args: { choferId: string | number } | [choferId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerPendientesChofer.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerPendientesChofer.form = obtenerPendientesChoferForm
/**
* @see \App\Http\Controllers\PrestamoClienteController::obtenerActivosCliente
 * @see app/Http/Controllers/PrestamoClienteController.php:245
 * @route '/api/prestamos-cliente/cliente/{clienteId}/activos'
 */
export const obtenerActivosCliente = (args: { clienteId: string | number } | [clienteId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerActivosCliente.url(args, options),
    method: 'get',
})

obtenerActivosCliente.definition = {
    methods: ["get","head"],
    url: '/api/prestamos-cliente/cliente/{clienteId}/activos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestamoClienteController::obtenerActivosCliente
 * @see app/Http/Controllers/PrestamoClienteController.php:245
 * @route '/api/prestamos-cliente/cliente/{clienteId}/activos'
 */
obtenerActivosCliente.url = (args: { clienteId: string | number } | [clienteId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { clienteId: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    clienteId: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        clienteId: args.clienteId,
                }

    return obtenerActivosCliente.definition.url
            .replace('{clienteId}', parsedArgs.clienteId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamoClienteController::obtenerActivosCliente
 * @see app/Http/Controllers/PrestamoClienteController.php:245
 * @route '/api/prestamos-cliente/cliente/{clienteId}/activos'
 */
obtenerActivosCliente.get = (args: { clienteId: string | number } | [clienteId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerActivosCliente.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestamoClienteController::obtenerActivosCliente
 * @see app/Http/Controllers/PrestamoClienteController.php:245
 * @route '/api/prestamos-cliente/cliente/{clienteId}/activos'
 */
obtenerActivosCliente.head = (args: { clienteId: string | number } | [clienteId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerActivosCliente.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestamoClienteController::obtenerActivosCliente
 * @see app/Http/Controllers/PrestamoClienteController.php:245
 * @route '/api/prestamos-cliente/cliente/{clienteId}/activos'
 */
    const obtenerActivosClienteForm = (args: { clienteId: string | number } | [clienteId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerActivosCliente.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestamoClienteController::obtenerActivosCliente
 * @see app/Http/Controllers/PrestamoClienteController.php:245
 * @route '/api/prestamos-cliente/cliente/{clienteId}/activos'
 */
        obtenerActivosClienteForm.get = (args: { clienteId: string | number } | [clienteId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerActivosCliente.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestamoClienteController::obtenerActivosCliente
 * @see app/Http/Controllers/PrestamoClienteController.php:245
 * @route '/api/prestamos-cliente/cliente/{clienteId}/activos'
 */
        obtenerActivosClienteForm.head = (args: { clienteId: string | number } | [clienteId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerActivosCliente.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerActivosCliente.form = obtenerActivosClienteForm
/**
* @see \App\Http\Controllers\PrestamoClienteController::imprimir
 * @see app/Http/Controllers/PrestamoClienteController.php:264
 * @route '/prestamos/clientes/{prestamo}/imprimir'
 */
export const imprimir = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir.url(args, options),
    method: 'get',
})

imprimir.definition = {
    methods: ["get","head"],
    url: '/prestamos/clientes/{prestamo}/imprimir',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestamoClienteController::imprimir
 * @see app/Http/Controllers/PrestamoClienteController.php:264
 * @route '/prestamos/clientes/{prestamo}/imprimir'
 */
imprimir.url = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { prestamo: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { prestamo: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    prestamo: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        prestamo: typeof args.prestamo === 'object'
                ? args.prestamo.id
                : args.prestamo,
                }

    return imprimir.definition.url
            .replace('{prestamo}', parsedArgs.prestamo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamoClienteController::imprimir
 * @see app/Http/Controllers/PrestamoClienteController.php:264
 * @route '/prestamos/clientes/{prestamo}/imprimir'
 */
imprimir.get = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestamoClienteController::imprimir
 * @see app/Http/Controllers/PrestamoClienteController.php:264
 * @route '/prestamos/clientes/{prestamo}/imprimir'
 */
imprimir.head = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imprimir.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestamoClienteController::imprimir
 * @see app/Http/Controllers/PrestamoClienteController.php:264
 * @route '/prestamos/clientes/{prestamo}/imprimir'
 */
    const imprimirForm = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: imprimir.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestamoClienteController::imprimir
 * @see app/Http/Controllers/PrestamoClienteController.php:264
 * @route '/prestamos/clientes/{prestamo}/imprimir'
 */
        imprimirForm.get = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimir.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestamoClienteController::imprimir
 * @see app/Http/Controllers/PrestamoClienteController.php:264
 * @route '/prestamos/clientes/{prestamo}/imprimir'
 */
        imprimirForm.head = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimir.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    imprimir.form = imprimirForm
const PrestamoClienteController = { index, store, show, registrarDevolucion, obtenerPendientesChofer, obtenerActivosCliente, imprimir }

export default PrestamoClienteController