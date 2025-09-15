import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::index
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:13
 * @route '/api/tipos-ajuste-inventario'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/tipos-ajuste-inventario',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::index
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:13
 * @route '/api/tipos-ajuste-inventario'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::index
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:13
 * @route '/api/tipos-ajuste-inventario'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::index
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:13
 * @route '/api/tipos-ajuste-inventario'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::index
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:13
 * @route '/api/tipos-ajuste-inventario'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::index
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:13
 * @route '/api/tipos-ajuste-inventario'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::index
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:13
 * @route '/api/tipos-ajuste-inventario'
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
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::store
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:23
 * @route '/api/tipos-ajuste-inventario'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/tipos-ajuste-inventario',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::store
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:23
 * @route '/api/tipos-ajuste-inventario'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::store
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:23
 * @route '/api/tipos-ajuste-inventario'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::store
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:23
 * @route '/api/tipos-ajuste-inventario'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::store
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:23
 * @route '/api/tipos-ajuste-inventario'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::show
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:41
 * @route '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}'
 */
export const show = (args: { tipos_ajuste_inventario: string | number } | [tipos_ajuste_inventario: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::show
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:41
 * @route '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}'
 */
show.url = (args: { tipos_ajuste_inventario: string | number } | [tipos_ajuste_inventario: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { tipos_ajuste_inventario: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    tipos_ajuste_inventario: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        tipos_ajuste_inventario: args.tipos_ajuste_inventario,
                }

    return show.definition.url
            .replace('{tipos_ajuste_inventario}', parsedArgs.tipos_ajuste_inventario.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::show
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:41
 * @route '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}'
 */
show.get = (args: { tipos_ajuste_inventario: string | number } | [tipos_ajuste_inventario: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::show
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:41
 * @route '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}'
 */
show.head = (args: { tipos_ajuste_inventario: string | number } | [tipos_ajuste_inventario: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::show
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:41
 * @route '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}'
 */
    const showForm = (args: { tipos_ajuste_inventario: string | number } | [tipos_ajuste_inventario: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::show
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:41
 * @route '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}'
 */
        showForm.get = (args: { tipos_ajuste_inventario: string | number } | [tipos_ajuste_inventario: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::show
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:41
 * @route '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}'
 */
        showForm.head = (args: { tipos_ajuste_inventario: string | number } | [tipos_ajuste_inventario: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::update
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:49
 * @route '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}'
 */
export const update = (args: { tipos_ajuste_inventario: string | number } | [tipos_ajuste_inventario: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::update
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:49
 * @route '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}'
 */
update.url = (args: { tipos_ajuste_inventario: string | number } | [tipos_ajuste_inventario: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { tipos_ajuste_inventario: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    tipos_ajuste_inventario: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        tipos_ajuste_inventario: args.tipos_ajuste_inventario,
                }

    return update.definition.url
            .replace('{tipos_ajuste_inventario}', parsedArgs.tipos_ajuste_inventario.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::update
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:49
 * @route '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}'
 */
update.put = (args: { tipos_ajuste_inventario: string | number } | [tipos_ajuste_inventario: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::update
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:49
 * @route '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}'
 */
update.patch = (args: { tipos_ajuste_inventario: string | number } | [tipos_ajuste_inventario: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::update
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:49
 * @route '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}'
 */
    const updateForm = (args: { tipos_ajuste_inventario: string | number } | [tipos_ajuste_inventario: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::update
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:49
 * @route '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}'
 */
        updateForm.put = (args: { tipos_ajuste_inventario: string | number } | [tipos_ajuste_inventario: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::update
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:49
 * @route '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}'
 */
        updateForm.patch = (args: { tipos_ajuste_inventario: string | number } | [tipos_ajuste_inventario: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::destroy
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:67
 * @route '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}'
 */
export const destroy = (args: { tipos_ajuste_inventario: string | number } | [tipos_ajuste_inventario: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::destroy
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:67
 * @route '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}'
 */
destroy.url = (args: { tipos_ajuste_inventario: string | number } | [tipos_ajuste_inventario: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { tipos_ajuste_inventario: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    tipos_ajuste_inventario: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        tipos_ajuste_inventario: args.tipos_ajuste_inventario,
                }

    return destroy.definition.url
            .replace('{tipos_ajuste_inventario}', parsedArgs.tipos_ajuste_inventario.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::destroy
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:67
 * @route '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}'
 */
destroy.delete = (args: { tipos_ajuste_inventario: string | number } | [tipos_ajuste_inventario: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::destroy
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:67
 * @route '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}'
 */
    const destroyForm = (args: { tipos_ajuste_inventario: string | number } | [tipos_ajuste_inventario: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\TipoAjustInventarioController::destroy
 * @see app/Http/Controllers/Api/TipoAjustInventarioController.php:67
 * @route '/api/tipos-ajuste-inventario/{tipos_ajuste_inventario}'
 */
        destroyForm.delete = (args: { tipos_ajuste_inventario: string | number } | [tipos_ajuste_inventario: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const tiposAjusteInventario = {
    index,
store,
show,
update,
destroy,
}

export default tiposAjusteInventario