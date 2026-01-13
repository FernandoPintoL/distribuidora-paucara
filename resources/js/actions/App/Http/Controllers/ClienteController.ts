import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:101
 * @route '/api/clientes'
 */
const index3f893ed87bfeddb33991dd3ccb9f0af8 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index3f893ed87bfeddb33991dd3ccb9f0af8.url(options),
    method: 'get',
})

index3f893ed87bfeddb33991dd3ccb9f0af8.definition = {
    methods: ["get","head"],
    url: '/api/clientes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:101
 * @route '/api/clientes'
 */
index3f893ed87bfeddb33991dd3ccb9f0af8.url = (options?: RouteQueryOptions) => {
    return index3f893ed87bfeddb33991dd3ccb9f0af8.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:101
 * @route '/api/clientes'
 */
index3f893ed87bfeddb33991dd3ccb9f0af8.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index3f893ed87bfeddb33991dd3ccb9f0af8.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:101
 * @route '/api/clientes'
 */
index3f893ed87bfeddb33991dd3ccb9f0af8.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index3f893ed87bfeddb33991dd3ccb9f0af8.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:101
 * @route '/api/clientes'
 */
    const index3f893ed87bfeddb33991dd3ccb9f0af8Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index3f893ed87bfeddb33991dd3ccb9f0af8.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:101
 * @route '/api/clientes'
 */
        index3f893ed87bfeddb33991dd3ccb9f0af8Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index3f893ed87bfeddb33991dd3ccb9f0af8.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:101
 * @route '/api/clientes'
 */
        index3f893ed87bfeddb33991dd3ccb9f0af8Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index3f893ed87bfeddb33991dd3ccb9f0af8.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index3f893ed87bfeddb33991dd3ccb9f0af8.form = index3f893ed87bfeddb33991dd3ccb9f0af8Form
    /**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:101
 * @route '/clientes'
 */
const index0627f617c87b7e3ae7d3a946494aca1a = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index0627f617c87b7e3ae7d3a946494aca1a.url(options),
    method: 'get',
})

index0627f617c87b7e3ae7d3a946494aca1a.definition = {
    methods: ["get","head"],
    url: '/clientes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:101
 * @route '/clientes'
 */
index0627f617c87b7e3ae7d3a946494aca1a.url = (options?: RouteQueryOptions) => {
    return index0627f617c87b7e3ae7d3a946494aca1a.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:101
 * @route '/clientes'
 */
index0627f617c87b7e3ae7d3a946494aca1a.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index0627f617c87b7e3ae7d3a946494aca1a.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:101
 * @route '/clientes'
 */
index0627f617c87b7e3ae7d3a946494aca1a.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index0627f617c87b7e3ae7d3a946494aca1a.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:101
 * @route '/clientes'
 */
    const index0627f617c87b7e3ae7d3a946494aca1aForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index0627f617c87b7e3ae7d3a946494aca1a.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:101
 * @route '/clientes'
 */
        index0627f617c87b7e3ae7d3a946494aca1aForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index0627f617c87b7e3ae7d3a946494aca1a.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:101
 * @route '/clientes'
 */
        index0627f617c87b7e3ae7d3a946494aca1aForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index0627f617c87b7e3ae7d3a946494aca1a.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index0627f617c87b7e3ae7d3a946494aca1a.form = index0627f617c87b7e3ae7d3a946494aca1aForm

export const index = {
    '/api/clientes': index3f893ed87bfeddb33991dd3ccb9f0af8,
    '/clientes': index0627f617c87b7e3ae7d3a946494aca1a,
}

/**
* @see \App\Http\Controllers\ClienteController::store
 * @see app/Http/Controllers/ClienteController.php:202
 * @route '/api/clientes'
 */
const store3f893ed87bfeddb33991dd3ccb9f0af8 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store3f893ed87bfeddb33991dd3ccb9f0af8.url(options),
    method: 'post',
})

store3f893ed87bfeddb33991dd3ccb9f0af8.definition = {
    methods: ["post"],
    url: '/api/clientes',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ClienteController::store
 * @see app/Http/Controllers/ClienteController.php:202
 * @route '/api/clientes'
 */
store3f893ed87bfeddb33991dd3ccb9f0af8.url = (options?: RouteQueryOptions) => {
    return store3f893ed87bfeddb33991dd3ccb9f0af8.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::store
 * @see app/Http/Controllers/ClienteController.php:202
 * @route '/api/clientes'
 */
store3f893ed87bfeddb33991dd3ccb9f0af8.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store3f893ed87bfeddb33991dd3ccb9f0af8.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ClienteController::store
 * @see app/Http/Controllers/ClienteController.php:202
 * @route '/api/clientes'
 */
    const store3f893ed87bfeddb33991dd3ccb9f0af8Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store3f893ed87bfeddb33991dd3ccb9f0af8.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ClienteController::store
 * @see app/Http/Controllers/ClienteController.php:202
 * @route '/api/clientes'
 */
        store3f893ed87bfeddb33991dd3ccb9f0af8Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store3f893ed87bfeddb33991dd3ccb9f0af8.url(options),
            method: 'post',
        })
    
    store3f893ed87bfeddb33991dd3ccb9f0af8.form = store3f893ed87bfeddb33991dd3ccb9f0af8Form
    /**
* @see \App\Http\Controllers\ClienteController::store
 * @see app/Http/Controllers/ClienteController.php:202
 * @route '/clientes'
 */
const store0627f617c87b7e3ae7d3a946494aca1a = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store0627f617c87b7e3ae7d3a946494aca1a.url(options),
    method: 'post',
})

store0627f617c87b7e3ae7d3a946494aca1a.definition = {
    methods: ["post"],
    url: '/clientes',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ClienteController::store
 * @see app/Http/Controllers/ClienteController.php:202
 * @route '/clientes'
 */
store0627f617c87b7e3ae7d3a946494aca1a.url = (options?: RouteQueryOptions) => {
    return store0627f617c87b7e3ae7d3a946494aca1a.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::store
 * @see app/Http/Controllers/ClienteController.php:202
 * @route '/clientes'
 */
store0627f617c87b7e3ae7d3a946494aca1a.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store0627f617c87b7e3ae7d3a946494aca1a.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ClienteController::store
 * @see app/Http/Controllers/ClienteController.php:202
 * @route '/clientes'
 */
    const store0627f617c87b7e3ae7d3a946494aca1aForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store0627f617c87b7e3ae7d3a946494aca1a.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ClienteController::store
 * @see app/Http/Controllers/ClienteController.php:202
 * @route '/clientes'
 */
        store0627f617c87b7e3ae7d3a946494aca1aForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store0627f617c87b7e3ae7d3a946494aca1a.url(options),
            method: 'post',
        })
    
    store0627f617c87b7e3ae7d3a946494aca1a.form = store0627f617c87b7e3ae7d3a946494aca1aForm

export const store = {
    '/api/clientes': store3f893ed87bfeddb33991dd3ccb9f0af8,
    '/clientes': store0627f617c87b7e3ae7d3a946494aca1a,
}

/**
* @see \App\Http\Controllers\ClienteController::buscarApi
 * @see app/Http/Controllers/ClienteController.php:721
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
 * @see app/Http/Controllers/ClienteController.php:721
 * @route '/api/clientes/buscar'
 */
buscarApi.url = (options?: RouteQueryOptions) => {
    return buscarApi.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::buscarApi
 * @see app/Http/Controllers/ClienteController.php:721
 * @route '/api/clientes/buscar'
 */
buscarApi.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: buscarApi.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::buscarApi
 * @see app/Http/Controllers/ClienteController.php:721
 * @route '/api/clientes/buscar'
 */
buscarApi.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: buscarApi.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::buscarApi
 * @see app/Http/Controllers/ClienteController.php:721
 * @route '/api/clientes/buscar'
 */
    const buscarApiForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: buscarApi.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::buscarApi
 * @see app/Http/Controllers/ClienteController.php:721
 * @route '/api/clientes/buscar'
 */
        buscarApiForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: buscarApi.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::buscarApi
 * @see app/Http/Controllers/ClienteController.php:721
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
* @see \App\Http\Controllers\ClienteController::miPerfil
 * @see app/Http/Controllers/ClienteController.php:524
 * @route '/api/clientes/mi-perfil'
 */
export const miPerfil = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: miPerfil.url(options),
    method: 'get',
})

miPerfil.definition = {
    methods: ["get","head"],
    url: '/api/clientes/mi-perfil',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClienteController::miPerfil
 * @see app/Http/Controllers/ClienteController.php:524
 * @route '/api/clientes/mi-perfil'
 */
miPerfil.url = (options?: RouteQueryOptions) => {
    return miPerfil.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::miPerfil
 * @see app/Http/Controllers/ClienteController.php:524
 * @route '/api/clientes/mi-perfil'
 */
miPerfil.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: miPerfil.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::miPerfil
 * @see app/Http/Controllers/ClienteController.php:524
 * @route '/api/clientes/mi-perfil'
 */
miPerfil.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: miPerfil.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::miPerfil
 * @see app/Http/Controllers/ClienteController.php:524
 * @route '/api/clientes/mi-perfil'
 */
    const miPerfilForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: miPerfil.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::miPerfil
 * @see app/Http/Controllers/ClienteController.php:524
 * @route '/api/clientes/mi-perfil'
 */
        miPerfilForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: miPerfil.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::miPerfil
 * @see app/Http/Controllers/ClienteController.php:524
 * @route '/api/clientes/mi-perfil'
 */
        miPerfilForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: miPerfil.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    miPerfil.form = miPerfilForm
/**
* @see \App\Http\Controllers\ClienteController::showApi
 * @see app/Http/Controllers/ClienteController.php:484
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
 * @see app/Http/Controllers/ClienteController.php:484
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
 * @see app/Http/Controllers/ClienteController.php:484
 * @route '/api/clientes/{cliente}'
 */
showApi.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showApi.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::showApi
 * @see app/Http/Controllers/ClienteController.php:484
 * @route '/api/clientes/{cliente}'
 */
showApi.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showApi.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::showApi
 * @see app/Http/Controllers/ClienteController.php:484
 * @route '/api/clientes/{cliente}'
 */
    const showApiForm = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: showApi.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::showApi
 * @see app/Http/Controllers/ClienteController.php:484
 * @route '/api/clientes/{cliente}'
 */
        showApiForm.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showApi.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::showApi
 * @see app/Http/Controllers/ClienteController.php:484
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
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:266
 * @route '/api/clientes/{cliente}'
 */
const updateb4aecc3f2a1150c4870c6b2353680aa8 = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateb4aecc3f2a1150c4870c6b2353680aa8.url(args, options),
    method: 'put',
})

updateb4aecc3f2a1150c4870c6b2353680aa8.definition = {
    methods: ["put"],
    url: '/api/clientes/{cliente}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:266
 * @route '/api/clientes/{cliente}'
 */
updateb4aecc3f2a1150c4870c6b2353680aa8.url = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return updateb4aecc3f2a1150c4870c6b2353680aa8.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:266
 * @route '/api/clientes/{cliente}'
 */
updateb4aecc3f2a1150c4870c6b2353680aa8.put = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateb4aecc3f2a1150c4870c6b2353680aa8.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:266
 * @route '/api/clientes/{cliente}'
 */
    const updateb4aecc3f2a1150c4870c6b2353680aa8Form = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateb4aecc3f2a1150c4870c6b2353680aa8.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:266
 * @route '/api/clientes/{cliente}'
 */
        updateb4aecc3f2a1150c4870c6b2353680aa8Form.put = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateb4aecc3f2a1150c4870c6b2353680aa8.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateb4aecc3f2a1150c4870c6b2353680aa8.form = updateb4aecc3f2a1150c4870c6b2353680aa8Form
    /**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:266
 * @route '/clientes/{cliente}'
 */
const update5b845d2a69a6f256699117f439758ef1 = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update5b845d2a69a6f256699117f439758ef1.url(args, options),
    method: 'put',
})

update5b845d2a69a6f256699117f439758ef1.definition = {
    methods: ["put","patch"],
    url: '/clientes/{cliente}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:266
 * @route '/clientes/{cliente}'
 */
update5b845d2a69a6f256699117f439758ef1.url = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return update5b845d2a69a6f256699117f439758ef1.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:266
 * @route '/clientes/{cliente}'
 */
update5b845d2a69a6f256699117f439758ef1.put = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update5b845d2a69a6f256699117f439758ef1.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:266
 * @route '/clientes/{cliente}'
 */
update5b845d2a69a6f256699117f439758ef1.patch = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update5b845d2a69a6f256699117f439758ef1.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:266
 * @route '/clientes/{cliente}'
 */
    const update5b845d2a69a6f256699117f439758ef1Form = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update5b845d2a69a6f256699117f439758ef1.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:266
 * @route '/clientes/{cliente}'
 */
        update5b845d2a69a6f256699117f439758ef1Form.put = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update5b845d2a69a6f256699117f439758ef1.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:266
 * @route '/clientes/{cliente}'
 */
        update5b845d2a69a6f256699117f439758ef1Form.patch = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update5b845d2a69a6f256699117f439758ef1.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update5b845d2a69a6f256699117f439758ef1.form = update5b845d2a69a6f256699117f439758ef1Form

export const update = {
    '/api/clientes/{cliente}': updateb4aecc3f2a1150c4870c6b2353680aa8,
    '/clientes/{cliente}': update5b845d2a69a6f256699117f439758ef1,
}

/**
* @see \App\Http\Controllers\ClienteController::destroy
 * @see app/Http/Controllers/ClienteController.php:438
 * @route '/api/clientes/{cliente}'
 */
const destroyb4aecc3f2a1150c4870c6b2353680aa8 = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyb4aecc3f2a1150c4870c6b2353680aa8.url(args, options),
    method: 'delete',
})

destroyb4aecc3f2a1150c4870c6b2353680aa8.definition = {
    methods: ["delete"],
    url: '/api/clientes/{cliente}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ClienteController::destroy
 * @see app/Http/Controllers/ClienteController.php:438
 * @route '/api/clientes/{cliente}'
 */
destroyb4aecc3f2a1150c4870c6b2353680aa8.url = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return destroyb4aecc3f2a1150c4870c6b2353680aa8.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::destroy
 * @see app/Http/Controllers/ClienteController.php:438
 * @route '/api/clientes/{cliente}'
 */
destroyb4aecc3f2a1150c4870c6b2353680aa8.delete = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyb4aecc3f2a1150c4870c6b2353680aa8.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\ClienteController::destroy
 * @see app/Http/Controllers/ClienteController.php:438
 * @route '/api/clientes/{cliente}'
 */
    const destroyb4aecc3f2a1150c4870c6b2353680aa8Form = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroyb4aecc3f2a1150c4870c6b2353680aa8.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ClienteController::destroy
 * @see app/Http/Controllers/ClienteController.php:438
 * @route '/api/clientes/{cliente}'
 */
        destroyb4aecc3f2a1150c4870c6b2353680aa8Form.delete = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroyb4aecc3f2a1150c4870c6b2353680aa8.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroyb4aecc3f2a1150c4870c6b2353680aa8.form = destroyb4aecc3f2a1150c4870c6b2353680aa8Form
    /**
* @see \App\Http\Controllers\ClienteController::destroy
 * @see app/Http/Controllers/ClienteController.php:438
 * @route '/clientes/{cliente}'
 */
const destroy5b845d2a69a6f256699117f439758ef1 = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy5b845d2a69a6f256699117f439758ef1.url(args, options),
    method: 'delete',
})

destroy5b845d2a69a6f256699117f439758ef1.definition = {
    methods: ["delete"],
    url: '/clientes/{cliente}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ClienteController::destroy
 * @see app/Http/Controllers/ClienteController.php:438
 * @route '/clientes/{cliente}'
 */
destroy5b845d2a69a6f256699117f439758ef1.url = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return destroy5b845d2a69a6f256699117f439758ef1.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::destroy
 * @see app/Http/Controllers/ClienteController.php:438
 * @route '/clientes/{cliente}'
 */
destroy5b845d2a69a6f256699117f439758ef1.delete = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy5b845d2a69a6f256699117f439758ef1.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\ClienteController::destroy
 * @see app/Http/Controllers/ClienteController.php:438
 * @route '/clientes/{cliente}'
 */
    const destroy5b845d2a69a6f256699117f439758ef1Form = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy5b845d2a69a6f256699117f439758ef1.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ClienteController::destroy
 * @see app/Http/Controllers/ClienteController.php:438
 * @route '/clientes/{cliente}'
 */
        destroy5b845d2a69a6f256699117f439758ef1Form.delete = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy5b845d2a69a6f256699117f439758ef1.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy5b845d2a69a6f256699117f439758ef1.form = destroy5b845d2a69a6f256699117f439758ef1Form

export const destroy = {
    '/api/clientes/{cliente}': destroyb4aecc3f2a1150c4870c6b2353680aa8,
    '/clientes/{cliente}': destroy5b845d2a69a6f256699117f439758ef1,
}

/**
* @see \App\Http\Controllers\ClienteController::saldoCuentasPorCobrar
 * @see app/Http/Controllers/ClienteController.php:750
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
 * @see app/Http/Controllers/ClienteController.php:750
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
 * @see app/Http/Controllers/ClienteController.php:750
 * @route '/api/clientes/{cliente}/saldo-cuentas'
 */
saldoCuentasPorCobrar.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: saldoCuentasPorCobrar.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::saldoCuentasPorCobrar
 * @see app/Http/Controllers/ClienteController.php:750
 * @route '/api/clientes/{cliente}/saldo-cuentas'
 */
saldoCuentasPorCobrar.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: saldoCuentasPorCobrar.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::saldoCuentasPorCobrar
 * @see app/Http/Controllers/ClienteController.php:750
 * @route '/api/clientes/{cliente}/saldo-cuentas'
 */
    const saldoCuentasPorCobrarForm = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: saldoCuentasPorCobrar.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::saldoCuentasPorCobrar
 * @see app/Http/Controllers/ClienteController.php:750
 * @route '/api/clientes/{cliente}/saldo-cuentas'
 */
        saldoCuentasPorCobrarForm.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: saldoCuentasPorCobrar.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::saldoCuentasPorCobrar
 * @see app/Http/Controllers/ClienteController.php:750
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
 * @see app/Http/Controllers/ClienteController.php:778
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
 * @see app/Http/Controllers/ClienteController.php:778
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
 * @see app/Http/Controllers/ClienteController.php:778
 * @route '/api/clientes/{cliente}/historial-ventas'
 */
historialVentas.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: historialVentas.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::historialVentas
 * @see app/Http/Controllers/ClienteController.php:778
 * @route '/api/clientes/{cliente}/historial-ventas'
 */
historialVentas.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: historialVentas.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::historialVentas
 * @see app/Http/Controllers/ClienteController.php:778
 * @route '/api/clientes/{cliente}/historial-ventas'
 */
    const historialVentasForm = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: historialVentas.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::historialVentas
 * @see app/Http/Controllers/ClienteController.php:778
 * @route '/api/clientes/{cliente}/historial-ventas'
 */
        historialVentasForm.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: historialVentas.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::historialVentas
 * @see app/Http/Controllers/ClienteController.php:778
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
* @see \App\Http\Controllers\ClienteController::obtenerDetallesCreditoApi
 * @see app/Http/Controllers/ClienteController.php:807
 * @route '/api/clientes/{cliente}/credito/detalles'
 */
export const obtenerDetallesCreditoApi = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerDetallesCreditoApi.url(args, options),
    method: 'get',
})

obtenerDetallesCreditoApi.definition = {
    methods: ["get","head"],
    url: '/api/clientes/{cliente}/credito/detalles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClienteController::obtenerDetallesCreditoApi
 * @see app/Http/Controllers/ClienteController.php:807
 * @route '/api/clientes/{cliente}/credito/detalles'
 */
obtenerDetallesCreditoApi.url = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return obtenerDetallesCreditoApi.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::obtenerDetallesCreditoApi
 * @see app/Http/Controllers/ClienteController.php:807
 * @route '/api/clientes/{cliente}/credito/detalles'
 */
obtenerDetallesCreditoApi.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerDetallesCreditoApi.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::obtenerDetallesCreditoApi
 * @see app/Http/Controllers/ClienteController.php:807
 * @route '/api/clientes/{cliente}/credito/detalles'
 */
obtenerDetallesCreditoApi.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerDetallesCreditoApi.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::obtenerDetallesCreditoApi
 * @see app/Http/Controllers/ClienteController.php:807
 * @route '/api/clientes/{cliente}/credito/detalles'
 */
    const obtenerDetallesCreditoApiForm = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerDetallesCreditoApi.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::obtenerDetallesCreditoApi
 * @see app/Http/Controllers/ClienteController.php:807
 * @route '/api/clientes/{cliente}/credito/detalles'
 */
        obtenerDetallesCreditoApiForm.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerDetallesCreditoApi.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::obtenerDetallesCreditoApi
 * @see app/Http/Controllers/ClienteController.php:807
 * @route '/api/clientes/{cliente}/credito/detalles'
 */
        obtenerDetallesCreditoApiForm.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerDetallesCreditoApi.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerDetallesCreditoApi.form = obtenerDetallesCreditoApiForm
/**
* @see \App\Http\Controllers\ClienteController::obtenerAuditoriaCreditoApi
 * @see app/Http/Controllers/ClienteController.php:564
 * @route '/api/clientes/{cliente}/auditoria-credito'
 */
export const obtenerAuditoriaCreditoApi = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerAuditoriaCreditoApi.url(args, options),
    method: 'get',
})

obtenerAuditoriaCreditoApi.definition = {
    methods: ["get","head"],
    url: '/api/clientes/{cliente}/auditoria-credito',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClienteController::obtenerAuditoriaCreditoApi
 * @see app/Http/Controllers/ClienteController.php:564
 * @route '/api/clientes/{cliente}/auditoria-credito'
 */
obtenerAuditoriaCreditoApi.url = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return obtenerAuditoriaCreditoApi.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::obtenerAuditoriaCreditoApi
 * @see app/Http/Controllers/ClienteController.php:564
 * @route '/api/clientes/{cliente}/auditoria-credito'
 */
obtenerAuditoriaCreditoApi.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerAuditoriaCreditoApi.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::obtenerAuditoriaCreditoApi
 * @see app/Http/Controllers/ClienteController.php:564
 * @route '/api/clientes/{cliente}/auditoria-credito'
 */
obtenerAuditoriaCreditoApi.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerAuditoriaCreditoApi.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::obtenerAuditoriaCreditoApi
 * @see app/Http/Controllers/ClienteController.php:564
 * @route '/api/clientes/{cliente}/auditoria-credito'
 */
    const obtenerAuditoriaCreditoApiForm = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerAuditoriaCreditoApi.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::obtenerAuditoriaCreditoApi
 * @see app/Http/Controllers/ClienteController.php:564
 * @route '/api/clientes/{cliente}/auditoria-credito'
 */
        obtenerAuditoriaCreditoApiForm.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerAuditoriaCreditoApi.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::obtenerAuditoriaCreditoApi
 * @see app/Http/Controllers/ClienteController.php:564
 * @route '/api/clientes/{cliente}/auditoria-credito'
 */
        obtenerAuditoriaCreditoApiForm.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerAuditoriaCreditoApi.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerAuditoriaCreditoApi.form = obtenerAuditoriaCreditoApiForm
/**
* @see \App\Http\Controllers\ClienteController::registrarPagoApi
 * @see app/Http/Controllers/ClienteController.php:918
 * @route '/api/clientes/{cliente}/pagos'
 */
export const registrarPagoApi = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarPagoApi.url(args, options),
    method: 'post',
})

registrarPagoApi.definition = {
    methods: ["post"],
    url: '/api/clientes/{cliente}/pagos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ClienteController::registrarPagoApi
 * @see app/Http/Controllers/ClienteController.php:918
 * @route '/api/clientes/{cliente}/pagos'
 */
registrarPagoApi.url = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return registrarPagoApi.definition.url
            .replace('{cliente}', parsedArgs.cliente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::registrarPagoApi
 * @see app/Http/Controllers/ClienteController.php:918
 * @route '/api/clientes/{cliente}/pagos'
 */
registrarPagoApi.post = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarPagoApi.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ClienteController::registrarPagoApi
 * @see app/Http/Controllers/ClienteController.php:918
 * @route '/api/clientes/{cliente}/pagos'
 */
    const registrarPagoApiForm = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: registrarPagoApi.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ClienteController::registrarPagoApi
 * @see app/Http/Controllers/ClienteController.php:918
 * @route '/api/clientes/{cliente}/pagos'
 */
        registrarPagoApiForm.post = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: registrarPagoApi.url(args, options),
            method: 'post',
        })
    
    registrarPagoApi.form = registrarPagoApiForm
/**
* @see \App\Http\Controllers\ClienteController::cambiarCredenciales
 * @see app/Http/Controllers/ClienteController.php:1028
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
 * @see app/Http/Controllers/ClienteController.php:1028
 * @route '/api/clientes/cambiar-credenciales'
 */
cambiarCredenciales.url = (options?: RouteQueryOptions) => {
    return cambiarCredenciales.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::cambiarCredenciales
 * @see app/Http/Controllers/ClienteController.php:1028
 * @route '/api/clientes/cambiar-credenciales'
 */
cambiarCredenciales.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cambiarCredenciales.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ClienteController::cambiarCredenciales
 * @see app/Http/Controllers/ClienteController.php:1028
 * @route '/api/clientes/cambiar-credenciales'
 */
    const cambiarCredencialesForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cambiarCredenciales.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ClienteController::cambiarCredenciales
 * @see app/Http/Controllers/ClienteController.php:1028
 * @route '/api/clientes/cambiar-credenciales'
 */
        cambiarCredencialesForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cambiarCredenciales.url(options),
            method: 'post',
        })
    
    cambiarCredenciales.form = cambiarCredencialesForm
/**
* @see \App\Http\Controllers\ClienteController::create
 * @see app/Http/Controllers/ClienteController.php:182
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
 * @see app/Http/Controllers/ClienteController.php:182
 * @route '/clientes/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::create
 * @see app/Http/Controllers/ClienteController.php:182
 * @route '/clientes/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::create
 * @see app/Http/Controllers/ClienteController.php:182
 * @route '/clientes/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::create
 * @see app/Http/Controllers/ClienteController.php:182
 * @route '/clientes/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::create
 * @see app/Http/Controllers/ClienteController.php:182
 * @route '/clientes/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::create
 * @see app/Http/Controllers/ClienteController.php:182
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
 * @see app/Http/Controllers/ClienteController.php:248
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
 * @see app/Http/Controllers/ClienteController.php:248
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
 * @see app/Http/Controllers/ClienteController.php:248
 * @route '/clientes/{cliente}/edit'
 */
edit.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::edit
 * @see app/Http/Controllers/ClienteController.php:248
 * @route '/clientes/{cliente}/edit'
 */
edit.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::edit
 * @see app/Http/Controllers/ClienteController.php:248
 * @route '/clientes/{cliente}/edit'
 */
    const editForm = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::edit
 * @see app/Http/Controllers/ClienteController.php:248
 * @route '/clientes/{cliente}/edit'
 */
        editForm.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::edit
 * @see app/Http/Controllers/ClienteController.php:248
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
const ClienteController = { index, store, buscarApi, miPerfil, showApi, update, destroy, saldoCuentasPorCobrar, historialVentas, obtenerDetallesCreditoApi, obtenerAuditoriaCreditoApi, registrarPagoApi, cambiarCredenciales, create, show, edit }

export default ClienteController