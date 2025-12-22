import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:173
 * @route '/api/entregas'
 */
const store5b6f89ee7ff6fd2c178bdce39232fdd8 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store5b6f89ee7ff6fd2c178bdce39232fdd8.url(options),
    method: 'post',
})

store5b6f89ee7ff6fd2c178bdce39232fdd8.definition = {
    methods: ["post"],
    url: '/api/entregas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:173
 * @route '/api/entregas'
 */
store5b6f89ee7ff6fd2c178bdce39232fdd8.url = (options?: RouteQueryOptions) => {
    return store5b6f89ee7ff6fd2c178bdce39232fdd8.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:173
 * @route '/api/entregas'
 */
store5b6f89ee7ff6fd2c178bdce39232fdd8.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store5b6f89ee7ff6fd2c178bdce39232fdd8.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:173
 * @route '/api/entregas'
 */
    const store5b6f89ee7ff6fd2c178bdce39232fdd8Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store5b6f89ee7ff6fd2c178bdce39232fdd8.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:173
 * @route '/api/entregas'
 */
        store5b6f89ee7ff6fd2c178bdce39232fdd8Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store5b6f89ee7ff6fd2c178bdce39232fdd8.url(options),
            method: 'post',
        })
    
    store5b6f89ee7ff6fd2c178bdce39232fdd8.form = store5b6f89ee7ff6fd2c178bdce39232fdd8Form
    /**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:173
 * @route '/logistica/entregas'
 */
const store0d12d3b87650411ad33f49ef68b848bd = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store0d12d3b87650411ad33f49ef68b848bd.url(options),
    method: 'post',
})

store0d12d3b87650411ad33f49ef68b848bd.definition = {
    methods: ["post"],
    url: '/logistica/entregas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:173
 * @route '/logistica/entregas'
 */
store0d12d3b87650411ad33f49ef68b848bd.url = (options?: RouteQueryOptions) => {
    return store0d12d3b87650411ad33f49ef68b848bd.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:173
 * @route '/logistica/entregas'
 */
store0d12d3b87650411ad33f49ef68b848bd.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store0d12d3b87650411ad33f49ef68b848bd.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:173
 * @route '/logistica/entregas'
 */
    const store0d12d3b87650411ad33f49ef68b848bdForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store0d12d3b87650411ad33f49ef68b848bd.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:173
 * @route '/logistica/entregas'
 */
        store0d12d3b87650411ad33f49ef68b848bdForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store0d12d3b87650411ad33f49ef68b848bd.url(options),
            method: 'post',
        })
    
    store0d12d3b87650411ad33f49ef68b848bd.form = store0d12d3b87650411ad33f49ef68b848bdForm

export const store = {
    '/api/entregas': store5b6f89ee7ff6fd2c178bdce39232fdd8,
    '/logistica/entregas': store0d12d3b87650411ad33f49ef68b848bd,
}

/**
* @see \App\Http\Controllers\EntregaController::index
 * @see app/Http/Controllers/EntregaController.php:47
 * @route '/logistica/entregas'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/logistica/entregas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EntregaController::index
 * @see app/Http/Controllers/EntregaController.php:47
 * @route '/logistica/entregas'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::index
 * @see app/Http/Controllers/EntregaController.php:47
 * @route '/logistica/entregas'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EntregaController::index
 * @see app/Http/Controllers/EntregaController.php:47
 * @route '/logistica/entregas'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EntregaController::index
 * @see app/Http/Controllers/EntregaController.php:47
 * @route '/logistica/entregas'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EntregaController::index
 * @see app/Http/Controllers/EntregaController.php:47
 * @route '/logistica/entregas'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EntregaController::index
 * @see app/Http/Controllers/EntregaController.php:47
 * @route '/logistica/entregas'
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
* @see \App\Http\Controllers\EntregaController::dashboardStats
 * @see app/Http/Controllers/EntregaController.php:663
 * @route '/logistica/entregas/dashboard-stats'
 */
export const dashboardStats = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboardStats.url(options),
    method: 'get',
})

dashboardStats.definition = {
    methods: ["get","head"],
    url: '/logistica/entregas/dashboard-stats',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EntregaController::dashboardStats
 * @see app/Http/Controllers/EntregaController.php:663
 * @route '/logistica/entregas/dashboard-stats'
 */
dashboardStats.url = (options?: RouteQueryOptions) => {
    return dashboardStats.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::dashboardStats
 * @see app/Http/Controllers/EntregaController.php:663
 * @route '/logistica/entregas/dashboard-stats'
 */
dashboardStats.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboardStats.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EntregaController::dashboardStats
 * @see app/Http/Controllers/EntregaController.php:663
 * @route '/logistica/entregas/dashboard-stats'
 */
dashboardStats.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboardStats.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EntregaController::dashboardStats
 * @see app/Http/Controllers/EntregaController.php:663
 * @route '/logistica/entregas/dashboard-stats'
 */
    const dashboardStatsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: dashboardStats.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EntregaController::dashboardStats
 * @see app/Http/Controllers/EntregaController.php:663
 * @route '/logistica/entregas/dashboard-stats'
 */
        dashboardStatsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboardStats.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EntregaController::dashboardStats
 * @see app/Http/Controllers/EntregaController.php:663
 * @route '/logistica/entregas/dashboard-stats'
 */
        dashboardStatsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboardStats.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    dashboardStats.form = dashboardStatsForm
/**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:95
 * @route '/logistica/entregas/create'
 */
const create9eab5848ac882d6ab242be828dd25043 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create9eab5848ac882d6ab242be828dd25043.url(options),
    method: 'get',
})

create9eab5848ac882d6ab242be828dd25043.definition = {
    methods: ["get","head"],
    url: '/logistica/entregas/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:95
 * @route '/logistica/entregas/create'
 */
create9eab5848ac882d6ab242be828dd25043.url = (options?: RouteQueryOptions) => {
    return create9eab5848ac882d6ab242be828dd25043.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:95
 * @route '/logistica/entregas/create'
 */
create9eab5848ac882d6ab242be828dd25043.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create9eab5848ac882d6ab242be828dd25043.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:95
 * @route '/logistica/entregas/create'
 */
create9eab5848ac882d6ab242be828dd25043.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create9eab5848ac882d6ab242be828dd25043.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:95
 * @route '/logistica/entregas/create'
 */
    const create9eab5848ac882d6ab242be828dd25043Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create9eab5848ac882d6ab242be828dd25043.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:95
 * @route '/logistica/entregas/create'
 */
        create9eab5848ac882d6ab242be828dd25043Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create9eab5848ac882d6ab242be828dd25043.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:95
 * @route '/logistica/entregas/create'
 */
        create9eab5848ac882d6ab242be828dd25043Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create9eab5848ac882d6ab242be828dd25043.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create9eab5848ac882d6ab242be828dd25043.form = create9eab5848ac882d6ab242be828dd25043Form
    /**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:95
 * @route '/logistica/entregas/crear-lote'
 */
const createa948951dae376b4dd1be8dd7f48b3e7e = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: createa948951dae376b4dd1be8dd7f48b3e7e.url(options),
    method: 'get',
})

createa948951dae376b4dd1be8dd7f48b3e7e.definition = {
    methods: ["get","head"],
    url: '/logistica/entregas/crear-lote',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:95
 * @route '/logistica/entregas/crear-lote'
 */
createa948951dae376b4dd1be8dd7f48b3e7e.url = (options?: RouteQueryOptions) => {
    return createa948951dae376b4dd1be8dd7f48b3e7e.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:95
 * @route '/logistica/entregas/crear-lote'
 */
createa948951dae376b4dd1be8dd7f48b3e7e.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: createa948951dae376b4dd1be8dd7f48b3e7e.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:95
 * @route '/logistica/entregas/crear-lote'
 */
createa948951dae376b4dd1be8dd7f48b3e7e.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: createa948951dae376b4dd1be8dd7f48b3e7e.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:95
 * @route '/logistica/entregas/crear-lote'
 */
    const createa948951dae376b4dd1be8dd7f48b3e7eForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: createa948951dae376b4dd1be8dd7f48b3e7e.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:95
 * @route '/logistica/entregas/crear-lote'
 */
        createa948951dae376b4dd1be8dd7f48b3e7eForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: createa948951dae376b4dd1be8dd7f48b3e7e.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:95
 * @route '/logistica/entregas/crear-lote'
 */
        createa948951dae376b4dd1be8dd7f48b3e7eForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: createa948951dae376b4dd1be8dd7f48b3e7e.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    createa948951dae376b4dd1be8dd7f48b3e7e.form = createa948951dae376b4dd1be8dd7f48b3e7eForm

export const create = {
    '/logistica/entregas/create': create9eab5848ac882d6ab242be828dd25043,
    '/logistica/entregas/crear-lote': createa948951dae376b4dd1be8dd7f48b3e7e,
}

/**
* @see \App\Http\Controllers\EntregaController::optimizarRutas
 * @see app/Http/Controllers/EntregaController.php:572
 * @route '/logistica/entregas/optimizar'
 */
export const optimizarRutas = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: optimizarRutas.url(options),
    method: 'post',
})

optimizarRutas.definition = {
    methods: ["post"],
    url: '/logistica/entregas/optimizar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EntregaController::optimizarRutas
 * @see app/Http/Controllers/EntregaController.php:572
 * @route '/logistica/entregas/optimizar'
 */
optimizarRutas.url = (options?: RouteQueryOptions) => {
    return optimizarRutas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::optimizarRutas
 * @see app/Http/Controllers/EntregaController.php:572
 * @route '/logistica/entregas/optimizar'
 */
optimizarRutas.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: optimizarRutas.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EntregaController::optimizarRutas
 * @see app/Http/Controllers/EntregaController.php:572
 * @route '/logistica/entregas/optimizar'
 */
    const optimizarRutasForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: optimizarRutas.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EntregaController::optimizarRutas
 * @see app/Http/Controllers/EntregaController.php:572
 * @route '/logistica/entregas/optimizar'
 */
        optimizarRutasForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: optimizarRutas.url(options),
            method: 'post',
        })
    
    optimizarRutas.form = optimizarRutasForm
/**
* @see \App\Http\Controllers\EntregaController::show
 * @see app/Http/Controllers/EntregaController.php:261
 * @route '/logistica/entregas/{entrega}'
 */
export const show = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/logistica/entregas/{entrega}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EntregaController::show
 * @see app/Http/Controllers/EntregaController.php:261
 * @route '/logistica/entregas/{entrega}'
 */
show.url = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { entrega: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { entrega: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    entrega: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        entrega: typeof args.entrega === 'object'
                ? args.entrega.id
                : args.entrega,
                }

    return show.definition.url
            .replace('{entrega}', parsedArgs.entrega.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::show
 * @see app/Http/Controllers/EntregaController.php:261
 * @route '/logistica/entregas/{entrega}'
 */
show.get = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EntregaController::show
 * @see app/Http/Controllers/EntregaController.php:261
 * @route '/logistica/entregas/{entrega}'
 */
show.head = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EntregaController::show
 * @see app/Http/Controllers/EntregaController.php:261
 * @route '/logistica/entregas/{entrega}'
 */
    const showForm = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EntregaController::show
 * @see app/Http/Controllers/EntregaController.php:261
 * @route '/logistica/entregas/{entrega}'
 */
        showForm.get = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EntregaController::show
 * @see app/Http/Controllers/EntregaController.php:261
 * @route '/logistica/entregas/{entrega}'
 */
        showForm.head = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\EntregaController::asignarChoferVehiculo
 * @see app/Http/Controllers/EntregaController.php:295
 * @route '/logistica/entregas/{entrega}/asignar'
 */
export const asignarChoferVehiculo = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: asignarChoferVehiculo.url(args, options),
    method: 'post',
})

asignarChoferVehiculo.definition = {
    methods: ["post"],
    url: '/logistica/entregas/{entrega}/asignar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EntregaController::asignarChoferVehiculo
 * @see app/Http/Controllers/EntregaController.php:295
 * @route '/logistica/entregas/{entrega}/asignar'
 */
asignarChoferVehiculo.url = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { entrega: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    entrega: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        entrega: args.entrega,
                }

    return asignarChoferVehiculo.definition.url
            .replace('{entrega}', parsedArgs.entrega.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::asignarChoferVehiculo
 * @see app/Http/Controllers/EntregaController.php:295
 * @route '/logistica/entregas/{entrega}/asignar'
 */
asignarChoferVehiculo.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: asignarChoferVehiculo.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EntregaController::asignarChoferVehiculo
 * @see app/Http/Controllers/EntregaController.php:295
 * @route '/logistica/entregas/{entrega}/asignar'
 */
    const asignarChoferVehiculoForm = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: asignarChoferVehiculo.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EntregaController::asignarChoferVehiculo
 * @see app/Http/Controllers/EntregaController.php:295
 * @route '/logistica/entregas/{entrega}/asignar'
 */
        asignarChoferVehiculoForm.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: asignarChoferVehiculo.url(args, options),
            method: 'post',
        })
    
    asignarChoferVehiculo.form = asignarChoferVehiculoForm
/**
* @see \App\Http\Controllers\EntregaController::iniciar
 * @see app/Http/Controllers/EntregaController.php:330
 * @route '/logistica/entregas/{entrega}/iniciar'
 */
export const iniciar = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: iniciar.url(args, options),
    method: 'post',
})

iniciar.definition = {
    methods: ["post"],
    url: '/logistica/entregas/{entrega}/iniciar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EntregaController::iniciar
 * @see app/Http/Controllers/EntregaController.php:330
 * @route '/logistica/entregas/{entrega}/iniciar'
 */
iniciar.url = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { entrega: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    entrega: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        entrega: args.entrega,
                }

    return iniciar.definition.url
            .replace('{entrega}', parsedArgs.entrega.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::iniciar
 * @see app/Http/Controllers/EntregaController.php:330
 * @route '/logistica/entregas/{entrega}/iniciar'
 */
iniciar.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: iniciar.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EntregaController::iniciar
 * @see app/Http/Controllers/EntregaController.php:330
 * @route '/logistica/entregas/{entrega}/iniciar'
 */
    const iniciarForm = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: iniciar.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EntregaController::iniciar
 * @see app/Http/Controllers/EntregaController.php:330
 * @route '/logistica/entregas/{entrega}/iniciar'
 */
        iniciarForm.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: iniciar.url(args, options),
            method: 'post',
        })
    
    iniciar.form = iniciarForm
/**
* @see \App\Http\Controllers\EntregaController::registrarLlegada
 * @see app/Http/Controllers/EntregaController.php:607
 * @route '/logistica/entregas/{entrega}/llego'
 */
export const registrarLlegada = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarLlegada.url(args, options),
    method: 'post',
})

registrarLlegada.definition = {
    methods: ["post"],
    url: '/logistica/entregas/{entrega}/llego',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EntregaController::registrarLlegada
 * @see app/Http/Controllers/EntregaController.php:607
 * @route '/logistica/entregas/{entrega}/llego'
 */
registrarLlegada.url = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { entrega: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    entrega: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        entrega: args.entrega,
                }

    return registrarLlegada.definition.url
            .replace('{entrega}', parsedArgs.entrega.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::registrarLlegada
 * @see app/Http/Controllers/EntregaController.php:607
 * @route '/logistica/entregas/{entrega}/llego'
 */
registrarLlegada.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarLlegada.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EntregaController::registrarLlegada
 * @see app/Http/Controllers/EntregaController.php:607
 * @route '/logistica/entregas/{entrega}/llego'
 */
    const registrarLlegadaForm = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: registrarLlegada.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EntregaController::registrarLlegada
 * @see app/Http/Controllers/EntregaController.php:607
 * @route '/logistica/entregas/{entrega}/llego'
 */
        registrarLlegadaForm.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: registrarLlegada.url(args, options),
            method: 'post',
        })
    
    registrarLlegada.form = registrarLlegadaForm
/**
* @see \App\Http\Controllers\EntregaController::confirmar
 * @see app/Http/Controllers/EntregaController.php:360
 * @route '/logistica/entregas/{entrega}/confirmar'
 */
export const confirmar = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmar.url(args, options),
    method: 'post',
})

confirmar.definition = {
    methods: ["post"],
    url: '/logistica/entregas/{entrega}/confirmar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EntregaController::confirmar
 * @see app/Http/Controllers/EntregaController.php:360
 * @route '/logistica/entregas/{entrega}/confirmar'
 */
confirmar.url = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { entrega: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    entrega: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        entrega: args.entrega,
                }

    return confirmar.definition.url
            .replace('{entrega}', parsedArgs.entrega.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::confirmar
 * @see app/Http/Controllers/EntregaController.php:360
 * @route '/logistica/entregas/{entrega}/confirmar'
 */
confirmar.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmar.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EntregaController::confirmar
 * @see app/Http/Controllers/EntregaController.php:360
 * @route '/logistica/entregas/{entrega}/confirmar'
 */
    const confirmarForm = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: confirmar.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EntregaController::confirmar
 * @see app/Http/Controllers/EntregaController.php:360
 * @route '/logistica/entregas/{entrega}/confirmar'
 */
        confirmarForm.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: confirmar.url(args, options),
            method: 'post',
        })
    
    confirmar.form = confirmarForm
/**
* @see \App\Http\Controllers\EntregaController::reportarNovedad
 * @see app/Http/Controllers/EntregaController.php:631
 * @route '/logistica/entregas/{entrega}/novedad'
 */
export const reportarNovedad = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reportarNovedad.url(args, options),
    method: 'post',
})

reportarNovedad.definition = {
    methods: ["post"],
    url: '/logistica/entregas/{entrega}/novedad',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EntregaController::reportarNovedad
 * @see app/Http/Controllers/EntregaController.php:631
 * @route '/logistica/entregas/{entrega}/novedad'
 */
reportarNovedad.url = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { entrega: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    entrega: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        entrega: args.entrega,
                }

    return reportarNovedad.definition.url
            .replace('{entrega}', parsedArgs.entrega.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::reportarNovedad
 * @see app/Http/Controllers/EntregaController.php:631
 * @route '/logistica/entregas/{entrega}/novedad'
 */
reportarNovedad.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reportarNovedad.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EntregaController::reportarNovedad
 * @see app/Http/Controllers/EntregaController.php:631
 * @route '/logistica/entregas/{entrega}/novedad'
 */
    const reportarNovedadForm = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: reportarNovedad.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EntregaController::reportarNovedad
 * @see app/Http/Controllers/EntregaController.php:631
 * @route '/logistica/entregas/{entrega}/novedad'
 */
        reportarNovedadForm.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: reportarNovedad.url(args, options),
            method: 'post',
        })
    
    reportarNovedad.form = reportarNovedadForm
/**
* @see \App\Http\Controllers\EntregaController::rechazar
 * @see app/Http/Controllers/EntregaController.php:392
 * @route '/logistica/entregas/{entrega}/rechazar'
 */
export const rechazar = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rechazar.url(args, options),
    method: 'post',
})

rechazar.definition = {
    methods: ["post"],
    url: '/logistica/entregas/{entrega}/rechazar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EntregaController::rechazar
 * @see app/Http/Controllers/EntregaController.php:392
 * @route '/logistica/entregas/{entrega}/rechazar'
 */
rechazar.url = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { entrega: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    entrega: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        entrega: args.entrega,
                }

    return rechazar.definition.url
            .replace('{entrega}', parsedArgs.entrega.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::rechazar
 * @see app/Http/Controllers/EntregaController.php:392
 * @route '/logistica/entregas/{entrega}/rechazar'
 */
rechazar.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rechazar.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EntregaController::rechazar
 * @see app/Http/Controllers/EntregaController.php:392
 * @route '/logistica/entregas/{entrega}/rechazar'
 */
    const rechazarForm = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rechazar.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EntregaController::rechazar
 * @see app/Http/Controllers/EntregaController.php:392
 * @route '/logistica/entregas/{entrega}/rechazar'
 */
        rechazarForm.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rechazar.url(args, options),
            method: 'post',
        })
    
    rechazar.form = rechazarForm
/**
* @see \App\Http\Controllers\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/EntregaController.php:448
 * @route '/logistica/entregas/{entrega}/ubicacion'
 */
export const registrarUbicacion = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarUbicacion.url(args, options),
    method: 'post',
})

registrarUbicacion.definition = {
    methods: ["post"],
    url: '/logistica/entregas/{entrega}/ubicacion',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/EntregaController.php:448
 * @route '/logistica/entregas/{entrega}/ubicacion'
 */
registrarUbicacion.url = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { entrega: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    entrega: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        entrega: args.entrega,
                }

    return registrarUbicacion.definition.url
            .replace('{entrega}', parsedArgs.entrega.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/EntregaController.php:448
 * @route '/logistica/entregas/{entrega}/ubicacion'
 */
registrarUbicacion.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarUbicacion.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/EntregaController.php:448
 * @route '/logistica/entregas/{entrega}/ubicacion'
 */
    const registrarUbicacionForm = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: registrarUbicacion.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/EntregaController.php:448
 * @route '/logistica/entregas/{entrega}/ubicacion'
 */
        registrarUbicacionForm.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: registrarUbicacion.url(args, options),
            method: 'post',
        })
    
    registrarUbicacion.form = registrarUbicacionForm
const EntregaController = { store, index, dashboardStats, create, optimizarRutas, show, asignarChoferVehiculo, iniciar, registrarLlegada, confirmar, reportarNovedad, rechazar, registrarUbicacion }

export default EntregaController