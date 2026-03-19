import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PrestableController::index
 * @see app/Http/Controllers/PrestableController.php:24
 * @route '/api/prestables'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/prestables',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestableController::index
 * @see app/Http/Controllers/PrestableController.php:24
 * @route '/api/prestables'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestableController::index
 * @see app/Http/Controllers/PrestableController.php:24
 * @route '/api/prestables'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestableController::index
 * @see app/Http/Controllers/PrestableController.php:24
 * @route '/api/prestables'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestableController::index
 * @see app/Http/Controllers/PrestableController.php:24
 * @route '/api/prestables'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestableController::index
 * @see app/Http/Controllers/PrestableController.php:24
 * @route '/api/prestables'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestableController::index
 * @see app/Http/Controllers/PrestableController.php:24
 * @route '/api/prestables'
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
* @see \App\Http\Controllers\PrestableController::store
 * @see app/Http/Controllers/PrestableController.php:65
 * @route '/api/prestables'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/prestables',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PrestableController::store
 * @see app/Http/Controllers/PrestableController.php:65
 * @route '/api/prestables'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestableController::store
 * @see app/Http/Controllers/PrestableController.php:65
 * @route '/api/prestables'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PrestableController::store
 * @see app/Http/Controllers/PrestableController.php:65
 * @route '/api/prestables'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PrestableController::store
 * @see app/Http/Controllers/PrestableController.php:65
 * @route '/api/prestables'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\PrestableController::show
 * @see app/Http/Controllers/PrestableController.php:191
 * @route '/api/prestables/{prestable}'
 */
export const show = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/prestables/{prestable}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestableController::show
 * @see app/Http/Controllers/PrestableController.php:191
 * @route '/api/prestables/{prestable}'
 */
show.url = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { prestable: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { prestable: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    prestable: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        prestable: typeof args.prestable === 'object'
                ? args.prestable.id
                : args.prestable,
                }

    return show.definition.url
            .replace('{prestable}', parsedArgs.prestable.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestableController::show
 * @see app/Http/Controllers/PrestableController.php:191
 * @route '/api/prestables/{prestable}'
 */
show.get = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestableController::show
 * @see app/Http/Controllers/PrestableController.php:191
 * @route '/api/prestables/{prestable}'
 */
show.head = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestableController::show
 * @see app/Http/Controllers/PrestableController.php:191
 * @route '/api/prestables/{prestable}'
 */
    const showForm = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestableController::show
 * @see app/Http/Controllers/PrestableController.php:191
 * @route '/api/prestables/{prestable}'
 */
        showForm.get = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestableController::show
 * @see app/Http/Controllers/PrestableController.php:191
 * @route '/api/prestables/{prestable}'
 */
        showForm.head = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\PrestableController::update
 * @see app/Http/Controllers/PrestableController.php:215
 * @route '/api/prestables/{prestable}'
 */
export const update = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/prestables/{prestable}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\PrestableController::update
 * @see app/Http/Controllers/PrestableController.php:215
 * @route '/api/prestables/{prestable}'
 */
update.url = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { prestable: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { prestable: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    prestable: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        prestable: typeof args.prestable === 'object'
                ? args.prestable.id
                : args.prestable,
                }

    return update.definition.url
            .replace('{prestable}', parsedArgs.prestable.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestableController::update
 * @see app/Http/Controllers/PrestableController.php:215
 * @route '/api/prestables/{prestable}'
 */
update.put = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\PrestableController::update
 * @see app/Http/Controllers/PrestableController.php:215
 * @route '/api/prestables/{prestable}'
 */
    const updateForm = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PrestableController::update
 * @see app/Http/Controllers/PrestableController.php:215
 * @route '/api/prestables/{prestable}'
 */
        updateForm.put = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\PrestableController::destroy
 * @see app/Http/Controllers/PrestableController.php:337
 * @route '/api/prestables/{prestable}'
 */
export const destroy = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/prestables/{prestable}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\PrestableController::destroy
 * @see app/Http/Controllers/PrestableController.php:337
 * @route '/api/prestables/{prestable}'
 */
destroy.url = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { prestable: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { prestable: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    prestable: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        prestable: typeof args.prestable === 'object'
                ? args.prestable.id
                : args.prestable,
                }

    return destroy.definition.url
            .replace('{prestable}', parsedArgs.prestable.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestableController::destroy
 * @see app/Http/Controllers/PrestableController.php:337
 * @route '/api/prestables/{prestable}'
 */
destroy.delete = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\PrestableController::destroy
 * @see app/Http/Controllers/PrestableController.php:337
 * @route '/api/prestables/{prestable}'
 */
    const destroyForm = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PrestableController::destroy
 * @see app/Http/Controllers/PrestableController.php:337
 * @route '/api/prestables/{prestable}'
 */
        destroyForm.delete = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
/**
* @see \App\Http\Controllers\PrestableController::obtenerStock
 * @see app/Http/Controllers/PrestableController.php:361
 * @route '/api/prestables/{prestable}/stock'
 */
export const obtenerStock = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerStock.url(args, options),
    method: 'get',
})

obtenerStock.definition = {
    methods: ["get","head"],
    url: '/api/prestables/{prestable}/stock',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestableController::obtenerStock
 * @see app/Http/Controllers/PrestableController.php:361
 * @route '/api/prestables/{prestable}/stock'
 */
obtenerStock.url = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { prestable: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { prestable: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    prestable: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        prestable: typeof args.prestable === 'object'
                ? args.prestable.id
                : args.prestable,
                }

    return obtenerStock.definition.url
            .replace('{prestable}', parsedArgs.prestable.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestableController::obtenerStock
 * @see app/Http/Controllers/PrestableController.php:361
 * @route '/api/prestables/{prestable}/stock'
 */
obtenerStock.get = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerStock.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestableController::obtenerStock
 * @see app/Http/Controllers/PrestableController.php:361
 * @route '/api/prestables/{prestable}/stock'
 */
obtenerStock.head = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerStock.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestableController::obtenerStock
 * @see app/Http/Controllers/PrestableController.php:361
 * @route '/api/prestables/{prestable}/stock'
 */
    const obtenerStockForm = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerStock.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestableController::obtenerStock
 * @see app/Http/Controllers/PrestableController.php:361
 * @route '/api/prestables/{prestable}/stock'
 */
        obtenerStockForm.get = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerStock.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestableController::obtenerStock
 * @see app/Http/Controllers/PrestableController.php:361
 * @route '/api/prestables/{prestable}/stock'
 */
        obtenerStockForm.head = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerStock.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerStock.form = obtenerStockForm
/**
* @see \App\Http\Controllers\PrestableController::incrementarStock
 * @see app/Http/Controllers/PrestableController.php:380
 * @route '/api/prestables/{prestable}/stock/incrementar'
 */
export const incrementarStock = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: incrementarStock.url(args, options),
    method: 'post',
})

incrementarStock.definition = {
    methods: ["post"],
    url: '/api/prestables/{prestable}/stock/incrementar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PrestableController::incrementarStock
 * @see app/Http/Controllers/PrestableController.php:380
 * @route '/api/prestables/{prestable}/stock/incrementar'
 */
incrementarStock.url = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { prestable: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { prestable: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    prestable: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        prestable: typeof args.prestable === 'object'
                ? args.prestable.id
                : args.prestable,
                }

    return incrementarStock.definition.url
            .replace('{prestable}', parsedArgs.prestable.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestableController::incrementarStock
 * @see app/Http/Controllers/PrestableController.php:380
 * @route '/api/prestables/{prestable}/stock/incrementar'
 */
incrementarStock.post = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: incrementarStock.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PrestableController::incrementarStock
 * @see app/Http/Controllers/PrestableController.php:380
 * @route '/api/prestables/{prestable}/stock/incrementar'
 */
    const incrementarStockForm = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: incrementarStock.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PrestableController::incrementarStock
 * @see app/Http/Controllers/PrestableController.php:380
 * @route '/api/prestables/{prestable}/stock/incrementar'
 */
        incrementarStockForm.post = (args: { prestable: string | number | { id: string | number } } | [prestable: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: incrementarStock.url(args, options),
            method: 'post',
        })
    
    incrementarStock.form = incrementarStockForm
const PrestableController = { index, store, show, update, destroy, obtenerStock, incrementarStock }

export default PrestableController