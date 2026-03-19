import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PrestamoProveedorController::index
 * @see app/Http/Controllers/PrestamoProveedorController.php:21
 * @route '/api/prestamos-proveedor'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/prestamos-proveedor',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestamoProveedorController::index
 * @see app/Http/Controllers/PrestamoProveedorController.php:21
 * @route '/api/prestamos-proveedor'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamoProveedorController::index
 * @see app/Http/Controllers/PrestamoProveedorController.php:21
 * @route '/api/prestamos-proveedor'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestamoProveedorController::index
 * @see app/Http/Controllers/PrestamoProveedorController.php:21
 * @route '/api/prestamos-proveedor'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestamoProveedorController::index
 * @see app/Http/Controllers/PrestamoProveedorController.php:21
 * @route '/api/prestamos-proveedor'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestamoProveedorController::index
 * @see app/Http/Controllers/PrestamoProveedorController.php:21
 * @route '/api/prestamos-proveedor'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestamoProveedorController::index
 * @see app/Http/Controllers/PrestamoProveedorController.php:21
 * @route '/api/prestamos-proveedor'
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
* @see \App\Http\Controllers\PrestamoProveedorController::store
 * @see app/Http/Controllers/PrestamoProveedorController.php:57
 * @route '/api/prestamos-proveedor'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/prestamos-proveedor',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PrestamoProveedorController::store
 * @see app/Http/Controllers/PrestamoProveedorController.php:57
 * @route '/api/prestamos-proveedor'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamoProveedorController::store
 * @see app/Http/Controllers/PrestamoProveedorController.php:57
 * @route '/api/prestamos-proveedor'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PrestamoProveedorController::store
 * @see app/Http/Controllers/PrestamoProveedorController.php:57
 * @route '/api/prestamos-proveedor'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PrestamoProveedorController::store
 * @see app/Http/Controllers/PrestamoProveedorController.php:57
 * @route '/api/prestamos-proveedor'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\PrestamoProveedorController::show
 * @see app/Http/Controllers/PrestamoProveedorController.php:95
 * @route '/api/prestamos-proveedor/{prestamo}'
 */
export const show = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/prestamos-proveedor/{prestamo}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestamoProveedorController::show
 * @see app/Http/Controllers/PrestamoProveedorController.php:95
 * @route '/api/prestamos-proveedor/{prestamo}'
 */
show.url = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { prestamo: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { prestamo: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    prestamo: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        prestamo: typeof args.prestamo === 'object'
                ? args.prestamo.id
                : args.prestamo,
                }

    return show.definition.url
            .replace('{prestamo}', parsedArgs.prestamo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamoProveedorController::show
 * @see app/Http/Controllers/PrestamoProveedorController.php:95
 * @route '/api/prestamos-proveedor/{prestamo}'
 */
show.get = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestamoProveedorController::show
 * @see app/Http/Controllers/PrestamoProveedorController.php:95
 * @route '/api/prestamos-proveedor/{prestamo}'
 */
show.head = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestamoProveedorController::show
 * @see app/Http/Controllers/PrestamoProveedorController.php:95
 * @route '/api/prestamos-proveedor/{prestamo}'
 */
    const showForm = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestamoProveedorController::show
 * @see app/Http/Controllers/PrestamoProveedorController.php:95
 * @route '/api/prestamos-proveedor/{prestamo}'
 */
        showForm.get = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestamoProveedorController::show
 * @see app/Http/Controllers/PrestamoProveedorController.php:95
 * @route '/api/prestamos-proveedor/{prestamo}'
 */
        showForm.head = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\PrestamoProveedorController::registrarDevolucion
 * @see app/Http/Controllers/PrestamoProveedorController.php:116
 * @route '/api/prestamos-proveedor/{prestamo}/devolver'
 */
export const registrarDevolucion = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarDevolucion.url(args, options),
    method: 'post',
})

registrarDevolucion.definition = {
    methods: ["post"],
    url: '/api/prestamos-proveedor/{prestamo}/devolver',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PrestamoProveedorController::registrarDevolucion
 * @see app/Http/Controllers/PrestamoProveedorController.php:116
 * @route '/api/prestamos-proveedor/{prestamo}/devolver'
 */
registrarDevolucion.url = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { prestamo: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { prestamo: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    prestamo: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        prestamo: typeof args.prestamo === 'object'
                ? args.prestamo.id
                : args.prestamo,
                }

    return registrarDevolucion.definition.url
            .replace('{prestamo}', parsedArgs.prestamo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamoProveedorController::registrarDevolucion
 * @see app/Http/Controllers/PrestamoProveedorController.php:116
 * @route '/api/prestamos-proveedor/{prestamo}/devolver'
 */
registrarDevolucion.post = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarDevolucion.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PrestamoProveedorController::registrarDevolucion
 * @see app/Http/Controllers/PrestamoProveedorController.php:116
 * @route '/api/prestamos-proveedor/{prestamo}/devolver'
 */
    const registrarDevolucionForm = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: registrarDevolucion.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PrestamoProveedorController::registrarDevolucion
 * @see app/Http/Controllers/PrestamoProveedorController.php:116
 * @route '/api/prestamos-proveedor/{prestamo}/devolver'
 */
        registrarDevolucionForm.post = (args: { prestamo: number | { id: number } } | [prestamo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: registrarDevolucion.url(args, options),
            method: 'post',
        })
    
    registrarDevolucion.form = registrarDevolucionForm
/**
* @see \App\Http\Controllers\PrestamoProveedorController::obtenerActivosProveedor
 * @see app/Http/Controllers/PrestamoProveedorController.php:161
 * @route '/api/prestamos-proveedor/proveedor/{proveedorId}/activos'
 */
export const obtenerActivosProveedor = (args: { proveedorId: string | number } | [proveedorId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerActivosProveedor.url(args, options),
    method: 'get',
})

obtenerActivosProveedor.definition = {
    methods: ["get","head"],
    url: '/api/prestamos-proveedor/proveedor/{proveedorId}/activos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestamoProveedorController::obtenerActivosProveedor
 * @see app/Http/Controllers/PrestamoProveedorController.php:161
 * @route '/api/prestamos-proveedor/proveedor/{proveedorId}/activos'
 */
obtenerActivosProveedor.url = (args: { proveedorId: string | number } | [proveedorId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proveedorId: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    proveedorId: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proveedorId: args.proveedorId,
                }

    return obtenerActivosProveedor.definition.url
            .replace('{proveedorId}', parsedArgs.proveedorId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamoProveedorController::obtenerActivosProveedor
 * @see app/Http/Controllers/PrestamoProveedorController.php:161
 * @route '/api/prestamos-proveedor/proveedor/{proveedorId}/activos'
 */
obtenerActivosProveedor.get = (args: { proveedorId: string | number } | [proveedorId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerActivosProveedor.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestamoProveedorController::obtenerActivosProveedor
 * @see app/Http/Controllers/PrestamoProveedorController.php:161
 * @route '/api/prestamos-proveedor/proveedor/{proveedorId}/activos'
 */
obtenerActivosProveedor.head = (args: { proveedorId: string | number } | [proveedorId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerActivosProveedor.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestamoProveedorController::obtenerActivosProveedor
 * @see app/Http/Controllers/PrestamoProveedorController.php:161
 * @route '/api/prestamos-proveedor/proveedor/{proveedorId}/activos'
 */
    const obtenerActivosProveedorForm = (args: { proveedorId: string | number } | [proveedorId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerActivosProveedor.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestamoProveedorController::obtenerActivosProveedor
 * @see app/Http/Controllers/PrestamoProveedorController.php:161
 * @route '/api/prestamos-proveedor/proveedor/{proveedorId}/activos'
 */
        obtenerActivosProveedorForm.get = (args: { proveedorId: string | number } | [proveedorId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerActivosProveedor.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestamoProveedorController::obtenerActivosProveedor
 * @see app/Http/Controllers/PrestamoProveedorController.php:161
 * @route '/api/prestamos-proveedor/proveedor/{proveedorId}/activos'
 */
        obtenerActivosProveedorForm.head = (args: { proveedorId: string | number } | [proveedorId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerActivosProveedor.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerActivosProveedor.form = obtenerActivosProveedorForm
/**
* @see \App\Http\Controllers\PrestamoProveedorController::obtenerDeuda
 * @see app/Http/Controllers/PrestamoProveedorController.php:180
 * @route '/api/prestamos-proveedor/proveedor/{proveedorId}/deuda'
 */
export const obtenerDeuda = (args: { proveedorId: string | number } | [proveedorId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerDeuda.url(args, options),
    method: 'get',
})

obtenerDeuda.definition = {
    methods: ["get","head"],
    url: '/api/prestamos-proveedor/proveedor/{proveedorId}/deuda',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestamoProveedorController::obtenerDeuda
 * @see app/Http/Controllers/PrestamoProveedorController.php:180
 * @route '/api/prestamos-proveedor/proveedor/{proveedorId}/deuda'
 */
obtenerDeuda.url = (args: { proveedorId: string | number } | [proveedorId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proveedorId: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    proveedorId: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proveedorId: args.proveedorId,
                }

    return obtenerDeuda.definition.url
            .replace('{proveedorId}', parsedArgs.proveedorId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamoProveedorController::obtenerDeuda
 * @see app/Http/Controllers/PrestamoProveedorController.php:180
 * @route '/api/prestamos-proveedor/proveedor/{proveedorId}/deuda'
 */
obtenerDeuda.get = (args: { proveedorId: string | number } | [proveedorId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerDeuda.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestamoProveedorController::obtenerDeuda
 * @see app/Http/Controllers/PrestamoProveedorController.php:180
 * @route '/api/prestamos-proveedor/proveedor/{proveedorId}/deuda'
 */
obtenerDeuda.head = (args: { proveedorId: string | number } | [proveedorId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerDeuda.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestamoProveedorController::obtenerDeuda
 * @see app/Http/Controllers/PrestamoProveedorController.php:180
 * @route '/api/prestamos-proveedor/proveedor/{proveedorId}/deuda'
 */
    const obtenerDeudaForm = (args: { proveedorId: string | number } | [proveedorId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerDeuda.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestamoProveedorController::obtenerDeuda
 * @see app/Http/Controllers/PrestamoProveedorController.php:180
 * @route '/api/prestamos-proveedor/proveedor/{proveedorId}/deuda'
 */
        obtenerDeudaForm.get = (args: { proveedorId: string | number } | [proveedorId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerDeuda.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestamoProveedorController::obtenerDeuda
 * @see app/Http/Controllers/PrestamoProveedorController.php:180
 * @route '/api/prestamos-proveedor/proveedor/{proveedorId}/deuda'
 */
        obtenerDeudaForm.head = (args: { proveedorId: string | number } | [proveedorId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerDeuda.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerDeuda.form = obtenerDeudaForm
const PrestamoProveedorController = { index, store, show, registrarDevolucion, obtenerActivosProveedor, obtenerDeuda }

export default PrestamoProveedorController