import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::estadoGeneral
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:35
 * @route '/api/admin/cajas/estado-general'
 */
export const estadoGeneral = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estadoGeneral.url(options),
    method: 'get',
})

estadoGeneral.definition = {
    methods: ["get","head"],
    url: '/api/admin/cajas/estado-general',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::estadoGeneral
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:35
 * @route '/api/admin/cajas/estado-general'
 */
estadoGeneral.url = (options?: RouteQueryOptions) => {
    return estadoGeneral.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::estadoGeneral
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:35
 * @route '/api/admin/cajas/estado-general'
 */
estadoGeneral.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estadoGeneral.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::estadoGeneral
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:35
 * @route '/api/admin/cajas/estado-general'
 */
estadoGeneral.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: estadoGeneral.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AdminCajaApiController::estadoGeneral
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:35
 * @route '/api/admin/cajas/estado-general'
 */
    const estadoGeneralForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: estadoGeneral.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AdminCajaApiController::estadoGeneral
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:35
 * @route '/api/admin/cajas/estado-general'
 */
        estadoGeneralForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: estadoGeneral.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AdminCajaApiController::estadoGeneral
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:35
 * @route '/api/admin/cajas/estado-general'
 */
        estadoGeneralForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: estadoGeneral.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    estadoGeneral.form = estadoGeneralForm
/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::obtenerAlertas
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:69
 * @route '/api/admin/cajas/alertas'
 */
export const obtenerAlertas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerAlertas.url(options),
    method: 'get',
})

obtenerAlertas.definition = {
    methods: ["get","head"],
    url: '/api/admin/cajas/alertas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::obtenerAlertas
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:69
 * @route '/api/admin/cajas/alertas'
 */
obtenerAlertas.url = (options?: RouteQueryOptions) => {
    return obtenerAlertas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::obtenerAlertas
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:69
 * @route '/api/admin/cajas/alertas'
 */
obtenerAlertas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerAlertas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::obtenerAlertas
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:69
 * @route '/api/admin/cajas/alertas'
 */
obtenerAlertas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerAlertas.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AdminCajaApiController::obtenerAlertas
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:69
 * @route '/api/admin/cajas/alertas'
 */
    const obtenerAlertasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerAlertas.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AdminCajaApiController::obtenerAlertas
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:69
 * @route '/api/admin/cajas/alertas'
 */
        obtenerAlertasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerAlertas.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AdminCajaApiController::obtenerAlertas
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:69
 * @route '/api/admin/cajas/alertas'
 */
        obtenerAlertasForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerAlertas.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerAlertas.form = obtenerAlertasForm
/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::estadisticas
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:127
 * @route '/api/admin/cajas/estadisticas'
 */
export const estadisticas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estadisticas.url(options),
    method: 'get',
})

estadisticas.definition = {
    methods: ["get","head"],
    url: '/api/admin/cajas/estadisticas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::estadisticas
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:127
 * @route '/api/admin/cajas/estadisticas'
 */
estadisticas.url = (options?: RouteQueryOptions) => {
    return estadisticas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::estadisticas
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:127
 * @route '/api/admin/cajas/estadisticas'
 */
estadisticas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estadisticas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::estadisticas
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:127
 * @route '/api/admin/cajas/estadisticas'
 */
estadisticas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: estadisticas.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AdminCajaApiController::estadisticas
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:127
 * @route '/api/admin/cajas/estadisticas'
 */
    const estadisticasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: estadisticas.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AdminCajaApiController::estadisticas
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:127
 * @route '/api/admin/cajas/estadisticas'
 */
        estadisticasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: estadisticas.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AdminCajaApiController::estadisticas
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:127
 * @route '/api/admin/cajas/estadisticas'
 */
        estadisticasForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: estadisticas.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    estadisticas.form = estadisticasForm
/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::detalleCaja
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:196
 * @route '/api/admin/cajas/{id}/detalle'
 */
export const detalleCaja = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: detalleCaja.url(args, options),
    method: 'get',
})

detalleCaja.definition = {
    methods: ["get","head"],
    url: '/api/admin/cajas/{id}/detalle',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::detalleCaja
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:196
 * @route '/api/admin/cajas/{id}/detalle'
 */
detalleCaja.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return detalleCaja.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::detalleCaja
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:196
 * @route '/api/admin/cajas/{id}/detalle'
 */
detalleCaja.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: detalleCaja.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::detalleCaja
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:196
 * @route '/api/admin/cajas/{id}/detalle'
 */
detalleCaja.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: detalleCaja.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AdminCajaApiController::detalleCaja
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:196
 * @route '/api/admin/cajas/{id}/detalle'
 */
    const detalleCajaForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: detalleCaja.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AdminCajaApiController::detalleCaja
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:196
 * @route '/api/admin/cajas/{id}/detalle'
 */
        detalleCajaForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: detalleCaja.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AdminCajaApiController::detalleCaja
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:196
 * @route '/api/admin/cajas/{id}/detalle'
 */
        detalleCajaForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: detalleCaja.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    detalleCaja.form = detalleCajaForm
/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::resumenGastos
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:280
 * @route '/api/admin/gastos/resumen'
 */
export const resumenGastos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: resumenGastos.url(options),
    method: 'get',
})

resumenGastos.definition = {
    methods: ["get","head"],
    url: '/api/admin/gastos/resumen',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::resumenGastos
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:280
 * @route '/api/admin/gastos/resumen'
 */
resumenGastos.url = (options?: RouteQueryOptions) => {
    return resumenGastos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::resumenGastos
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:280
 * @route '/api/admin/gastos/resumen'
 */
resumenGastos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: resumenGastos.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AdminCajaApiController::resumenGastos
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:280
 * @route '/api/admin/gastos/resumen'
 */
resumenGastos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: resumenGastos.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AdminCajaApiController::resumenGastos
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:280
 * @route '/api/admin/gastos/resumen'
 */
    const resumenGastosForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: resumenGastos.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AdminCajaApiController::resumenGastos
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:280
 * @route '/api/admin/gastos/resumen'
 */
        resumenGastosForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: resumenGastos.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AdminCajaApiController::resumenGastos
 * @see app/Http/Controllers/Api/AdminCajaApiController.php:280
 * @route '/api/admin/gastos/resumen'
 */
        resumenGastosForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: resumenGastos.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    resumenGastos.form = resumenGastosForm
const AdminCajaApiController = { estadoGeneral, obtenerAlertas, estadisticas, detalleCaja, resumenGastos }

export default AdminCajaApiController