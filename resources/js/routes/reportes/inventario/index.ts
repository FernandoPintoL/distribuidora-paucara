import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ReporteInventarioController::stockActual
 * @see app/Http/Controllers/ReporteInventarioController.php:19
 * @route '/reportes/inventario/stock-actual'
 */
export const stockActual = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stockActual.url(options),
    method: 'get',
})

stockActual.definition = {
    methods: ["get","head"],
    url: '/reportes/inventario/stock-actual',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteInventarioController::stockActual
 * @see app/Http/Controllers/ReporteInventarioController.php:19
 * @route '/reportes/inventario/stock-actual'
 */
stockActual.url = (options?: RouteQueryOptions) => {
    return stockActual.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteInventarioController::stockActual
 * @see app/Http/Controllers/ReporteInventarioController.php:19
 * @route '/reportes/inventario/stock-actual'
 */
stockActual.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stockActual.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteInventarioController::stockActual
 * @see app/Http/Controllers/ReporteInventarioController.php:19
 * @route '/reportes/inventario/stock-actual'
 */
stockActual.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: stockActual.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReporteInventarioController::stockActual
 * @see app/Http/Controllers/ReporteInventarioController.php:19
 * @route '/reportes/inventario/stock-actual'
 */
    const stockActualForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: stockActual.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReporteInventarioController::stockActual
 * @see app/Http/Controllers/ReporteInventarioController.php:19
 * @route '/reportes/inventario/stock-actual'
 */
        stockActualForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stockActual.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReporteInventarioController::stockActual
 * @see app/Http/Controllers/ReporteInventarioController.php:19
 * @route '/reportes/inventario/stock-actual'
 */
        stockActualForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stockActual.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    stockActual.form = stockActualForm
/**
* @see \App\Http\Controllers\ReporteInventarioController::vencimientos
 * @see app/Http/Controllers/ReporteInventarioController.php:79
 * @route '/reportes/inventario/vencimientos'
 */
export const vencimientos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: vencimientos.url(options),
    method: 'get',
})

vencimientos.definition = {
    methods: ["get","head"],
    url: '/reportes/inventario/vencimientos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteInventarioController::vencimientos
 * @see app/Http/Controllers/ReporteInventarioController.php:79
 * @route '/reportes/inventario/vencimientos'
 */
vencimientos.url = (options?: RouteQueryOptions) => {
    return vencimientos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteInventarioController::vencimientos
 * @see app/Http/Controllers/ReporteInventarioController.php:79
 * @route '/reportes/inventario/vencimientos'
 */
vencimientos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: vencimientos.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteInventarioController::vencimientos
 * @see app/Http/Controllers/ReporteInventarioController.php:79
 * @route '/reportes/inventario/vencimientos'
 */
vencimientos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: vencimientos.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReporteInventarioController::vencimientos
 * @see app/Http/Controllers/ReporteInventarioController.php:79
 * @route '/reportes/inventario/vencimientos'
 */
    const vencimientosForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: vencimientos.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReporteInventarioController::vencimientos
 * @see app/Http/Controllers/ReporteInventarioController.php:79
 * @route '/reportes/inventario/vencimientos'
 */
        vencimientosForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: vencimientos.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReporteInventarioController::vencimientos
 * @see app/Http/Controllers/ReporteInventarioController.php:79
 * @route '/reportes/inventario/vencimientos'
 */
        vencimientosForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: vencimientos.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    vencimientos.form = vencimientosForm
/**
* @see \App\Http\Controllers\ReporteInventarioController::rotacion
 * @see app/Http/Controllers/ReporteInventarioController.php:132
 * @route '/reportes/inventario/rotacion'
 */
export const rotacion = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: rotacion.url(options),
    method: 'get',
})

rotacion.definition = {
    methods: ["get","head"],
    url: '/reportes/inventario/rotacion',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteInventarioController::rotacion
 * @see app/Http/Controllers/ReporteInventarioController.php:132
 * @route '/reportes/inventario/rotacion'
 */
rotacion.url = (options?: RouteQueryOptions) => {
    return rotacion.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteInventarioController::rotacion
 * @see app/Http/Controllers/ReporteInventarioController.php:132
 * @route '/reportes/inventario/rotacion'
 */
rotacion.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: rotacion.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteInventarioController::rotacion
 * @see app/Http/Controllers/ReporteInventarioController.php:132
 * @route '/reportes/inventario/rotacion'
 */
rotacion.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: rotacion.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReporteInventarioController::rotacion
 * @see app/Http/Controllers/ReporteInventarioController.php:132
 * @route '/reportes/inventario/rotacion'
 */
    const rotacionForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: rotacion.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReporteInventarioController::rotacion
 * @see app/Http/Controllers/ReporteInventarioController.php:132
 * @route '/reportes/inventario/rotacion'
 */
        rotacionForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: rotacion.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReporteInventarioController::rotacion
 * @see app/Http/Controllers/ReporteInventarioController.php:132
 * @route '/reportes/inventario/rotacion'
 */
        rotacionForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: rotacion.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    rotacion.form = rotacionForm
/**
* @see \App\Http\Controllers\ReporteInventarioController::movimientos
 * @see app/Http/Controllers/ReporteInventarioController.php:198
 * @route '/reportes/inventario/movimientos'
 */
export const movimientos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: movimientos.url(options),
    method: 'get',
})

movimientos.definition = {
    methods: ["get","head"],
    url: '/reportes/inventario/movimientos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteInventarioController::movimientos
 * @see app/Http/Controllers/ReporteInventarioController.php:198
 * @route '/reportes/inventario/movimientos'
 */
movimientos.url = (options?: RouteQueryOptions) => {
    return movimientos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteInventarioController::movimientos
 * @see app/Http/Controllers/ReporteInventarioController.php:198
 * @route '/reportes/inventario/movimientos'
 */
movimientos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: movimientos.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteInventarioController::movimientos
 * @see app/Http/Controllers/ReporteInventarioController.php:198
 * @route '/reportes/inventario/movimientos'
 */
movimientos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: movimientos.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReporteInventarioController::movimientos
 * @see app/Http/Controllers/ReporteInventarioController.php:198
 * @route '/reportes/inventario/movimientos'
 */
    const movimientosForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: movimientos.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReporteInventarioController::movimientos
 * @see app/Http/Controllers/ReporteInventarioController.php:198
 * @route '/reportes/inventario/movimientos'
 */
        movimientosForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: movimientos.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReporteInventarioController::movimientos
 * @see app/Http/Controllers/ReporteInventarioController.php:198
 * @route '/reportes/inventario/movimientos'
 */
        movimientosForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: movimientos.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    movimientos.form = movimientosForm
/**
* @see \App\Http\Controllers\ReporteInventarioController::exportMethod
 * @see app/Http/Controllers/ReporteInventarioController.php:260
 * @route '/reportes/inventario/export'
 */
export const exportMethod = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

exportMethod.definition = {
    methods: ["get","head"],
    url: '/reportes/inventario/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteInventarioController::exportMethod
 * @see app/Http/Controllers/ReporteInventarioController.php:260
 * @route '/reportes/inventario/export'
 */
exportMethod.url = (options?: RouteQueryOptions) => {
    return exportMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteInventarioController::exportMethod
 * @see app/Http/Controllers/ReporteInventarioController.php:260
 * @route '/reportes/inventario/export'
 */
exportMethod.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteInventarioController::exportMethod
 * @see app/Http/Controllers/ReporteInventarioController.php:260
 * @route '/reportes/inventario/export'
 */
exportMethod.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReporteInventarioController::exportMethod
 * @see app/Http/Controllers/ReporteInventarioController.php:260
 * @route '/reportes/inventario/export'
 */
    const exportMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportMethod.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReporteInventarioController::exportMethod
 * @see app/Http/Controllers/ReporteInventarioController.php:260
 * @route '/reportes/inventario/export'
 */
        exportMethodForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportMethod.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReporteInventarioController::exportMethod
 * @see app/Http/Controllers/ReporteInventarioController.php:260
 * @route '/reportes/inventario/export'
 */
        exportMethodForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportMethod.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    exportMethod.form = exportMethodForm
const inventario = {
    stockActual,
vencimientos,
rotacion,
movimientos,
export: exportMethod,
}

export default inventario