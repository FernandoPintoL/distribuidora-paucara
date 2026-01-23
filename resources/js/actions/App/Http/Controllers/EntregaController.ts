import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:481
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
 * @see app/Http/Controllers/EntregaController.php:481
 * @route '/api/entregas'
 */
store5b6f89ee7ff6fd2c178bdce39232fdd8.url = (options?: RouteQueryOptions) => {
    return store5b6f89ee7ff6fd2c178bdce39232fdd8.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:481
 * @route '/api/entregas'
 */
store5b6f89ee7ff6fd2c178bdce39232fdd8.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store5b6f89ee7ff6fd2c178bdce39232fdd8.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:481
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
 * @see app/Http/Controllers/EntregaController.php:481
 * @route '/logistica/entregas'
 */
store0d12d3b87650411ad33f49ef68b848bd.url = (options?: RouteQueryOptions) => {
    return store0d12d3b87650411ad33f49ef68b848bd.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:481
 * @route '/logistica/entregas'
 */
store0d12d3b87650411ad33f49ef68b848bd.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store0d12d3b87650411ad33f49ef68b848bd.url(options),
    method: 'post',
})

export const store = {
    '/api/entregas': store5b6f89ee7ff6fd2c178bdce39232fdd8,
    '/logistica/entregas': store0d12d3b87650411ad33f49ef68b848bd,
}

/**
* @see \App\Http\Controllers\EntregaController::index
 * @see app/Http/Controllers/EntregaController.php:70
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
 * @see app/Http/Controllers/EntregaController.php:70
 * @route '/logistica/entregas'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::index
 * @see app/Http/Controllers/EntregaController.php:70
 * @route '/logistica/entregas'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EntregaController::index
 * @see app/Http/Controllers/EntregaController.php:70
 * @route '/logistica/entregas'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EntregaController::dashboardStats
 * @see app/Http/Controllers/EntregaController.php:1179
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
 * @see app/Http/Controllers/EntregaController.php:1179
 * @route '/logistica/entregas/dashboard-stats'
 */
dashboardStats.url = (options?: RouteQueryOptions) => {
    return dashboardStats.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::dashboardStats
 * @see app/Http/Controllers/EntregaController.php:1179
 * @route '/logistica/entregas/dashboard-stats'
 */
dashboardStats.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboardStats.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EntregaController::dashboardStats
 * @see app/Http/Controllers/EntregaController.php:1179
 * @route '/logistica/entregas/dashboard-stats'
 */
dashboardStats.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboardStats.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EntregaController::debugVentas
 * @see app/Http/Controllers/EntregaController.php:172
 * @route '/logistica/entregas/debug-ventas'
 */
export const debugVentas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: debugVentas.url(options),
    method: 'get',
})

debugVentas.definition = {
    methods: ["get","head"],
    url: '/logistica/entregas/debug-ventas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EntregaController::debugVentas
 * @see app/Http/Controllers/EntregaController.php:172
 * @route '/logistica/entregas/debug-ventas'
 */
debugVentas.url = (options?: RouteQueryOptions) => {
    return debugVentas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::debugVentas
 * @see app/Http/Controllers/EntregaController.php:172
 * @route '/logistica/entregas/debug-ventas'
 */
debugVentas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: debugVentas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EntregaController::debugVentas
 * @see app/Http/Controllers/EntregaController.php:172
 * @route '/logistica/entregas/debug-ventas'
 */
debugVentas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: debugVentas.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:195
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
 * @see app/Http/Controllers/EntregaController.php:195
 * @route '/logistica/entregas/create'
 */
create9eab5848ac882d6ab242be828dd25043.url = (options?: RouteQueryOptions) => {
    return create9eab5848ac882d6ab242be828dd25043.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:195
 * @route '/logistica/entregas/create'
 */
create9eab5848ac882d6ab242be828dd25043.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create9eab5848ac882d6ab242be828dd25043.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:195
 * @route '/logistica/entregas/create'
 */
create9eab5848ac882d6ab242be828dd25043.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create9eab5848ac882d6ab242be828dd25043.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:195
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
 * @see app/Http/Controllers/EntregaController.php:195
 * @route '/logistica/entregas/crear-lote'
 */
createa948951dae376b4dd1be8dd7f48b3e7e.url = (options?: RouteQueryOptions) => {
    return createa948951dae376b4dd1be8dd7f48b3e7e.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:195
 * @route '/logistica/entregas/crear-lote'
 */
createa948951dae376b4dd1be8dd7f48b3e7e.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: createa948951dae376b4dd1be8dd7f48b3e7e.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:195
 * @route '/logistica/entregas/crear-lote'
 */
createa948951dae376b4dd1be8dd7f48b3e7e.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: createa948951dae376b4dd1be8dd7f48b3e7e.url(options),
    method: 'head',
})

export const create = {
    '/logistica/entregas/create': create9eab5848ac882d6ab242be828dd25043,
    '/logistica/entregas/crear-lote': createa948951dae376b4dd1be8dd7f48b3e7e,
}

/**
* @see \App\Http\Controllers\EntregaController::searchVentas
 * @see app/Http/Controllers/EntregaController.php:350
 * @route '/logistica/entregas/ventas/search'
 */
export const searchVentas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchVentas.url(options),
    method: 'get',
})

searchVentas.definition = {
    methods: ["get","head"],
    url: '/logistica/entregas/ventas/search',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EntregaController::searchVentas
 * @see app/Http/Controllers/EntregaController.php:350
 * @route '/logistica/entregas/ventas/search'
 */
searchVentas.url = (options?: RouteQueryOptions) => {
    return searchVentas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::searchVentas
 * @see app/Http/Controllers/EntregaController.php:350
 * @route '/logistica/entregas/ventas/search'
 */
searchVentas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchVentas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EntregaController::searchVentas
 * @see app/Http/Controllers/EntregaController.php:350
 * @route '/logistica/entregas/ventas/search'
 */
searchVentas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: searchVentas.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EntregaController::optimizarRutas
 * @see app/Http/Controllers/EntregaController.php:1084
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
 * @see app/Http/Controllers/EntregaController.php:1084
 * @route '/logistica/entregas/optimizar'
 */
optimizarRutas.url = (options?: RouteQueryOptions) => {
    return optimizarRutas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::optimizarRutas
 * @see app/Http/Controllers/EntregaController.php:1084
 * @route '/logistica/entregas/optimizar'
 */
optimizarRutas.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: optimizarRutas.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EntregaController::show
 * @see app/Http/Controllers/EntregaController.php:627
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
 * @see app/Http/Controllers/EntregaController.php:627
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
 * @see app/Http/Controllers/EntregaController.php:627
 * @route '/logistica/entregas/{entrega}'
 */
show.get = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EntregaController::show
 * @see app/Http/Controllers/EntregaController.php:627
 * @route '/logistica/entregas/{entrega}'
 */
show.head = (args: { entrega: number | { id: number } } | [entrega: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EntregaController::asignarChoferVehiculo
 * @see app/Http/Controllers/EntregaController.php:692
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
 * @see app/Http/Controllers/EntregaController.php:692
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
 * @see app/Http/Controllers/EntregaController.php:692
 * @route '/logistica/entregas/{entrega}/asignar'
 */
asignarChoferVehiculo.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: asignarChoferVehiculo.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EntregaController::iniciar
 * @see app/Http/Controllers/EntregaController.php:727
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
 * @see app/Http/Controllers/EntregaController.php:727
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
 * @see app/Http/Controllers/EntregaController.php:727
 * @route '/logistica/entregas/{entrega}/iniciar'
 */
iniciar.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: iniciar.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EntregaController::registrarLlegada
 * @see app/Http/Controllers/EntregaController.php:1119
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
 * @see app/Http/Controllers/EntregaController.php:1119
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
 * @see app/Http/Controllers/EntregaController.php:1119
 * @route '/logistica/entregas/{entrega}/llego'
 */
registrarLlegada.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarLlegada.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EntregaController::confirmar
 * @see app/Http/Controllers/EntregaController.php:757
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
 * @see app/Http/Controllers/EntregaController.php:757
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
 * @see app/Http/Controllers/EntregaController.php:757
 * @route '/logistica/entregas/{entrega}/confirmar'
 */
confirmar.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmar.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EntregaController::reportarNovedad
 * @see app/Http/Controllers/EntregaController.php:1143
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
 * @see app/Http/Controllers/EntregaController.php:1143
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
 * @see app/Http/Controllers/EntregaController.php:1143
 * @route '/logistica/entregas/{entrega}/novedad'
 */
reportarNovedad.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reportarNovedad.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EntregaController::rechazar
 * @see app/Http/Controllers/EntregaController.php:904
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
 * @see app/Http/Controllers/EntregaController.php:904
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
 * @see app/Http/Controllers/EntregaController.php:904
 * @route '/logistica/entregas/{entrega}/rechazar'
 */
rechazar.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rechazar.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EntregaController::registrarUbicacion
 * @see app/Http/Controllers/EntregaController.php:960
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
 * @see app/Http/Controllers/EntregaController.php:960
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
 * @see app/Http/Controllers/EntregaController.php:960
 * @route '/logistica/entregas/{entrega}/ubicacion'
 */
registrarUbicacion.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarUbicacion.url(args, options),
    method: 'post',
})
const EntregaController = { store, index, dashboardStats, debugVentas, create, searchVentas, optimizarRutas, show, asignarChoferVehiculo, iniciar, registrarLlegada, confirmar, reportarNovedad, rechazar, registrarUbicacion }

export default EntregaController