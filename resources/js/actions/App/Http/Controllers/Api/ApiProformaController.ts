import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ApiProformaController::index
 * @see app/Http/Controllers/Api/ApiProformaController.php:589
 * @route '/api/proformas'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/proformas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::index
 * @see app/Http/Controllers/Api/ApiProformaController.php:589
 * @route '/api/proformas'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::index
 * @see app/Http/Controllers/Api/ApiProformaController.php:589
 * @route '/api/proformas'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::index
 * @see app/Http/Controllers/Api/ApiProformaController.php:589
 * @route '/api/proformas'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::stats
 * @see app/Http/Controllers/Api/ApiProformaController.php:872
 * @route '/api/proformas/estadisticas'
 */
export const stats = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stats.url(options),
    method: 'get',
})

stats.definition = {
    methods: ["get","head"],
    url: '/api/proformas/estadisticas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::stats
 * @see app/Http/Controllers/Api/ApiProformaController.php:872
 * @route '/api/proformas/estadisticas'
 */
stats.url = (options?: RouteQueryOptions) => {
    return stats.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::stats
 * @see app/Http/Controllers/Api/ApiProformaController.php:872
 * @route '/api/proformas/estadisticas'
 */
stats.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stats.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::stats
 * @see app/Http/Controllers/Api/ApiProformaController.php:872
 * @route '/api/proformas/estadisticas'
 */
stats.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: stats.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::store
 * @see app/Http/Controllers/Api/ApiProformaController.php:26
 * @route '/api/proformas'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/proformas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::store
 * @see app/Http/Controllers/Api/ApiProformaController.php:26
 * @route '/api/proformas'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::store
 * @see app/Http/Controllers/Api/ApiProformaController.php:26
 * @route '/api/proformas'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::show
 * @see app/Http/Controllers/Api/ApiProformaController.php:280
 * @route '/api/proformas/{proforma}'
 */
export const show = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/proformas/{proforma}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::show
 * @see app/Http/Controllers/Api/ApiProformaController.php:280
 * @route '/api/proformas/{proforma}'
 */
show.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proforma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proforma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proforma: typeof args.proforma === 'object'
                ? args.proforma.id
                : args.proforma,
                }

    return show.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::show
 * @see app/Http/Controllers/Api/ApiProformaController.php:280
 * @route '/api/proformas/{proforma}'
 */
show.get = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::show
 * @see app/Http/Controllers/Api/ApiProformaController.php:280
 * @route '/api/proformas/{proforma}'
 */
show.head = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::update
 * @see app/Http/Controllers/Api/ApiProformaController.php:306
 * @route '/api/proformas/{proforma}'
 */
export const update = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/proformas/{proforma}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::update
 * @see app/Http/Controllers/Api/ApiProformaController.php:306
 * @route '/api/proformas/{proforma}'
 */
update.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proforma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proforma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proforma: typeof args.proforma === 'object'
                ? args.proforma.id
                : args.proforma,
                }

    return update.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::update
 * @see app/Http/Controllers/Api/ApiProformaController.php:306
 * @route '/api/proformas/{proforma}'
 */
update.put = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::aprobar
 * @see app/Http/Controllers/Api/ApiProformaController.php:1109
 * @route '/api/proformas/{proforma}/aprobar'
 */
export const aprobar = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: aprobar.url(args, options),
    method: 'post',
})

aprobar.definition = {
    methods: ["post"],
    url: '/api/proformas/{proforma}/aprobar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::aprobar
 * @see app/Http/Controllers/Api/ApiProformaController.php:1109
 * @route '/api/proformas/{proforma}/aprobar'
 */
aprobar.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proforma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proforma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proforma: typeof args.proforma === 'object'
                ? args.proforma.id
                : args.proforma,
                }

    return aprobar.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::aprobar
 * @see app/Http/Controllers/Api/ApiProformaController.php:1109
 * @route '/api/proformas/{proforma}/aprobar'
 */
aprobar.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: aprobar.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::rechazar
 * @see app/Http/Controllers/Api/ApiProformaController.php:1224
 * @route '/api/proformas/{proforma}/rechazar'
 */
export const rechazar = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rechazar.url(args, options),
    method: 'post',
})

rechazar.definition = {
    methods: ["post"],
    url: '/api/proformas/{proforma}/rechazar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::rechazar
 * @see app/Http/Controllers/Api/ApiProformaController.php:1224
 * @route '/api/proformas/{proforma}/rechazar'
 */
rechazar.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proforma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proforma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proforma: typeof args.proforma === 'object'
                ? args.proforma.id
                : args.proforma,
                }

    return rechazar.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::rechazar
 * @see app/Http/Controllers/Api/ApiProformaController.php:1224
 * @route '/api/proformas/{proforma}/rechazar'
 */
rechazar.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rechazar.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::convertirAVenta
 * @see app/Http/Controllers/Api/ApiProformaController.php:2327
 * @route '/api/proformas/{proforma}/convertir-venta'
 */
export const convertirAVenta = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: convertirAVenta.url(args, options),
    method: 'post',
})

convertirAVenta.definition = {
    methods: ["post"],
    url: '/api/proformas/{proforma}/convertir-venta',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::convertirAVenta
 * @see app/Http/Controllers/Api/ApiProformaController.php:2327
 * @route '/api/proformas/{proforma}/convertir-venta'
 */
convertirAVenta.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proforma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proforma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proforma: typeof args.proforma === 'object'
                ? args.proforma.id
                : args.proforma,
                }

    return convertirAVenta.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::convertirAVenta
 * @see app/Http/Controllers/Api/ApiProformaController.php:2327
 * @route '/api/proformas/{proforma}/convertir-venta'
 */
convertirAVenta.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: convertirAVenta.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::confirmarProforma
 * @see app/Http/Controllers/Api/ApiProformaController.php:2070
 * @route '/api/proformas/{proforma}/confirmar'
 */
export const confirmarProforma = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarProforma.url(args, options),
    method: 'post',
})

confirmarProforma.definition = {
    methods: ["post"],
    url: '/api/proformas/{proforma}/confirmar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::confirmarProforma
 * @see app/Http/Controllers/Api/ApiProformaController.php:2070
 * @route '/api/proformas/{proforma}/confirmar'
 */
confirmarProforma.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proforma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proforma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proforma: typeof args.proforma === 'object'
                ? args.proforma.id
                : args.proforma,
                }

    return confirmarProforma.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::confirmarProforma
 * @see app/Http/Controllers/Api/ApiProformaController.php:2070
 * @route '/api/proformas/{proforma}/confirmar'
 */
confirmarProforma.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarProforma.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::extenderVencimiento
 * @see app/Http/Controllers/Api/ApiProformaController.php:1384
 * @route '/api/proformas/{proforma}/extender-vencimiento'
 */
export const extenderVencimiento = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: extenderVencimiento.url(args, options),
    method: 'post',
})

extenderVencimiento.definition = {
    methods: ["post"],
    url: '/api/proformas/{proforma}/extender-vencimiento',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::extenderVencimiento
 * @see app/Http/Controllers/Api/ApiProformaController.php:1384
 * @route '/api/proformas/{proforma}/extender-vencimiento'
 */
extenderVencimiento.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proforma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proforma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proforma: typeof args.proforma === 'object'
                ? args.proforma.id
                : args.proforma,
                }

    return extenderVencimiento.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::extenderVencimiento
 * @see app/Http/Controllers/Api/ApiProformaController.php:1384
 * @route '/api/proformas/{proforma}/extender-vencimiento'
 */
extenderVencimiento.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: extenderVencimiento.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::coordinarEntrega
 * @see app/Http/Controllers/Api/ApiProformaController.php:1279
 * @route '/api/proformas/{proforma}/coordinar'
 */
export const coordinarEntrega = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: coordinarEntrega.url(args, options),
    method: 'post',
})

coordinarEntrega.definition = {
    methods: ["post"],
    url: '/api/proformas/{proforma}/coordinar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::coordinarEntrega
 * @see app/Http/Controllers/Api/ApiProformaController.php:1279
 * @route '/api/proformas/{proforma}/coordinar'
 */
coordinarEntrega.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proforma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proforma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proforma: typeof args.proforma === 'object'
                ? args.proforma.id
                : args.proforma,
                }

    return coordinarEntrega.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::coordinarEntrega
 * @see app/Http/Controllers/Api/ApiProformaController.php:1279
 * @route '/api/proformas/{proforma}/coordinar'
 */
coordinarEntrega.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: coordinarEntrega.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::actualizarDetalles
 * @see app/Http/Controllers/Api/ApiProformaController.php:3536
 * @route '/api/proformas/{proforma}/actualizar-detalles'
 */
export const actualizarDetalles = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarDetalles.url(args, options),
    method: 'post',
})

actualizarDetalles.definition = {
    methods: ["post"],
    url: '/api/proformas/{proforma}/actualizar-detalles',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::actualizarDetalles
 * @see app/Http/Controllers/Api/ApiProformaController.php:3536
 * @route '/api/proformas/{proforma}/actualizar-detalles'
 */
actualizarDetalles.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proforma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proforma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proforma: typeof args.proforma === 'object'
                ? args.proforma.id
                : args.proforma,
                }

    return actualizarDetalles.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::actualizarDetalles
 * @see app/Http/Controllers/Api/ApiProformaController.php:3536
 * @route '/api/proformas/{proforma}/actualizar-detalles'
 */
actualizarDetalles.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarDetalles.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarEstado
 * @see app/Http/Controllers/Api/ApiProformaController.php:1051
 * @route '/api/proformas/{proforma}/estado'
 */
export const verificarEstado = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verificarEstado.url(args, options),
    method: 'get',
})

verificarEstado.definition = {
    methods: ["get","head"],
    url: '/api/proformas/{proforma}/estado',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarEstado
 * @see app/Http/Controllers/Api/ApiProformaController.php:1051
 * @route '/api/proformas/{proforma}/estado'
 */
verificarEstado.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proforma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proforma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proforma: typeof args.proforma === 'object'
                ? args.proforma.id
                : args.proforma,
                }

    return verificarEstado.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarEstado
 * @see app/Http/Controllers/Api/ApiProformaController.php:1051
 * @route '/api/proformas/{proforma}/estado'
 */
verificarEstado.get = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verificarEstado.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarEstado
 * @see app/Http/Controllers/Api/ApiProformaController.php:1051
 * @route '/api/proformas/{proforma}/estado'
 */
verificarEstado.head = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: verificarEstado.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarReservas
 * @see app/Http/Controllers/Api/ApiProformaController.php:1480
 * @route '/api/proformas/{proforma}/reservas'
 */
export const verificarReservas = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verificarReservas.url(args, options),
    method: 'get',
})

verificarReservas.definition = {
    methods: ["get","head"],
    url: '/api/proformas/{proforma}/reservas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarReservas
 * @see app/Http/Controllers/Api/ApiProformaController.php:1480
 * @route '/api/proformas/{proforma}/reservas'
 */
verificarReservas.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proforma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proforma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proforma: typeof args.proforma === 'object'
                ? args.proforma.id
                : args.proforma,
                }

    return verificarReservas.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarReservas
 * @see app/Http/Controllers/Api/ApiProformaController.php:1480
 * @route '/api/proformas/{proforma}/reservas'
 */
verificarReservas.get = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verificarReservas.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarReservas
 * @see app/Http/Controllers/Api/ApiProformaController.php:1480
 * @route '/api/proformas/{proforma}/reservas'
 */
verificarReservas.head = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: verificarReservas.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::extenderReservas
 * @see app/Http/Controllers/Api/ApiProformaController.php:1507
 * @route '/api/proformas/{proforma}/extender-reservas'
 */
export const extenderReservas = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: extenderReservas.url(args, options),
    method: 'post',
})

extenderReservas.definition = {
    methods: ["post"],
    url: '/api/proformas/{proforma}/extender-reservas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::extenderReservas
 * @see app/Http/Controllers/Api/ApiProformaController.php:1507
 * @route '/api/proformas/{proforma}/extender-reservas'
 */
extenderReservas.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proforma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proforma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proforma: typeof args.proforma === 'object'
                ? args.proforma.id
                : args.proforma,
                }

    return extenderReservas.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::extenderReservas
 * @see app/Http/Controllers/Api/ApiProformaController.php:1507
 * @route '/api/proformas/{proforma}/extender-reservas'
 */
extenderReservas.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: extenderReservas.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarStock
 * @see app/Http/Controllers/Api/ApiProformaController.php:1429
 * @route '/api/proformas/verificar-stock'
 */
export const verificarStock = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verificarStock.url(options),
    method: 'post',
})

verificarStock.definition = {
    methods: ["post"],
    url: '/api/proformas/verificar-stock',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarStock
 * @see app/Http/Controllers/Api/ApiProformaController.php:1429
 * @route '/api/proformas/verificar-stock'
 */
verificarStock.url = (options?: RouteQueryOptions) => {
    return verificarStock.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::verificarStock
 * @see app/Http/Controllers/Api/ApiProformaController.php:1429
 * @route '/api/proformas/verificar-stock'
 */
verificarStock.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verificarStock.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerProductosDisponibles
 * @see app/Http/Controllers/Api/ApiProformaController.php:1070
 * @route '/api/proformas/productos-disponibles'
 */
export const obtenerProductosDisponibles = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerProductosDisponibles.url(options),
    method: 'get',
})

obtenerProductosDisponibles.definition = {
    methods: ["get","head"],
    url: '/api/proformas/productos-disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerProductosDisponibles
 * @see app/Http/Controllers/Api/ApiProformaController.php:1070
 * @route '/api/proformas/productos-disponibles'
 */
obtenerProductosDisponibles.url = (options?: RouteQueryOptions) => {
    return obtenerProductosDisponibles.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerProductosDisponibles
 * @see app/Http/Controllers/Api/ApiProformaController.php:1070
 * @route '/api/proformas/productos-disponibles'
 */
obtenerProductosDisponibles.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerProductosDisponibles.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerProductosDisponibles
 * @see app/Http/Controllers/Api/ApiProformaController.php:1070
 * @route '/api/proformas/productos-disponibles'
 */
obtenerProductosDisponibles.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerProductosDisponibles.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerSiguientePendiente
 * @see app/Http/Controllers/Api/ApiProformaController.php:3675
 * @route '/api/proformas/siguiente-pendiente'
 */
export const obtenerSiguientePendiente = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerSiguientePendiente.url(options),
    method: 'get',
})

obtenerSiguientePendiente.definition = {
    methods: ["get","head"],
    url: '/api/proformas/siguiente-pendiente',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerSiguientePendiente
 * @see app/Http/Controllers/Api/ApiProformaController.php:3675
 * @route '/api/proformas/siguiente-pendiente'
 */
obtenerSiguientePendiente.url = (options?: RouteQueryOptions) => {
    return obtenerSiguientePendiente.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerSiguientePendiente
 * @see app/Http/Controllers/Api/ApiProformaController.php:3675
 * @route '/api/proformas/siguiente-pendiente'
 */
obtenerSiguientePendiente.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerSiguientePendiente.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerSiguientePendiente
 * @see app/Http/Controllers/Api/ApiProformaController.php:3675
 * @route '/api/proformas/siguiente-pendiente'
 */
obtenerSiguientePendiente.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerSiguientePendiente.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::crearPedidoDesdeApp
 * @see app/Http/Controllers/Api/ApiProformaController.php:1552
 * @route '/api/app/pedidos'
 */
export const crearPedidoDesdeApp = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearPedidoDesdeApp.url(options),
    method: 'post',
})

crearPedidoDesdeApp.definition = {
    methods: ["post"],
    url: '/api/app/pedidos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::crearPedidoDesdeApp
 * @see app/Http/Controllers/Api/ApiProformaController.php:1552
 * @route '/api/app/pedidos'
 */
crearPedidoDesdeApp.url = (options?: RouteQueryOptions) => {
    return crearPedidoDesdeApp.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::crearPedidoDesdeApp
 * @see app/Http/Controllers/Api/ApiProformaController.php:1552
 * @route '/api/app/pedidos'
 */
crearPedidoDesdeApp.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearPedidoDesdeApp.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerDetallePedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:1808
 * @route '/api/app/pedidos/{id}'
 */
export const obtenerDetallePedido = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerDetallePedido.url(args, options),
    method: 'get',
})

obtenerDetallePedido.definition = {
    methods: ["get","head"],
    url: '/api/app/pedidos/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerDetallePedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:1808
 * @route '/api/app/pedidos/{id}'
 */
obtenerDetallePedido.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return obtenerDetallePedido.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerDetallePedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:1808
 * @route '/api/app/pedidos/{id}'
 */
obtenerDetallePedido.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerDetallePedido.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerDetallePedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:1808
 * @route '/api/app/pedidos/{id}'
 */
obtenerDetallePedido.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerDetallePedido.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerEstadoPedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:1935
 * @route '/api/app/pedidos/{id}/estado'
 */
export const obtenerEstadoPedido = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerEstadoPedido.url(args, options),
    method: 'get',
})

obtenerEstadoPedido.definition = {
    methods: ["get","head"],
    url: '/api/app/pedidos/{id}/estado',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerEstadoPedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:1935
 * @route '/api/app/pedidos/{id}/estado'
 */
obtenerEstadoPedido.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return obtenerEstadoPedido.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerEstadoPedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:1935
 * @route '/api/app/pedidos/{id}/estado'
 */
obtenerEstadoPedido.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerEstadoPedido.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerEstadoPedido
 * @see app/Http/Controllers/Api/ApiProformaController.php:1935
 * @route '/api/app/pedidos/{id}/estado'
 */
obtenerEstadoPedido.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerEstadoPedido.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerUltimoCarrito
 * @see app/Http/Controllers/Api/ApiProformaController.php:2860
 * @route '/api/carritos/usuario/{usuarioId}/ultimo'
 */
export const obtenerUltimoCarrito = (args: { usuarioId: string | number } | [usuarioId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerUltimoCarrito.url(args, options),
    method: 'get',
})

obtenerUltimoCarrito.definition = {
    methods: ["get","head"],
    url: '/api/carritos/usuario/{usuarioId}/ultimo',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerUltimoCarrito
 * @see app/Http/Controllers/Api/ApiProformaController.php:2860
 * @route '/api/carritos/usuario/{usuarioId}/ultimo'
 */
obtenerUltimoCarrito.url = (args: { usuarioId: string | number } | [usuarioId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { usuarioId: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    usuarioId: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        usuarioId: args.usuarioId,
                }

    return obtenerUltimoCarrito.definition.url
            .replace('{usuarioId}', parsedArgs.usuarioId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerUltimoCarrito
 * @see app/Http/Controllers/Api/ApiProformaController.php:2860
 * @route '/api/carritos/usuario/{usuarioId}/ultimo'
 */
obtenerUltimoCarrito.get = (args: { usuarioId: string | number } | [usuarioId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerUltimoCarrito.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ApiProformaController::obtenerUltimoCarrito
 * @see app/Http/Controllers/Api/ApiProformaController.php:2860
 * @route '/api/carritos/usuario/{usuarioId}/ultimo'
 */
obtenerUltimoCarrito.head = (args: { usuarioId: string | number } | [usuarioId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerUltimoCarrito.url(args, options),
    method: 'head',
})
const ApiProformaController = { index, stats, store, show, update, aprobar, rechazar, convertirAVenta, confirmarProforma, extenderVencimiento, coordinarEntrega, actualizarDetalles, verificarEstado, verificarReservas, extenderReservas, verificarStock, obtenerProductosDisponibles, obtenerSiguientePendiente, crearPedidoDesdeApp, obtenerDetallePedido, obtenerEstadoPedido, obtenerUltimoCarrito }

export default ApiProformaController