import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\UserController::index
 * @see app/Http/Controllers/UserController.php:27
 * @route '/usuarios'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/usuarios',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UserController::index
 * @see app/Http/Controllers/UserController.php:27
 * @route '/usuarios'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserController::index
 * @see app/Http/Controllers/UserController.php:27
 * @route '/usuarios'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UserController::index
 * @see app/Http/Controllers/UserController.php:27
 * @route '/usuarios'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UserController::index
 * @see app/Http/Controllers/UserController.php:27
 * @route '/usuarios'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UserController::index
 * @see app/Http/Controllers/UserController.php:27
 * @route '/usuarios'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UserController::index
 * @see app/Http/Controllers/UserController.php:27
 * @route '/usuarios'
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
* @see \App\Http\Controllers\UserController::create
 * @see app/Http/Controllers/UserController.php:61
 * @route '/usuarios/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/usuarios/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UserController::create
 * @see app/Http/Controllers/UserController.php:61
 * @route '/usuarios/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserController::create
 * @see app/Http/Controllers/UserController.php:61
 * @route '/usuarios/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UserController::create
 * @see app/Http/Controllers/UserController.php:61
 * @route '/usuarios/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UserController::create
 * @see app/Http/Controllers/UserController.php:61
 * @route '/usuarios/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UserController::create
 * @see app/Http/Controllers/UserController.php:61
 * @route '/usuarios/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UserController::create
 * @see app/Http/Controllers/UserController.php:61
 * @route '/usuarios/create'
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
* @see \App\Http\Controllers\UserController::store
 * @see app/Http/Controllers/UserController.php:74
 * @route '/usuarios'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/usuarios',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserController::store
 * @see app/Http/Controllers/UserController.php:74
 * @route '/usuarios'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserController::store
 * @see app/Http/Controllers/UserController.php:74
 * @route '/usuarios'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UserController::store
 * @see app/Http/Controllers/UserController.php:74
 * @route '/usuarios'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserController::store
 * @see app/Http/Controllers/UserController.php:74
 * @route '/usuarios'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\UserController::show
 * @see app/Http/Controllers/UserController.php:108
 * @route '/usuarios/{usuario}'
 */
export const show = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/usuarios/{usuario}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UserController::show
 * @see app/Http/Controllers/UserController.php:108
 * @route '/usuarios/{usuario}'
 */
show.url = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { usuario: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    usuario: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        usuario: args.usuario,
                }

    return show.definition.url
            .replace('{usuario}', parsedArgs.usuario.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserController::show
 * @see app/Http/Controllers/UserController.php:108
 * @route '/usuarios/{usuario}'
 */
show.get = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UserController::show
 * @see app/Http/Controllers/UserController.php:108
 * @route '/usuarios/{usuario}'
 */
show.head = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UserController::show
 * @see app/Http/Controllers/UserController.php:108
 * @route '/usuarios/{usuario}'
 */
    const showForm = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UserController::show
 * @see app/Http/Controllers/UserController.php:108
 * @route '/usuarios/{usuario}'
 */
        showForm.get = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UserController::show
 * @see app/Http/Controllers/UserController.php:108
 * @route '/usuarios/{usuario}'
 */
        showForm.head = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\UserController::edit
 * @see app/Http/Controllers/UserController.php:120
 * @route '/usuarios/{usuario}/edit'
 */
export const edit = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/usuarios/{usuario}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UserController::edit
 * @see app/Http/Controllers/UserController.php:120
 * @route '/usuarios/{usuario}/edit'
 */
edit.url = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { usuario: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    usuario: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        usuario: args.usuario,
                }

    return edit.definition.url
            .replace('{usuario}', parsedArgs.usuario.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserController::edit
 * @see app/Http/Controllers/UserController.php:120
 * @route '/usuarios/{usuario}/edit'
 */
edit.get = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UserController::edit
 * @see app/Http/Controllers/UserController.php:120
 * @route '/usuarios/{usuario}/edit'
 */
edit.head = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UserController::edit
 * @see app/Http/Controllers/UserController.php:120
 * @route '/usuarios/{usuario}/edit'
 */
    const editForm = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UserController::edit
 * @see app/Http/Controllers/UserController.php:120
 * @route '/usuarios/{usuario}/edit'
 */
        editForm.get = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UserController::edit
 * @see app/Http/Controllers/UserController.php:120
 * @route '/usuarios/{usuario}/edit'
 */
        editForm.head = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\UserController::update
 * @see app/Http/Controllers/UserController.php:137
 * @route '/usuarios/{usuario}'
 */
export const update = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/usuarios/{usuario}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\UserController::update
 * @see app/Http/Controllers/UserController.php:137
 * @route '/usuarios/{usuario}'
 */
update.url = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { usuario: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    usuario: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        usuario: args.usuario,
                }

    return update.definition.url
            .replace('{usuario}', parsedArgs.usuario.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserController::update
 * @see app/Http/Controllers/UserController.php:137
 * @route '/usuarios/{usuario}'
 */
update.put = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\UserController::update
 * @see app/Http/Controllers/UserController.php:137
 * @route '/usuarios/{usuario}'
 */
update.patch = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\UserController::update
 * @see app/Http/Controllers/UserController.php:137
 * @route '/usuarios/{usuario}'
 */
    const updateForm = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserController::update
 * @see app/Http/Controllers/UserController.php:137
 * @route '/usuarios/{usuario}'
 */
        updateForm.put = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\UserController::update
 * @see app/Http/Controllers/UserController.php:137
 * @route '/usuarios/{usuario}'
 */
        updateForm.patch = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\UserController::destroy
 * @see app/Http/Controllers/UserController.php:179
 * @route '/usuarios/{usuario}'
 */
export const destroy = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/usuarios/{usuario}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\UserController::destroy
 * @see app/Http/Controllers/UserController.php:179
 * @route '/usuarios/{usuario}'
 */
destroy.url = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { usuario: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    usuario: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        usuario: args.usuario,
                }

    return destroy.definition.url
            .replace('{usuario}', parsedArgs.usuario.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserController::destroy
 * @see app/Http/Controllers/UserController.php:179
 * @route '/usuarios/{usuario}'
 */
destroy.delete = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\UserController::destroy
 * @see app/Http/Controllers/UserController.php:179
 * @route '/usuarios/{usuario}'
 */
    const destroyForm = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserController::destroy
 * @see app/Http/Controllers/UserController.php:179
 * @route '/usuarios/{usuario}'
 */
        destroyForm.delete = (args: { usuario: string | number } | [usuario: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\UserController::assignRole
 * @see app/Http/Controllers/UserController.php:206
 * @route '/usuarios/{user}/assign-role'
 */
export const assignRole = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: assignRole.url(args, options),
    method: 'post',
})

assignRole.definition = {
    methods: ["post"],
    url: '/usuarios/{user}/assign-role',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserController::assignRole
 * @see app/Http/Controllers/UserController.php:206
 * @route '/usuarios/{user}/assign-role'
 */
assignRole.url = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { user: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { user: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    user: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        user: typeof args.user === 'object'
                ? args.user.id
                : args.user,
                }

    return assignRole.definition.url
            .replace('{user}', parsedArgs.user.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserController::assignRole
 * @see app/Http/Controllers/UserController.php:206
 * @route '/usuarios/{user}/assign-role'
 */
assignRole.post = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: assignRole.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UserController::assignRole
 * @see app/Http/Controllers/UserController.php:206
 * @route '/usuarios/{user}/assign-role'
 */
    const assignRoleForm = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: assignRole.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserController::assignRole
 * @see app/Http/Controllers/UserController.php:206
 * @route '/usuarios/{user}/assign-role'
 */
        assignRoleForm.post = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: assignRole.url(args, options),
            method: 'post',
        })
    
    assignRole.form = assignRoleForm
/**
* @see \App\Http\Controllers\UserController::removeRole
 * @see app/Http/Controllers/UserController.php:217
 * @route '/usuarios/{user}/remove-role'
 */
export const removeRole = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: removeRole.url(args, options),
    method: 'delete',
})

removeRole.definition = {
    methods: ["delete"],
    url: '/usuarios/{user}/remove-role',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\UserController::removeRole
 * @see app/Http/Controllers/UserController.php:217
 * @route '/usuarios/{user}/remove-role'
 */
removeRole.url = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { user: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { user: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    user: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        user: typeof args.user === 'object'
                ? args.user.id
                : args.user,
                }

    return removeRole.definition.url
            .replace('{user}', parsedArgs.user.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserController::removeRole
 * @see app/Http/Controllers/UserController.php:217
 * @route '/usuarios/{user}/remove-role'
 */
removeRole.delete = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: removeRole.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\UserController::removeRole
 * @see app/Http/Controllers/UserController.php:217
 * @route '/usuarios/{user}/remove-role'
 */
    const removeRoleForm = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: removeRole.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserController::removeRole
 * @see app/Http/Controllers/UserController.php:217
 * @route '/usuarios/{user}/remove-role'
 */
        removeRoleForm.delete = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: removeRole.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    removeRole.form = removeRoleForm
/**
* @see \App\Http\Controllers\UserController::assignPermission
 * @see app/Http/Controllers/UserController.php:228
 * @route '/usuarios/{user}/assign-permission'
 */
export const assignPermission = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: assignPermission.url(args, options),
    method: 'post',
})

assignPermission.definition = {
    methods: ["post"],
    url: '/usuarios/{user}/assign-permission',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserController::assignPermission
 * @see app/Http/Controllers/UserController.php:228
 * @route '/usuarios/{user}/assign-permission'
 */
assignPermission.url = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { user: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { user: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    user: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        user: typeof args.user === 'object'
                ? args.user.id
                : args.user,
                }

    return assignPermission.definition.url
            .replace('{user}', parsedArgs.user.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserController::assignPermission
 * @see app/Http/Controllers/UserController.php:228
 * @route '/usuarios/{user}/assign-permission'
 */
assignPermission.post = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: assignPermission.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UserController::assignPermission
 * @see app/Http/Controllers/UserController.php:228
 * @route '/usuarios/{user}/assign-permission'
 */
    const assignPermissionForm = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: assignPermission.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserController::assignPermission
 * @see app/Http/Controllers/UserController.php:228
 * @route '/usuarios/{user}/assign-permission'
 */
        assignPermissionForm.post = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: assignPermission.url(args, options),
            method: 'post',
        })
    
    assignPermission.form = assignPermissionForm
/**
* @see \App\Http\Controllers\UserController::removePermission
 * @see app/Http/Controllers/UserController.php:239
 * @route '/usuarios/{user}/remove-permission'
 */
export const removePermission = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: removePermission.url(args, options),
    method: 'delete',
})

removePermission.definition = {
    methods: ["delete"],
    url: '/usuarios/{user}/remove-permission',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\UserController::removePermission
 * @see app/Http/Controllers/UserController.php:239
 * @route '/usuarios/{user}/remove-permission'
 */
removePermission.url = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { user: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { user: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    user: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        user: typeof args.user === 'object'
                ? args.user.id
                : args.user,
                }

    return removePermission.definition.url
            .replace('{user}', parsedArgs.user.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserController::removePermission
 * @see app/Http/Controllers/UserController.php:239
 * @route '/usuarios/{user}/remove-permission'
 */
removePermission.delete = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: removePermission.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\UserController::removePermission
 * @see app/Http/Controllers/UserController.php:239
 * @route '/usuarios/{user}/remove-permission'
 */
    const removePermissionForm = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: removePermission.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserController::removePermission
 * @see app/Http/Controllers/UserController.php:239
 * @route '/usuarios/{user}/remove-permission'
 */
        removePermissionForm.delete = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: removePermission.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    removePermission.form = removePermissionForm
/**
* @see \App\Http\Controllers\UserController::toggleStatus
 * @see app/Http/Controllers/UserController.php:192
 * @route '/usuarios/{user}/toggle-status'
 */
export const toggleStatus = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/usuarios/{user}/toggle-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\UserController::toggleStatus
 * @see app/Http/Controllers/UserController.php:192
 * @route '/usuarios/{user}/toggle-status'
 */
toggleStatus.url = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { user: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { user: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    user: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        user: typeof args.user === 'object'
                ? args.user.id
                : args.user,
                }

    return toggleStatus.definition.url
            .replace('{user}', parsedArgs.user.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserController::toggleStatus
 * @see app/Http/Controllers/UserController.php:192
 * @route '/usuarios/{user}/toggle-status'
 */
toggleStatus.patch = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\UserController::toggleStatus
 * @see app/Http/Controllers/UserController.php:192
 * @route '/usuarios/{user}/toggle-status'
 */
    const toggleStatusForm = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleStatus.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserController::toggleStatus
 * @see app/Http/Controllers/UserController.php:192
 * @route '/usuarios/{user}/toggle-status'
 */
        toggleStatusForm.patch = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: toggleStatus.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    toggleStatus.form = toggleStatusForm
const UserController = { index, create, store, show, edit, update, destroy, assignRole, removeRole, assignPermission, removePermission, toggleStatus }

export default UserController