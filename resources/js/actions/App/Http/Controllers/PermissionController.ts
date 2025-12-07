import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PermissionController::getStructure
 * @see app/Http/Controllers/PermissionController.php:114
 * @route '/api/permisos/estructura'
 */
export const getStructure = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStructure.url(options),
    method: 'get',
})

getStructure.definition = {
    methods: ["get","head"],
    url: '/api/permisos/estructura',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PermissionController::getStructure
 * @see app/Http/Controllers/PermissionController.php:114
 * @route '/api/permisos/estructura'
 */
getStructure.url = (options?: RouteQueryOptions) => {
    return getStructure.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PermissionController::getStructure
 * @see app/Http/Controllers/PermissionController.php:114
 * @route '/api/permisos/estructura'
 */
getStructure.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStructure.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PermissionController::getStructure
 * @see app/Http/Controllers/PermissionController.php:114
 * @route '/api/permisos/estructura'
 */
getStructure.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getStructure.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PermissionController::getStructure
 * @see app/Http/Controllers/PermissionController.php:114
 * @route '/api/permisos/estructura'
 */
    const getStructureForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getStructure.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PermissionController::getStructure
 * @see app/Http/Controllers/PermissionController.php:114
 * @route '/api/permisos/estructura'
 */
        getStructureForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStructure.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PermissionController::getStructure
 * @see app/Http/Controllers/PermissionController.php:114
 * @route '/api/permisos/estructura'
 */
        getStructureForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getStructure.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getStructure.form = getStructureForm
/**
* @see \App\Http\Controllers\PermissionController::getGrouped
 * @see app/Http/Controllers/PermissionController.php:128
 * @route '/api/permisos/agrupados'
 */
export const getGrouped = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getGrouped.url(options),
    method: 'get',
})

getGrouped.definition = {
    methods: ["get","head"],
    url: '/api/permisos/agrupados',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PermissionController::getGrouped
 * @see app/Http/Controllers/PermissionController.php:128
 * @route '/api/permisos/agrupados'
 */
getGrouped.url = (options?: RouteQueryOptions) => {
    return getGrouped.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PermissionController::getGrouped
 * @see app/Http/Controllers/PermissionController.php:128
 * @route '/api/permisos/agrupados'
 */
getGrouped.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getGrouped.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PermissionController::getGrouped
 * @see app/Http/Controllers/PermissionController.php:128
 * @route '/api/permisos/agrupados'
 */
getGrouped.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getGrouped.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PermissionController::getGrouped
 * @see app/Http/Controllers/PermissionController.php:128
 * @route '/api/permisos/agrupados'
 */
    const getGroupedForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getGrouped.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PermissionController::getGrouped
 * @see app/Http/Controllers/PermissionController.php:128
 * @route '/api/permisos/agrupados'
 */
        getGroupedForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getGrouped.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PermissionController::getGrouped
 * @see app/Http/Controllers/PermissionController.php:128
 * @route '/api/permisos/agrupados'
 */
        getGroupedForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getGrouped.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getGrouped.form = getGroupedForm
/**
* @see \App\Http\Controllers\PermissionController::editarUsuario
 * @see app/Http/Controllers/PermissionController.php:34
 * @route '/api/permisos/usuario/{user}'
 */
const editarUsuario9cf08b543857fc9bd418de868ac248cb = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: editarUsuario9cf08b543857fc9bd418de868ac248cb.url(args, options),
    method: 'get',
})

editarUsuario9cf08b543857fc9bd418de868ac248cb.definition = {
    methods: ["get","head"],
    url: '/api/permisos/usuario/{user}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PermissionController::editarUsuario
 * @see app/Http/Controllers/PermissionController.php:34
 * @route '/api/permisos/usuario/{user}'
 */
editarUsuario9cf08b543857fc9bd418de868ac248cb.url = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return editarUsuario9cf08b543857fc9bd418de868ac248cb.definition.url
            .replace('{user}', parsedArgs.user.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PermissionController::editarUsuario
 * @see app/Http/Controllers/PermissionController.php:34
 * @route '/api/permisos/usuario/{user}'
 */
editarUsuario9cf08b543857fc9bd418de868ac248cb.get = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: editarUsuario9cf08b543857fc9bd418de868ac248cb.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PermissionController::editarUsuario
 * @see app/Http/Controllers/PermissionController.php:34
 * @route '/api/permisos/usuario/{user}'
 */
editarUsuario9cf08b543857fc9bd418de868ac248cb.head = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: editarUsuario9cf08b543857fc9bd418de868ac248cb.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PermissionController::editarUsuario
 * @see app/Http/Controllers/PermissionController.php:34
 * @route '/api/permisos/usuario/{user}'
 */
    const editarUsuario9cf08b543857fc9bd418de868ac248cbForm = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: editarUsuario9cf08b543857fc9bd418de868ac248cb.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PermissionController::editarUsuario
 * @see app/Http/Controllers/PermissionController.php:34
 * @route '/api/permisos/usuario/{user}'
 */
        editarUsuario9cf08b543857fc9bd418de868ac248cbForm.get = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: editarUsuario9cf08b543857fc9bd418de868ac248cb.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PermissionController::editarUsuario
 * @see app/Http/Controllers/PermissionController.php:34
 * @route '/api/permisos/usuario/{user}'
 */
        editarUsuario9cf08b543857fc9bd418de868ac248cbForm.head = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: editarUsuario9cf08b543857fc9bd418de868ac248cb.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    editarUsuario9cf08b543857fc9bd418de868ac248cb.form = editarUsuario9cf08b543857fc9bd418de868ac248cbForm
    /**
* @see \App\Http\Controllers\PermissionController::editarUsuario
 * @see app/Http/Controllers/PermissionController.php:34
 * @route '/permisos/usuario/{user}/editar'
 */
const editarUsuario2bee7011d8e7df97ab7a25035a15ff84 = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: editarUsuario2bee7011d8e7df97ab7a25035a15ff84.url(args, options),
    method: 'get',
})

editarUsuario2bee7011d8e7df97ab7a25035a15ff84.definition = {
    methods: ["get","head"],
    url: '/permisos/usuario/{user}/editar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PermissionController::editarUsuario
 * @see app/Http/Controllers/PermissionController.php:34
 * @route '/permisos/usuario/{user}/editar'
 */
editarUsuario2bee7011d8e7df97ab7a25035a15ff84.url = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return editarUsuario2bee7011d8e7df97ab7a25035a15ff84.definition.url
            .replace('{user}', parsedArgs.user.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PermissionController::editarUsuario
 * @see app/Http/Controllers/PermissionController.php:34
 * @route '/permisos/usuario/{user}/editar'
 */
editarUsuario2bee7011d8e7df97ab7a25035a15ff84.get = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: editarUsuario2bee7011d8e7df97ab7a25035a15ff84.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PermissionController::editarUsuario
 * @see app/Http/Controllers/PermissionController.php:34
 * @route '/permisos/usuario/{user}/editar'
 */
editarUsuario2bee7011d8e7df97ab7a25035a15ff84.head = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: editarUsuario2bee7011d8e7df97ab7a25035a15ff84.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PermissionController::editarUsuario
 * @see app/Http/Controllers/PermissionController.php:34
 * @route '/permisos/usuario/{user}/editar'
 */
    const editarUsuario2bee7011d8e7df97ab7a25035a15ff84Form = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: editarUsuario2bee7011d8e7df97ab7a25035a15ff84.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PermissionController::editarUsuario
 * @see app/Http/Controllers/PermissionController.php:34
 * @route '/permisos/usuario/{user}/editar'
 */
        editarUsuario2bee7011d8e7df97ab7a25035a15ff84Form.get = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: editarUsuario2bee7011d8e7df97ab7a25035a15ff84.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PermissionController::editarUsuario
 * @see app/Http/Controllers/PermissionController.php:34
 * @route '/permisos/usuario/{user}/editar'
 */
        editarUsuario2bee7011d8e7df97ab7a25035a15ff84Form.head = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: editarUsuario2bee7011d8e7df97ab7a25035a15ff84.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    editarUsuario2bee7011d8e7df97ab7a25035a15ff84.form = editarUsuario2bee7011d8e7df97ab7a25035a15ff84Form

export const editarUsuario = {
    '/api/permisos/usuario/{user}': editarUsuario9cf08b543857fc9bd418de868ac248cb,
    '/permisos/usuario/{user}/editar': editarUsuario2bee7011d8e7df97ab7a25035a15ff84,
}

/**
* @see \App\Http\Controllers\PermissionController::actualizarUsuario
 * @see app/Http/Controllers/PermissionController.php:54
 * @route '/api/permisos/usuario/{user}'
 */
const actualizarUsuario9cf08b543857fc9bd418de868ac248cb = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: actualizarUsuario9cf08b543857fc9bd418de868ac248cb.url(args, options),
    method: 'patch',
})

actualizarUsuario9cf08b543857fc9bd418de868ac248cb.definition = {
    methods: ["patch"],
    url: '/api/permisos/usuario/{user}',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\PermissionController::actualizarUsuario
 * @see app/Http/Controllers/PermissionController.php:54
 * @route '/api/permisos/usuario/{user}'
 */
actualizarUsuario9cf08b543857fc9bd418de868ac248cb.url = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return actualizarUsuario9cf08b543857fc9bd418de868ac248cb.definition.url
            .replace('{user}', parsedArgs.user.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PermissionController::actualizarUsuario
 * @see app/Http/Controllers/PermissionController.php:54
 * @route '/api/permisos/usuario/{user}'
 */
actualizarUsuario9cf08b543857fc9bd418de868ac248cb.patch = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: actualizarUsuario9cf08b543857fc9bd418de868ac248cb.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\PermissionController::actualizarUsuario
 * @see app/Http/Controllers/PermissionController.php:54
 * @route '/api/permisos/usuario/{user}'
 */
    const actualizarUsuario9cf08b543857fc9bd418de868ac248cbForm = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: actualizarUsuario9cf08b543857fc9bd418de868ac248cb.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PermissionController::actualizarUsuario
 * @see app/Http/Controllers/PermissionController.php:54
 * @route '/api/permisos/usuario/{user}'
 */
        actualizarUsuario9cf08b543857fc9bd418de868ac248cbForm.patch = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: actualizarUsuario9cf08b543857fc9bd418de868ac248cb.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    actualizarUsuario9cf08b543857fc9bd418de868ac248cb.form = actualizarUsuario9cf08b543857fc9bd418de868ac248cbForm
    /**
* @see \App\Http\Controllers\PermissionController::actualizarUsuario
 * @see app/Http/Controllers/PermissionController.php:54
 * @route '/permisos/usuario/{user}'
 */
const actualizarUsuariod5c3dd1f492157f16f47b6f0a163cb62 = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: actualizarUsuariod5c3dd1f492157f16f47b6f0a163cb62.url(args, options),
    method: 'patch',
})

actualizarUsuariod5c3dd1f492157f16f47b6f0a163cb62.definition = {
    methods: ["patch"],
    url: '/permisos/usuario/{user}',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\PermissionController::actualizarUsuario
 * @see app/Http/Controllers/PermissionController.php:54
 * @route '/permisos/usuario/{user}'
 */
actualizarUsuariod5c3dd1f492157f16f47b6f0a163cb62.url = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return actualizarUsuariod5c3dd1f492157f16f47b6f0a163cb62.definition.url
            .replace('{user}', parsedArgs.user.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PermissionController::actualizarUsuario
 * @see app/Http/Controllers/PermissionController.php:54
 * @route '/permisos/usuario/{user}'
 */
actualizarUsuariod5c3dd1f492157f16f47b6f0a163cb62.patch = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: actualizarUsuariod5c3dd1f492157f16f47b6f0a163cb62.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\PermissionController::actualizarUsuario
 * @see app/Http/Controllers/PermissionController.php:54
 * @route '/permisos/usuario/{user}'
 */
    const actualizarUsuariod5c3dd1f492157f16f47b6f0a163cb62Form = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: actualizarUsuariod5c3dd1f492157f16f47b6f0a163cb62.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PermissionController::actualizarUsuario
 * @see app/Http/Controllers/PermissionController.php:54
 * @route '/permisos/usuario/{user}'
 */
        actualizarUsuariod5c3dd1f492157f16f47b6f0a163cb62Form.patch = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: actualizarUsuariod5c3dd1f492157f16f47b6f0a163cb62.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    actualizarUsuariod5c3dd1f492157f16f47b6f0a163cb62.form = actualizarUsuariod5c3dd1f492157f16f47b6f0a163cb62Form

export const actualizarUsuario = {
    '/api/permisos/usuario/{user}': actualizarUsuario9cf08b543857fc9bd418de868ac248cb,
    '/permisos/usuario/{user}': actualizarUsuariod5c3dd1f492157f16f47b6f0a163cb62,
}

/**
* @see \App\Http\Controllers\PermissionController::editarRol
 * @see app/Http/Controllers/PermissionController.php:76
 * @route '/api/permisos/rol/{role}'
 */
const editarRol0513cf81727e06dde4c0694f8d2c26e4 = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: editarRol0513cf81727e06dde4c0694f8d2c26e4.url(args, options),
    method: 'get',
})

editarRol0513cf81727e06dde4c0694f8d2c26e4.definition = {
    methods: ["get","head"],
    url: '/api/permisos/rol/{role}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PermissionController::editarRol
 * @see app/Http/Controllers/PermissionController.php:76
 * @route '/api/permisos/rol/{role}'
 */
editarRol0513cf81727e06dde4c0694f8d2c26e4.url = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { role: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { role: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    role: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        role: typeof args.role === 'object'
                ? args.role.id
                : args.role,
                }

    return editarRol0513cf81727e06dde4c0694f8d2c26e4.definition.url
            .replace('{role}', parsedArgs.role.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PermissionController::editarRol
 * @see app/Http/Controllers/PermissionController.php:76
 * @route '/api/permisos/rol/{role}'
 */
editarRol0513cf81727e06dde4c0694f8d2c26e4.get = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: editarRol0513cf81727e06dde4c0694f8d2c26e4.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PermissionController::editarRol
 * @see app/Http/Controllers/PermissionController.php:76
 * @route '/api/permisos/rol/{role}'
 */
editarRol0513cf81727e06dde4c0694f8d2c26e4.head = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: editarRol0513cf81727e06dde4c0694f8d2c26e4.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PermissionController::editarRol
 * @see app/Http/Controllers/PermissionController.php:76
 * @route '/api/permisos/rol/{role}'
 */
    const editarRol0513cf81727e06dde4c0694f8d2c26e4Form = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: editarRol0513cf81727e06dde4c0694f8d2c26e4.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PermissionController::editarRol
 * @see app/Http/Controllers/PermissionController.php:76
 * @route '/api/permisos/rol/{role}'
 */
        editarRol0513cf81727e06dde4c0694f8d2c26e4Form.get = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: editarRol0513cf81727e06dde4c0694f8d2c26e4.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PermissionController::editarRol
 * @see app/Http/Controllers/PermissionController.php:76
 * @route '/api/permisos/rol/{role}'
 */
        editarRol0513cf81727e06dde4c0694f8d2c26e4Form.head = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: editarRol0513cf81727e06dde4c0694f8d2c26e4.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    editarRol0513cf81727e06dde4c0694f8d2c26e4.form = editarRol0513cf81727e06dde4c0694f8d2c26e4Form
    /**
* @see \App\Http\Controllers\PermissionController::editarRol
 * @see app/Http/Controllers/PermissionController.php:76
 * @route '/permisos/rol/{role}/editar'
 */
const editarRol0b034d6e7dbfd63c90a1e18bb2dd4086 = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: editarRol0b034d6e7dbfd63c90a1e18bb2dd4086.url(args, options),
    method: 'get',
})

editarRol0b034d6e7dbfd63c90a1e18bb2dd4086.definition = {
    methods: ["get","head"],
    url: '/permisos/rol/{role}/editar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PermissionController::editarRol
 * @see app/Http/Controllers/PermissionController.php:76
 * @route '/permisos/rol/{role}/editar'
 */
editarRol0b034d6e7dbfd63c90a1e18bb2dd4086.url = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { role: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { role: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    role: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        role: typeof args.role === 'object'
                ? args.role.id
                : args.role,
                }

    return editarRol0b034d6e7dbfd63c90a1e18bb2dd4086.definition.url
            .replace('{role}', parsedArgs.role.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PermissionController::editarRol
 * @see app/Http/Controllers/PermissionController.php:76
 * @route '/permisos/rol/{role}/editar'
 */
editarRol0b034d6e7dbfd63c90a1e18bb2dd4086.get = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: editarRol0b034d6e7dbfd63c90a1e18bb2dd4086.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PermissionController::editarRol
 * @see app/Http/Controllers/PermissionController.php:76
 * @route '/permisos/rol/{role}/editar'
 */
editarRol0b034d6e7dbfd63c90a1e18bb2dd4086.head = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: editarRol0b034d6e7dbfd63c90a1e18bb2dd4086.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PermissionController::editarRol
 * @see app/Http/Controllers/PermissionController.php:76
 * @route '/permisos/rol/{role}/editar'
 */
    const editarRol0b034d6e7dbfd63c90a1e18bb2dd4086Form = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: editarRol0b034d6e7dbfd63c90a1e18bb2dd4086.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PermissionController::editarRol
 * @see app/Http/Controllers/PermissionController.php:76
 * @route '/permisos/rol/{role}/editar'
 */
        editarRol0b034d6e7dbfd63c90a1e18bb2dd4086Form.get = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: editarRol0b034d6e7dbfd63c90a1e18bb2dd4086.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PermissionController::editarRol
 * @see app/Http/Controllers/PermissionController.php:76
 * @route '/permisos/rol/{role}/editar'
 */
        editarRol0b034d6e7dbfd63c90a1e18bb2dd4086Form.head = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: editarRol0b034d6e7dbfd63c90a1e18bb2dd4086.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    editarRol0b034d6e7dbfd63c90a1e18bb2dd4086.form = editarRol0b034d6e7dbfd63c90a1e18bb2dd4086Form

export const editarRol = {
    '/api/permisos/rol/{role}': editarRol0513cf81727e06dde4c0694f8d2c26e4,
    '/permisos/rol/{role}/editar': editarRol0b034d6e7dbfd63c90a1e18bb2dd4086,
}

/**
* @see \App\Http\Controllers\PermissionController::actualizarRol
 * @see app/Http/Controllers/PermissionController.php:93
 * @route '/api/permisos/rol/{role}'
 */
const actualizarRol0513cf81727e06dde4c0694f8d2c26e4 = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: actualizarRol0513cf81727e06dde4c0694f8d2c26e4.url(args, options),
    method: 'patch',
})

actualizarRol0513cf81727e06dde4c0694f8d2c26e4.definition = {
    methods: ["patch"],
    url: '/api/permisos/rol/{role}',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\PermissionController::actualizarRol
 * @see app/Http/Controllers/PermissionController.php:93
 * @route '/api/permisos/rol/{role}'
 */
actualizarRol0513cf81727e06dde4c0694f8d2c26e4.url = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { role: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { role: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    role: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        role: typeof args.role === 'object'
                ? args.role.id
                : args.role,
                }

    return actualizarRol0513cf81727e06dde4c0694f8d2c26e4.definition.url
            .replace('{role}', parsedArgs.role.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PermissionController::actualizarRol
 * @see app/Http/Controllers/PermissionController.php:93
 * @route '/api/permisos/rol/{role}'
 */
actualizarRol0513cf81727e06dde4c0694f8d2c26e4.patch = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: actualizarRol0513cf81727e06dde4c0694f8d2c26e4.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\PermissionController::actualizarRol
 * @see app/Http/Controllers/PermissionController.php:93
 * @route '/api/permisos/rol/{role}'
 */
    const actualizarRol0513cf81727e06dde4c0694f8d2c26e4Form = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: actualizarRol0513cf81727e06dde4c0694f8d2c26e4.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PermissionController::actualizarRol
 * @see app/Http/Controllers/PermissionController.php:93
 * @route '/api/permisos/rol/{role}'
 */
        actualizarRol0513cf81727e06dde4c0694f8d2c26e4Form.patch = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: actualizarRol0513cf81727e06dde4c0694f8d2c26e4.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    actualizarRol0513cf81727e06dde4c0694f8d2c26e4.form = actualizarRol0513cf81727e06dde4c0694f8d2c26e4Form
    /**
* @see \App\Http\Controllers\PermissionController::actualizarRol
 * @see app/Http/Controllers/PermissionController.php:93
 * @route '/permisos/rol/{role}'
 */
const actualizarRola5f96a26c816b3f35c56c27b29edf11f = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: actualizarRola5f96a26c816b3f35c56c27b29edf11f.url(args, options),
    method: 'patch',
})

actualizarRola5f96a26c816b3f35c56c27b29edf11f.definition = {
    methods: ["patch"],
    url: '/permisos/rol/{role}',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\PermissionController::actualizarRol
 * @see app/Http/Controllers/PermissionController.php:93
 * @route '/permisos/rol/{role}'
 */
actualizarRola5f96a26c816b3f35c56c27b29edf11f.url = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { role: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { role: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    role: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        role: typeof args.role === 'object'
                ? args.role.id
                : args.role,
                }

    return actualizarRola5f96a26c816b3f35c56c27b29edf11f.definition.url
            .replace('{role}', parsedArgs.role.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PermissionController::actualizarRol
 * @see app/Http/Controllers/PermissionController.php:93
 * @route '/permisos/rol/{role}'
 */
actualizarRola5f96a26c816b3f35c56c27b29edf11f.patch = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: actualizarRola5f96a26c816b3f35c56c27b29edf11f.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\PermissionController::actualizarRol
 * @see app/Http/Controllers/PermissionController.php:93
 * @route '/permisos/rol/{role}'
 */
    const actualizarRola5f96a26c816b3f35c56c27b29edf11fForm = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: actualizarRola5f96a26c816b3f35c56c27b29edf11f.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PermissionController::actualizarRol
 * @see app/Http/Controllers/PermissionController.php:93
 * @route '/permisos/rol/{role}'
 */
        actualizarRola5f96a26c816b3f35c56c27b29edf11fForm.patch = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: actualizarRola5f96a26c816b3f35c56c27b29edf11f.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    actualizarRola5f96a26c816b3f35c56c27b29edf11f.form = actualizarRola5f96a26c816b3f35c56c27b29edf11fForm

export const actualizarRol = {
    '/api/permisos/rol/{role}': actualizarRol0513cf81727e06dde4c0694f8d2c26e4,
    '/permisos/rol/{role}': actualizarRola5f96a26c816b3f35c56c27b29edf11f,
}

/**
* @see \App\Http\Controllers\PermissionController::getUsuarios
 * @see app/Http/Controllers/PermissionController.php:142
 * @route '/api/usuarios'
 */
export const getUsuarios = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getUsuarios.url(options),
    method: 'get',
})

getUsuarios.definition = {
    methods: ["get","head"],
    url: '/api/usuarios',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PermissionController::getUsuarios
 * @see app/Http/Controllers/PermissionController.php:142
 * @route '/api/usuarios'
 */
getUsuarios.url = (options?: RouteQueryOptions) => {
    return getUsuarios.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PermissionController::getUsuarios
 * @see app/Http/Controllers/PermissionController.php:142
 * @route '/api/usuarios'
 */
getUsuarios.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getUsuarios.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PermissionController::getUsuarios
 * @see app/Http/Controllers/PermissionController.php:142
 * @route '/api/usuarios'
 */
getUsuarios.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getUsuarios.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PermissionController::getUsuarios
 * @see app/Http/Controllers/PermissionController.php:142
 * @route '/api/usuarios'
 */
    const getUsuariosForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getUsuarios.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PermissionController::getUsuarios
 * @see app/Http/Controllers/PermissionController.php:142
 * @route '/api/usuarios'
 */
        getUsuariosForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getUsuarios.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PermissionController::getUsuarios
 * @see app/Http/Controllers/PermissionController.php:142
 * @route '/api/usuarios'
 */
        getUsuariosForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getUsuarios.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getUsuarios.form = getUsuariosForm
/**
* @see \App\Http\Controllers\PermissionController::getRoles
 * @see app/Http/Controllers/PermissionController.php:184
 * @route '/api/roles'
 */
export const getRoles = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getRoles.url(options),
    method: 'get',
})

getRoles.definition = {
    methods: ["get","head"],
    url: '/api/roles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PermissionController::getRoles
 * @see app/Http/Controllers/PermissionController.php:184
 * @route '/api/roles'
 */
getRoles.url = (options?: RouteQueryOptions) => {
    return getRoles.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PermissionController::getRoles
 * @see app/Http/Controllers/PermissionController.php:184
 * @route '/api/roles'
 */
getRoles.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getRoles.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PermissionController::getRoles
 * @see app/Http/Controllers/PermissionController.php:184
 * @route '/api/roles'
 */
getRoles.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getRoles.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PermissionController::getRoles
 * @see app/Http/Controllers/PermissionController.php:184
 * @route '/api/roles'
 */
    const getRolesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getRoles.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PermissionController::getRoles
 * @see app/Http/Controllers/PermissionController.php:184
 * @route '/api/roles'
 */
        getRolesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getRoles.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PermissionController::getRoles
 * @see app/Http/Controllers/PermissionController.php:184
 * @route '/api/roles'
 */
        getRolesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getRoles.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getRoles.form = getRolesForm
/**
* @see \App\Http\Controllers\PermissionController::getHistorial
 * @see app/Http/Controllers/PermissionController.php:224
 * @route '/api/permisos/historial'
 */
export const getHistorial = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getHistorial.url(options),
    method: 'get',
})

getHistorial.definition = {
    methods: ["get","head"],
    url: '/api/permisos/historial',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PermissionController::getHistorial
 * @see app/Http/Controllers/PermissionController.php:224
 * @route '/api/permisos/historial'
 */
getHistorial.url = (options?: RouteQueryOptions) => {
    return getHistorial.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PermissionController::getHistorial
 * @see app/Http/Controllers/PermissionController.php:224
 * @route '/api/permisos/historial'
 */
getHistorial.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getHistorial.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PermissionController::getHistorial
 * @see app/Http/Controllers/PermissionController.php:224
 * @route '/api/permisos/historial'
 */
getHistorial.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getHistorial.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PermissionController::getHistorial
 * @see app/Http/Controllers/PermissionController.php:224
 * @route '/api/permisos/historial'
 */
    const getHistorialForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getHistorial.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PermissionController::getHistorial
 * @see app/Http/Controllers/PermissionController.php:224
 * @route '/api/permisos/historial'
 */
        getHistorialForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getHistorial.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PermissionController::getHistorial
 * @see app/Http/Controllers/PermissionController.php:224
 * @route '/api/permisos/historial'
 */
        getHistorialForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getHistorial.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getHistorial.form = getHistorialForm
/**
* @see \App\Http\Controllers\PermissionController::bulkEdit
 * @see app/Http/Controllers/PermissionController.php:280
 * @route '/api/permisos/bulk-edit'
 */
export const bulkEdit = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: bulkEdit.url(options),
    method: 'post',
})

bulkEdit.definition = {
    methods: ["post"],
    url: '/api/permisos/bulk-edit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PermissionController::bulkEdit
 * @see app/Http/Controllers/PermissionController.php:280
 * @route '/api/permisos/bulk-edit'
 */
bulkEdit.url = (options?: RouteQueryOptions) => {
    return bulkEdit.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PermissionController::bulkEdit
 * @see app/Http/Controllers/PermissionController.php:280
 * @route '/api/permisos/bulk-edit'
 */
bulkEdit.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: bulkEdit.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PermissionController::bulkEdit
 * @see app/Http/Controllers/PermissionController.php:280
 * @route '/api/permisos/bulk-edit'
 */
    const bulkEditForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: bulkEdit.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PermissionController::bulkEdit
 * @see app/Http/Controllers/PermissionController.php:280
 * @route '/api/permisos/bulk-edit'
 */
        bulkEditForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: bulkEdit.url(options),
            method: 'post',
        })
    
    bulkEdit.form = bulkEditForm
/**
* @see \App\Http\Controllers\PermissionController::index
 * @see app/Http/Controllers/PermissionController.php:23
 * @route '/permisos'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/permisos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PermissionController::index
 * @see app/Http/Controllers/PermissionController.php:23
 * @route '/permisos'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PermissionController::index
 * @see app/Http/Controllers/PermissionController.php:23
 * @route '/permisos'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PermissionController::index
 * @see app/Http/Controllers/PermissionController.php:23
 * @route '/permisos'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PermissionController::index
 * @see app/Http/Controllers/PermissionController.php:23
 * @route '/permisos'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PermissionController::index
 * @see app/Http/Controllers/PermissionController.php:23
 * @route '/permisos'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PermissionController::index
 * @see app/Http/Controllers/PermissionController.php:23
 * @route '/permisos'
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
const PermissionController = { getStructure, getGrouped, editarUsuario, actualizarUsuario, editarRol, actualizarRol, getUsuarios, getRoles, getHistorial, bulkEdit, index }

export default PermissionController