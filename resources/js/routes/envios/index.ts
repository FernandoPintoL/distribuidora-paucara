import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\EnvioController::vehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:421
 * @route '/envios/api/vehiculos-disponibles'
 */
export const vehiculosDisponibles = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: vehiculosDisponibles.url(options),
    method: 'get',
})

vehiculosDisponibles.definition = {
    methods: ["get","head"],
    url: '/envios/api/vehiculos-disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::vehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:421
 * @route '/envios/api/vehiculos-disponibles'
 */
vehiculosDisponibles.url = (options?: RouteQueryOptions) => {
    return vehiculosDisponibles.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::vehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:421
 * @route '/envios/api/vehiculos-disponibles'
 */
vehiculosDisponibles.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: vehiculosDisponibles.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::vehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:421
 * @route '/envios/api/vehiculos-disponibles'
 */
vehiculosDisponibles.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: vehiculosDisponibles.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::vehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:421
 * @route '/envios/api/vehiculos-disponibles'
 */
    const vehiculosDisponiblesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: vehiculosDisponibles.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::vehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:421
 * @route '/envios/api/vehiculos-disponibles'
 */
        vehiculosDisponiblesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: vehiculosDisponibles.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::vehiculosDisponibles
 * @see app/Http/Controllers/EnvioController.php:421
 * @route '/envios/api/vehiculos-disponibles'
 */
        vehiculosDisponiblesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: vehiculosDisponibles.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    vehiculosDisponibles.form = vehiculosDisponiblesForm
/**
* @see \App\Http\Controllers\EnvioController::choferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:438
 * @route '/envios/api/choferes-disponibles'
 */
export const choferesDisponibles = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: choferesDisponibles.url(options),
    method: 'get',
})

choferesDisponibles.definition = {
    methods: ["get","head"],
    url: '/envios/api/choferes-disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::choferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:438
 * @route '/envios/api/choferes-disponibles'
 */
choferesDisponibles.url = (options?: RouteQueryOptions) => {
    return choferesDisponibles.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::choferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:438
 * @route '/envios/api/choferes-disponibles'
 */
choferesDisponibles.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: choferesDisponibles.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::choferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:438
 * @route '/envios/api/choferes-disponibles'
 */
choferesDisponibles.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: choferesDisponibles.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::choferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:438
 * @route '/envios/api/choferes-disponibles'
 */
    const choferesDisponiblesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: choferesDisponibles.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::choferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:438
 * @route '/envios/api/choferes-disponibles'
 */
        choferesDisponiblesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: choferesDisponibles.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::choferesDisponibles
 * @see app/Http/Controllers/EnvioController.php:438
 * @route '/envios/api/choferes-disponibles'
 */
        choferesDisponiblesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: choferesDisponibles.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    choferesDisponibles.form = choferesDisponiblesForm
/**
* @see \App\Http\Controllers\EnvioController::exportPdf
 * @see app/Http/Controllers/EnvioController.php:867
 * @route '/envios/export/pdf'
 */
export const exportPdf = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportPdf.url(options),
    method: 'get',
})

exportPdf.definition = {
    methods: ["get","head"],
    url: '/envios/export/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::exportPdf
 * @see app/Http/Controllers/EnvioController.php:867
 * @route '/envios/export/pdf'
 */
exportPdf.url = (options?: RouteQueryOptions) => {
    return exportPdf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::exportPdf
 * @see app/Http/Controllers/EnvioController.php:867
 * @route '/envios/export/pdf'
 */
exportPdf.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportPdf.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::exportPdf
 * @see app/Http/Controllers/EnvioController.php:867
 * @route '/envios/export/pdf'
 */
exportPdf.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportPdf.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::exportPdf
 * @see app/Http/Controllers/EnvioController.php:867
 * @route '/envios/export/pdf'
 */
    const exportPdfForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportPdf.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::exportPdf
 * @see app/Http/Controllers/EnvioController.php:867
 * @route '/envios/export/pdf'
 */
        exportPdfForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportPdf.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::exportPdf
 * @see app/Http/Controllers/EnvioController.php:867
 * @route '/envios/export/pdf'
 */
        exportPdfForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportPdf.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    exportPdf.form = exportPdfForm
/**
* @see \App\Http\Controllers\EnvioController::exportExcel
 * @see app/Http/Controllers/EnvioController.php:882
 * @route '/envios/export/excel'
 */
export const exportExcel = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportExcel.url(options),
    method: 'get',
})

exportExcel.definition = {
    methods: ["get","head"],
    url: '/envios/export/excel',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::exportExcel
 * @see app/Http/Controllers/EnvioController.php:882
 * @route '/envios/export/excel'
 */
exportExcel.url = (options?: RouteQueryOptions) => {
    return exportExcel.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::exportExcel
 * @see app/Http/Controllers/EnvioController.php:882
 * @route '/envios/export/excel'
 */
exportExcel.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportExcel.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::exportExcel
 * @see app/Http/Controllers/EnvioController.php:882
 * @route '/envios/export/excel'
 */
exportExcel.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportExcel.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::exportExcel
 * @see app/Http/Controllers/EnvioController.php:882
 * @route '/envios/export/excel'
 */
    const exportExcelForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportExcel.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::exportExcel
 * @see app/Http/Controllers/EnvioController.php:882
 * @route '/envios/export/excel'
 */
        exportExcelForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportExcel.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::exportExcel
 * @see app/Http/Controllers/EnvioController.php:882
 * @route '/envios/export/excel'
 */
        exportExcelForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportExcel.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    exportExcel.form = exportExcelForm
/**
* @see \App\Http\Controllers\EnvioController::exportRechazadas
 * @see app/Http/Controllers/EnvioController.php:894
 * @route '/envios/export/rechazadas'
 */
export const exportRechazadas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportRechazadas.url(options),
    method: 'get',
})

exportRechazadas.definition = {
    methods: ["get","head"],
    url: '/envios/export/rechazadas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::exportRechazadas
 * @see app/Http/Controllers/EnvioController.php:894
 * @route '/envios/export/rechazadas'
 */
exportRechazadas.url = (options?: RouteQueryOptions) => {
    return exportRechazadas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::exportRechazadas
 * @see app/Http/Controllers/EnvioController.php:894
 * @route '/envios/export/rechazadas'
 */
exportRechazadas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportRechazadas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::exportRechazadas
 * @see app/Http/Controllers/EnvioController.php:894
 * @route '/envios/export/rechazadas'
 */
exportRechazadas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportRechazadas.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::exportRechazadas
 * @see app/Http/Controllers/EnvioController.php:894
 * @route '/envios/export/rechazadas'
 */
    const exportRechazadasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportRechazadas.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::exportRechazadas
 * @see app/Http/Controllers/EnvioController.php:894
 * @route '/envios/export/rechazadas'
 */
        exportRechazadasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportRechazadas.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::exportRechazadas
 * @see app/Http/Controllers/EnvioController.php:894
 * @route '/envios/export/rechazadas'
 */
        exportRechazadasForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportRechazadas.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    exportRechazadas.form = exportRechazadasForm
/**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:26
 * @route '/envios'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/envios',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:26
 * @route '/envios'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:26
 * @route '/envios'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:26
 * @route '/envios'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:26
 * @route '/envios'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:26
 * @route '/envios'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::index
 * @see app/Http/Controllers/EnvioController.php:26
 * @route '/envios'
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
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:72
 * @route '/envios/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/envios/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:72
 * @route '/envios/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:72
 * @route '/envios/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:72
 * @route '/envios/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:72
 * @route '/envios/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:72
 * @route '/envios/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::create
 * @see app/Http/Controllers/EnvioController.php:72
 * @route '/envios/create'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\EnvioController::store
 * @see app/Http/Controllers/EnvioController.php:102
 * @route '/envios'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/envios',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EnvioController::store
 * @see app/Http/Controllers/EnvioController.php:102
 * @route '/envios'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::store
 * @see app/Http/Controllers/EnvioController.php:102
 * @route '/envios'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::store
 * @see app/Http/Controllers/EnvioController.php:102
 * @route '/envios'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::store
 * @see app/Http/Controllers/EnvioController.php:102
 * @route '/envios'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\EnvioController::programar
 * @see app/Http/Controllers/EnvioController.php:147
 * @route '/envios/ventas/{venta}/programar'
 */
export const programar = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: programar.url(args, options),
    method: 'post',
})

programar.definition = {
    methods: ["post"],
    url: '/envios/ventas/{venta}/programar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EnvioController::programar
 * @see app/Http/Controllers/EnvioController.php:147
 * @route '/envios/ventas/{venta}/programar'
 */
programar.url = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { venta: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: typeof args.venta === 'object'
                ? args.venta.id
                : args.venta,
                }

    return programar.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::programar
 * @see app/Http/Controllers/EnvioController.php:147
 * @route '/envios/ventas/{venta}/programar'
 */
programar.post = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: programar.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::programar
 * @see app/Http/Controllers/EnvioController.php:147
 * @route '/envios/ventas/{venta}/programar'
 */
    const programarForm = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: programar.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::programar
 * @see app/Http/Controllers/EnvioController.php:147
 * @route '/envios/ventas/{venta}/programar'
 */
        programarForm.post = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: programar.url(args, options),
            method: 'post',
        })
    
    programar.form = programarForm
/**
* @see \App\Http\Controllers\EnvioController::iniciarPreparacion
 * @see app/Http/Controllers/EnvioController.php:196
 * @route '/envios/{envio}/iniciar-preparacion'
 */
export const iniciarPreparacion = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: iniciarPreparacion.url(args, options),
    method: 'post',
})

iniciarPreparacion.definition = {
    methods: ["post"],
    url: '/envios/{envio}/iniciar-preparacion',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EnvioController::iniciarPreparacion
 * @see app/Http/Controllers/EnvioController.php:196
 * @route '/envios/{envio}/iniciar-preparacion'
 */
iniciarPreparacion.url = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { envio: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { envio: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    envio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        envio: typeof args.envio === 'object'
                ? args.envio.id
                : args.envio,
                }

    return iniciarPreparacion.definition.url
            .replace('{envio}', parsedArgs.envio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::iniciarPreparacion
 * @see app/Http/Controllers/EnvioController.php:196
 * @route '/envios/{envio}/iniciar-preparacion'
 */
iniciarPreparacion.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: iniciarPreparacion.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::iniciarPreparacion
 * @see app/Http/Controllers/EnvioController.php:196
 * @route '/envios/{envio}/iniciar-preparacion'
 */
    const iniciarPreparacionForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: iniciarPreparacion.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::iniciarPreparacion
 * @see app/Http/Controllers/EnvioController.php:196
 * @route '/envios/{envio}/iniciar-preparacion'
 */
        iniciarPreparacionForm.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: iniciarPreparacion.url(args, options),
            method: 'post',
        })
    
    iniciarPreparacion.form = iniciarPreparacionForm
/**
* @see \App\Http\Controllers\EnvioController::confirmarSalida
 * @see app/Http/Controllers/EnvioController.php:232
 * @route '/envios/{envio}/confirmar-salida'
 */
export const confirmarSalida = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarSalida.url(args, options),
    method: 'post',
})

confirmarSalida.definition = {
    methods: ["post"],
    url: '/envios/{envio}/confirmar-salida',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EnvioController::confirmarSalida
 * @see app/Http/Controllers/EnvioController.php:232
 * @route '/envios/{envio}/confirmar-salida'
 */
confirmarSalida.url = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { envio: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { envio: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    envio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        envio: typeof args.envio === 'object'
                ? args.envio.id
                : args.envio,
                }

    return confirmarSalida.definition.url
            .replace('{envio}', parsedArgs.envio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::confirmarSalida
 * @see app/Http/Controllers/EnvioController.php:232
 * @route '/envios/{envio}/confirmar-salida'
 */
confirmarSalida.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarSalida.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::confirmarSalida
 * @see app/Http/Controllers/EnvioController.php:232
 * @route '/envios/{envio}/confirmar-salida'
 */
    const confirmarSalidaForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: confirmarSalida.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::confirmarSalida
 * @see app/Http/Controllers/EnvioController.php:232
 * @route '/envios/{envio}/confirmar-salida'
 */
        confirmarSalidaForm.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: confirmarSalida.url(args, options),
            method: 'post',
        })
    
    confirmarSalida.form = confirmarSalidaForm
/**
* @see \App\Http\Controllers\EnvioController::confirmarEntrega
 * @see app/Http/Controllers/EnvioController.php:256
 * @route '/envios/{envio}/confirmar-entrega'
 */
export const confirmarEntrega = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarEntrega.url(args, options),
    method: 'post',
})

confirmarEntrega.definition = {
    methods: ["post"],
    url: '/envios/{envio}/confirmar-entrega',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EnvioController::confirmarEntrega
 * @see app/Http/Controllers/EnvioController.php:256
 * @route '/envios/{envio}/confirmar-entrega'
 */
confirmarEntrega.url = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { envio: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { envio: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    envio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        envio: typeof args.envio === 'object'
                ? args.envio.id
                : args.envio,
                }

    return confirmarEntrega.definition.url
            .replace('{envio}', parsedArgs.envio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::confirmarEntrega
 * @see app/Http/Controllers/EnvioController.php:256
 * @route '/envios/{envio}/confirmar-entrega'
 */
confirmarEntrega.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmarEntrega.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::confirmarEntrega
 * @see app/Http/Controllers/EnvioController.php:256
 * @route '/envios/{envio}/confirmar-entrega'
 */
    const confirmarEntregaForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: confirmarEntrega.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::confirmarEntrega
 * @see app/Http/Controllers/EnvioController.php:256
 * @route '/envios/{envio}/confirmar-entrega'
 */
        confirmarEntregaForm.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: confirmarEntrega.url(args, options),
            method: 'post',
        })
    
    confirmarEntrega.form = confirmarEntregaForm
/**
* @see \App\Http\Controllers\EnvioController::cancelar
 * @see app/Http/Controllers/EnvioController.php:387
 * @route '/envios/{envio}/cancelar'
 */
export const cancelar = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelar.url(args, options),
    method: 'post',
})

cancelar.definition = {
    methods: ["post"],
    url: '/envios/{envio}/cancelar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EnvioController::cancelar
 * @see app/Http/Controllers/EnvioController.php:387
 * @route '/envios/{envio}/cancelar'
 */
cancelar.url = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { envio: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { envio: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    envio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        envio: typeof args.envio === 'object'
                ? args.envio.id
                : args.envio,
                }

    return cancelar.definition.url
            .replace('{envio}', parsedArgs.envio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::cancelar
 * @see app/Http/Controllers/EnvioController.php:387
 * @route '/envios/{envio}/cancelar'
 */
cancelar.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelar.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EnvioController::cancelar
 * @see app/Http/Controllers/EnvioController.php:387
 * @route '/envios/{envio}/cancelar'
 */
    const cancelarForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelar.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EnvioController::cancelar
 * @see app/Http/Controllers/EnvioController.php:387
 * @route '/envios/{envio}/cancelar'
 */
        cancelarForm.post = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelar.url(args, options),
            method: 'post',
        })
    
    cancelar.form = cancelarForm
/**
* @see \App\Http\Controllers\EnvioController::show
 * @see app/Http/Controllers/EnvioController.php:132
 * @route '/envios/{envio}'
 */
export const show = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/envios/{envio}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EnvioController::show
 * @see app/Http/Controllers/EnvioController.php:132
 * @route '/envios/{envio}'
 */
show.url = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { envio: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { envio: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    envio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        envio: typeof args.envio === 'object'
                ? args.envio.id
                : args.envio,
                }

    return show.definition.url
            .replace('{envio}', parsedArgs.envio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::show
 * @see app/Http/Controllers/EnvioController.php:132
 * @route '/envios/{envio}'
 */
show.get = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EnvioController::show
 * @see app/Http/Controllers/EnvioController.php:132
 * @route '/envios/{envio}'
 */
show.head = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EnvioController::show
 * @see app/Http/Controllers/EnvioController.php:132
 * @route '/envios/{envio}'
 */
    const showForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EnvioController::show
 * @see app/Http/Controllers/EnvioController.php:132
 * @route '/envios/{envio}'
 */
        showForm.get = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EnvioController::show
 * @see app/Http/Controllers/EnvioController.php:132
 * @route '/envios/{envio}'
 */
        showForm.head = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const envios = {
    vehiculosDisponibles,
choferesDisponibles,
exportPdf,
exportExcel,
exportRechazadas,
index,
create,
store,
programar,
iniciarPreparacion,
confirmarSalida,
confirmarEntrega,
cancelar,
show,
}

export default envios