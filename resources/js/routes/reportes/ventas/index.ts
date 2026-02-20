import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ReporteVentasController::porPeriodo
 * @see app/Http/Controllers/ReporteVentasController.php:25
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
 * @see app/Http/Controllers/ReporteVentasController.php:25
 * @route '/reportes/ventas/por-periodo'
 */
porPeriodo.url = (options?: RouteQueryOptions) => {
    return porPeriodo.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteVentasController::porPeriodo
 * @see app/Http/Controllers/ReporteVentasController.php:25
 * @route '/reportes/ventas/por-periodo'
 */
porPeriodo.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: porPeriodo.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteVentasController::porPeriodo
 * @see app/Http/Controllers/ReporteVentasController.php:25
 * @route '/reportes/ventas/por-periodo'
 */
porPeriodo.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: porPeriodo.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReporteVentasController::porPeriodo
 * @see app/Http/Controllers/ReporteVentasController.php:25
 * @route '/reportes/ventas/por-periodo'
 */
    const porPeriodoForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: porPeriodo.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReporteVentasController::porPeriodo
 * @see app/Http/Controllers/ReporteVentasController.php:25
 * @route '/reportes/ventas/por-periodo'
 */
        porPeriodoForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: porPeriodo.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReporteVentasController::porPeriodo
 * @see app/Http/Controllers/ReporteVentasController.php:25
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
 * @see app/Http/Controllers/ReporteVentasController.php:56
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
 * @see app/Http/Controllers/ReporteVentasController.php:56
 * @route '/reportes/ventas/por-cliente-producto'
 */
porClienteProducto.url = (options?: RouteQueryOptions) => {
    return porClienteProducto.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteVentasController::porClienteProducto
 * @see app/Http/Controllers/ReporteVentasController.php:56
 * @route '/reportes/ventas/por-cliente-producto'
 */
porClienteProducto.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: porClienteProducto.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteVentasController::porClienteProducto
 * @see app/Http/Controllers/ReporteVentasController.php:56
 * @route '/reportes/ventas/por-cliente-producto'
 */
porClienteProducto.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: porClienteProducto.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReporteVentasController::porClienteProducto
 * @see app/Http/Controllers/ReporteVentasController.php:56
 * @route '/reportes/ventas/por-cliente-producto'
 */
    const porClienteProductoForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: porClienteProducto.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReporteVentasController::porClienteProducto
 * @see app/Http/Controllers/ReporteVentasController.php:56
 * @route '/reportes/ventas/por-cliente-producto'
 */
        porClienteProductoForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: porClienteProducto.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReporteVentasController::porClienteProducto
 * @see app/Http/Controllers/ReporteVentasController.php:56
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
 * @see app/Http/Controllers/ReporteVentasController.php:91
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
 * @see app/Http/Controllers/ReporteVentasController.php:91
 * @route '/reportes/ventas/por-vendedor-estado-pago'
 */
porVendedorEstadoPago.url = (options?: RouteQueryOptions) => {
    return porVendedorEstadoPago.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteVentasController::porVendedorEstadoPago
 * @see app/Http/Controllers/ReporteVentasController.php:91
 * @route '/reportes/ventas/por-vendedor-estado-pago'
 */
porVendedorEstadoPago.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: porVendedorEstadoPago.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteVentasController::porVendedorEstadoPago
 * @see app/Http/Controllers/ReporteVentasController.php:91
 * @route '/reportes/ventas/por-vendedor-estado-pago'
 */
porVendedorEstadoPago.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: porVendedorEstadoPago.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReporteVentasController::porVendedorEstadoPago
 * @see app/Http/Controllers/ReporteVentasController.php:91
 * @route '/reportes/ventas/por-vendedor-estado-pago'
 */
    const porVendedorEstadoPagoForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: porVendedorEstadoPago.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReporteVentasController::porVendedorEstadoPago
 * @see app/Http/Controllers/ReporteVentasController.php:91
 * @route '/reportes/ventas/por-vendedor-estado-pago'
 */
        porVendedorEstadoPagoForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: porVendedorEstadoPago.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReporteVentasController::porVendedorEstadoPago
 * @see app/Http/Controllers/ReporteVentasController.php:91
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
* @see \App\Http\Controllers\ReporteVentasController::exportMethod
 * @see app/Http/Controllers/ReporteVentasController.php:124
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
 * @see app/Http/Controllers/ReporteVentasController.php:124
 * @route '/reportes/ventas/export'
 */
exportMethod.url = (options?: RouteQueryOptions) => {
    return exportMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteVentasController::exportMethod
 * @see app/Http/Controllers/ReporteVentasController.php:124
 * @route '/reportes/ventas/export'
 */
exportMethod.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: exportMethod.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ReporteVentasController::exportMethod
 * @see app/Http/Controllers/ReporteVentasController.php:124
 * @route '/reportes/ventas/export'
 */
    const exportMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: exportMethod.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ReporteVentasController::exportMethod
 * @see app/Http/Controllers/ReporteVentasController.php:124
 * @route '/reportes/ventas/export'
 */
        exportMethodForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: exportMethod.url(options),
            method: 'post',
        })
    
    exportMethod.form = exportMethodForm
const ventas = {
    porPeriodo,
porClienteProducto,
porVendedorEstadoPago,
export: exportMethod,
}

export default ventas