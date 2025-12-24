import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
import lote from './lote'
/**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:474
 * @route '/api/entregas/{id}/ubicacion'
 */
export const registrarUbicacion = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarUbicacion.url(args, options),
    method: 'post',
})

registrarUbicacion.definition = {
    methods: ["post"],
    url: '/api/entregas/{id}/ubicacion',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:474
 * @route '/api/entregas/{id}/ubicacion'
 */
registrarUbicacion.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return registrarUbicacion.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:474
 * @route '/api/entregas/{id}/ubicacion'
 */
registrarUbicacion.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarUbicacion.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:474
 * @route '/api/entregas/{id}/ubicacion'
 */
    const registrarUbicacionForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: registrarUbicacion.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:474
 * @route '/api/entregas/{id}/ubicacion'
 */
        registrarUbicacionForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: registrarUbicacion.url(args, options),
            method: 'post',
        })
    
    registrarUbicacion.form = registrarUbicacionForm
/**
* @see \App\Http\Controllers\Api\EntregaController::ubicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
export const ubicaciones = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ubicaciones.url(args, options),
    method: 'get',
})

ubicaciones.definition = {
    methods: ["get","head"],
    url: '/api/entregas/{id}/ubicaciones',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::ubicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
ubicaciones.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return ubicaciones.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::ubicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
ubicaciones.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ubicaciones.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::ubicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
ubicaciones.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ubicaciones.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::ubicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
    const ubicacionesForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: ubicaciones.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::ubicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
        ubicacionesForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ubicaciones.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\EntregaController::ubicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
        ubicacionesForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ubicaciones.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    ubicaciones.form = ubicacionesForm
/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarCarga
 * @see app/Http/Controllers/Api/EntregaController.php:747
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
 * @see app/Http/Controllers/Api/EntregaController.php:747
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
 * @see app/Http/Controllers/Api/EntregaController.php:747
 * @route '/api/entregas/{id}/confirmar-carga'
 */
confirmarCarga.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarCarga.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::confirmarCarga
 * @see app/Http/Controllers/Api/EntregaController.php:747
 * @route '/api/entregas/{id}/confirmar-carga'
 */
    const confirmarCargaForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: confirmarCarga.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::confirmarCarga
 * @see app/Http/Controllers/Api/EntregaController.php:747
 * @route '/api/entregas/{id}/confirmar-carga'
 */
        confirmarCargaForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: confirmarCarga.url(args, options),
            method: 'post',
        })
    
    confirmarCarga.form = confirmarCargaForm
/**
* @see \App\Http\Controllers\Api\EntregaController::listoParaEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:770
 * @route '/api/entregas/{id}/listo-para-entrega'
 */
export const listoParaEntrega = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: listoParaEntrega.url(args, options),
    method: 'post',
})

listoParaEntrega.definition = {
    methods: ["post"],
    url: '/api/entregas/{id}/listo-para-entrega',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::listoParaEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:770
 * @route '/api/entregas/{id}/listo-para-entrega'
 */
listoParaEntrega.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return listoParaEntrega.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::listoParaEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:770
 * @route '/api/entregas/{id}/listo-para-entrega'
 */
listoParaEntrega.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: listoParaEntrega.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::listoParaEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:770
 * @route '/api/entregas/{id}/listo-para-entrega'
 */
    const listoParaEntregaForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: listoParaEntrega.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::listoParaEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:770
 * @route '/api/entregas/{id}/listo-para-entrega'
 */
        listoParaEntregaForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: listoParaEntrega.url(args, options),
            method: 'post',
        })
    
    listoParaEntrega.form = listoParaEntregaForm
/**
* @see \App\Http\Controllers\Api\EntregaController::iniciarTransito
 * @see app/Http/Controllers/Api/EntregaController.php:793
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
 * @see app/Http/Controllers/Api/EntregaController.php:793
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
 * @see app/Http/Controllers/Api/EntregaController.php:793
 * @route '/api/entregas/{id}/iniciar-transito'
 */
iniciarTransito.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: iniciarTransito.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::iniciarTransito
 * @see app/Http/Controllers/Api/EntregaController.php:793
 * @route '/api/entregas/{id}/iniciar-transito'
 */
    const iniciarTransitoForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: iniciarTransito.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::iniciarTransito
 * @see app/Http/Controllers/Api/EntregaController.php:793
 * @route '/api/entregas/{id}/iniciar-transito'
 */
        iniciarTransitoForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: iniciarTransito.url(args, options),
            method: 'post',
        })
    
    iniciarTransito.form = iniciarTransitoForm
/**
* @see \App\Http\Controllers\Api\EntregaController::ubicacionGps
 * @see app/Http/Controllers/Api/EntregaController.php:825
 * @route '/api/entregas/{id}/ubicacion-gps'
 */
export const ubicacionGps = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: ubicacionGps.url(args, options),
    method: 'patch',
})

ubicacionGps.definition = {
    methods: ["patch"],
    url: '/api/entregas/{id}/ubicacion-gps',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::ubicacionGps
 * @see app/Http/Controllers/Api/EntregaController.php:825
 * @route '/api/entregas/{id}/ubicacion-gps'
 */
ubicacionGps.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return ubicacionGps.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::ubicacionGps
 * @see app/Http/Controllers/Api/EntregaController.php:825
 * @route '/api/entregas/{id}/ubicacion-gps'
 */
ubicacionGps.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: ubicacionGps.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::ubicacionGps
 * @see app/Http/Controllers/Api/EntregaController.php:825
 * @route '/api/entregas/{id}/ubicacion-gps'
 */
    const ubicacionGpsForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: ubicacionGps.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::ubicacionGps
 * @see app/Http/Controllers/Api/EntregaController.php:825
 * @route '/api/entregas/{id}/ubicacion-gps'
 */
        ubicacionGpsForm.patch = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: ubicacionGps.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    ubicacionGps.form = ubicacionGpsForm
const entregas = {
    registrarUbicacion,
ubicaciones,
lote,
confirmarCarga,
listoParaEntrega,
iniciarTransito,
ubicacionGps,
}

export default entregas