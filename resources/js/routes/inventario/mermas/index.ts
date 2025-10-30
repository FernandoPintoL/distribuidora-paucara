import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\InventarioController::index
 * @see app/Http/Controllers/InventarioController.php:934
 * @route '/inventario/mermas'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/inventario/mermas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::index
 * @see app/Http/Controllers/InventarioController.php:934
 * @route '/inventario/mermas'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::index
 * @see app/Http/Controllers/InventarioController.php:934
 * @route '/inventario/mermas'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::index
 * @see app/Http/Controllers/InventarioController.php:934
 * @route '/inventario/mermas'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::index
 * @see app/Http/Controllers/InventarioController.php:934
 * @route '/inventario/mermas'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::index
 * @see app/Http/Controllers/InventarioController.php:934
 * @route '/inventario/mermas'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::index
 * @see app/Http/Controllers/InventarioController.php:934
 * @route '/inventario/mermas'
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
* @see \App\Http\Controllers\InventarioController::registrar
 * @see app/Http/Controllers/InventarioController.php:959
 * @route '/inventario/mermas/registrar'
 */
export const registrar = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: registrar.url(options),
    method: 'get',
})

registrar.definition = {
    methods: ["get","head"],
    url: '/inventario/mermas/registrar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::registrar
 * @see app/Http/Controllers/InventarioController.php:959
 * @route '/inventario/mermas/registrar'
 */
registrar.url = (options?: RouteQueryOptions) => {
    return registrar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::registrar
 * @see app/Http/Controllers/InventarioController.php:959
 * @route '/inventario/mermas/registrar'
 */
registrar.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: registrar.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::registrar
 * @see app/Http/Controllers/InventarioController.php:959
 * @route '/inventario/mermas/registrar'
 */
registrar.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: registrar.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::registrar
 * @see app/Http/Controllers/InventarioController.php:959
 * @route '/inventario/mermas/registrar'
 */
    const registrarForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: registrar.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::registrar
 * @see app/Http/Controllers/InventarioController.php:959
 * @route '/inventario/mermas/registrar'
 */
        registrarForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: registrar.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::registrar
 * @see app/Http/Controllers/InventarioController.php:959
 * @route '/inventario/mermas/registrar'
 */
        registrarForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: registrar.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    registrar.form = registrarForm
/**
* @see \App\Http\Controllers\InventarioController::store
 * @see app/Http/Controllers/InventarioController.php:773
 * @route '/inventario/mermas/registrar'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/inventario/mermas/registrar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventarioController::store
 * @see app/Http/Controllers/InventarioController.php:773
 * @route '/inventario/mermas/registrar'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::store
 * @see app/Http/Controllers/InventarioController.php:773
 * @route '/inventario/mermas/registrar'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::store
 * @see app/Http/Controllers/InventarioController.php:773
 * @route '/inventario/mermas/registrar'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::store
 * @see app/Http/Controllers/InventarioController.php:773
 * @route '/inventario/mermas/registrar'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\InventarioController::show
 * @see app/Http/Controllers/InventarioController.php:1110
 * @route '/inventario/mermas/{merma}'
 */
export const show = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/inventario/mermas/{merma}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::show
 * @see app/Http/Controllers/InventarioController.php:1110
 * @route '/inventario/mermas/{merma}'
 */
show.url = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { merma: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    merma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        merma: args.merma,
                }

    return show.definition.url
            .replace('{merma}', parsedArgs.merma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::show
 * @see app/Http/Controllers/InventarioController.php:1110
 * @route '/inventario/mermas/{merma}'
 */
show.get = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::show
 * @see app/Http/Controllers/InventarioController.php:1110
 * @route '/inventario/mermas/{merma}'
 */
show.head = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::show
 * @see app/Http/Controllers/InventarioController.php:1110
 * @route '/inventario/mermas/{merma}'
 */
    const showForm = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::show
 * @see app/Http/Controllers/InventarioController.php:1110
 * @route '/inventario/mermas/{merma}'
 */
        showForm.get = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::show
 * @see app/Http/Controllers/InventarioController.php:1110
 * @route '/inventario/mermas/{merma}'
 */
        showForm.head = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\InventarioController::aprobar
 * @see app/Http/Controllers/InventarioController.php:1167
 * @route '/inventario/mermas/{merma}/aprobar'
 */
export const aprobar = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: aprobar.url(args, options),
    method: 'post',
})

aprobar.definition = {
    methods: ["post"],
    url: '/inventario/mermas/{merma}/aprobar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventarioController::aprobar
 * @see app/Http/Controllers/InventarioController.php:1167
 * @route '/inventario/mermas/{merma}/aprobar'
 */
aprobar.url = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { merma: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    merma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        merma: args.merma,
                }

    return aprobar.definition.url
            .replace('{merma}', parsedArgs.merma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::aprobar
 * @see app/Http/Controllers/InventarioController.php:1167
 * @route '/inventario/mermas/{merma}/aprobar'
 */
aprobar.post = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: aprobar.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::aprobar
 * @see app/Http/Controllers/InventarioController.php:1167
 * @route '/inventario/mermas/{merma}/aprobar'
 */
    const aprobarForm = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: aprobar.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::aprobar
 * @see app/Http/Controllers/InventarioController.php:1167
 * @route '/inventario/mermas/{merma}/aprobar'
 */
        aprobarForm.post = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: aprobar.url(args, options),
            method: 'post',
        })
    
    aprobar.form = aprobarForm
/**
* @see \App\Http\Controllers\InventarioController::rechazar
 * @see app/Http/Controllers/InventarioController.php:1217
 * @route '/inventario/mermas/{merma}/rechazar'
 */
export const rechazar = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rechazar.url(args, options),
    method: 'post',
})

rechazar.definition = {
    methods: ["post"],
    url: '/inventario/mermas/{merma}/rechazar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventarioController::rechazar
 * @see app/Http/Controllers/InventarioController.php:1217
 * @route '/inventario/mermas/{merma}/rechazar'
 */
rechazar.url = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { merma: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    merma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        merma: args.merma,
                }

    return rechazar.definition.url
            .replace('{merma}', parsedArgs.merma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::rechazar
 * @see app/Http/Controllers/InventarioController.php:1217
 * @route '/inventario/mermas/{merma}/rechazar'
 */
rechazar.post = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rechazar.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::rechazar
 * @see app/Http/Controllers/InventarioController.php:1217
 * @route '/inventario/mermas/{merma}/rechazar'
 */
    const rechazarForm = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rechazar.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::rechazar
 * @see app/Http/Controllers/InventarioController.php:1217
 * @route '/inventario/mermas/{merma}/rechazar'
 */
        rechazarForm.post = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rechazar.url(args, options),
            method: 'post',
        })
    
    rechazar.form = rechazarForm
const mermas = {
    index,
registrar,
store,
show,
aprobar,
rechazar,
}

export default mermas