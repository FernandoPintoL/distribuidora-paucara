import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ReporteVentasController::productosVendidos
 * @see app/Http/Controllers/ReporteVentasController.php:21
 * @route '/ventas/reporte-productos-vendidos'
 */
export const productosVendidos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosVendidos.url(options),
    method: 'get',
})

productosVendidos.definition = {
    methods: ["get","head"],
    url: '/ventas/reporte-productos-vendidos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteVentasController::productosVendidos
 * @see app/Http/Controllers/ReporteVentasController.php:21
 * @route '/ventas/reporte-productos-vendidos'
 */
productosVendidos.url = (options?: RouteQueryOptions) => {
    return productosVendidos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteVentasController::productosVendidos
 * @see app/Http/Controllers/ReporteVentasController.php:21
 * @route '/ventas/reporte-productos-vendidos'
 */
productosVendidos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosVendidos.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteVentasController::productosVendidos
 * @see app/Http/Controllers/ReporteVentasController.php:21
 * @route '/ventas/reporte-productos-vendidos'
 */
productosVendidos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: productosVendidos.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReporteVentasController::productosVendidos
 * @see app/Http/Controllers/ReporteVentasController.php:21
 * @route '/ventas/reporte-productos-vendidos'
 */
    const productosVendidosForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: productosVendidos.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReporteVentasController::productosVendidos
 * @see app/Http/Controllers/ReporteVentasController.php:21
 * @route '/ventas/reporte-productos-vendidos'
 */
        productosVendidosForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: productosVendidos.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReporteVentasController::productosVendidos
 * @see app/Http/Controllers/ReporteVentasController.php:21
 * @route '/ventas/reporte-productos-vendidos'
 */
        productosVendidosForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: productosVendidos.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    productosVendidos.form = productosVendidosForm
/**
* @see \App\Http\Controllers\ReporteVentasController::imprimirReporte
 * @see app/Http/Controllers/ReporteVentasController.php:638
 * @route '/ventas/reporte-productos-vendidos/imprimir'
 */
export const imprimirReporte = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimirReporte.url(options),
    method: 'get',
})

imprimirReporte.definition = {
    methods: ["get","head"],
    url: '/ventas/reporte-productos-vendidos/imprimir',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteVentasController::imprimirReporte
 * @see app/Http/Controllers/ReporteVentasController.php:638
 * @route '/ventas/reporte-productos-vendidos/imprimir'
 */
imprimirReporte.url = (options?: RouteQueryOptions) => {
    return imprimirReporte.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteVentasController::imprimirReporte
 * @see app/Http/Controllers/ReporteVentasController.php:638
 * @route '/ventas/reporte-productos-vendidos/imprimir'
 */
imprimirReporte.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimirReporte.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteVentasController::imprimirReporte
 * @see app/Http/Controllers/ReporteVentasController.php:638
 * @route '/ventas/reporte-productos-vendidos/imprimir'
 */
imprimirReporte.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imprimirReporte.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReporteVentasController::imprimirReporte
 * @see app/Http/Controllers/ReporteVentasController.php:638
 * @route '/ventas/reporte-productos-vendidos/imprimir'
 */
    const imprimirReporteForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: imprimirReporte.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReporteVentasController::imprimirReporte
 * @see app/Http/Controllers/ReporteVentasController.php:638
 * @route '/ventas/reporte-productos-vendidos/imprimir'
 */
        imprimirReporteForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimirReporte.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReporteVentasController::imprimirReporte
 * @see app/Http/Controllers/ReporteVentasController.php:638
 * @route '/ventas/reporte-productos-vendidos/imprimir'
 */
        imprimirReporteForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimirReporte.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    imprimirReporte.form = imprimirReporteForm
/**
* @see \App\Http\Controllers\ReporteVentasController::porPeriodo
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-periodo'
 */
export const porPeriodo = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: porPeriodo.url(options),
    method: 'get',
})

porPeriodo.definition = {
    methods: ["get","head"],
    url: '/reportes/ventas/por-periodo',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteVentasController::porPeriodo
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-periodo'
 */
porPeriodo.url = (options?: RouteQueryOptions) => {
    return porPeriodo.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteVentasController::porPeriodo
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-periodo'
 */
porPeriodo.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: porPeriodo.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteVentasController::porPeriodo
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-periodo'
 */
porPeriodo.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: porPeriodo.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReporteVentasController::porPeriodo
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-periodo'
 */
    const porPeriodoForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: porPeriodo.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReporteVentasController::porPeriodo
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-periodo'
 */
        porPeriodoForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: porPeriodo.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReporteVentasController::porPeriodo
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-periodo'
 */
        porPeriodoForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: porPeriodo.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    porPeriodo.form = porPeriodoForm
/**
* @see \App\Http\Controllers\ReporteVentasController::porClienteProducto
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-cliente-producto'
 */
export const porClienteProducto = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: porClienteProducto.url(options),
    method: 'get',
})

porClienteProducto.definition = {
    methods: ["get","head"],
    url: '/reportes/ventas/por-cliente-producto',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteVentasController::porClienteProducto
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-cliente-producto'
 */
porClienteProducto.url = (options?: RouteQueryOptions) => {
    return porClienteProducto.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteVentasController::porClienteProducto
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-cliente-producto'
 */
porClienteProducto.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: porClienteProducto.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteVentasController::porClienteProducto
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-cliente-producto'
 */
porClienteProducto.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: porClienteProducto.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReporteVentasController::porClienteProducto
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-cliente-producto'
 */
    const porClienteProductoForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: porClienteProducto.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReporteVentasController::porClienteProducto
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-cliente-producto'
 */
        porClienteProductoForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: porClienteProducto.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReporteVentasController::porClienteProducto
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-cliente-producto'
 */
        porClienteProductoForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: porClienteProducto.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    porClienteProducto.form = porClienteProductoForm
/**
* @see \App\Http\Controllers\ReporteVentasController::porVendedorEstadoPago
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-vendedor-estado-pago'
 */
export const porVendedorEstadoPago = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: porVendedorEstadoPago.url(options),
    method: 'get',
})

porVendedorEstadoPago.definition = {
    methods: ["get","head"],
    url: '/reportes/ventas/por-vendedor-estado-pago',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteVentasController::porVendedorEstadoPago
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-vendedor-estado-pago'
 */
porVendedorEstadoPago.url = (options?: RouteQueryOptions) => {
    return porVendedorEstadoPago.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteVentasController::porVendedorEstadoPago
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-vendedor-estado-pago'
 */
porVendedorEstadoPago.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: porVendedorEstadoPago.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteVentasController::porVendedorEstadoPago
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-vendedor-estado-pago'
 */
porVendedorEstadoPago.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: porVendedorEstadoPago.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReporteVentasController::porVendedorEstadoPago
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-vendedor-estado-pago'
 */
    const porVendedorEstadoPagoForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: porVendedorEstadoPago.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReporteVentasController::porVendedorEstadoPago
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-vendedor-estado-pago'
 */
        porVendedorEstadoPagoForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: porVendedorEstadoPago.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReporteVentasController::porVendedorEstadoPago
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/por-vendedor-estado-pago'
 */
        porVendedorEstadoPagoForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: porVendedorEstadoPago.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    porVendedorEstadoPago.form = porVendedorEstadoPagoForm
/**
* @see \App\Http\Controllers\ReporteVentasController::rankingClientes
 * @see app/Http/Controllers/ReporteVentasController.php:223
 * @route '/reportes/ventas/ranking-clientes'
 */
export const rankingClientes = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: rankingClientes.url(options),
    method: 'get',
})

rankingClientes.definition = {
    methods: ["get","head"],
    url: '/reportes/ventas/ranking-clientes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteVentasController::rankingClientes
 * @see app/Http/Controllers/ReporteVentasController.php:223
 * @route '/reportes/ventas/ranking-clientes'
 */
rankingClientes.url = (options?: RouteQueryOptions) => {
    return rankingClientes.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteVentasController::rankingClientes
 * @see app/Http/Controllers/ReporteVentasController.php:223
 * @route '/reportes/ventas/ranking-clientes'
 */
rankingClientes.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: rankingClientes.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteVentasController::rankingClientes
 * @see app/Http/Controllers/ReporteVentasController.php:223
 * @route '/reportes/ventas/ranking-clientes'
 */
rankingClientes.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: rankingClientes.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReporteVentasController::rankingClientes
 * @see app/Http/Controllers/ReporteVentasController.php:223
 * @route '/reportes/ventas/ranking-clientes'
 */
    const rankingClientesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: rankingClientes.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReporteVentasController::rankingClientes
 * @see app/Http/Controllers/ReporteVentasController.php:223
 * @route '/reportes/ventas/ranking-clientes'
 */
        rankingClientesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: rankingClientes.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReporteVentasController::rankingClientes
 * @see app/Http/Controllers/ReporteVentasController.php:223
 * @route '/reportes/ventas/ranking-clientes'
 */
        rankingClientesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: rankingClientes.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    rankingClientes.form = rankingClientesForm
/**
* @see \App\Http\Controllers\ReporteVentasController::entregasPorChofer
 * @see app/Http/Controllers/ReporteVentasController.php:401
 * @route '/reportes/ventas/entregas-por-chofer'
 */
export const entregasPorChofer = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: entregasPorChofer.url(options),
    method: 'get',
})

entregasPorChofer.definition = {
    methods: ["get","head"],
    url: '/reportes/ventas/entregas-por-chofer',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteVentasController::entregasPorChofer
 * @see app/Http/Controllers/ReporteVentasController.php:401
 * @route '/reportes/ventas/entregas-por-chofer'
 */
entregasPorChofer.url = (options?: RouteQueryOptions) => {
    return entregasPorChofer.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteVentasController::entregasPorChofer
 * @see app/Http/Controllers/ReporteVentasController.php:401
 * @route '/reportes/ventas/entregas-por-chofer'
 */
entregasPorChofer.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: entregasPorChofer.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteVentasController::entregasPorChofer
 * @see app/Http/Controllers/ReporteVentasController.php:401
 * @route '/reportes/ventas/entregas-por-chofer'
 */
entregasPorChofer.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: entregasPorChofer.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReporteVentasController::entregasPorChofer
 * @see app/Http/Controllers/ReporteVentasController.php:401
 * @route '/reportes/ventas/entregas-por-chofer'
 */
    const entregasPorChoferForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: entregasPorChofer.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReporteVentasController::entregasPorChofer
 * @see app/Http/Controllers/ReporteVentasController.php:401
 * @route '/reportes/ventas/entregas-por-chofer'
 */
        entregasPorChoferForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: entregasPorChofer.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReporteVentasController::entregasPorChofer
 * @see app/Http/Controllers/ReporteVentasController.php:401
 * @route '/reportes/ventas/entregas-por-chofer'
 */
        entregasPorChoferForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: entregasPorChofer.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    entregasPorChofer.form = entregasPorChoferForm
/**
* @see \App\Http\Controllers\ReporteVentasController::entregarsPorCliente
 * @see app/Http/Controllers/ReporteVentasController.php:501
 * @route '/reportes/ventas/entregas-por-cliente'
 */
export const entregarsPorCliente = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: entregarsPorCliente.url(options),
    method: 'get',
})

entregarsPorCliente.definition = {
    methods: ["get","head"],
    url: '/reportes/ventas/entregas-por-cliente',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteVentasController::entregarsPorCliente
 * @see app/Http/Controllers/ReporteVentasController.php:501
 * @route '/reportes/ventas/entregas-por-cliente'
 */
entregarsPorCliente.url = (options?: RouteQueryOptions) => {
    return entregarsPorCliente.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteVentasController::entregarsPorCliente
 * @see app/Http/Controllers/ReporteVentasController.php:501
 * @route '/reportes/ventas/entregas-por-cliente'
 */
entregarsPorCliente.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: entregarsPorCliente.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteVentasController::entregarsPorCliente
 * @see app/Http/Controllers/ReporteVentasController.php:501
 * @route '/reportes/ventas/entregas-por-cliente'
 */
entregarsPorCliente.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: entregarsPorCliente.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReporteVentasController::entregarsPorCliente
 * @see app/Http/Controllers/ReporteVentasController.php:501
 * @route '/reportes/ventas/entregas-por-cliente'
 */
    const entregarsPorClienteForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: entregarsPorCliente.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReporteVentasController::entregarsPorCliente
 * @see app/Http/Controllers/ReporteVentasController.php:501
 * @route '/reportes/ventas/entregas-por-cliente'
 */
        entregarsPorClienteForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: entregarsPorCliente.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReporteVentasController::entregarsPorCliente
 * @see app/Http/Controllers/ReporteVentasController.php:501
 * @route '/reportes/ventas/entregas-por-cliente'
 */
        entregarsPorClienteForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: entregarsPorCliente.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    entregarsPorCliente.form = entregarsPorClienteForm
/**
* @see \App\Http\Controllers\ReporteVentasController::exportMethod
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/export'
 */
export const exportMethod = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: exportMethod.url(options),
    method: 'post',
})

exportMethod.definition = {
    methods: ["post"],
    url: '/reportes/ventas/export',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ReporteVentasController::exportMethod
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/export'
 */
exportMethod.url = (options?: RouteQueryOptions) => {
    return exportMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteVentasController::exportMethod
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/export'
 */
exportMethod.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: exportMethod.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ReporteVentasController::exportMethod
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/export'
 */
    const exportMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: exportMethod.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ReporteVentasController::exportMethod
 * @see app/Http/Controllers/ReporteVentasController.php:0
 * @route '/reportes/ventas/export'
 */
        exportMethodForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: exportMethod.url(options),
            method: 'post',
        })
    
    exportMethod.form = exportMethodForm
const ReporteVentasController = { productosVendidos, imprimirReporte, porPeriodo, porClienteProducto, porVendedorEstadoPago, rankingClientes, entregasPorChofer, entregarsPorCliente, exportMethod, export: exportMethod }

export default ReporteVentasController