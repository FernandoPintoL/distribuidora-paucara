import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../wayfinder'
import lote from './lote'
/**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:1076
 * @route '/api/entregas/{id}/ubicacion'
 */
export const registrarUbicacion = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarUbicacion.url(args, options),
    method: 'post',
})

registrarUbicacion.definition = {
    methods: ["post"],
    url: '/api/entregas/{id}/ubicacion',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:1076
 * @route '/api/entregas/{id}/ubicacion'
 */
registrarUbicacion.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return registrarUbicacion.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:1076
 * @route '/api/entregas/{id}/ubicacion'
 */
registrarUbicacion.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarUbicacion.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::ubicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
export const ubicaciones = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ubicaciones.url(args, options),
    method: 'get',
})

ubicaciones.definition = {
    methods: ["get","head"],
    url: '/api/entregas/{id}/ubicaciones',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::ubicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
ubicaciones.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return ubicaciones.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::ubicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
ubicaciones.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ubicaciones.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::ubicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
ubicaciones.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ubicaciones.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EntregaPdfController::descargar
 * @see app/Http/Controllers/EntregaPdfController.php:53
 * @route '/api/entregas/{entrega}/descargar'
 */
export const descargar = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: descargar.url(args, options),
    method: 'get',
})

descargar.definition = {
    methods: ["get","head"],
    url: '/api/entregas/{entrega}/descargar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EntregaPdfController::descargar
 * @see app/Http/Controllers/EntregaPdfController.php:53
 * @route '/api/entregas/{entrega}/descargar'
 */
descargar.url = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { entrega: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { entrega: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    entrega: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        entrega: typeof args.entrega === 'object'
                ? args.entrega.id
                : args.entrega,
                }

    return descargar.definition.url
            .replace('{entrega}', parsedArgs.entrega.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaPdfController::descargar
 * @see app/Http/Controllers/EntregaPdfController.php:53
 * @route '/api/entregas/{entrega}/descargar'
 */
descargar.get = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: descargar.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EntregaPdfController::descargar
 * @see app/Http/Controllers/EntregaPdfController.php:53
 * @route '/api/entregas/{entrega}/descargar'
 */
descargar.head = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: descargar.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EntregaPdfController::preview
 * @see app/Http/Controllers/EntregaPdfController.php:114
 * @route '/api/entregas/{entrega}/preview'
 */
export const preview = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: preview.url(args, options),
    method: 'get',
})

preview.definition = {
    methods: ["get","head"],
    url: '/api/entregas/{entrega}/preview',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EntregaPdfController::preview
 * @see app/Http/Controllers/EntregaPdfController.php:114
 * @route '/api/entregas/{entrega}/preview'
 */
preview.url = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { entrega: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { entrega: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    entrega: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        entrega: typeof args.entrega === 'object'
                ? args.entrega.id
                : args.entrega,
                }

    return preview.definition.url
            .replace('{entrega}', parsedArgs.entrega.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaPdfController::preview
 * @see app/Http/Controllers/EntregaPdfController.php:114
 * @route '/api/entregas/{entrega}/preview'
 */
preview.get = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: preview.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EntregaPdfController::preview
 * @see app/Http/Controllers/EntregaPdfController.php:114
 * @route '/api/entregas/{entrega}/preview'
 */
preview.head = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: preview.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EntregaPdfController::debug
 * @see app/Http/Controllers/EntregaPdfController.php:23
 * @route '/api/entregas/{entrega}/debug'
 */
export const debug = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: debug.url(args, options),
    method: 'get',
})

debug.definition = {
    methods: ["get","head"],
    url: '/api/entregas/{entrega}/debug',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EntregaPdfController::debug
 * @see app/Http/Controllers/EntregaPdfController.php:23
 * @route '/api/entregas/{entrega}/debug'
 */
debug.url = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { entrega: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { entrega: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    entrega: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        entrega: typeof args.entrega === 'object'
                ? args.entrega.id
                : args.entrega,
                }

    return debug.definition.url
            .replace('{entrega}', parsedArgs.entrega.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaPdfController::debug
 * @see app/Http/Controllers/EntregaPdfController.php:23
 * @route '/api/entregas/{entrega}/debug'
 */
debug.get = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: debug.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EntregaPdfController::debug
 * @see app/Http/Controllers/EntregaPdfController.php:23
 * @route '/api/entregas/{entrega}/debug'
 */
debug.head = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: debug.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarCarga
 * @see app/Http/Controllers/Api/EntregaController.php:1375
 * @route '/api/entregas/{id}/confirmar-carga'
 */
export const confirmarCarga = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarCarga.url(args, options),
    method: 'post',
})

confirmarCarga.definition = {
    methods: ["post"],
    url: '/api/entregas/{id}/confirmar-carga',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarCarga
 * @see app/Http/Controllers/Api/EntregaController.php:1375
 * @route '/api/entregas/{id}/confirmar-carga'
 */
confirmarCarga.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return confirmarCarga.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarCarga
 * @see app/Http/Controllers/Api/EntregaController.php:1375
 * @route '/api/entregas/{id}/confirmar-carga'
 */
confirmarCarga.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarCarga.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::listoParaEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:1398
 * @route '/api/entregas/{id}/listo-para-entrega'
 */
export const listoParaEntrega = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: listoParaEntrega.url(args, options),
    method: 'post',
})

listoParaEntrega.definition = {
    methods: ["post"],
    url: '/api/entregas/{id}/listo-para-entrega',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::listoParaEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:1398
 * @route '/api/entregas/{id}/listo-para-entrega'
 */
listoParaEntrega.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return listoParaEntrega.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::listoParaEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:1398
 * @route '/api/entregas/{id}/listo-para-entrega'
 */
listoParaEntrega.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: listoParaEntrega.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::iniciarTransito
 * @see app/Http/Controllers/Api/EntregaController.php:1421
 * @route '/api/entregas/{id}/iniciar-transito'
 */
export const iniciarTransito = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: iniciarTransito.url(args, options),
    method: 'post',
})

iniciarTransito.definition = {
    methods: ["post"],
    url: '/api/entregas/{id}/iniciar-transito',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::iniciarTransito
 * @see app/Http/Controllers/Api/EntregaController.php:1421
 * @route '/api/entregas/{id}/iniciar-transito'
 */
iniciarTransito.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return iniciarTransito.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::iniciarTransito
 * @see app/Http/Controllers/Api/EntregaController.php:1421
 * @route '/api/entregas/{id}/iniciar-transito'
 */
iniciarTransito.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: iniciarTransito.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::ubicacionGps
 * @see app/Http/Controllers/Api/EntregaController.php:1453
 * @route '/api/entregas/{id}/ubicacion-gps'
 */
export const ubicacionGps = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: ubicacionGps.url(args, options),
    method: 'patch',
})

ubicacionGps.definition = {
    methods: ["patch"],
    url: '/api/entregas/{id}/ubicacion-gps',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::ubicacionGps
 * @see app/Http/Controllers/Api/EntregaController.php:1453
 * @route '/api/entregas/{id}/ubicacion-gps'
 */
ubicacionGps.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return ubicacionGps.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::ubicacionGps
 * @see app/Http/Controllers/Api/EntregaController.php:1453
 * @route '/api/entregas/{id}/ubicacion-gps'
 */
ubicacionGps.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: ubicacionGps.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::consolidarAutomatico
 * @see app/Http/Controllers/Api/EntregaController.php:1493
 * @route '/api/entregas/consolidar-automatico'
 */
export const consolidarAutomatico = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: consolidarAutomatico.url(options),
    method: 'post',
})

consolidarAutomatico.definition = {
    methods: ["post"],
    url: '/api/entregas/consolidar-automatico',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::consolidarAutomatico
 * @see app/Http/Controllers/Api/EntregaController.php:1493
 * @route '/api/entregas/consolidar-automatico'
 */
consolidarAutomatico.url = (options?: RouteQueryOptions) => {
    return consolidarAutomatico.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::consolidarAutomatico
 * @see app/Http/Controllers/Api/EntregaController.php:1493
 * @route '/api/entregas/consolidar-automatico'
 */
consolidarAutomatico.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: consolidarAutomatico.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::crearConsolidada
 * @see app/Http/Controllers/Api/EntregaController.php:1528
 * @route '/api/entregas/crear-consolidada'
 */
export const crearConsolidada = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearConsolidada.url(options),
    method: 'post',
})

crearConsolidada.definition = {
    methods: ["post"],
    url: '/api/entregas/crear-consolidada',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::crearConsolidada
 * @see app/Http/Controllers/Api/EntregaController.php:1528
 * @route '/api/entregas/crear-consolidada'
 */
crearConsolidada.url = (options?: RouteQueryOptions) => {
    return crearConsolidada.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::crearConsolidada
 * @see app/Http/Controllers/Api/EntregaController.php:1528
 * @route '/api/entregas/crear-consolidada'
 */
crearConsolidada.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearConsolidada.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarVenta
 * @see app/Http/Controllers/Api/EntregaController.php:1682
 * @route '/api/entregas/{id}/confirmar-venta/{venta_id}'
 */
export const confirmarVenta = (args: { id: string | number, venta_id: string | number } | [id: string | number, venta_id: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarVenta.url(args, options),
    method: 'post',
})

confirmarVenta.definition = {
    methods: ["post"],
    url: '/api/entregas/{id}/confirmar-venta/{venta_id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarVenta
 * @see app/Http/Controllers/Api/EntregaController.php:1682
 * @route '/api/entregas/{id}/confirmar-venta/{venta_id}'
 */
confirmarVenta.url = (args: { id: string | number, venta_id: string | number } | [id: string | number, venta_id: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                    venta_id: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                                venta_id: args.venta_id,
                }

    return confirmarVenta.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace('{venta_id}', parsedArgs.venta_id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarVenta
 * @see app/Http/Controllers/Api/EntregaController.php:1682
 * @route '/api/entregas/{id}/confirmar-venta/{venta_id}'
 */
confirmarVenta.post = (args: { id: string | number, venta_id: string | number } | [id: string | number, venta_id: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarVenta.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::desmarcarVenta
 * @see app/Http/Controllers/Api/EntregaController.php:1738
 * @route '/api/entregas/{id}/confirmar-venta/{venta_id}'
 */
export const desmarcarVenta = (args: { id: string | number, venta_id: string | number } | [id: string | number, venta_id: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: desmarcarVenta.url(args, options),
    method: 'delete',
})

desmarcarVenta.definition = {
    methods: ["delete"],
    url: '/api/entregas/{id}/confirmar-venta/{venta_id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::desmarcarVenta
 * @see app/Http/Controllers/Api/EntregaController.php:1738
 * @route '/api/entregas/{id}/confirmar-venta/{venta_id}'
 */
desmarcarVenta.url = (args: { id: string | number, venta_id: string | number } | [id: string | number, venta_id: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                    venta_id: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                                venta_id: args.venta_id,
                }

    return desmarcarVenta.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace('{venta_id}', parsedArgs.venta_id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::desmarcarVenta
 * @see app/Http/Controllers/Api/EntregaController.php:1738
 * @route '/api/entregas/{id}/confirmar-venta/{venta_id}'
 */
desmarcarVenta.delete = (args: { id: string | number, venta_id: string | number } | [id: string | number, venta_id: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: desmarcarVenta.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::detalles
 * @see app/Http/Controllers/Api/EntregaController.php:1780
 * @route '/api/entregas/{id}/detalles'
 */
export const detalles = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: detalles.url(args, options),
    method: 'get',
})

detalles.definition = {
    methods: ["get","head"],
    url: '/api/entregas/{id}/detalles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::detalles
 * @see app/Http/Controllers/Api/EntregaController.php:1780
 * @route '/api/entregas/{id}/detalles'
 */
detalles.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return detalles.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::detalles
 * @see app/Http/Controllers/Api/EntregaController.php:1780
 * @route '/api/entregas/{id}/detalles'
 */
detalles.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: detalles.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::detalles
 * @see app/Http/Controllers/Api/EntregaController.php:1780
 * @route '/api/entregas/{id}/detalles'
 */
detalles.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: detalles.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::progreso
 * @see app/Http/Controllers/Api/EntregaController.php:1840
 * @route '/api/entregas/{id}/progreso'
 */
export const progreso = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: progreso.url(args, options),
    method: 'get',
})

progreso.definition = {
    methods: ["get","head"],
    url: '/api/entregas/{id}/progreso',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::progreso
 * @see app/Http/Controllers/Api/EntregaController.php:1840
 * @route '/api/entregas/{id}/progreso'
 */
progreso.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return progreso.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::progreso
 * @see app/Http/Controllers/Api/EntregaController.php:1840
 * @route '/api/entregas/{id}/progreso'
 */
progreso.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: progreso.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::progreso
 * @see app/Http/Controllers/Api/EntregaController.php:1840
 * @route '/api/entregas/{id}/progreso'
 */
progreso.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: progreso.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::show
 * @see app/Http/Controllers/Api/EntregaController.php:411
 * @route '/api/entregas/{id}'
 */
export const show = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/entregas/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::show
 * @see app/Http/Controllers/Api/EntregaController.php:411
 * @route '/api/entregas/{id}'
 */
show.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::show
 * @see app/Http/Controllers/Api/EntregaController.php:411
 * @route '/api/entregas/{id}'
 */
show.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::show
 * @see app/Http/Controllers/Api/EntregaController.php:411
 * @route '/api/entregas/{id}'
 */
show.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})
const entregas = {
    registrarUbicacion,
ubicaciones,
lote,
descargar,
preview,
debug,
confirmarCarga,
listoParaEntrega,
iniciarTransito,
ubicacionGps,
consolidarAutomatico,
crearConsolidada,
confirmarVenta,
desmarcarVenta,
detalles,
progreso,
show,
}

export default entregas