import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:21
 * @route '/cajas'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/cajas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:21
 * @route '/cajas'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:21
 * @route '/cajas'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:21
 * @route '/cajas'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:21
 * @route '/cajas'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:21
 * @route '/cajas'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:21
 * @route '/cajas'
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
* @see \App\Http\Controllers\CajaController::abrirCaja
 * @see app/Http/Controllers/CajaController.php:56
 * @route '/cajas/abrir'
 */
export const abrirCaja = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: abrirCaja.url(options),
    method: 'post',
})

abrirCaja.definition = {
    methods: ["post"],
    url: '/cajas/abrir',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CajaController::abrirCaja
 * @see app/Http/Controllers/CajaController.php:56
 * @route '/cajas/abrir'
 */
abrirCaja.url = (options?: RouteQueryOptions) => {
    return abrirCaja.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::abrirCaja
 * @see app/Http/Controllers/CajaController.php:56
 * @route '/cajas/abrir'
 */
abrirCaja.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: abrirCaja.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\CajaController::abrirCaja
 * @see app/Http/Controllers/CajaController.php:56
 * @route '/cajas/abrir'
 */
    const abrirCajaForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: abrirCaja.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CajaController::abrirCaja
 * @see app/Http/Controllers/CajaController.php:56
 * @route '/cajas/abrir'
 */
        abrirCajaForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: abrirCaja.url(options),
            method: 'post',
        })
    
    abrirCaja.form = abrirCajaForm
/**
* @see \App\Http\Controllers\CajaController::cerrarCaja
 * @see app/Http/Controllers/CajaController.php:137
 * @route '/cajas/cerrar'
 */
export const cerrarCaja = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cerrarCaja.url(options),
    method: 'post',
})

cerrarCaja.definition = {
    methods: ["post"],
    url: '/cajas/cerrar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CajaController::cerrarCaja
 * @see app/Http/Controllers/CajaController.php:137
 * @route '/cajas/cerrar'
 */
cerrarCaja.url = (options?: RouteQueryOptions) => {
    return cerrarCaja.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::cerrarCaja
 * @see app/Http/Controllers/CajaController.php:137
 * @route '/cajas/cerrar'
 */
cerrarCaja.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cerrarCaja.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\CajaController::cerrarCaja
 * @see app/Http/Controllers/CajaController.php:137
 * @route '/cajas/cerrar'
 */
    const cerrarCajaForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cerrarCaja.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CajaController::cerrarCaja
 * @see app/Http/Controllers/CajaController.php:137
 * @route '/cajas/cerrar'
 */
        cerrarCajaForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cerrarCaja.url(options),
            method: 'post',
        })
    
    cerrarCaja.form = cerrarCajaForm
/**
* @see \App\Http\Controllers\CajaController::estadoCajas
 * @see app/Http/Controllers/CajaController.php:221
 * @route '/cajas/estado'
 */
export const estadoCajas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estadoCajas.url(options),
    method: 'get',
})

estadoCajas.definition = {
    methods: ["get","head"],
    url: '/cajas/estado',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CajaController::estadoCajas
 * @see app/Http/Controllers/CajaController.php:221
 * @route '/cajas/estado'
 */
estadoCajas.url = (options?: RouteQueryOptions) => {
    return estadoCajas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::estadoCajas
 * @see app/Http/Controllers/CajaController.php:221
 * @route '/cajas/estado'
 */
estadoCajas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estadoCajas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CajaController::estadoCajas
 * @see app/Http/Controllers/CajaController.php:221
 * @route '/cajas/estado'
 */
estadoCajas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: estadoCajas.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CajaController::estadoCajas
 * @see app/Http/Controllers/CajaController.php:221
 * @route '/cajas/estado'
 */
    const estadoCajasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: estadoCajas.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CajaController::estadoCajas
 * @see app/Http/Controllers/CajaController.php:221
 * @route '/cajas/estado'
 */
        estadoCajasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: estadoCajas.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CajaController::estadoCajas
 * @see app/Http/Controllers/CajaController.php:221
 * @route '/cajas/estado'
 */
        estadoCajasForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: estadoCajas.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    estadoCajas.form = estadoCajasForm
/**
* @see \App\Http\Controllers\CajaController::movimientosDia
 * @see app/Http/Controllers/CajaController.php:250
 * @route '/cajas/movimientos'
 */
export const movimientosDia = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: movimientosDia.url(options),
    method: 'get',
})

movimientosDia.definition = {
    methods: ["get","head"],
    url: '/cajas/movimientos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CajaController::movimientosDia
 * @see app/Http/Controllers/CajaController.php:250
 * @route '/cajas/movimientos'
 */
movimientosDia.url = (options?: RouteQueryOptions) => {
    return movimientosDia.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::movimientosDia
 * @see app/Http/Controllers/CajaController.php:250
 * @route '/cajas/movimientos'
 */
movimientosDia.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: movimientosDia.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CajaController::movimientosDia
 * @see app/Http/Controllers/CajaController.php:250
 * @route '/cajas/movimientos'
 */
movimientosDia.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: movimientosDia.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CajaController::movimientosDia
 * @see app/Http/Controllers/CajaController.php:250
 * @route '/cajas/movimientos'
 */
    const movimientosDiaForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: movimientosDia.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CajaController::movimientosDia
 * @see app/Http/Controllers/CajaController.php:250
 * @route '/cajas/movimientos'
 */
        movimientosDiaForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: movimientosDia.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CajaController::movimientosDia
 * @see app/Http/Controllers/CajaController.php:250
 * @route '/cajas/movimientos'
 */
        movimientosDiaForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: movimientosDia.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    movimientosDia.form = movimientosDiaForm
const CajaController = { index, abrirCaja, cerrarCaja, estadoCajas, movimientosDia }

export default CajaController