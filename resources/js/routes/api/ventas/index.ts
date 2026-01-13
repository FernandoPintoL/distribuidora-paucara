import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\VentaController::registrarPago
 * @see app/Http/Controllers/VentaController.php:512
 * @route '/api/app/ventas/{venta}/pagos'
 */
export const registrarPago = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarPago.url(args, options),
    method: 'post',
})

registrarPago.definition = {
    methods: ["post"],
    url: '/api/app/ventas/{venta}/pagos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\VentaController::registrarPago
 * @see app/Http/Controllers/VentaController.php:512
 * @route '/api/app/ventas/{venta}/pagos'
 */
registrarPago.url = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: args.venta,
                }

    return registrarPago.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::registrarPago
 * @see app/Http/Controllers/VentaController.php:512
 * @route '/api/app/ventas/{venta}/pagos'
 */
registrarPago.post = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarPago.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\VentaController::index
 * @see app/Http/Controllers/VentaController.php:67
 * @route '/api/ventas'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/ventas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VentaController::index
 * @see app/Http/Controllers/VentaController.php:67
 * @route '/api/ventas'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::index
 * @see app/Http/Controllers/VentaController.php:67
 * @route '/api/ventas'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VentaController::index
 * @see app/Http/Controllers/VentaController.php:67
 * @route '/api/ventas'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\VentaController::store
 * @see app/Http/Controllers/VentaController.php:220
 * @route '/api/ventas'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/ventas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\VentaController::store
 * @see app/Http/Controllers/VentaController.php:220
 * @route '/api/ventas'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::store
 * @see app/Http/Controllers/VentaController.php:220
 * @route '/api/ventas'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\VentaController::show
 * @see app/Http/Controllers/VentaController.php:305
 * @route '/api/ventas/{venta}'
 */
export const show = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/ventas/{venta}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VentaController::show
 * @see app/Http/Controllers/VentaController.php:305
 * @route '/api/ventas/{venta}'
 */
show.url = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: args.venta,
                }

    return show.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::show
 * @see app/Http/Controllers/VentaController.php:305
 * @route '/api/ventas/{venta}'
 */
show.get = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VentaController::show
 * @see app/Http/Controllers/VentaController.php:305
 * @route '/api/ventas/{venta}'
 */
show.head = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\VentaController::update
 * @see app/Http/Controllers/VentaController.php:361
 * @route '/api/ventas/{venta}'
 */
export const update = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/api/ventas/{venta}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\VentaController::update
 * @see app/Http/Controllers/VentaController.php:361
 * @route '/api/ventas/{venta}'
 */
update.url = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: args.venta,
                }

    return update.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::update
 * @see app/Http/Controllers/VentaController.php:361
 * @route '/api/ventas/{venta}'
 */
update.put = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\VentaController::update
 * @see app/Http/Controllers/VentaController.php:361
 * @route '/api/ventas/{venta}'
 */
update.patch = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\VentaController::destroy
 * @see app/Http/Controllers/VentaController.php:394
 * @route '/api/ventas/{venta}'
 */
export const destroy = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/ventas/{venta}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\VentaController::destroy
 * @see app/Http/Controllers/VentaController.php:394
 * @route '/api/ventas/{venta}'
 */
destroy.url = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: args.venta,
                }

    return destroy.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::destroy
 * @see app/Http/Controllers/VentaController.php:394
 * @route '/api/ventas/{venta}'
 */
destroy.delete = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Api\ApiVentaController::confirmarPickupCliente
 * @see app/Http/Controllers/Api/ApiVentaController.php:24
 * @route '/api/ventas/{venta}/confirmar-pickup-cliente'
 */
export const confirmarPickupCliente = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarPickupCliente.url(args, options),
    method: 'post',
})

confirmarPickupCliente.definition = {
    methods: ["post"],
    url: '/api/ventas/{venta}/confirmar-pickup-cliente',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiVentaController::confirmarPickupCliente
 * @see app/Http/Controllers/Api/ApiVentaController.php:24
 * @route '/api/ventas/{venta}/confirmar-pickup-cliente'
 */
confirmarPickupCliente.url = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return confirmarPickupCliente.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiVentaController::confirmarPickupCliente
 * @see app/Http/Controllers/Api/ApiVentaController.php:24
 * @route '/api/ventas/{venta}/confirmar-pickup-cliente'
 */
confirmarPickupCliente.post = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarPickupCliente.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ApiVentaController::confirmarPickupEmpleado
 * @see app/Http/Controllers/Api/ApiVentaController.php:121
 * @route '/api/ventas/{venta}/confirmar-pickup-empleado'
 */
export const confirmarPickupEmpleado = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarPickupEmpleado.url(args, options),
    method: 'post',
})

confirmarPickupEmpleado.definition = {
    methods: ["post"],
    url: '/api/ventas/{venta}/confirmar-pickup-empleado',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiVentaController::confirmarPickupEmpleado
 * @see app/Http/Controllers/Api/ApiVentaController.php:121
 * @route '/api/ventas/{venta}/confirmar-pickup-empleado'
 */
confirmarPickupEmpleado.url = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return confirmarPickupEmpleado.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiVentaController::confirmarPickupEmpleado
 * @see app/Http/Controllers/Api/ApiVentaController.php:121
 * @route '/api/ventas/{venta}/confirmar-pickup-empleado'
 */
confirmarPickupEmpleado.post = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarPickupEmpleado.url(args, options),
    method: 'post',
})
const ventas = {
    registrarPago,
index,
store,
show,
update,
destroy,
confirmarPickupCliente,
confirmarPickupEmpleado,
}

export default ventas