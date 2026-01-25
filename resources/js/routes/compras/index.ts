import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
import cuentasPorPagar from './cuentas-por-pagar'
import pagos from './pagos'
import lotesVencimientos from './lotes-vencimientos'
import reportes from './reportes'
import detalles from './detalles'
/**
* @see \App\Http\Controllers\CompraController::index
 * @see app/Http/Controllers/CompraController.php:35
 * @route '/compras'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/compras',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CompraController::index
 * @see app/Http/Controllers/CompraController.php:35
 * @route '/compras'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CompraController::index
 * @see app/Http/Controllers/CompraController.php:35
 * @route '/compras'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CompraController::index
 * @see app/Http/Controllers/CompraController.php:35
 * @route '/compras'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CompraController::index
 * @see app/Http/Controllers/CompraController.php:35
 * @route '/compras'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CompraController::index
 * @see app/Http/Controllers/CompraController.php:35
 * @route '/compras'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CompraController::index
 * @see app/Http/Controllers/CompraController.php:35
 * @route '/compras'
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
* @see \App\Http\Controllers\CompraController::create
 * @see app/Http/Controllers/CompraController.php:134
 * @route '/compras/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/compras/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CompraController::create
 * @see app/Http/Controllers/CompraController.php:134
 * @route '/compras/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CompraController::create
 * @see app/Http/Controllers/CompraController.php:134
 * @route '/compras/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CompraController::create
 * @see app/Http/Controllers/CompraController.php:134
 * @route '/compras/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CompraController::create
 * @see app/Http/Controllers/CompraController.php:134
 * @route '/compras/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CompraController::create
 * @see app/Http/Controllers/CompraController.php:134
 * @route '/compras/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CompraController::create
 * @see app/Http/Controllers/CompraController.php:134
 * @route '/compras/create'
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
* @see \App\Http\Controllers\CompraController::store
 * @see app/Http/Controllers/CompraController.php:301
 * @route '/compras'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/compras',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CompraController::store
 * @see app/Http/Controllers/CompraController.php:301
 * @route '/compras'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CompraController::store
 * @see app/Http/Controllers/CompraController.php:301
 * @route '/compras'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\CompraController::store
 * @see app/Http/Controllers/CompraController.php:301
 * @route '/compras'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CompraController::store
 * @see app/Http/Controllers/CompraController.php:301
 * @route '/compras'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\CompraController::show
 * @see app/Http/Controllers/CompraController.php:218
 * @route '/compras/{compra}'
 */
export const show = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/compras/{compra}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CompraController::show
 * @see app/Http/Controllers/CompraController.php:218
 * @route '/compras/{compra}'
 */
show.url = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { compra: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    compra: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        compra: args.compra,
                }

    return show.definition.url
            .replace('{compra}', parsedArgs.compra.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CompraController::show
 * @see app/Http/Controllers/CompraController.php:218
 * @route '/compras/{compra}'
 */
show.get = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CompraController::show
 * @see app/Http/Controllers/CompraController.php:218
 * @route '/compras/{compra}'
 */
show.head = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CompraController::show
 * @see app/Http/Controllers/CompraController.php:218
 * @route '/compras/{compra}'
 */
    const showForm = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CompraController::show
 * @see app/Http/Controllers/CompraController.php:218
 * @route '/compras/{compra}'
 */
        showForm.get = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CompraController::show
 * @see app/Http/Controllers/CompraController.php:218
 * @route '/compras/{compra}'
 */
        showForm.head = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\CompraController::edit
 * @see app/Http/Controllers/CompraController.php:228
 * @route '/compras/{compra}/edit'
 */
export const edit = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/compras/{compra}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CompraController::edit
 * @see app/Http/Controllers/CompraController.php:228
 * @route '/compras/{compra}/edit'
 */
edit.url = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { compra: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    compra: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        compra: args.compra,
                }

    return edit.definition.url
            .replace('{compra}', parsedArgs.compra.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CompraController::edit
 * @see app/Http/Controllers/CompraController.php:228
 * @route '/compras/{compra}/edit'
 */
edit.get = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CompraController::edit
 * @see app/Http/Controllers/CompraController.php:228
 * @route '/compras/{compra}/edit'
 */
edit.head = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CompraController::edit
 * @see app/Http/Controllers/CompraController.php:228
 * @route '/compras/{compra}/edit'
 */
    const editForm = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CompraController::edit
 * @see app/Http/Controllers/CompraController.php:228
 * @route '/compras/{compra}/edit'
 */
        editForm.get = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CompraController::edit
 * @see app/Http/Controllers/CompraController.php:228
 * @route '/compras/{compra}/edit'
 */
        editForm.head = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
/**
* @see \App\Http\Controllers\CompraController::update
 * @see app/Http/Controllers/CompraController.php:372
 * @route '/compras/{compra}'
 */
export const update = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/compras/{compra}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\CompraController::update
 * @see app/Http/Controllers/CompraController.php:372
 * @route '/compras/{compra}'
 */
update.url = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { compra: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    compra: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        compra: args.compra,
                }

    return update.definition.url
            .replace('{compra}', parsedArgs.compra.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CompraController::update
 * @see app/Http/Controllers/CompraController.php:372
 * @route '/compras/{compra}'
 */
update.put = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\CompraController::update
 * @see app/Http/Controllers/CompraController.php:372
 * @route '/compras/{compra}'
 */
update.patch = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\CompraController::update
 * @see app/Http/Controllers/CompraController.php:372
 * @route '/compras/{compra}'
 */
    const updateForm = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CompraController::update
 * @see app/Http/Controllers/CompraController.php:372
 * @route '/compras/{compra}'
 */
        updateForm.put = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\CompraController::update
 * @see app/Http/Controllers/CompraController.php:372
 * @route '/compras/{compra}'
 */
        updateForm.patch = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\CompraController::imprimir
 * @see app/Http/Controllers/CompraController.php:996
 * @route '/compras/{compra}/imprimir'
 */
export const imprimir = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir.url(args, options),
    method: 'get',
})

imprimir.definition = {
    methods: ["get","head"],
    url: '/compras/{compra}/imprimir',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CompraController::imprimir
 * @see app/Http/Controllers/CompraController.php:996
 * @route '/compras/{compra}/imprimir'
 */
imprimir.url = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { compra: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { compra: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    compra: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        compra: typeof args.compra === 'object'
                ? args.compra.id
                : args.compra,
                }

    return imprimir.definition.url
            .replace('{compra}', parsedArgs.compra.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CompraController::imprimir
 * @see app/Http/Controllers/CompraController.php:996
 * @route '/compras/{compra}/imprimir'
 */
imprimir.get = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CompraController::imprimir
 * @see app/Http/Controllers/CompraController.php:996
 * @route '/compras/{compra}/imprimir'
 */
imprimir.head = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imprimir.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CompraController::imprimir
 * @see app/Http/Controllers/CompraController.php:996
 * @route '/compras/{compra}/imprimir'
 */
    const imprimirForm = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: imprimir.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CompraController::imprimir
 * @see app/Http/Controllers/CompraController.php:996
 * @route '/compras/{compra}/imprimir'
 */
        imprimirForm.get = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimir.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CompraController::imprimir
 * @see app/Http/Controllers/CompraController.php:996
 * @route '/compras/{compra}/imprimir'
 */
        imprimirForm.head = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimir.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    imprimir.form = imprimirForm
/**
* @see \App\Http\Controllers\CompraController::preview
 * @see app/Http/Controllers/CompraController.php:1065
 * @route '/compras/{compra}/preview'
 */
export const preview = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: preview.url(args, options),
    method: 'get',
})

preview.definition = {
    methods: ["get","head"],
    url: '/compras/{compra}/preview',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CompraController::preview
 * @see app/Http/Controllers/CompraController.php:1065
 * @route '/compras/{compra}/preview'
 */
preview.url = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { compra: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { compra: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    compra: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        compra: typeof args.compra === 'object'
                ? args.compra.id
                : args.compra,
                }

    return preview.definition.url
            .replace('{compra}', parsedArgs.compra.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CompraController::preview
 * @see app/Http/Controllers/CompraController.php:1065
 * @route '/compras/{compra}/preview'
 */
preview.get = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: preview.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CompraController::preview
 * @see app/Http/Controllers/CompraController.php:1065
 * @route '/compras/{compra}/preview'
 */
preview.head = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: preview.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CompraController::preview
 * @see app/Http/Controllers/CompraController.php:1065
 * @route '/compras/{compra}/preview'
 */
    const previewForm = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: preview.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CompraController::preview
 * @see app/Http/Controllers/CompraController.php:1065
 * @route '/compras/{compra}/preview'
 */
        previewForm.get = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: preview.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CompraController::preview
 * @see app/Http/Controllers/CompraController.php:1065
 * @route '/compras/{compra}/preview'
 */
        previewForm.head = (args: { compra: number | { id: number } } | [compra: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: preview.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    preview.form = previewForm
const compras = {
    cuentasPorPagar,
pagos,
lotesVencimientos,
reportes,
index,
create,
store,
show,
edit,
update,
detalles,
imprimir,
preview,
}

export default compras