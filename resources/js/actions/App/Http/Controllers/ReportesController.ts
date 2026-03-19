import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ReportesController::reporteStock
 * @see app/Http/Controllers/ReportesController.php:38
 * @route '/api/reportes/stock'
 */
export const reporteStock = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporteStock.url(options),
    method: 'get',
})

reporteStock.definition = {
    methods: ["get","head"],
    url: '/api/reportes/stock',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportesController::reporteStock
 * @see app/Http/Controllers/ReportesController.php:38
 * @route '/api/reportes/stock'
 */
reporteStock.url = (options?: RouteQueryOptions) => {
    return reporteStock.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportesController::reporteStock
 * @see app/Http/Controllers/ReportesController.php:38
 * @route '/api/reportes/stock'
 */
reporteStock.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporteStock.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportesController::reporteStock
 * @see app/Http/Controllers/ReportesController.php:38
 * @route '/api/reportes/stock'
 */
reporteStock.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reporteStock.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReportesController::reporteStock
 * @see app/Http/Controllers/ReportesController.php:38
 * @route '/api/reportes/stock'
 */
    const reporteStockForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: reporteStock.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReportesController::reporteStock
 * @see app/Http/Controllers/ReportesController.php:38
 * @route '/api/reportes/stock'
 */
        reporteStockForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reporteStock.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReportesController::reporteStock
 * @see app/Http/Controllers/ReportesController.php:38
 * @route '/api/reportes/stock'
 */
        reporteStockForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reporteStock.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    reporteStock.form = reporteStockForm
/**
* @see \App\Http\Controllers\ReportesController::reporteStockBajo
 * @see app/Http/Controllers/ReportesController.php:80
 * @route '/api/reportes/stock/bajo'
 */
export const reporteStockBajo = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporteStockBajo.url(options),
    method: 'get',
})

reporteStockBajo.definition = {
    methods: ["get","head"],
    url: '/api/reportes/stock/bajo',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportesController::reporteStockBajo
 * @see app/Http/Controllers/ReportesController.php:80
 * @route '/api/reportes/stock/bajo'
 */
reporteStockBajo.url = (options?: RouteQueryOptions) => {
    return reporteStockBajo.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportesController::reporteStockBajo
 * @see app/Http/Controllers/ReportesController.php:80
 * @route '/api/reportes/stock/bajo'
 */
reporteStockBajo.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporteStockBajo.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportesController::reporteStockBajo
 * @see app/Http/Controllers/ReportesController.php:80
 * @route '/api/reportes/stock/bajo'
 */
reporteStockBajo.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reporteStockBajo.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReportesController::reporteStockBajo
 * @see app/Http/Controllers/ReportesController.php:80
 * @route '/api/reportes/stock/bajo'
 */
    const reporteStockBajoForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: reporteStockBajo.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReportesController::reporteStockBajo
 * @see app/Http/Controllers/ReportesController.php:80
 * @route '/api/reportes/stock/bajo'
 */
        reporteStockBajoForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reporteStockBajo.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReportesController::reporteStockBajo
 * @see app/Http/Controllers/ReportesController.php:80
 * @route '/api/reportes/stock/bajo'
 */
        reporteStockBajoForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reporteStockBajo.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    reporteStockBajo.form = reporteStockBajoForm
/**
* @see \App\Http\Controllers\ReportesController::reportePrestamosCliente
 * @see app/Http/Controllers/ReportesController.php:120
 * @route '/api/reportes/prestamos/cliente'
 */
export const reportePrestamosCliente = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportePrestamosCliente.url(options),
    method: 'get',
})

reportePrestamosCliente.definition = {
    methods: ["get","head"],
    url: '/api/reportes/prestamos/cliente',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportesController::reportePrestamosCliente
 * @see app/Http/Controllers/ReportesController.php:120
 * @route '/api/reportes/prestamos/cliente'
 */
reportePrestamosCliente.url = (options?: RouteQueryOptions) => {
    return reportePrestamosCliente.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportesController::reportePrestamosCliente
 * @see app/Http/Controllers/ReportesController.php:120
 * @route '/api/reportes/prestamos/cliente'
 */
reportePrestamosCliente.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportePrestamosCliente.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportesController::reportePrestamosCliente
 * @see app/Http/Controllers/ReportesController.php:120
 * @route '/api/reportes/prestamos/cliente'
 */
reportePrestamosCliente.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reportePrestamosCliente.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReportesController::reportePrestamosCliente
 * @see app/Http/Controllers/ReportesController.php:120
 * @route '/api/reportes/prestamos/cliente'
 */
    const reportePrestamosClienteForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: reportePrestamosCliente.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReportesController::reportePrestamosCliente
 * @see app/Http/Controllers/ReportesController.php:120
 * @route '/api/reportes/prestamos/cliente'
 */
        reportePrestamosClienteForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reportePrestamosCliente.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReportesController::reportePrestamosCliente
 * @see app/Http/Controllers/ReportesController.php:120
 * @route '/api/reportes/prestamos/cliente'
 */
        reportePrestamosClienteForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reportePrestamosCliente.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    reportePrestamosCliente.form = reportePrestamosClienteForm
/**
* @see \App\Http\Controllers\ReportesController::reporteDevolucionesPendientes
 * @see app/Http/Controllers/ReportesController.php:162
 * @route '/api/reportes/devoluciones/pendientes'
 */
export const reporteDevolucionesPendientes = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporteDevolucionesPendientes.url(options),
    method: 'get',
})

reporteDevolucionesPendientes.definition = {
    methods: ["get","head"],
    url: '/api/reportes/devoluciones/pendientes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportesController::reporteDevolucionesPendientes
 * @see app/Http/Controllers/ReportesController.php:162
 * @route '/api/reportes/devoluciones/pendientes'
 */
reporteDevolucionesPendientes.url = (options?: RouteQueryOptions) => {
    return reporteDevolucionesPendientes.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportesController::reporteDevolucionesPendientes
 * @see app/Http/Controllers/ReportesController.php:162
 * @route '/api/reportes/devoluciones/pendientes'
 */
reporteDevolucionesPendientes.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporteDevolucionesPendientes.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportesController::reporteDevolucionesPendientes
 * @see app/Http/Controllers/ReportesController.php:162
 * @route '/api/reportes/devoluciones/pendientes'
 */
reporteDevolucionesPendientes.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reporteDevolucionesPendientes.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReportesController::reporteDevolucionesPendientes
 * @see app/Http/Controllers/ReportesController.php:162
 * @route '/api/reportes/devoluciones/pendientes'
 */
    const reporteDevolucionesPendientesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: reporteDevolucionesPendientes.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReportesController::reporteDevolucionesPendientes
 * @see app/Http/Controllers/ReportesController.php:162
 * @route '/api/reportes/devoluciones/pendientes'
 */
        reporteDevolucionesPendientesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reporteDevolucionesPendientes.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReportesController::reporteDevolucionesPendientes
 * @see app/Http/Controllers/ReportesController.php:162
 * @route '/api/reportes/devoluciones/pendientes'
 */
        reporteDevolucionesPendientesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reporteDevolucionesPendientes.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    reporteDevolucionesPendientes.form = reporteDevolucionesPendientesForm
/**
* @see \App\Http\Controllers\ReportesController::reporteDeudas
 * @see app/Http/Controllers/ReportesController.php:209
 * @route '/api/reportes/proveedor/deudas'
 */
export const reporteDeudas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporteDeudas.url(options),
    method: 'get',
})

reporteDeudas.definition = {
    methods: ["get","head"],
    url: '/api/reportes/proveedor/deudas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportesController::reporteDeudas
 * @see app/Http/Controllers/ReportesController.php:209
 * @route '/api/reportes/proveedor/deudas'
 */
reporteDeudas.url = (options?: RouteQueryOptions) => {
    return reporteDeudas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportesController::reporteDeudas
 * @see app/Http/Controllers/ReportesController.php:209
 * @route '/api/reportes/proveedor/deudas'
 */
reporteDeudas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporteDeudas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportesController::reporteDeudas
 * @see app/Http/Controllers/ReportesController.php:209
 * @route '/api/reportes/proveedor/deudas'
 */
reporteDeudas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reporteDeudas.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReportesController::reporteDeudas
 * @see app/Http/Controllers/ReportesController.php:209
 * @route '/api/reportes/proveedor/deudas'
 */
    const reporteDeudasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: reporteDeudas.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReportesController::reporteDeudas
 * @see app/Http/Controllers/ReportesController.php:209
 * @route '/api/reportes/proveedor/deudas'
 */
        reporteDeudasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reporteDeudas.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReportesController::reporteDeudas
 * @see app/Http/Controllers/ReportesController.php:209
 * @route '/api/reportes/proveedor/deudas'
 */
        reporteDeudasForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reporteDeudas.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    reporteDeudas.form = reporteDeudasForm
/**
* @see \App\Http\Controllers\ReportesController::reporteResumen
 * @see app/Http/Controllers/ReportesController.php:253
 * @route '/api/reportes/resumen-prestamos'
 */
export const reporteResumen = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporteResumen.url(options),
    method: 'get',
})

reporteResumen.definition = {
    methods: ["get","head"],
    url: '/api/reportes/resumen-prestamos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportesController::reporteResumen
 * @see app/Http/Controllers/ReportesController.php:253
 * @route '/api/reportes/resumen-prestamos'
 */
reporteResumen.url = (options?: RouteQueryOptions) => {
    return reporteResumen.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportesController::reporteResumen
 * @see app/Http/Controllers/ReportesController.php:253
 * @route '/api/reportes/resumen-prestamos'
 */
reporteResumen.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporteResumen.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportesController::reporteResumen
 * @see app/Http/Controllers/ReportesController.php:253
 * @route '/api/reportes/resumen-prestamos'
 */
reporteResumen.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reporteResumen.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReportesController::reporteResumen
 * @see app/Http/Controllers/ReportesController.php:253
 * @route '/api/reportes/resumen-prestamos'
 */
    const reporteResumenForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: reporteResumen.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReportesController::reporteResumen
 * @see app/Http/Controllers/ReportesController.php:253
 * @route '/api/reportes/resumen-prestamos'
 */
        reporteResumenForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reporteResumen.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReportesController::reporteResumen
 * @see app/Http/Controllers/ReportesController.php:253
 * @route '/api/reportes/resumen-prestamos'
 */
        reporteResumenForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reporteResumen.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    reporteResumen.form = reporteResumenForm
const ReportesController = { reporteStock, reporteStockBajo, reportePrestamosCliente, reporteDevolucionesPendientes, reporteDeudas, reporteResumen }

export default ReportesController