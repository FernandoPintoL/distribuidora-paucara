import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:100
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
 * @see app/Http/Controllers/ClienteController.php:100
 * @route '/api/clientes'
 */
index3f893ed87bfeddb33991dd3ccb9f0af8.url = (options?: RouteQueryOptions) => {
    return index3f893ed87bfeddb33991dd3ccb9f0af8.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:100
 * @route '/api/clientes'
 */
index3f893ed87bfeddb33991dd3ccb9f0af8.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index3f893ed87bfeddb33991dd3ccb9f0af8.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:100
 * @route '/api/clientes'
 */
index3f893ed87bfeddb33991dd3ccb9f0af8.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index3f893ed87bfeddb33991dd3ccb9f0af8.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:100
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
 * @see app/Http/Controllers/ClienteController.php:100
 * @route '/clientes'
 */
index0627f617c87b7e3ae7d3a946494aca1a.url = (options?: RouteQueryOptions) => {
    return index0627f617c87b7e3ae7d3a946494aca1a.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:100
 * @route '/clientes'
 */
index0627f617c87b7e3ae7d3a946494aca1a.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index0627f617c87b7e3ae7d3a946494aca1a.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:100
 * @route '/clientes'
 */
index0627f617c87b7e3ae7d3a946494aca1a.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index0627f617c87b7e3ae7d3a946494aca1a.url(options),
    method: 'head',
})

export const index = {
    '/api/clientes': index3f893ed87bfeddb33991dd3ccb9f0af8,
    '/clientes': index0627f617c87b7e3ae7d3a946494aca1a,
}

/**
* @see \App\Http\Controllers\ClienteController::store
 * @see app/Http/Controllers/ClienteController.php:201
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
 * @see app/Http/Controllers/ClienteController.php:201
 * @route '/api/clientes'
 */
store3f893ed87bfeddb33991dd3ccb9f0af8.url = (options?: RouteQueryOptions) => {
    return store3f893ed87bfeddb33991dd3ccb9f0af8.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::store
 * @see app/Http/Controllers/ClienteController.php:201
 * @route '/api/clientes'
 */
store3f893ed87bfeddb33991dd3ccb9f0af8.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store3f893ed87bfeddb33991dd3ccb9f0af8.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ClienteController::store
 * @see app/Http/Controllers/ClienteController.php:201
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
 * @see app/Http/Controllers/ClienteController.php:201
 * @route '/clientes'
 */
store0627f617c87b7e3ae7d3a946494aca1a.url = (options?: RouteQueryOptions) => {
    return store0627f617c87b7e3ae7d3a946494aca1a.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::store
 * @see app/Http/Controllers/ClienteController.php:201
 * @route '/clientes'
 */
store0627f617c87b7e3ae7d3a946494aca1a.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store0627f617c87b7e3ae7d3a946494aca1a.url(options),
    method: 'post',
})

export const store = {
    '/api/clientes': store3f893ed87bfeddb33991dd3ccb9f0af8,
    '/clientes': store0627f617c87b7e3ae7d3a946494aca1a,
}

/**
* @see \App\Http\Controllers\ClienteController::buscarApi
 * @see app/Http/Controllers/ClienteController.php:614
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
 * @see app/Http/Controllers/ClienteController.php:614
 * @route '/api/clientes/buscar'
 */
buscarApi.url = (options?: RouteQueryOptions) => {
    return buscarApi.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::buscarApi
 * @see app/Http/Controllers/ClienteController.php:614
 * @route '/api/clientes/buscar'
 */
buscarApi.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: buscarApi.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::buscarApi
 * @see app/Http/Controllers/ClienteController.php:614
 * @route '/api/clientes/buscar'
 */
buscarApi.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: buscarApi.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ClienteController::miPerfil
 * @see app/Http/Controllers/ClienteController.php:472
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
 * @see app/Http/Controllers/ClienteController.php:472
 * @route '/api/clientes/mi-perfil'
 */
miPerfil.url = (options?: RouteQueryOptions) => {
    return miPerfil.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::miPerfil
 * @see app/Http/Controllers/ClienteController.php:472
 * @route '/api/clientes/mi-perfil'
 */
miPerfil.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: miPerfil.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::miPerfil
 * @see app/Http/Controllers/ClienteController.php:472
 * @route '/api/clientes/mi-perfil'
 */
miPerfil.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: miPerfil.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ClienteController::showApi
 * @see app/Http/Controllers/ClienteController.php:432
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
 * @see app/Http/Controllers/ClienteController.php:432
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
 * @see app/Http/Controllers/ClienteController.php:432
 * @route '/api/clientes/{cliente}'
 */
showApi.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showApi.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::showApi
 * @see app/Http/Controllers/ClienteController.php:432
 * @route '/api/clientes/{cliente}'
 */
showApi.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showApi.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:264
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
 * @see app/Http/Controllers/ClienteController.php:264
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
 * @see app/Http/Controllers/ClienteController.php:264
 * @route '/api/clientes/{cliente}'
 */
updateb4aecc3f2a1150c4870c6b2353680aa8.put = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateb4aecc3f2a1150c4870c6b2353680aa8.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:264
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
 * @see app/Http/Controllers/ClienteController.php:264
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
 * @see app/Http/Controllers/ClienteController.php:264
 * @route '/clientes/{cliente}'
 */
update5b845d2a69a6f256699117f439758ef1.put = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update5b845d2a69a6f256699117f439758ef1.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\ClienteController::update
 * @see app/Http/Controllers/ClienteController.php:264
 * @route '/clientes/{cliente}'
 */
update5b845d2a69a6f256699117f439758ef1.patch = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update5b845d2a69a6f256699117f439758ef1.url(args, options),
    method: 'patch',
})

export const update = {
    '/api/clientes/{cliente}': updateb4aecc3f2a1150c4870c6b2353680aa8,
    '/clientes/{cliente}': update5b845d2a69a6f256699117f439758ef1,
}

/**
* @see \App\Http\Controllers\ClienteController::destroy
 * @see app/Http/Controllers/ClienteController.php:386
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
 * @see app/Http/Controllers/ClienteController.php:386
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
 * @see app/Http/Controllers/ClienteController.php:386
 * @route '/api/clientes/{cliente}'
 */
destroyb4aecc3f2a1150c4870c6b2353680aa8.delete = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyb4aecc3f2a1150c4870c6b2353680aa8.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\ClienteController::destroy
 * @see app/Http/Controllers/ClienteController.php:386
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
 * @see app/Http/Controllers/ClienteController.php:386
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
 * @see app/Http/Controllers/ClienteController.php:386
 * @route '/clientes/{cliente}'
 */
destroy5b845d2a69a6f256699117f439758ef1.delete = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy5b845d2a69a6f256699117f439758ef1.url(args, options),
    method: 'delete',
})

export const destroy = {
    '/api/clientes/{cliente}': destroyb4aecc3f2a1150c4870c6b2353680aa8,
    '/clientes/{cliente}': destroy5b845d2a69a6f256699117f439758ef1,
}

/**
* @see \App\Http\Controllers\ClienteController::saldoCuentasPorCobrar
 * @see app/Http/Controllers/ClienteController.php:642
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
 * @see app/Http/Controllers/ClienteController.php:642
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
 * @see app/Http/Controllers/ClienteController.php:642
 * @route '/api/clientes/{cliente}/saldo-cuentas'
 */
saldoCuentasPorCobrar.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: saldoCuentasPorCobrar.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::saldoCuentasPorCobrar
 * @see app/Http/Controllers/ClienteController.php:642
 * @route '/api/clientes/{cliente}/saldo-cuentas'
 */
saldoCuentasPorCobrar.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: saldoCuentasPorCobrar.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ClienteController::historialVentas
 * @see app/Http/Controllers/ClienteController.php:670
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
 * @see app/Http/Controllers/ClienteController.php:670
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
 * @see app/Http/Controllers/ClienteController.php:670
 * @route '/api/clientes/{cliente}/historial-ventas'
 */
historialVentas.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: historialVentas.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::historialVentas
 * @see app/Http/Controllers/ClienteController.php:670
 * @route '/api/clientes/{cliente}/historial-ventas'
 */
historialVentas.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: historialVentas.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ClienteController::cambiarCredenciales
 * @see app/Http/Controllers/ClienteController.php:710
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
 * @see app/Http/Controllers/ClienteController.php:710
 * @route '/api/clientes/cambiar-credenciales'
 */
cambiarCredenciales.url = (options?: RouteQueryOptions) => {
    return cambiarCredenciales.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::cambiarCredenciales
 * @see app/Http/Controllers/ClienteController.php:710
 * @route '/api/clientes/cambiar-credenciales'
 */
cambiarCredenciales.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cambiarCredenciales.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ClienteController::create
 * @see app/Http/Controllers/ClienteController.php:181
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
 * @see app/Http/Controllers/ClienteController.php:181
 * @route '/clientes/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::create
 * @see app/Http/Controllers/ClienteController.php:181
 * @route '/clientes/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::create
 * @see app/Http/Controllers/ClienteController.php:181
 * @route '/clientes/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

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
* @see \App\Http\Controllers\ClienteController::edit
 * @see app/Http/Controllers/ClienteController.php:246
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
 * @see app/Http/Controllers/ClienteController.php:246
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
 * @see app/Http/Controllers/ClienteController.php:246
 * @route '/clientes/{cliente}/edit'
 */
edit.get = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::edit
 * @see app/Http/Controllers/ClienteController.php:246
 * @route '/clientes/{cliente}/edit'
 */
edit.head = (args: { cliente: number | { id: number } } | [cliente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})
const ClienteController = { index, store, buscarApi, miPerfil, showApi, update, destroy, saldoCuentasPorCobrar, historialVentas, cambiarCredenciales, create, show, edit }

export default ClienteController