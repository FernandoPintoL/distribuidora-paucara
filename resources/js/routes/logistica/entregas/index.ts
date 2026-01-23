import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
import ventas from './ventas'
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
 * @see routes/web.php:502
 * @route '/logistica/entregas/asignadas'
 */
export const asignadas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: asignadas.url(options),
    method: 'get',
})

asignadas.definition = {
    methods: ["get","head"],
    url: '/logistica/entregas/asignadas',
} satisfies RouteDefinition<["get","head"]>

/**
 * @see routes/web.php:502
 * @route '/logistica/entregas/asignadas'
 */
asignadas.url = (options?: RouteQueryOptions) => {
    return asignadas.definition.url + queryParams(options)
}

/**
 * @see routes/web.php:502
 * @route '/logistica/entregas/asignadas'
 */
asignadas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: asignadas.url(options),
    method: 'get',
})
/**
 * @see routes/web.php:502
 * @route '/logistica/entregas/asignadas'
 */
asignadas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: asignadas.url(options),
    method: 'head',
})

/**
 * @see routes/web.php:503
 * @route '/logistica/entregas/en-transito'
 */
export const enTransito = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: enTransito.url(options),
    method: 'get',
})

enTransito.definition = {
    methods: ["get","head"],
    url: '/logistica/entregas/en-transito',
} satisfies RouteDefinition<["get","head"]>

/**
 * @see routes/web.php:503
 * @route '/logistica/entregas/en-transito'
 */
enTransito.url = (options?: RouteQueryOptions) => {
    return enTransito.definition.url + queryParams(options)
}

/**
 * @see routes/web.php:503
 * @route '/logistica/entregas/en-transito'
 */
enTransito.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: enTransito.url(options),
    method: 'get',
})
/**
 * @see routes/web.php:503
 * @route '/logistica/entregas/en-transito'
 */
enTransito.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: enTransito.url(options),
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
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/logistica/entregas/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:195
 * @route '/logistica/entregas/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:195
 * @route '/logistica/entregas/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EntregaController::create
 * @see app/Http/Controllers/EntregaController.php:195
 * @route '/logistica/entregas/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EntregaController::createBatch
 * @see app/Http/Controllers/EntregaController.php:195
 * @route '/logistica/entregas/crear-lote'
 */
export const createBatch = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: createBatch.url(options),
    method: 'get',
})

createBatch.definition = {
    methods: ["get","head"],
    url: '/logistica/entregas/crear-lote',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EntregaController::createBatch
 * @see app/Http/Controllers/EntregaController.php:195
 * @route '/logistica/entregas/crear-lote'
 */
createBatch.url = (options?: RouteQueryOptions) => {
    return createBatch.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::createBatch
 * @see app/Http/Controllers/EntregaController.php:195
 * @route '/logistica/entregas/crear-lote'
 */
createBatch.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: createBatch.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EntregaController::createBatch
 * @see app/Http/Controllers/EntregaController.php:195
 * @route '/logistica/entregas/crear-lote'
 */
createBatch.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: createBatch.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EntregaController::optimizar
 * @see app/Http/Controllers/EntregaController.php:1084
 * @route '/logistica/entregas/optimizar'
 */
export const optimizar = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: optimizar.url(options),
    method: 'post',
})

optimizar.definition = {
    methods: ["post"],
    url: '/logistica/entregas/optimizar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EntregaController::optimizar
 * @see app/Http/Controllers/EntregaController.php:1084
 * @route '/logistica/entregas/optimizar'
 */
optimizar.url = (options?: RouteQueryOptions) => {
    return optimizar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::optimizar
 * @see app/Http/Controllers/EntregaController.php:1084
 * @route '/logistica/entregas/optimizar'
 */
optimizar.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: optimizar.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:481
 * @route '/logistica/entregas'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/logistica/entregas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:481
 * @route '/logistica/entregas'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::store
 * @see app/Http/Controllers/EntregaController.php:481
 * @route '/logistica/entregas'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
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
* @see \App\Http\Controllers\EntregaController::asignar
 * @see app/Http/Controllers/EntregaController.php:692
 * @route '/logistica/entregas/{entrega}/asignar'
 */
export const asignar = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: asignar.url(args, options),
    method: 'post',
})

asignar.definition = {
    methods: ["post"],
    url: '/logistica/entregas/{entrega}/asignar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EntregaController::asignar
 * @see app/Http/Controllers/EntregaController.php:692
 * @route '/logistica/entregas/{entrega}/asignar'
 */
asignar.url = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return asignar.definition.url
            .replace('{entrega}', parsedArgs.entrega.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::asignar
 * @see app/Http/Controllers/EntregaController.php:692
 * @route '/logistica/entregas/{entrega}/asignar'
 */
asignar.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: asignar.url(args, options),
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
* @see \App\Http\Controllers\EntregaController::llego
 * @see app/Http/Controllers/EntregaController.php:1119
 * @route '/logistica/entregas/{entrega}/llego'
 */
export const llego = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: llego.url(args, options),
    method: 'post',
})

llego.definition = {
    methods: ["post"],
    url: '/logistica/entregas/{entrega}/llego',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EntregaController::llego
 * @see app/Http/Controllers/EntregaController.php:1119
 * @route '/logistica/entregas/{entrega}/llego'
 */
llego.url = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return llego.definition.url
            .replace('{entrega}', parsedArgs.entrega.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::llego
 * @see app/Http/Controllers/EntregaController.php:1119
 * @route '/logistica/entregas/{entrega}/llego'
 */
llego.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: llego.url(args, options),
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
* @see \App\Http\Controllers\EntregaController::novedad
 * @see app/Http/Controllers/EntregaController.php:1143
 * @route '/logistica/entregas/{entrega}/novedad'
 */
export const novedad = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: novedad.url(args, options),
    method: 'post',
})

novedad.definition = {
    methods: ["post"],
    url: '/logistica/entregas/{entrega}/novedad',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EntregaController::novedad
 * @see app/Http/Controllers/EntregaController.php:1143
 * @route '/logistica/entregas/{entrega}/novedad'
 */
novedad.url = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return novedad.definition.url
            .replace('{entrega}', parsedArgs.entrega.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::novedad
 * @see app/Http/Controllers/EntregaController.php:1143
 * @route '/logistica/entregas/{entrega}/novedad'
 */
novedad.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: novedad.url(args, options),
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
* @see \App\Http\Controllers\EntregaController::ubicacion
 * @see app/Http/Controllers/EntregaController.php:960
 * @route '/logistica/entregas/{entrega}/ubicacion'
 */
export const ubicacion = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ubicacion.url(args, options),
    method: 'post',
})

ubicacion.definition = {
    methods: ["post"],
    url: '/logistica/entregas/{entrega}/ubicacion',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EntregaController::ubicacion
 * @see app/Http/Controllers/EntregaController.php:960
 * @route '/logistica/entregas/{entrega}/ubicacion'
 */
ubicacion.url = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return ubicacion.definition.url
            .replace('{entrega}', parsedArgs.entrega.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EntregaController::ubicacion
 * @see app/Http/Controllers/EntregaController.php:960
 * @route '/logistica/entregas/{entrega}/ubicacion'
 */
ubicacion.post = (args: { entrega: string | number } | [entrega: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ubicacion.url(args, options),
    method: 'post',
})
const entregas = {
    index,
asignadas,
enTransito,
dashboardStats,
debugVentas,
create,
ventas,
createBatch,
optimizar,
store,
show,
asignar,
iniciar,
llego,
confirmar,
novedad,
rechazar,
ubicacion,
}

export default entregas