import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\EntregaController::misTrabjos
 * @see app/Http/Controllers/Api/EntregaController.php:28
 * @route '/api/chofer/trabajos'
 */
export const misTrabjos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: misTrabjos.url(options),
    method: 'get',
})

misTrabjos.definition = {
    methods: ["get","head"],
    url: '/api/chofer/trabajos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::misTrabjos
 * @see app/Http/Controllers/Api/EntregaController.php:28
 * @route '/api/chofer/trabajos'
 */
misTrabjos.url = (options?: RouteQueryOptions) => {
    return misTrabjos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::misTrabjos
 * @see app/Http/Controllers/Api/EntregaController.php:28
 * @route '/api/chofer/trabajos'
 */
misTrabjos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: misTrabjos.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::misTrabjos
 * @see app/Http/Controllers/Api/EntregaController.php:28
 * @route '/api/chofer/trabajos'
 */
misTrabjos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: misTrabjos.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::misTrabjos
 * @see app/Http/Controllers/Api/EntregaController.php:28
 * @route '/api/chofer/trabajos'
 */
    const misTrabjosForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: misTrabjos.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::misTrabjos
 * @see app/Http/Controllers/Api/EntregaController.php:28
 * @route '/api/chofer/trabajos'
 */
        misTrabjosForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: misTrabjos.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\EntregaController::misTrabjos
 * @see app/Http/Controllers/Api/EntregaController.php:28
 * @route '/api/chofer/trabajos'
 */
        misTrabjosForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: misTrabjos.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    misTrabjos.form = misTrabjosForm
/**
* @see \App\Http\Controllers\Api\EntregaController::entregasAsignadas
 * @see app/Http/Controllers/Api/EntregaController.php:113
 * @route '/api/chofer/entregas'
 */
export const entregasAsignadas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: entregasAsignadas.url(options),
    method: 'get',
})

entregasAsignadas.definition = {
    methods: ["get","head"],
    url: '/api/chofer/entregas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::entregasAsignadas
 * @see app/Http/Controllers/Api/EntregaController.php:113
 * @route '/api/chofer/entregas'
 */
entregasAsignadas.url = (options?: RouteQueryOptions) => {
    return entregasAsignadas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::entregasAsignadas
 * @see app/Http/Controllers/Api/EntregaController.php:113
 * @route '/api/chofer/entregas'
 */
entregasAsignadas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: entregasAsignadas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::entregasAsignadas
 * @see app/Http/Controllers/Api/EntregaController.php:113
 * @route '/api/chofer/entregas'
 */
entregasAsignadas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: entregasAsignadas.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::entregasAsignadas
 * @see app/Http/Controllers/Api/EntregaController.php:113
 * @route '/api/chofer/entregas'
 */
    const entregasAsignadasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: entregasAsignadas.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::entregasAsignadas
 * @see app/Http/Controllers/Api/EntregaController.php:113
 * @route '/api/chofer/entregas'
 */
        entregasAsignadasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: entregasAsignadas.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\EntregaController::entregasAsignadas
 * @see app/Http/Controllers/Api/EntregaController.php:113
 * @route '/api/chofer/entregas'
 */
        entregasAsignadasForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: entregasAsignadas.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    entregasAsignadas.form = entregasAsignadasForm
/**
* @see \App\Http\Controllers\Api\EntregaController::showEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:150
 * @route '/api/chofer/entregas/{id}'
 */
export const showEntrega = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showEntrega.url(args, options),
    method: 'get',
})

showEntrega.definition = {
    methods: ["get","head"],
    url: '/api/chofer/entregas/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::showEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:150
 * @route '/api/chofer/entregas/{id}'
 */
showEntrega.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return showEntrega.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::showEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:150
 * @route '/api/chofer/entregas/{id}'
 */
showEntrega.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showEntrega.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::showEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:150
 * @route '/api/chofer/entregas/{id}'
 */
showEntrega.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showEntrega.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::showEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:150
 * @route '/api/chofer/entregas/{id}'
 */
    const showEntregaForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: showEntrega.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::showEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:150
 * @route '/api/chofer/entregas/{id}'
 */
        showEntregaForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showEntrega.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\EntregaController::showEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:150
 * @route '/api/chofer/entregas/{id}'
 */
        showEntregaForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showEntrega.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    showEntrega.form = showEntregaForm
/**
* @see \App\Http\Controllers\Api\EntregaController::iniciarRuta
 * @see app/Http/Controllers/Api/EntregaController.php:195
 * @route '/api/chofer/entregas/{id}/iniciar-ruta'
 */
export const iniciarRuta = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: iniciarRuta.url(args, options),
    method: 'post',
})

iniciarRuta.definition = {
    methods: ["post"],
    url: '/api/chofer/entregas/{id}/iniciar-ruta',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::iniciarRuta
 * @see app/Http/Controllers/Api/EntregaController.php:195
 * @route '/api/chofer/entregas/{id}/iniciar-ruta'
 */
iniciarRuta.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return iniciarRuta.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::iniciarRuta
 * @see app/Http/Controllers/Api/EntregaController.php:195
 * @route '/api/chofer/entregas/{id}/iniciar-ruta'
 */
iniciarRuta.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: iniciarRuta.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::iniciarRuta
 * @see app/Http/Controllers/Api/EntregaController.php:195
 * @route '/api/chofer/entregas/{id}/iniciar-ruta'
 */
    const iniciarRutaForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: iniciarRuta.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::iniciarRuta
 * @see app/Http/Controllers/Api/EntregaController.php:195
 * @route '/api/chofer/entregas/{id}/iniciar-ruta'
 */
        iniciarRutaForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: iniciarRuta.url(args, options),
            method: 'post',
        })
    
    iniciarRuta.form = iniciarRutaForm
/**
* @see \App\Http\Controllers\Api\EntregaController::actualizarEstado
 * @see app/Http/Controllers/Api/EntregaController.php:231
 * @route '/api/chofer/entregas/{id}/actualizar-estado'
 */
export const actualizarEstado = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarEstado.url(args, options),
    method: 'post',
})

actualizarEstado.definition = {
    methods: ["post"],
    url: '/api/chofer/entregas/{id}/actualizar-estado',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::actualizarEstado
 * @see app/Http/Controllers/Api/EntregaController.php:231
 * @route '/api/chofer/entregas/{id}/actualizar-estado'
 */
actualizarEstado.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return actualizarEstado.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::actualizarEstado
 * @see app/Http/Controllers/Api/EntregaController.php:231
 * @route '/api/chofer/entregas/{id}/actualizar-estado'
 */
actualizarEstado.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarEstado.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::actualizarEstado
 * @see app/Http/Controllers/Api/EntregaController.php:231
 * @route '/api/chofer/entregas/{id}/actualizar-estado'
 */
    const actualizarEstadoForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: actualizarEstado.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::actualizarEstado
 * @see app/Http/Controllers/Api/EntregaController.php:231
 * @route '/api/chofer/entregas/{id}/actualizar-estado'
 */
        actualizarEstadoForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: actualizarEstado.url(args, options),
            method: 'post',
        })
    
    actualizarEstado.form = actualizarEstadoForm
/**
* @see \App\Http\Controllers\Api\EntregaController::marcarLlegada
 * @see app/Http/Controllers/Api/EntregaController.php:282
 * @route '/api/chofer/entregas/{id}/marcar-llegada'
 */
export const marcarLlegada = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: marcarLlegada.url(args, options),
    method: 'post',
})

marcarLlegada.definition = {
    methods: ["post"],
    url: '/api/chofer/entregas/{id}/marcar-llegada',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::marcarLlegada
 * @see app/Http/Controllers/Api/EntregaController.php:282
 * @route '/api/chofer/entregas/{id}/marcar-llegada'
 */
marcarLlegada.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return marcarLlegada.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::marcarLlegada
 * @see app/Http/Controllers/Api/EntregaController.php:282
 * @route '/api/chofer/entregas/{id}/marcar-llegada'
 */
marcarLlegada.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: marcarLlegada.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::marcarLlegada
 * @see app/Http/Controllers/Api/EntregaController.php:282
 * @route '/api/chofer/entregas/{id}/marcar-llegada'
 */
    const marcarLlegadaForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: marcarLlegada.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::marcarLlegada
 * @see app/Http/Controllers/Api/EntregaController.php:282
 * @route '/api/chofer/entregas/{id}/marcar-llegada'
 */
        marcarLlegadaForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: marcarLlegada.url(args, options),
            method: 'post',
        })
    
    marcarLlegada.form = marcarLlegadaForm
/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:336
 * @route '/api/chofer/entregas/{id}/confirmar-entrega'
 */
export const confirmarEntrega = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarEntrega.url(args, options),
    method: 'post',
})

confirmarEntrega.definition = {
    methods: ["post"],
    url: '/api/chofer/entregas/{id}/confirmar-entrega',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:336
 * @route '/api/chofer/entregas/{id}/confirmar-entrega'
 */
confirmarEntrega.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return confirmarEntrega.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::confirmarEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:336
 * @route '/api/chofer/entregas/{id}/confirmar-entrega'
 */
confirmarEntrega.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarEntrega.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::confirmarEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:336
 * @route '/api/chofer/entregas/{id}/confirmar-entrega'
 */
    const confirmarEntregaForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: confirmarEntrega.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::confirmarEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:336
 * @route '/api/chofer/entregas/{id}/confirmar-entrega'
 */
        confirmarEntregaForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: confirmarEntrega.url(args, options),
            method: 'post',
        })
    
    confirmarEntrega.form = confirmarEntregaForm
/**
* @see \App\Http\Controllers\Api\EntregaController::reportarNovedad
 * @see app/Http/Controllers/Api/EntregaController.php:410
 * @route '/api/chofer/entregas/{id}/reportar-novedad'
 */
export const reportarNovedad = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reportarNovedad.url(args, options),
    method: 'post',
})

reportarNovedad.definition = {
    methods: ["post"],
    url: '/api/chofer/entregas/{id}/reportar-novedad',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::reportarNovedad
 * @see app/Http/Controllers/Api/EntregaController.php:410
 * @route '/api/chofer/entregas/{id}/reportar-novedad'
 */
reportarNovedad.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return reportarNovedad.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::reportarNovedad
 * @see app/Http/Controllers/Api/EntregaController.php:410
 * @route '/api/chofer/entregas/{id}/reportar-novedad'
 */
reportarNovedad.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reportarNovedad.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::reportarNovedad
 * @see app/Http/Controllers/Api/EntregaController.php:410
 * @route '/api/chofer/entregas/{id}/reportar-novedad'
 */
    const reportarNovedadForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: reportarNovedad.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::reportarNovedad
 * @see app/Http/Controllers/Api/EntregaController.php:410
 * @route '/api/chofer/entregas/{id}/reportar-novedad'
 */
        reportarNovedadForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: reportarNovedad.url(args, options),
            method: 'post',
        })
    
    reportarNovedad.form = reportarNovedadForm
/**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:474
 * @route '/api/chofer/entregas/{id}/ubicacion'
 */
const registrarUbicacionad3754bc340c83999f6ded5b3a54a778 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarUbicacionad3754bc340c83999f6ded5b3a54a778.url(args, options),
    method: 'post',
})

registrarUbicacionad3754bc340c83999f6ded5b3a54a778.definition = {
    methods: ["post"],
    url: '/api/chofer/entregas/{id}/ubicacion',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:474
 * @route '/api/chofer/entregas/{id}/ubicacion'
 */
registrarUbicacionad3754bc340c83999f6ded5b3a54a778.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return registrarUbicacionad3754bc340c83999f6ded5b3a54a778.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:474
 * @route '/api/chofer/entregas/{id}/ubicacion'
 */
registrarUbicacionad3754bc340c83999f6ded5b3a54a778.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarUbicacionad3754bc340c83999f6ded5b3a54a778.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:474
 * @route '/api/chofer/entregas/{id}/ubicacion'
 */
    const registrarUbicacionad3754bc340c83999f6ded5b3a54a778Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: registrarUbicacionad3754bc340c83999f6ded5b3a54a778.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:474
 * @route '/api/chofer/entregas/{id}/ubicacion'
 */
        registrarUbicacionad3754bc340c83999f6ded5b3a54a778Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: registrarUbicacionad3754bc340c83999f6ded5b3a54a778.url(args, options),
            method: 'post',
        })
    
    registrarUbicacionad3754bc340c83999f6ded5b3a54a778.form = registrarUbicacionad3754bc340c83999f6ded5b3a54a778Form
    /**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:474
 * @route '/api/entregas/{id}/ubicacion'
 */
const registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8.url(args, options),
    method: 'post',
})

registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8.definition = {
    methods: ["post"],
    url: '/api/entregas/{id}/ubicacion',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:474
 * @route '/api/entregas/{id}/ubicacion'
 */
registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:474
 * @route '/api/entregas/{id}/ubicacion'
 */
registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:474
 * @route '/api/entregas/{id}/ubicacion'
 */
    const registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/Api/EntregaController.php:474
 * @route '/api/entregas/{id}/ubicacion'
 */
        registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8.url(args, options),
            method: 'post',
        })
    
    registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8.form = registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8Form

export const registrarUbicacion = {
    '/api/chofer/entregas/{id}/ubicacion': registrarUbicacionad3754bc340c83999f6ded5b3a54a778,
    '/api/entregas/{id}/ubicacion': registrarUbicacion079f6e0dafb99bdbbd8d8c46cc96bcc8,
}

/**
* @see \App\Http\Controllers\Api\EntregaController::historialEntregas
 * @see app/Http/Controllers/Api/EntregaController.php:530
 * @route '/api/chofer/historial'
 */
export const historialEntregas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: historialEntregas.url(options),
    method: 'get',
})

historialEntregas.definition = {
    methods: ["get","head"],
    url: '/api/chofer/historial',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::historialEntregas
 * @see app/Http/Controllers/Api/EntregaController.php:530
 * @route '/api/chofer/historial'
 */
historialEntregas.url = (options?: RouteQueryOptions) => {
    return historialEntregas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::historialEntregas
 * @see app/Http/Controllers/Api/EntregaController.php:530
 * @route '/api/chofer/historial'
 */
historialEntregas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: historialEntregas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::historialEntregas
 * @see app/Http/Controllers/Api/EntregaController.php:530
 * @route '/api/chofer/historial'
 */
historialEntregas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: historialEntregas.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::historialEntregas
 * @see app/Http/Controllers/Api/EntregaController.php:530
 * @route '/api/chofer/historial'
 */
    const historialEntregasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: historialEntregas.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::historialEntregas
 * @see app/Http/Controllers/Api/EntregaController.php:530
 * @route '/api/chofer/historial'
 */
        historialEntregasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: historialEntregas.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\EntregaController::historialEntregas
 * @see app/Http/Controllers/Api/EntregaController.php:530
 * @route '/api/chofer/historial'
 */
        historialEntregasForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: historialEntregas.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    historialEntregas.form = historialEntregasForm
/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerTracking
 * @see app/Http/Controllers/Api/EntregaController.php:569
 * @route '/api/cliente/pedidos/{proformaId}/tracking'
 */
export const obtenerTracking = (args: { proformaId: string | number } | [proformaId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerTracking.url(args, options),
    method: 'get',
})

obtenerTracking.definition = {
    methods: ["get","head"],
    url: '/api/cliente/pedidos/{proformaId}/tracking',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerTracking
 * @see app/Http/Controllers/Api/EntregaController.php:569
 * @route '/api/cliente/pedidos/{proformaId}/tracking'
 */
obtenerTracking.url = (args: { proformaId: string | number } | [proformaId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proformaId: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    proformaId: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proformaId: args.proformaId,
                }

    return obtenerTracking.definition.url
            .replace('{proformaId}', parsedArgs.proformaId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerTracking
 * @see app/Http/Controllers/Api/EntregaController.php:569
 * @route '/api/cliente/pedidos/{proformaId}/tracking'
 */
obtenerTracking.get = (args: { proformaId: string | number } | [proformaId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerTracking.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerTracking
 * @see app/Http/Controllers/Api/EntregaController.php:569
 * @route '/api/cliente/pedidos/{proformaId}/tracking'
 */
obtenerTracking.head = (args: { proformaId: string | number } | [proformaId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerTracking.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::obtenerTracking
 * @see app/Http/Controllers/Api/EntregaController.php:569
 * @route '/api/cliente/pedidos/{proformaId}/tracking'
 */
    const obtenerTrackingForm = (args: { proformaId: string | number } | [proformaId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerTracking.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::obtenerTracking
 * @see app/Http/Controllers/Api/EntregaController.php:569
 * @route '/api/cliente/pedidos/{proformaId}/tracking'
 */
        obtenerTrackingForm.get = (args: { proformaId: string | number } | [proformaId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerTracking.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\EntregaController::obtenerTracking
 * @see app/Http/Controllers/Api/EntregaController.php:569
 * @route '/api/cliente/pedidos/{proformaId}/tracking'
 */
        obtenerTrackingForm.head = (args: { proformaId: string | number } | [proformaId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerTracking.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerTracking.form = obtenerTrackingForm
/**
* @see \App\Http\Controllers\Api\EntregaController::indexAdmin
 * @see app/Http/Controllers/Api/EntregaController.php:633
 * @route '/api/admin/entregas'
 */
export const indexAdmin = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexAdmin.url(options),
    method: 'get',
})

indexAdmin.definition = {
    methods: ["get","head"],
    url: '/api/admin/entregas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::indexAdmin
 * @see app/Http/Controllers/Api/EntregaController.php:633
 * @route '/api/admin/entregas'
 */
indexAdmin.url = (options?: RouteQueryOptions) => {
    return indexAdmin.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::indexAdmin
 * @see app/Http/Controllers/Api/EntregaController.php:633
 * @route '/api/admin/entregas'
 */
indexAdmin.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexAdmin.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::indexAdmin
 * @see app/Http/Controllers/Api/EntregaController.php:633
 * @route '/api/admin/entregas'
 */
indexAdmin.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: indexAdmin.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::indexAdmin
 * @see app/Http/Controllers/Api/EntregaController.php:633
 * @route '/api/admin/entregas'
 */
    const indexAdminForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: indexAdmin.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::indexAdmin
 * @see app/Http/Controllers/Api/EntregaController.php:633
 * @route '/api/admin/entregas'
 */
        indexAdminForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: indexAdmin.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\EntregaController::indexAdmin
 * @see app/Http/Controllers/Api/EntregaController.php:633
 * @route '/api/admin/entregas'
 */
        indexAdminForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: indexAdmin.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    indexAdmin.form = indexAdminForm
/**
* @see \App\Http\Controllers\Api\EntregaController::asignarEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:668
 * @route '/api/admin/entregas/{id}/asignar'
 */
export const asignarEntrega = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: asignarEntrega.url(args, options),
    method: 'post',
})

asignarEntrega.definition = {
    methods: ["post"],
    url: '/api/admin/entregas/{id}/asignar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::asignarEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:668
 * @route '/api/admin/entregas/{id}/asignar'
 */
asignarEntrega.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return asignarEntrega.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::asignarEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:668
 * @route '/api/admin/entregas/{id}/asignar'
 */
asignarEntrega.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: asignarEntrega.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::asignarEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:668
 * @route '/api/admin/entregas/{id}/asignar'
 */
    const asignarEntregaForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: asignarEntrega.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::asignarEntrega
 * @see app/Http/Controllers/Api/EntregaController.php:668
 * @route '/api/admin/entregas/{id}/asignar'
 */
        asignarEntregaForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: asignarEntrega.url(args, options),
            method: 'post',
        })
    
    asignarEntrega.form = asignarEntregaForm
/**
* @see \App\Http\Controllers\Api\EntregaController::entregasActivas
 * @see app/Http/Controllers/Api/EntregaController.php:709
 * @route '/api/admin/entregas/activas'
 */
export const entregasActivas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: entregasActivas.url(options),
    method: 'get',
})

entregasActivas.definition = {
    methods: ["get","head"],
    url: '/api/admin/entregas/activas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::entregasActivas
 * @see app/Http/Controllers/Api/EntregaController.php:709
 * @route '/api/admin/entregas/activas'
 */
entregasActivas.url = (options?: RouteQueryOptions) => {
    return entregasActivas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::entregasActivas
 * @see app/Http/Controllers/Api/EntregaController.php:709
 * @route '/api/admin/entregas/activas'
 */
entregasActivas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: entregasActivas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::entregasActivas
 * @see app/Http/Controllers/Api/EntregaController.php:709
 * @route '/api/admin/entregas/activas'
 */
entregasActivas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: entregasActivas.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::entregasActivas
 * @see app/Http/Controllers/Api/EntregaController.php:709
 * @route '/api/admin/entregas/activas'
 */
    const entregasActivasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: entregasActivas.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::entregasActivas
 * @see app/Http/Controllers/Api/EntregaController.php:709
 * @route '/api/admin/entregas/activas'
 */
        entregasActivasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: entregasActivas.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\EntregaController::entregasActivas
 * @see app/Http/Controllers/Api/EntregaController.php:709
 * @route '/api/admin/entregas/activas'
 */
        entregasActivasForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: entregasActivas.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    entregasActivas.form = entregasActivasForm
/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerUbicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
export const obtenerUbicaciones = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerUbicaciones.url(args, options),
    method: 'get',
})

obtenerUbicaciones.definition = {
    methods: ["get","head"],
    url: '/api/entregas/{id}/ubicaciones',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerUbicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
obtenerUbicaciones.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return obtenerUbicaciones.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerUbicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
obtenerUbicaciones.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerUbicaciones.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EntregaController::obtenerUbicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
obtenerUbicaciones.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerUbicaciones.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\EntregaController::obtenerUbicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
    const obtenerUbicacionesForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerUbicaciones.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\EntregaController::obtenerUbicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
        obtenerUbicacionesForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerUbicaciones.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\EntregaController::obtenerUbicaciones
 * @see app/Http/Controllers/Api/EntregaController.php:0
 * @route '/api/entregas/{id}/ubicaciones'
 */
        obtenerUbicacionesForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerUbicaciones.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerUbicaciones.form = obtenerUbicacionesForm
const EntregaController = { misTrabjos, entregasAsignadas, showEntrega, iniciarRuta, actualizarEstado, marcarLlegada, confirmarEntrega, reportarNovedad, registrarUbicacion, historialEntregas, obtenerTracking, indexAdmin, asignarEntrega, entregasActivas, obtenerUbicaciones }

export default EntregaController