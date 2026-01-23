import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\EntregaController::estadisticasChofer
 * @see app/Http/Controllers/Api/EntregaController.php:226
 * @route '/api/chofer/estadisticas'
 */
export const estadisticasChofer = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estadisticasChofer.url(options),
    method: 'get',
})

estadisticasChofer.definition = {
    methods: ["get","head"],
    url: '/api/chofer/estadisticas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::estadisticasChofer
 * @see app/Http/Controllers/Api/EntregaController.php:226
 * @route '/api/chofer/estadisticas'
 */
estadisticasChofer.url = (options?: RouteQueryOptions) => {
    return estadisticasChofer.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::estadisticasChofer
 * @see app/Http/Controllers/Api/EntregaController.php:226
 * @route '/api/chofer/estadisticas'
 */
estadisticasChofer.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estadisticasChofer.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::estadisticasChofer
 * @see app/Http/Controllers/Api/EntregaController.php:226
 * @route '/api/chofer/estadisticas'
 */
estadisticasChofer.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: estadisticasChofer.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::misTrabjos
 * @see app/Http/Controllers/Api/EntregaController.php:43
 * @route '/api/chofer/trabajos'
 */
export const misTrabjos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: misTrabjos.url(options),
    method: 'get',
})

misTrabjos.definition = {
    methods: ["get","head"],
    url: '/api/chofer/trabajos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::misTrabjos
 * @see app/Http/Controllers/Api/EntregaController.php:43
 * @route '/api/chofer/trabajos'
 */
misTrabjos.url = (options?: RouteQueryOptions) => {
    return misTrabjos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::misTrabjos
 * @see app/Http/Controllers/Api/EntregaController.php:43
 * @route '/api/chofer/trabajos'
 */
misTrabjos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: misTrabjos.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::misTrabjos
 * @see app/Http/Controllers/Api/EntregaController.php:43
 * @route '/api/chofer/trabajos'
 */
misTrabjos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: misTrabjos.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::entregasAsignadas
 * @see app/Http/Controllers/Api/EntregaController.php:383
 * @route '/api/chofer/entregas'
 */
export const entregasAsignadas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: entregasAsignadas.url(options),
    method: 'get',
})

entregasAsignadas.definition = {
    methods: ["get","head"],
    url: '/api/chofer/entregas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::entregasAsignadas
 * @see app/Http/Controllers/Api/EntregaController.php:383
 * @route '/api/chofer/entregas'
 */
entregasAsignadas.url = (options?: RouteQueryOptions) => {
    return entregasAsignadas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::entregasAsignadas
 * @see app/Http/Controllers/Api/EntregaController.php:383
 * @route '/api/chofer/entregas'
 */
entregasAsignadas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: entregasAsignadas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::entregasAsignadas
 * @see app/Http/Controllers/Api/EntregaController.php:383
 * @route '/api/chofer/entregas'
 */
entregasAsignadas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: entregasAsignadas.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::showEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:420
 * @route '/api/chofer/entregas/{id}'
 */
const showEntrega99966fc58ef488bb366bec129ad31105 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showEntrega99966fc58ef488bb366bec129ad31105.url(args, options),
    method: 'get',
})

showEntrega99966fc58ef488bb366bec129ad31105.definition = {
    methods: ["get","head"],
    url: '/api/chofer/entregas/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::showEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:420
 * @route '/api/chofer/entregas/{id}'
 */
showEntrega99966fc58ef488bb366bec129ad31105.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return showEntrega99966fc58ef488bb366bec129ad31105.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::showEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:420
 * @route '/api/chofer/entregas/{id}'
 */
showEntrega99966fc58ef488bb366bec129ad31105.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showEntrega99966fc58ef488bb366bec129ad31105.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::showEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:420
 * @route '/api/chofer/entregas/{id}'
 */
showEntrega99966fc58ef488bb366bec129ad31105.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showEntrega99966fc58ef488bb366bec129ad31105.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::showEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:420
 * @route '/api/entregas/{id}'
 */
const showEntrega1e6ef048b02be613ee2091b53c41cf2e = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showEntrega1e6ef048b02be613ee2091b53c41cf2e.url(args, options),
    method: 'get',
})

showEntrega1e6ef048b02be613ee2091b53c41cf2e.definition = {
    methods: ["get","head"],
    url: '/api/entregas/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::showEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:420
 * @route '/api/entregas/{id}'
 */
showEntrega1e6ef048b02be613ee2091b53c41cf2e.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return showEntrega1e6ef048b02be613ee2091b53c41cf2e.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::showEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:420
 * @route '/api/entregas/{id}'
 */
showEntrega1e6ef048b02be613ee2091b53c41cf2e.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showEntrega1e6ef048b02be613ee2091b53c41cf2e.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::showEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:420
 * @route '/api/entregas/{id}'
 */
showEntrega1e6ef048b02be613ee2091b53c41cf2e.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showEntrega1e6ef048b02be613ee2091b53c41cf2e.url(args, options),
    method: 'head',
})

export const showEntrega = {
    '/api/chofer/entregas/{id}': showEntrega99966fc58ef488bb366bec129ad31105,
    '/api/entregas/{id}': showEntrega1e6ef048b02be613ee2091b53c41cf2e,
}

/**
* @see \App\Http\Controllers\Api\EntregaController::iniciarRuta
 * @see app/Http/Controllers/Api/EntregaController.php:481
 * @route '/api/chofer/entregas/{id}/iniciar-ruta'
 */
export const iniciarRuta = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: iniciarRuta.url(args, options),
    method: 'post',
})

iniciarRuta.definition = {
    methods: ["post"],
    url: '/api/chofer/entregas/{id}/iniciar-ruta',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::iniciarRuta
 * @see app/Http/Controllers/Api/EntregaController.php:481
 * @route '/api/chofer/entregas/{id}/iniciar-ruta'
 */
iniciarRuta.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return iniciarRuta.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::iniciarRuta
 * @see app/Http/Controllers/Api/EntregaController.php:481
 * @route '/api/chofer/entregas/{id}/iniciar-ruta'
 */
iniciarRuta.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: iniciarRuta.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::actualizarEstado
 * @see app/Http/Controllers/Api/EntregaController.php:548
 * @route '/api/chofer/entregas/{id}/actualizar-estado'
 */
export const actualizarEstado = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarEstado.url(args, options),
    method: 'post',
})

actualizarEstado.definition = {
    methods: ["post"],
    url: '/api/chofer/entregas/{id}/actualizar-estado',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::actualizarEstado
 * @see app/Http/Controllers/Api/EntregaController.php:548
 * @route '/api/chofer/entregas/{id}/actualizar-estado'
 */
actualizarEstado.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return actualizarEstado.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::actualizarEstado
 * @see app/Http/Controllers/Api/EntregaController.php:548
 * @route '/api/chofer/entregas/{id}/actualizar-estado'
 */
actualizarEstado.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarEstado.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::marcarLlegada
 * @see app/Http/Controllers/Api/EntregaController.php:599
 * @route '/api/chofer/entregas/{id}/marcar-llegada'
 */
export const marcarLlegada = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: marcarLlegada.url(args, options),
    method: 'post',
})

marcarLlegada.definition = {
    methods: ["post"],
    url: '/api/chofer/entregas/{id}/marcar-llegada',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::marcarLlegada
 * @see app/Http/Controllers/Api/EntregaController.php:599
 * @route '/api/chofer/entregas/{id}/marcar-llegada'
 */
marcarLlegada.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return marcarLlegada.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::marcarLlegada
 * @see app/Http/Controllers/Api/EntregaController.php:599
 * @route '/api/chofer/entregas/{id}/marcar-llegada'
 */
marcarLlegada.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: marcarLlegada.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarVentaEntregada
 * @see app/Http/Controllers/Api/EntregaController.php:666
 * @route '/api/chofer/entregas/{id}/ventas/{venta_id}/confirmar-entrega'
 */
export const confirmarVentaEntregada = (args: { id: string | number, venta_id: string | number } | [id: string | number, venta_id: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarVentaEntregada.url(args, options),
    method: 'post',
})

confirmarVentaEntregada.definition = {
    methods: ["post"],
    url: '/api/chofer/entregas/{id}/ventas/{venta_id}/confirmar-entrega',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarVentaEntregada
 * @see app/Http/Controllers/Api/EntregaController.php:666
 * @route '/api/chofer/entregas/{id}/ventas/{venta_id}/confirmar-entrega'
 */
confirmarVentaEntregada.url = (args: { id: string | number, venta_id: string | number } | [id: string | number, venta_id: string | number ], options?: RouteQueryOptions) => {
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

    return confirmarVentaEntregada.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace('{venta_id}', parsedArgs.venta_id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarVentaEntregada
 * @see app/Http/Controllers/Api/EntregaController.php:666
 * @route '/api/chofer/entregas/{id}/ventas/{venta_id}/confirmar-entrega'
 */
confirmarVentaEntregada.post = (args: { id: string | number, venta_id: string | number } | [id: string | number, venta_id: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarVentaEntregada.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::finalizarEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:888
 * @route '/api/chofer/entregas/{id}/finalizar-entrega'
 */
export const finalizarEntrega = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: finalizarEntrega.url(args, options),
    method: 'post',
})

finalizarEntrega.definition = {
    methods: ["post"],
    url: '/api/chofer/entregas/{id}/finalizar-entrega',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::finalizarEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:888
 * @route '/api/chofer/entregas/{id}/finalizar-entrega'
 */
finalizarEntrega.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return finalizarEntrega.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::finalizarEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:888
 * @route '/api/chofer/entregas/{id}/finalizar-entrega'
 */
finalizarEntrega.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: finalizarEntrega.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:999
 * @route '/api/chofer/entregas/{id}/confirmar-entrega'
 */
export const confirmarEntrega = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarEntrega.url(args, options),
    method: 'post',
})

confirmarEntrega.definition = {
    methods: ["post"],
    url: '/api/chofer/entregas/{id}/confirmar-entrega',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:999
 * @route '/api/chofer/entregas/{id}/confirmar-entrega'
 */
confirmarEntrega.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return confirmarEntrega.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:999
 * @route '/api/chofer/entregas/{id}/confirmar-entrega'
 */
confirmarEntrega.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarEntrega.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::reportarNovedad
 * @see app/Http/Controllers/Api/EntregaController.php:1073
 * @route '/api/chofer/entregas/{id}/reportar-novedad'
 */
export const reportarNovedad = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reportarNovedad.url(args, options),
    method: 'post',
})

reportarNovedad.definition = {
    methods: ["post"],
    url: '/api/chofer/entregas/{id}/reportar-novedad',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::reportarNovedad
 * @see app/Http/Controllers/Api/EntregaController.php:1073
 * @route '/api/chofer/entregas/{id}/reportar-novedad'
 */
reportarNovedad.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return reportarNovedad.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::reportarNovedad
 * @see app/Http/Controllers/Api/EntregaController.php:1073
 * @route '/api/chofer/entregas/{id}/reportar-novedad'
 */
reportarNovedad.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reportarNovedad.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:1137
 * @route '/api/chofer/entregas/{id}/ubicacion'
 */
const registrarUbicacionad3754bc340c83999f6ded5b3a54a778 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarUbicacionad3754bc340c83999f6ded5b3a54a778.url(args, options),
    method: 'post',
})

registrarUbicacionad3754bc340c83999f6ded5b3a54a778.definition = {
    methods: ["post"],
    url: '/api/chofer/entregas/{id}/ubicacion',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:1137
 * @route '/api/chofer/entregas/{id}/ubicacion'
 */
registrarUbicacionad3754bc340c83999f6ded5b3a54a778.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return registrarUbicacionad3754bc340c83999f6ded5b3a54a778.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:1137
 * @route '/api/chofer/entregas/{id}/ubicacion'
 */
registrarUbicacionad3754bc340c83999f6ded5b3a54a778.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarUbicacionad3754bc340c83999f6ded5b3a54a778.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:1137
 * @route '/api/entregas/{id}/ubicacion'
 */
const registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8.url(args, options),
    method: 'post',
})

registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8.definition = {
    methods: ["post"],
    url: '/api/entregas/{id}/ubicacion',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:1137
 * @route '/api/entregas/{id}/ubicacion'
 */
registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:1137
 * @route '/api/entregas/{id}/ubicacion'
 */
registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8.url(args, options),
    method: 'post',
})

export const registrarUbicacion = {
    '/api/chofer/entregas/{id}/ubicacion': registrarUbicacionad3754bc340c83999f6ded5b3a54a778,
    '/api/entregas/{id}/ubicacion': registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8,
}

/**
* @see \App\Http\Controllers\Api\EntregaController::historialEntregas
 * @see app/Http/Controllers/Api/EntregaController.php:1215
 * @route '/api/chofer/historial'
 */
export const historialEntregas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: historialEntregas.url(options),
    method: 'get',
})

historialEntregas.definition = {
    methods: ["get","head"],
    url: '/api/chofer/historial',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::historialEntregas
 * @see app/Http/Controllers/Api/EntregaController.php:1215
 * @route '/api/chofer/historial'
 */
historialEntregas.url = (options?: RouteQueryOptions) => {
    return historialEntregas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::historialEntregas
 * @see app/Http/Controllers/Api/EntregaController.php:1215
 * @route '/api/chofer/historial'
 */
historialEntregas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: historialEntregas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::historialEntregas
 * @see app/Http/Controllers/Api/EntregaController.php:1215
 * @route '/api/chofer/historial'
 */
historialEntregas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: historialEntregas.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerTracking
 * @see app/Http/Controllers/Api/EntregaController.php:1249
 * @route '/api/cliente/pedidos/{proformaId}/tracking'
 */
export const obtenerTracking = (args: { proformaId: string | number } | [proformaId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerTracking.url(args, options),
    method: 'get',
})

obtenerTracking.definition = {
    methods: ["get","head"],
    url: '/api/cliente/pedidos/{proformaId}/tracking',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerTracking
 * @see app/Http/Controllers/Api/EntregaController.php:1249
 * @route '/api/cliente/pedidos/{proformaId}/tracking'
 */
obtenerTracking.url = (args: { proformaId: string | number } | [proformaId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proformaId: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    proformaId: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proformaId: args.proformaId,
                }

    return obtenerTracking.definition.url
            .replace('{proformaId}', parsedArgs.proformaId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerTracking
 * @see app/Http/Controllers/Api/EntregaController.php:1249
 * @route '/api/cliente/pedidos/{proformaId}/tracking'
 */
obtenerTracking.get = (args: { proformaId: string | number } | [proformaId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerTracking.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerTracking
 * @see app/Http/Controllers/Api/EntregaController.php:1249
 * @route '/api/cliente/pedidos/{proformaId}/tracking'
 */
obtenerTracking.head = (args: { proformaId: string | number } | [proformaId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerTracking.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::indexAdmin
 * @see app/Http/Controllers/Api/EntregaController.php:1322
 * @route '/api/admin/entregas'
 */
export const indexAdmin = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexAdmin.url(options),
    method: 'get',
})

indexAdmin.definition = {
    methods: ["get","head"],
    url: '/api/admin/entregas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::indexAdmin
 * @see app/Http/Controllers/Api/EntregaController.php:1322
 * @route '/api/admin/entregas'
 */
indexAdmin.url = (options?: RouteQueryOptions) => {
    return indexAdmin.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::indexAdmin
 * @see app/Http/Controllers/Api/EntregaController.php:1322
 * @route '/api/admin/entregas'
 */
indexAdmin.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexAdmin.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::indexAdmin
 * @see app/Http/Controllers/Api/EntregaController.php:1322
 * @route '/api/admin/entregas'
 */
indexAdmin.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: indexAdmin.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::asignarEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:1357
 * @route '/api/admin/entregas/{id}/asignar'
 */
export const asignarEntrega = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: asignarEntrega.url(args, options),
    method: 'post',
})

asignarEntrega.definition = {
    methods: ["post"],
    url: '/api/admin/entregas/{id}/asignar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::asignarEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:1357
 * @route '/api/admin/entregas/{id}/asignar'
 */
asignarEntrega.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return asignarEntrega.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::asignarEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:1357
 * @route '/api/admin/entregas/{id}/asignar'
 */
asignarEntrega.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: asignarEntrega.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::entregasActivas
 * @see app/Http/Controllers/Api/EntregaController.php:1398
 * @route '/api/admin/entregas/activas'
 */
export const entregasActivas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: entregasActivas.url(options),
    method: 'get',
})

entregasActivas.definition = {
    methods: ["get","head"],
    url: '/api/admin/entregas/activas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::entregasActivas
 * @see app/Http/Controllers/Api/EntregaController.php:1398
 * @route '/api/admin/entregas/activas'
 */
entregasActivas.url = (options?: RouteQueryOptions) => {
    return entregasActivas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::entregasActivas
 * @see app/Http/Controllers/Api/EntregaController.php:1398
 * @route '/api/admin/entregas/activas'
 */
entregasActivas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: entregasActivas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::entregasActivas
 * @see app/Http/Controllers/Api/EntregaController.php:1398
 * @route '/api/admin/entregas/activas'
 */
entregasActivas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: entregasActivas.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerUbicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
export const obtenerUbicaciones = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerUbicaciones.url(args, options),
    method: 'get',
})

obtenerUbicaciones.definition = {
    methods: ["get","head"],
    url: '/api/entregas/{id}/ubicaciones',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerUbicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
obtenerUbicaciones.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return obtenerUbicaciones.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerUbicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
obtenerUbicaciones.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerUbicaciones.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerUbicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
obtenerUbicaciones.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerUbicaciones.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarCarga
 * @see app/Http/Controllers/Api/EntregaController.php:1436
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
 * @see app/Http/Controllers/Api/EntregaController.php:1436
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
 * @see app/Http/Controllers/Api/EntregaController.php:1436
 * @route '/api/entregas/{id}/confirmar-carga'
 */
confirmarCarga.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarCarga.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::marcarListoParaEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:1459
 * @route '/api/entregas/{id}/listo-para-entrega'
 */
export const marcarListoParaEntrega = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: marcarListoParaEntrega.url(args, options),
    method: 'post',
})

marcarListoParaEntrega.definition = {
    methods: ["post"],
    url: '/api/entregas/{id}/listo-para-entrega',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::marcarListoParaEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:1459
 * @route '/api/entregas/{id}/listo-para-entrega'
 */
marcarListoParaEntrega.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return marcarListoParaEntrega.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::marcarListoParaEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:1459
 * @route '/api/entregas/{id}/listo-para-entrega'
 */
marcarListoParaEntrega.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: marcarListoParaEntrega.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::iniciarTransito
 * @see app/Http/Controllers/Api/EntregaController.php:1482
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
 * @see app/Http/Controllers/Api/EntregaController.php:1482
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
 * @see app/Http/Controllers/Api/EntregaController.php:1482
 * @route '/api/entregas/{id}/iniciar-transito'
 */
iniciarTransito.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: iniciarTransito.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::actualizarUbicacionGPS
 * @see app/Http/Controllers/Api/EntregaController.php:1514
 * @route '/api/entregas/{id}/ubicacion-gps'
 */
export const actualizarUbicacionGPS = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: actualizarUbicacionGPS.url(args, options),
    method: 'patch',
})

actualizarUbicacionGPS.definition = {
    methods: ["patch"],
    url: '/api/entregas/{id}/ubicacion-gps',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::actualizarUbicacionGPS
 * @see app/Http/Controllers/Api/EntregaController.php:1514
 * @route '/api/entregas/{id}/ubicacion-gps'
 */
actualizarUbicacionGPS.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return actualizarUbicacionGPS.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::actualizarUbicacionGPS
 * @see app/Http/Controllers/Api/EntregaController.php:1514
 * @route '/api/entregas/{id}/ubicacion-gps'
 */
actualizarUbicacionGPS.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: actualizarUbicacionGPS.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::consolidarAutomatico
 * @see app/Http/Controllers/Api/EntregaController.php:1554
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
 * @see app/Http/Controllers/Api/EntregaController.php:1554
 * @route '/api/entregas/consolidar-automatico'
 */
consolidarAutomatico.url = (options?: RouteQueryOptions) => {
    return consolidarAutomatico.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::consolidarAutomatico
 * @see app/Http/Controllers/Api/EntregaController.php:1554
 * @route '/api/entregas/consolidar-automatico'
 */
consolidarAutomatico.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: consolidarAutomatico.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::crearEntregaConsolidada
 * @see app/Http/Controllers/Api/EntregaController.php:1589
 * @route '/api/entregas/crear-consolidada'
 */
export const crearEntregaConsolidada = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearEntregaConsolidada.url(options),
    method: 'post',
})

crearEntregaConsolidada.definition = {
    methods: ["post"],
    url: '/api/entregas/crear-consolidada',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::crearEntregaConsolidada
 * @see app/Http/Controllers/Api/EntregaController.php:1589
 * @route '/api/entregas/crear-consolidada'
 */
crearEntregaConsolidada.url = (options?: RouteQueryOptions) => {
    return crearEntregaConsolidada.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::crearEntregaConsolidada
 * @see app/Http/Controllers/Api/EntregaController.php:1589
 * @route '/api/entregas/crear-consolidada'
 */
crearEntregaConsolidada.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearEntregaConsolidada.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarVentaCargada
 * @see app/Http/Controllers/Api/EntregaController.php:1771
 * @route '/api/entregas/{id}/confirmar-venta/{venta_id}'
 */
export const confirmarVentaCargada = (args: { id: string | number, venta_id: string | number } | [id: string | number, venta_id: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarVentaCargada.url(args, options),
    method: 'post',
})

confirmarVentaCargada.definition = {
    methods: ["post"],
    url: '/api/entregas/{id}/confirmar-venta/{venta_id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarVentaCargada
 * @see app/Http/Controllers/Api/EntregaController.php:1771
 * @route '/api/entregas/{id}/confirmar-venta/{venta_id}'
 */
confirmarVentaCargada.url = (args: { id: string | number, venta_id: string | number } | [id: string | number, venta_id: string | number ], options?: RouteQueryOptions) => {
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

    return confirmarVentaCargada.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace('{venta_id}', parsedArgs.venta_id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarVentaCargada
 * @see app/Http/Controllers/Api/EntregaController.php:1771
 * @route '/api/entregas/{id}/confirmar-venta/{venta_id}'
 */
confirmarVentaCargada.post = (args: { id: string | number, venta_id: string | number } | [id: string | number, venta_id: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarVentaCargada.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::desmarcarVentaCargada
 * @see app/Http/Controllers/Api/EntregaController.php:1827
 * @route '/api/entregas/{id}/confirmar-venta/{venta_id}'
 */
export const desmarcarVentaCargada = (args: { id: string | number, venta_id: string | number } | [id: string | number, venta_id: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: desmarcarVentaCargada.url(args, options),
    method: 'delete',
})

desmarcarVentaCargada.definition = {
    methods: ["delete"],
    url: '/api/entregas/{id}/confirmar-venta/{venta_id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::desmarcarVentaCargada
 * @see app/Http/Controllers/Api/EntregaController.php:1827
 * @route '/api/entregas/{id}/confirmar-venta/{venta_id}'
 */
desmarcarVentaCargada.url = (args: { id: string | number, venta_id: string | number } | [id: string | number, venta_id: string | number ], options?: RouteQueryOptions) => {
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

    return desmarcarVentaCargada.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace('{venta_id}', parsedArgs.venta_id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::desmarcarVentaCargada
 * @see app/Http/Controllers/Api/EntregaController.php:1827
 * @route '/api/entregas/{id}/confirmar-venta/{venta_id}'
 */
desmarcarVentaCargada.delete = (args: { id: string | number, venta_id: string | number } | [id: string | number, venta_id: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: desmarcarVentaCargada.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerDetalles
 * @see app/Http/Controllers/Api/EntregaController.php:1869
 * @route '/api/entregas/{id}/detalles'
 */
export const obtenerDetalles = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerDetalles.url(args, options),
    method: 'get',
})

obtenerDetalles.definition = {
    methods: ["get","head"],
    url: '/api/entregas/{id}/detalles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerDetalles
 * @see app/Http/Controllers/Api/EntregaController.php:1869
 * @route '/api/entregas/{id}/detalles'
 */
obtenerDetalles.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return obtenerDetalles.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerDetalles
 * @see app/Http/Controllers/Api/EntregaController.php:1869
 * @route '/api/entregas/{id}/detalles'
 */
obtenerDetalles.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerDetalles.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerDetalles
 * @see app/Http/Controllers/Api/EntregaController.php:1869
 * @route '/api/entregas/{id}/detalles'
 */
obtenerDetalles.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerDetalles.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerProgreso
 * @see app/Http/Controllers/Api/EntregaController.php:1929
 * @route '/api/entregas/{id}/progreso'
 */
export const obtenerProgreso = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerProgreso.url(args, options),
    method: 'get',
})

obtenerProgreso.definition = {
    methods: ["get","head"],
    url: '/api/entregas/{id}/progreso',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerProgreso
 * @see app/Http/Controllers/Api/EntregaController.php:1929
 * @route '/api/entregas/{id}/progreso'
 */
obtenerProgreso.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return obtenerProgreso.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerProgreso
 * @see app/Http/Controllers/Api/EntregaController.php:1929
 * @route '/api/entregas/{id}/progreso'
 */
obtenerProgreso.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerProgreso.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerProgreso
 * @see app/Http/Controllers/Api/EntregaController.php:1929
 * @route '/api/entregas/{id}/progreso'
 */
obtenerProgreso.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerProgreso.url(args, options),
    method: 'head',
})
const EntregaController = { estadisticasChofer, misTrabjos, entregasAsignadas, showEntrega, iniciarRuta, actualizarEstado, marcarLlegada, confirmarVentaEntregada, finalizarEntrega, confirmarEntrega, reportarNovedad, registrarUbicacion, historialEntregas, obtenerTracking, indexAdmin, asignarEntrega, entregasActivas, obtenerUbicaciones, confirmarCarga, marcarListoParaEntrega, iniciarTransito, actualizarUbicacionGPS, consolidarAutomatico, crearEntregaConsolidada, confirmarVentaCargada, desmarcarVentaCargada, obtenerDetalles, obtenerProgreso }

export default EntregaController