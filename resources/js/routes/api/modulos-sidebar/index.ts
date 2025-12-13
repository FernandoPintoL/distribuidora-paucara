import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ModuloSidebarController::permisos
 * @see app/Http/Controllers/ModuloSidebarController.php:260
 * @route '/api/modulos-sidebar/permisos/disponibles'
 */
export const permisos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: permisos.url(options),
    method: 'get',
})

permisos.definition = {
    methods: ["get","head"],
    url: '/api/modulos-sidebar/permisos/disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ModuloSidebarController::permisos
 * @see app/Http/Controllers/ModuloSidebarController.php:260
 * @route '/api/modulos-sidebar/permisos/disponibles'
 */
permisos.url = (options?: RouteQueryOptions) => {
    return permisos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ModuloSidebarController::permisos
 * @see app/Http/Controllers/ModuloSidebarController.php:260
 * @route '/api/modulos-sidebar/permisos/disponibles'
 */
permisos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: permisos.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ModuloSidebarController::permisos
 * @see app/Http/Controllers/ModuloSidebarController.php:260
 * @route '/api/modulos-sidebar/permisos/disponibles'
 */
permisos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: permisos.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ModuloSidebarController::permisos
 * @see app/Http/Controllers/ModuloSidebarController.php:260
 * @route '/api/modulos-sidebar/permisos/disponibles'
 */
    const permisosForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: permisos.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ModuloSidebarController::permisos
 * @see app/Http/Controllers/ModuloSidebarController.php:260
 * @route '/api/modulos-sidebar/permisos/disponibles'
 */
        permisosForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: permisos.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ModuloSidebarController::permisos
 * @see app/Http/Controllers/ModuloSidebarController.php:260
 * @route '/api/modulos-sidebar/permisos/disponibles'
 */
        permisosForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: permisos.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    permisos.form = permisosForm
/**
* @see \App\Http\Controllers\ModuloSidebarController::matrizAcceso
 * @see app/Http/Controllers/ModuloSidebarController.php:280
 * @route '/api/modulos-sidebar/matriz-acceso'
 */
export const matrizAcceso = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: matrizAcceso.url(options),
    method: 'get',
})

matrizAcceso.definition = {
    methods: ["get","head"],
    url: '/api/modulos-sidebar/matriz-acceso',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ModuloSidebarController::matrizAcceso
 * @see app/Http/Controllers/ModuloSidebarController.php:280
 * @route '/api/modulos-sidebar/matriz-acceso'
 */
matrizAcceso.url = (options?: RouteQueryOptions) => {
    return matrizAcceso.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ModuloSidebarController::matrizAcceso
 * @see app/Http/Controllers/ModuloSidebarController.php:280
 * @route '/api/modulos-sidebar/matriz-acceso'
 */
matrizAcceso.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: matrizAcceso.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ModuloSidebarController::matrizAcceso
 * @see app/Http/Controllers/ModuloSidebarController.php:280
 * @route '/api/modulos-sidebar/matriz-acceso'
 */
matrizAcceso.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: matrizAcceso.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ModuloSidebarController::matrizAcceso
 * @see app/Http/Controllers/ModuloSidebarController.php:280
 * @route '/api/modulos-sidebar/matriz-acceso'
 */
    const matrizAccesoForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: matrizAcceso.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ModuloSidebarController::matrizAcceso
 * @see app/Http/Controllers/ModuloSidebarController.php:280
 * @route '/api/modulos-sidebar/matriz-acceso'
 */
        matrizAccesoForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: matrizAcceso.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ModuloSidebarController::matrizAcceso
 * @see app/Http/Controllers/ModuloSidebarController.php:280
 * @route '/api/modulos-sidebar/matriz-acceso'
 */
        matrizAccesoForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: matrizAcceso.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    matrizAcceso.form = matrizAccesoForm
/**
* @see \App\Http\Controllers\ModuloSidebarController::roles
 * @see app/Http/Controllers/ModuloSidebarController.php:426
 * @route '/api/modulos-sidebar/roles'
 */
export const roles = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: roles.url(options),
    method: 'get',
})

roles.definition = {
    methods: ["get","head"],
    url: '/api/modulos-sidebar/roles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ModuloSidebarController::roles
 * @see app/Http/Controllers/ModuloSidebarController.php:426
 * @route '/api/modulos-sidebar/roles'
 */
roles.url = (options?: RouteQueryOptions) => {
    return roles.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ModuloSidebarController::roles
 * @see app/Http/Controllers/ModuloSidebarController.php:426
 * @route '/api/modulos-sidebar/roles'
 */
roles.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: roles.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ModuloSidebarController::roles
 * @see app/Http/Controllers/ModuloSidebarController.php:426
 * @route '/api/modulos-sidebar/roles'
 */
roles.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: roles.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ModuloSidebarController::roles
 * @see app/Http/Controllers/ModuloSidebarController.php:426
 * @route '/api/modulos-sidebar/roles'
 */
    const rolesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: roles.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ModuloSidebarController::roles
 * @see app/Http/Controllers/ModuloSidebarController.php:426
 * @route '/api/modulos-sidebar/roles'
 */
        rolesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: roles.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ModuloSidebarController::roles
 * @see app/Http/Controllers/ModuloSidebarController.php:426
 * @route '/api/modulos-sidebar/roles'
 */
        rolesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: roles.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    roles.form = rolesForm
/**
* @see \App\Http\Controllers\ModuloSidebarController::preview
 * @see app/Http/Controllers/ModuloSidebarController.php:370
 * @route '/api/modulos-sidebar/preview/{rolName}'
 */
export const preview = (args: { rolName: string | number } | [rolName: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: preview.url(args, options),
    method: 'get',
})

preview.definition = {
    methods: ["get","head"],
    url: '/api/modulos-sidebar/preview/{rolName}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ModuloSidebarController::preview
 * @see app/Http/Controllers/ModuloSidebarController.php:370
 * @route '/api/modulos-sidebar/preview/{rolName}'
 */
preview.url = (args: { rolName: string | number } | [rolName: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { rolName: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    rolName: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        rolName: args.rolName,
                }

    return preview.definition.url
            .replace('{rolName}', parsedArgs.rolName.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ModuloSidebarController::preview
 * @see app/Http/Controllers/ModuloSidebarController.php:370
 * @route '/api/modulos-sidebar/preview/{rolName}'
 */
preview.get = (args: { rolName: string | number } | [rolName: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: preview.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ModuloSidebarController::preview
 * @see app/Http/Controllers/ModuloSidebarController.php:370
 * @route '/api/modulos-sidebar/preview/{rolName}'
 */
preview.head = (args: { rolName: string | number } | [rolName: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: preview.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ModuloSidebarController::preview
 * @see app/Http/Controllers/ModuloSidebarController.php:370
 * @route '/api/modulos-sidebar/preview/{rolName}'
 */
    const previewForm = (args: { rolName: string | number } | [rolName: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: preview.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ModuloSidebarController::preview
 * @see app/Http/Controllers/ModuloSidebarController.php:370
 * @route '/api/modulos-sidebar/preview/{rolName}'
 */
        previewForm.get = (args: { rolName: string | number } | [rolName: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: preview.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ModuloSidebarController::preview
 * @see app/Http/Controllers/ModuloSidebarController.php:370
 * @route '/api/modulos-sidebar/preview/{rolName}'
 */
        previewForm.head = (args: { rolName: string | number } | [rolName: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: preview.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    preview.form = previewForm
const modulosSidebar = {
    permisos,
matrizAcceso,
roles,
preview,
}

export default modulosSidebar