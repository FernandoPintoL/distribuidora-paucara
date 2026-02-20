import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\RoleController::crearFuncionalidad
 * @see app/Http/Controllers/RoleController.php:0
 * @route '/roles/{role}/crear-funcionalidad'
 */
export const crearFuncionalidad = (args: { role: string | number } | [role: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearFuncionalidad.url(args, options),
    method: 'post',
})

crearFuncionalidad.definition = {
    methods: ["post"],
    url: '/roles/{role}/crear-funcionalidad',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RoleController::crearFuncionalidad
 * @see app/Http/Controllers/RoleController.php:0
 * @route '/roles/{role}/crear-funcionalidad'
 */
crearFuncionalidad.url = (args: { role: string | number } | [role: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { role: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    role: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        role: args.role,
                }

    return crearFuncionalidad.definition.url
            .replace('{role}', parsedArgs.role.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RoleController::crearFuncionalidad
 * @see app/Http/Controllers/RoleController.php:0
 * @route '/roles/{role}/crear-funcionalidad'
 */
crearFuncionalidad.post = (args: { role: string | number } | [role: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearFuncionalidad.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RoleController::index
 * @see app/Http/Controllers/RoleController.php:21
 * @route '/roles'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/roles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RoleController::index
 * @see app/Http/Controllers/RoleController.php:21
 * @route '/roles'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RoleController::index
 * @see app/Http/Controllers/RoleController.php:21
 * @route '/roles'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RoleController::index
 * @see app/Http/Controllers/RoleController.php:21
 * @route '/roles'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\RoleController::create
 * @see app/Http/Controllers/RoleController.php:41
 * @route '/roles/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/roles/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RoleController::create
 * @see app/Http/Controllers/RoleController.php:41
 * @route '/roles/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RoleController::create
 * @see app/Http/Controllers/RoleController.php:41
 * @route '/roles/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RoleController::create
 * @see app/Http/Controllers/RoleController.php:41
 * @route '/roles/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\RoleController::store
 * @see app/Http/Controllers/RoleController.php:52
 * @route '/roles'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/roles',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RoleController::store
 * @see app/Http/Controllers/RoleController.php:52
 * @route '/roles'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RoleController::store
 * @see app/Http/Controllers/RoleController.php:52
 * @route '/roles'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RoleController::show
 * @see app/Http/Controllers/RoleController.php:76
 * @route '/roles/{role}'
 */
export const show = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/roles/{role}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RoleController::show
 * @see app/Http/Controllers/RoleController.php:76
 * @route '/roles/{role}'
 */
show.url = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{role}', parsedArgs.role.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RoleController::show
 * @see app/Http/Controllers/RoleController.php:76
 * @route '/roles/{role}'
 */
show.get = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RoleController::show
 * @see app/Http/Controllers/RoleController.php:76
 * @route '/roles/{role}'
 */
show.head = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\RoleController::edit
 * @see app/Http/Controllers/RoleController.php:87
 * @route '/roles/{role}/edit'
 */
export const edit = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/roles/{role}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RoleController::edit
 * @see app/Http/Controllers/RoleController.php:87
 * @route '/roles/{role}/edit'
 */
edit.url = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return edit.definition.url
            .replace('{role}', parsedArgs.role.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RoleController::edit
 * @see app/Http/Controllers/RoleController.php:87
 * @route '/roles/{role}/edit'
 */
edit.get = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RoleController::edit
 * @see app/Http/Controllers/RoleController.php:87
 * @route '/roles/{role}/edit'
 */
edit.head = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\RoleController::update
 * @see app/Http/Controllers/RoleController.php:101
 * @route '/roles/{role}'
 */
export const update = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/roles/{role}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\RoleController::update
 * @see app/Http/Controllers/RoleController.php:101
 * @route '/roles/{role}'
 */
update.url = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return update.definition.url
            .replace('{role}', parsedArgs.role.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RoleController::update
 * @see app/Http/Controllers/RoleController.php:101
 * @route '/roles/{role}'
 */
update.put = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\RoleController::update
 * @see app/Http/Controllers/RoleController.php:101
 * @route '/roles/{role}'
 */
update.patch = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\RoleController::destroy
 * @see app/Http/Controllers/RoleController.php:127
 * @route '/roles/{role}'
 */
export const destroy = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/roles/{role}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\RoleController::destroy
 * @see app/Http/Controllers/RoleController.php:127
 * @route '/roles/{role}'
 */
destroy.url = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{role}', parsedArgs.role.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RoleController::destroy
 * @see app/Http/Controllers/RoleController.php:127
 * @route '/roles/{role}'
 */
destroy.delete = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\RoleController::assignPermission
 * @see app/Http/Controllers/RoleController.php:140
 * @route '/roles/{role}/assign-permission'
 */
export const assignPermission = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: assignPermission.url(args, options),
    method: 'post',
})

assignPermission.definition = {
    methods: ["post"],
    url: '/roles/{role}/assign-permission',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RoleController::assignPermission
 * @see app/Http/Controllers/RoleController.php:140
 * @route '/roles/{role}/assign-permission'
 */
assignPermission.url = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return assignPermission.definition.url
            .replace('{role}', parsedArgs.role.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RoleController::assignPermission
 * @see app/Http/Controllers/RoleController.php:140
 * @route '/roles/{role}/assign-permission'
 */
assignPermission.post = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: assignPermission.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RoleController::removePermission
 * @see app/Http/Controllers/RoleController.php:151
 * @route '/roles/{role}/remove-permission'
 */
export const removePermission = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: removePermission.url(args, options),
    method: 'delete',
})

removePermission.definition = {
    methods: ["delete"],
    url: '/roles/{role}/remove-permission',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\RoleController::removePermission
 * @see app/Http/Controllers/RoleController.php:151
 * @route '/roles/{role}/remove-permission'
 */
removePermission.url = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return removePermission.definition.url
            .replace('{role}', parsedArgs.role.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RoleController::removePermission
 * @see app/Http/Controllers/RoleController.php:151
 * @route '/roles/{role}/remove-permission'
 */
removePermission.delete = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: removePermission.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\RoleController::getTemplates
 * @see app/Http/Controllers/RoleController.php:165
 * @route '/roles-data/templates'
 */
export const getTemplates = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getTemplates.url(options),
    method: 'get',
})

getTemplates.definition = {
    methods: ["get","head"],
    url: '/roles-data/templates',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RoleController::getTemplates
 * @see app/Http/Controllers/RoleController.php:165
 * @route '/roles-data/templates'
 */
getTemplates.url = (options?: RouteQueryOptions) => {
    return getTemplates.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RoleController::getTemplates
 * @see app/Http/Controllers/RoleController.php:165
 * @route '/roles-data/templates'
 */
getTemplates.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getTemplates.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RoleController::getTemplates
 * @see app/Http/Controllers/RoleController.php:165
 * @route '/roles-data/templates'
 */
getTemplates.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getTemplates.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\RoleController::createTemplate
 * @see app/Http/Controllers/RoleController.php:175
 * @route '/roles-data/templates'
 */
export const createTemplate = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createTemplate.url(options),
    method: 'post',
})

createTemplate.definition = {
    methods: ["post"],
    url: '/roles-data/templates',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RoleController::createTemplate
 * @see app/Http/Controllers/RoleController.php:175
 * @route '/roles-data/templates'
 */
createTemplate.url = (options?: RouteQueryOptions) => {
    return createTemplate.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RoleController::createTemplate
 * @see app/Http/Controllers/RoleController.php:175
 * @route '/roles-data/templates'
 */
createTemplate.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createTemplate.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RoleController::applyTemplate
 * @see app/Http/Controllers/RoleController.php:201
 * @route '/roles/{role}/apply-template'
 */
export const applyTemplate = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: applyTemplate.url(args, options),
    method: 'post',
})

applyTemplate.definition = {
    methods: ["post"],
    url: '/roles/{role}/apply-template',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RoleController::applyTemplate
 * @see app/Http/Controllers/RoleController.php:201
 * @route '/roles/{role}/apply-template'
 */
applyTemplate.url = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return applyTemplate.definition.url
            .replace('{role}', parsedArgs.role.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RoleController::applyTemplate
 * @see app/Http/Controllers/RoleController.php:201
 * @route '/roles/{role}/apply-template'
 */
applyTemplate.post = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: applyTemplate.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RoleController::copyFromRole
 * @see app/Http/Controllers/RoleController.php:234
 * @route '/roles/{role}/copy-from'
 */
export const copyFromRole = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: copyFromRole.url(args, options),
    method: 'post',
})

copyFromRole.definition = {
    methods: ["post"],
    url: '/roles/{role}/copy-from',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RoleController::copyFromRole
 * @see app/Http/Controllers/RoleController.php:234
 * @route '/roles/{role}/copy-from'
 */
copyFromRole.url = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return copyFromRole.definition.url
            .replace('{role}', parsedArgs.role.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RoleController::copyFromRole
 * @see app/Http/Controllers/RoleController.php:234
 * @route '/roles/{role}/copy-from'
 */
copyFromRole.post = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: copyFromRole.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RoleController::compareRoles
 * @see app/Http/Controllers/RoleController.php:266
 * @route '/roles-data/compare'
 */
export const compareRoles = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: compareRoles.url(options),
    method: 'post',
})

compareRoles.definition = {
    methods: ["post"],
    url: '/roles-data/compare',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RoleController::compareRoles
 * @see app/Http/Controllers/RoleController.php:266
 * @route '/roles-data/compare'
 */
compareRoles.url = (options?: RouteQueryOptions) => {
    return compareRoles.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RoleController::compareRoles
 * @see app/Http/Controllers/RoleController.php:266
 * @route '/roles-data/compare'
 */
compareRoles.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: compareRoles.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RoleController::getAudit
 * @see app/Http/Controllers/RoleController.php:310
 * @route '/roles/{role}/audit'
 */
export const getAudit = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAudit.url(args, options),
    method: 'get',
})

getAudit.definition = {
    methods: ["get","head"],
    url: '/roles/{role}/audit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RoleController::getAudit
 * @see app/Http/Controllers/RoleController.php:310
 * @route '/roles/{role}/audit'
 */
getAudit.url = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return getAudit.definition.url
            .replace('{role}', parsedArgs.role.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RoleController::getAudit
 * @see app/Http/Controllers/RoleController.php:310
 * @route '/roles/{role}/audit'
 */
getAudit.get = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAudit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RoleController::getAudit
 * @see app/Http/Controllers/RoleController.php:310
 * @route '/roles/{role}/audit'
 */
getAudit.head = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getAudit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\RoleController::getPermissionsGrouped
 * @see app/Http/Controllers/RoleController.php:323
 * @route '/roles-data/permissions-grouped'
 */
export const getPermissionsGrouped = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getPermissionsGrouped.url(options),
    method: 'get',
})

getPermissionsGrouped.definition = {
    methods: ["get","head"],
    url: '/roles-data/permissions-grouped',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RoleController::getPermissionsGrouped
 * @see app/Http/Controllers/RoleController.php:323
 * @route '/roles-data/permissions-grouped'
 */
getPermissionsGrouped.url = (options?: RouteQueryOptions) => {
    return getPermissionsGrouped.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RoleController::getPermissionsGrouped
 * @see app/Http/Controllers/RoleController.php:323
 * @route '/roles-data/permissions-grouped'
 */
getPermissionsGrouped.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getPermissionsGrouped.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RoleController::getPermissionsGrouped
 * @see app/Http/Controllers/RoleController.php:323
 * @route '/roles-data/permissions-grouped'
 */
getPermissionsGrouped.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getPermissionsGrouped.url(options),
    method: 'head',
})
const RoleController = { crearFuncionalidad, index, create, store, show, edit, update, destroy, assignPermission, removePermission, getTemplates, createTemplate, applyTemplate, copyFromRole, compareRoles, getAudit, getPermissionsGrouped }

export default RoleController