import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:31
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
 * @see app/Http/Controllers/CajaController.php:31
 * @route '/cajas'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:31
 * @route '/cajas'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:31
 * @route '/cajas'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:31
 * @route '/cajas'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:31
 * @route '/cajas'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:31
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
 * @see app/Http/Controllers/CajaController.php:66
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
 * @see app/Http/Controllers/CajaController.php:66
 * @route '/cajas/abrir'
 */
abrirCaja.url = (options?: RouteQueryOptions) => {
    return abrirCaja.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::abrirCaja
 * @see app/Http/Controllers/CajaController.php:66
 * @route '/cajas/abrir'
 */
abrirCaja.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: abrirCaja.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\CajaController::abrirCaja
 * @see app/Http/Controllers/CajaController.php:66
 * @route '/cajas/abrir'
 */
    const abrirCajaForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: abrirCaja.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CajaController::abrirCaja
 * @see app/Http/Controllers/CajaController.php:66
 * @route '/cajas/abrir'
 */
        abrirCajaForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: abrirCaja.url(options),
            method: 'post',
        })
    
    abrirCaja.form = abrirCajaForm
/**
* @see \App\Http\Controllers\CajaController::cerrarCaja
 * @see app/Http/Controllers/CajaController.php:147
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
 * @see app/Http/Controllers/CajaController.php:147
 * @route '/cajas/cerrar'
 */
cerrarCaja.url = (options?: RouteQueryOptions) => {
    return cerrarCaja.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::cerrarCaja
 * @see app/Http/Controllers/CajaController.php:147
 * @route '/cajas/cerrar'
 */
cerrarCaja.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cerrarCaja.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\CajaController::cerrarCaja
 * @see app/Http/Controllers/CajaController.php:147
 * @route '/cajas/cerrar'
 */
    const cerrarCajaForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cerrarCaja.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CajaController::cerrarCaja
 * @see app/Http/Controllers/CajaController.php:147
 * @route '/cajas/cerrar'
 */
        cerrarCajaForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cerrarCaja.url(options),
            method: 'post',
        })
    
    cerrarCaja.form = cerrarCajaForm
/**
* @see \App\Http\Controllers\CajaController::estadoCajas
 * @see app/Http/Controllers/CajaController.php:243
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
 * @see app/Http/Controllers/CajaController.php:243
 * @route '/cajas/estado'
 */
estadoCajas.url = (options?: RouteQueryOptions) => {
    return estadoCajas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::estadoCajas
 * @see app/Http/Controllers/CajaController.php:243
 * @route '/cajas/estado'
 */
estadoCajas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estadoCajas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CajaController::estadoCajas
 * @see app/Http/Controllers/CajaController.php:243
 * @route '/cajas/estado'
 */
estadoCajas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: estadoCajas.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CajaController::estadoCajas
 * @see app/Http/Controllers/CajaController.php:243
 * @route '/cajas/estado'
 */
    const estadoCajasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: estadoCajas.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CajaController::estadoCajas
 * @see app/Http/Controllers/CajaController.php:243
 * @route '/cajas/estado'
 */
        estadoCajasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: estadoCajas.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CajaController::estadoCajas
 * @see app/Http/Controllers/CajaController.php:243
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
 * @see app/Http/Controllers/CajaController.php:272
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
 * @see app/Http/Controllers/CajaController.php:272
 * @route '/cajas/movimientos'
 */
movimientosDia.url = (options?: RouteQueryOptions) => {
    return movimientosDia.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::movimientosDia
 * @see app/Http/Controllers/CajaController.php:272
 * @route '/cajas/movimientos'
 */
movimientosDia.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: movimientosDia.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CajaController::movimientosDia
 * @see app/Http/Controllers/CajaController.php:272
 * @route '/cajas/movimientos'
 */
movimientosDia.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: movimientosDia.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CajaController::movimientosDia
 * @see app/Http/Controllers/CajaController.php:272
 * @route '/cajas/movimientos'
 */
    const movimientosDiaForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: movimientosDia.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CajaController::movimientosDia
 * @see app/Http/Controllers/CajaController.php:272
 * @route '/cajas/movimientos'
 */
        movimientosDiaForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: movimientosDia.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CajaController::movimientosDia
 * @see app/Http/Controllers/CajaController.php:272
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
/**
* @see \App\Http\Controllers\CajaController::dashboard
 * @see app/Http/Controllers/CajaController.php:323
 * @route '/cajas/admin/dashboard'
 */
export const dashboard = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

dashboard.definition = {
    methods: ["get","head"],
    url: '/cajas/admin/dashboard',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CajaController::dashboard
 * @see app/Http/Controllers/CajaController.php:323
 * @route '/cajas/admin/dashboard'
 */
dashboard.url = (options?: RouteQueryOptions) => {
    return dashboard.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::dashboard
 * @see app/Http/Controllers/CajaController.php:323
 * @route '/cajas/admin/dashboard'
 */
dashboard.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CajaController::dashboard
 * @see app/Http/Controllers/CajaController.php:323
 * @route '/cajas/admin/dashboard'
 */
dashboard.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboard.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CajaController::dashboard
 * @see app/Http/Controllers/CajaController.php:323
 * @route '/cajas/admin/dashboard'
 */
    const dashboardForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: dashboard.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CajaController::dashboard
 * @see app/Http/Controllers/CajaController.php:323
 * @route '/cajas/admin/dashboard'
 */
        dashboardForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboard.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CajaController::dashboard
 * @see app/Http/Controllers/CajaController.php:323
 * @route '/cajas/admin/dashboard'
 */
        dashboardForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboard.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    dashboard.form = dashboardForm
/**
* @see \App\Http\Controllers\CajaController::reportes
 * @see app/Http/Controllers/CajaController.php:380
 * @route '/cajas/reportes'
 */
export const reportes = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportes.url(options),
    method: 'get',
})

reportes.definition = {
    methods: ["get","head"],
    url: '/cajas/reportes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CajaController::reportes
 * @see app/Http/Controllers/CajaController.php:380
 * @route '/cajas/reportes'
 */
reportes.url = (options?: RouteQueryOptions) => {
    return reportes.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::reportes
 * @see app/Http/Controllers/CajaController.php:380
 * @route '/cajas/reportes'
 */
reportes.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportes.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CajaController::reportes
 * @see app/Http/Controllers/CajaController.php:380
 * @route '/cajas/reportes'
 */
reportes.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reportes.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CajaController::reportes
 * @see app/Http/Controllers/CajaController.php:380
 * @route '/cajas/reportes'
 */
    const reportesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: reportes.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CajaController::reportes
 * @see app/Http/Controllers/CajaController.php:380
 * @route '/cajas/reportes'
 */
        reportesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reportes.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CajaController::reportes
 * @see app/Http/Controllers/CajaController.php:380
 * @route '/cajas/reportes'
 */
        reportesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reportes.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    reportes.form = reportesForm
/**
* @see \App\Http\Controllers\CajaController::detalle
 * @see app/Http/Controllers/CajaController.php:355
 * @route '/cajas/{id}'
 */
export const detalle = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: detalle.url(args, options),
    method: 'get',
})

detalle.definition = {
    methods: ["get","head"],
    url: '/cajas/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CajaController::detalle
 * @see app/Http/Controllers/CajaController.php:355
 * @route '/cajas/{id}'
 */
detalle.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return detalle.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::detalle
 * @see app/Http/Controllers/CajaController.php:355
 * @route '/cajas/{id}'
 */
detalle.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: detalle.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CajaController::detalle
 * @see app/Http/Controllers/CajaController.php:355
 * @route '/cajas/{id}'
 */
detalle.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: detalle.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CajaController::detalle
 * @see app/Http/Controllers/CajaController.php:355
 * @route '/cajas/{id}'
 */
    const detalleForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: detalle.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CajaController::detalle
 * @see app/Http/Controllers/CajaController.php:355
 * @route '/cajas/{id}'
 */
        detalleForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: detalle.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CajaController::detalle
 * @see app/Http/Controllers/CajaController.php:355
 * @route '/cajas/{id}'
 */
        detalleForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: detalle.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    detalle.form = detalleForm
const CajaController = { index, abrirCaja, cerrarCaja, estadoCajas, movimientosDia, dashboard, reportes, detalle }

export default CajaController