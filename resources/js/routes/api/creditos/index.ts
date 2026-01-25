import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:1400
 * @route '/api/creditos'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/creditos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:1400
 * @route '/api/creditos'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:1400
 * @route '/api/creditos'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:1400
 * @route '/api/creditos'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:1400
 * @route '/api/creditos'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:1400
 * @route '/api/creditos'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::index
 * @see app/Http/Controllers/ClienteController.php:1400
 * @route '/api/creditos'
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
* @see \App\Http\Controllers\ClienteController::miCredito
 * @see app/Http/Controllers/ClienteController.php:1468
 * @route '/api/creditos/mi-credito'
 */
export const miCredito = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: miCredito.url(options),
    method: 'get',
})

miCredito.definition = {
    methods: ["get","head"],
    url: '/api/creditos/mi-credito',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClienteController::miCredito
 * @see app/Http/Controllers/ClienteController.php:1468
 * @route '/api/creditos/mi-credito'
 */
miCredito.url = (options?: RouteQueryOptions) => {
    return miCredito.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::miCredito
 * @see app/Http/Controllers/ClienteController.php:1468
 * @route '/api/creditos/mi-credito'
 */
miCredito.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: miCredito.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::miCredito
 * @see app/Http/Controllers/ClienteController.php:1468
 * @route '/api/creditos/mi-credito'
 */
miCredito.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: miCredito.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::miCredito
 * @see app/Http/Controllers/ClienteController.php:1468
 * @route '/api/creditos/mi-credito'
 */
    const miCreditoForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: miCredito.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::miCredito
 * @see app/Http/Controllers/ClienteController.php:1468
 * @route '/api/creditos/mi-credito'
 */
        miCreditoForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: miCredito.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::miCredito
 * @see app/Http/Controllers/ClienteController.php:1468
 * @route '/api/creditos/mi-credito'
 */
        miCreditoForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: miCredito.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    miCredito.form = miCreditoForm
/**
* @see \App\Http\Controllers\ClienteController::resumen
 * @see app/Http/Controllers/ClienteController.php:1518
 * @route '/api/creditos/cliente/{clienteId}/resumen'
 */
export const resumen = (args: { clienteId: string | number } | [clienteId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: resumen.url(args, options),
    method: 'get',
})

resumen.definition = {
    methods: ["get","head"],
    url: '/api/creditos/cliente/{clienteId}/resumen',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClienteController::resumen
 * @see app/Http/Controllers/ClienteController.php:1518
 * @route '/api/creditos/cliente/{clienteId}/resumen'
 */
resumen.url = (args: { clienteId: string | number } | [clienteId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { clienteId: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    clienteId: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        clienteId: args.clienteId,
                }

    return resumen.definition.url
            .replace('{clienteId}', parsedArgs.clienteId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::resumen
 * @see app/Http/Controllers/ClienteController.php:1518
 * @route '/api/creditos/cliente/{clienteId}/resumen'
 */
resumen.get = (args: { clienteId: string | number } | [clienteId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: resumen.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::resumen
 * @see app/Http/Controllers/ClienteController.php:1518
 * @route '/api/creditos/cliente/{clienteId}/resumen'
 */
resumen.head = (args: { clienteId: string | number } | [clienteId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: resumen.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::resumen
 * @see app/Http/Controllers/ClienteController.php:1518
 * @route '/api/creditos/cliente/{clienteId}/resumen'
 */
    const resumenForm = (args: { clienteId: string | number } | [clienteId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: resumen.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::resumen
 * @see app/Http/Controllers/ClienteController.php:1518
 * @route '/api/creditos/cliente/{clienteId}/resumen'
 */
        resumenForm.get = (args: { clienteId: string | number } | [clienteId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: resumen.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::resumen
 * @see app/Http/Controllers/ClienteController.php:1518
 * @route '/api/creditos/cliente/{clienteId}/resumen'
 */
        resumenForm.head = (args: { clienteId: string | number } | [clienteId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: resumen.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    resumen.form = resumenForm
/**
* @see \App\Http\Controllers\ClienteController::estadisticas
 * @see app/Http/Controllers/ClienteController.php:1551
 * @route '/api/creditos/estadisticas'
 */
export const estadisticas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estadisticas.url(options),
    method: 'get',
})

estadisticas.definition = {
    methods: ["get","head"],
    url: '/api/creditos/estadisticas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClienteController::estadisticas
 * @see app/Http/Controllers/ClienteController.php:1551
 * @route '/api/creditos/estadisticas'
 */
estadisticas.url = (options?: RouteQueryOptions) => {
    return estadisticas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::estadisticas
 * @see app/Http/Controllers/ClienteController.php:1551
 * @route '/api/creditos/estadisticas'
 */
estadisticas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estadisticas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::estadisticas
 * @see app/Http/Controllers/ClienteController.php:1551
 * @route '/api/creditos/estadisticas'
 */
estadisticas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: estadisticas.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::estadisticas
 * @see app/Http/Controllers/ClienteController.php:1551
 * @route '/api/creditos/estadisticas'
 */
    const estadisticasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: estadisticas.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::estadisticas
 * @see app/Http/Controllers/ClienteController.php:1551
 * @route '/api/creditos/estadisticas'
 */
        estadisticasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: estadisticas.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::estadisticas
 * @see app/Http/Controllers/ClienteController.php:1551
 * @route '/api/creditos/estadisticas'
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
* @see \App\Http\Controllers\ClienteController::exportar
 * @see app/Http/Controllers/ClienteController.php:1574
 * @route '/api/creditos/exportar'
 */
export const exportar = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportar.url(options),
    method: 'get',
})

exportar.definition = {
    methods: ["get","head"],
    url: '/api/creditos/exportar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClienteController::exportar
 * @see app/Http/Controllers/ClienteController.php:1574
 * @route '/api/creditos/exportar'
 */
exportar.url = (options?: RouteQueryOptions) => {
    return exportar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClienteController::exportar
 * @see app/Http/Controllers/ClienteController.php:1574
 * @route '/api/creditos/exportar'
 */
exportar.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportar.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClienteController::exportar
 * @see app/Http/Controllers/ClienteController.php:1574
 * @route '/api/creditos/exportar'
 */
exportar.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportar.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClienteController::exportar
 * @see app/Http/Controllers/ClienteController.php:1574
 * @route '/api/creditos/exportar'
 */
    const exportarForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportar.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClienteController::exportar
 * @see app/Http/Controllers/ClienteController.php:1574
 * @route '/api/creditos/exportar'
 */
        exportarForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportar.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClienteController::exportar
 * @see app/Http/Controllers/ClienteController.php:1574
 * @route '/api/creditos/exportar'
 */
        exportarForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportar.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    exportar.form = exportarForm
const creditos = {
    index,
miCredito,
resumen,
estadisticas,
exportar,
}

export default creditos