import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ProformaController::imprimir
 * @see app/Http/Controllers/ProformaController.php:830
 * @route '/api/proformas/{proforma}/imprimir'
 */
const imprimir125bf4b428ce963584075dbfa8f6f64d = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir125bf4b428ce963584075dbfa8f6f64d.url(args, options),
    method: 'get',
})

imprimir125bf4b428ce963584075dbfa8f6f64d.definition = {
    methods: ["get","head"],
    url: '/api/proformas/{proforma}/imprimir',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProformaController::imprimir
 * @see app/Http/Controllers/ProformaController.php:830
 * @route '/api/proformas/{proforma}/imprimir'
 */
imprimir125bf4b428ce963584075dbfa8f6f64d.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proforma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proforma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proforma: typeof args.proforma === 'object'
                ? args.proforma.id
                : args.proforma,
                }

    return imprimir125bf4b428ce963584075dbfa8f6f64d.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::imprimir
 * @see app/Http/Controllers/ProformaController.php:830
 * @route '/api/proformas/{proforma}/imprimir'
 */
imprimir125bf4b428ce963584075dbfa8f6f64d.get = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir125bf4b428ce963584075dbfa8f6f64d.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProformaController::imprimir
 * @see app/Http/Controllers/ProformaController.php:830
 * @route '/api/proformas/{proforma}/imprimir'
 */
imprimir125bf4b428ce963584075dbfa8f6f64d.head = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imprimir125bf4b428ce963584075dbfa8f6f64d.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ProformaController::imprimir
 * @see app/Http/Controllers/ProformaController.php:830
 * @route '/proformas/{proforma}/imprimir'
 */
const imprimir6149e35b40ee82ad9184bc1a0f70365f = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir6149e35b40ee82ad9184bc1a0f70365f.url(args, options),
    method: 'get',
})

imprimir6149e35b40ee82ad9184bc1a0f70365f.definition = {
    methods: ["get","head"],
    url: '/proformas/{proforma}/imprimir',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProformaController::imprimir
 * @see app/Http/Controllers/ProformaController.php:830
 * @route '/proformas/{proforma}/imprimir'
 */
imprimir6149e35b40ee82ad9184bc1a0f70365f.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proforma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proforma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proforma: typeof args.proforma === 'object'
                ? args.proforma.id
                : args.proforma,
                }

    return imprimir6149e35b40ee82ad9184bc1a0f70365f.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::imprimir
 * @see app/Http/Controllers/ProformaController.php:830
 * @route '/proformas/{proforma}/imprimir'
 */
imprimir6149e35b40ee82ad9184bc1a0f70365f.get = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir6149e35b40ee82ad9184bc1a0f70365f.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProformaController::imprimir
 * @see app/Http/Controllers/ProformaController.php:830
 * @route '/proformas/{proforma}/imprimir'
 */
imprimir6149e35b40ee82ad9184bc1a0f70365f.head = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imprimir6149e35b40ee82ad9184bc1a0f70365f.url(args, options),
    method: 'head',
})

export const imprimir = {
    '/api/proformas/{proforma}/imprimir': imprimir125bf4b428ce963584075dbfa8f6f64d,
    '/proformas/{proforma}/imprimir': imprimir6149e35b40ee82ad9184bc1a0f70365f,
}

/**
* @see \App\Http\Controllers\ProformaController::preview
 * @see app/Http/Controllers/ProformaController.php:864
 * @route '/api/proformas/{proforma}/preview'
 */
const preview068fc740980b3bd88a6f118f89ff5a90 = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: preview068fc740980b3bd88a6f118f89ff5a90.url(args, options),
    method: 'get',
})

preview068fc740980b3bd88a6f118f89ff5a90.definition = {
    methods: ["get","head"],
    url: '/api/proformas/{proforma}/preview',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProformaController::preview
 * @see app/Http/Controllers/ProformaController.php:864
 * @route '/api/proformas/{proforma}/preview'
 */
preview068fc740980b3bd88a6f118f89ff5a90.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proforma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proforma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proforma: typeof args.proforma === 'object'
                ? args.proforma.id
                : args.proforma,
                }

    return preview068fc740980b3bd88a6f118f89ff5a90.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::preview
 * @see app/Http/Controllers/ProformaController.php:864
 * @route '/api/proformas/{proforma}/preview'
 */
preview068fc740980b3bd88a6f118f89ff5a90.get = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: preview068fc740980b3bd88a6f118f89ff5a90.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProformaController::preview
 * @see app/Http/Controllers/ProformaController.php:864
 * @route '/api/proformas/{proforma}/preview'
 */
preview068fc740980b3bd88a6f118f89ff5a90.head = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: preview068fc740980b3bd88a6f118f89ff5a90.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ProformaController::preview
 * @see app/Http/Controllers/ProformaController.php:864
 * @route '/proformas/{proforma}/preview'
 */
const previewd63ae53f9c6c4b70ea2bb5205141601d = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: previewd63ae53f9c6c4b70ea2bb5205141601d.url(args, options),
    method: 'get',
})

previewd63ae53f9c6c4b70ea2bb5205141601d.definition = {
    methods: ["get","head"],
    url: '/proformas/{proforma}/preview',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProformaController::preview
 * @see app/Http/Controllers/ProformaController.php:864
 * @route '/proformas/{proforma}/preview'
 */
previewd63ae53f9c6c4b70ea2bb5205141601d.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proforma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proforma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proforma: typeof args.proforma === 'object'
                ? args.proforma.id
                : args.proforma,
                }

    return previewd63ae53f9c6c4b70ea2bb5205141601d.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::preview
 * @see app/Http/Controllers/ProformaController.php:864
 * @route '/proformas/{proforma}/preview'
 */
previewd63ae53f9c6c4b70ea2bb5205141601d.get = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: previewd63ae53f9c6c4b70ea2bb5205141601d.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProformaController::preview
 * @see app/Http/Controllers/ProformaController.php:864
 * @route '/proformas/{proforma}/preview'
 */
previewd63ae53f9c6c4b70ea2bb5205141601d.head = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: previewd63ae53f9c6c4b70ea2bb5205141601d.url(args, options),
    method: 'head',
})

export const preview = {
    '/api/proformas/{proforma}/preview': preview068fc740980b3bd88a6f118f89ff5a90,
    '/proformas/{proforma}/preview': previewd63ae53f9c6c4b70ea2bb5205141601d,
}

/**
* @see \App\Http\Controllers\ProformaController::index
 * @see app/Http/Controllers/ProformaController.php:52
 * @route '/proformas'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/proformas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProformaController::index
 * @see app/Http/Controllers/ProformaController.php:52
 * @route '/proformas'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::index
 * @see app/Http/Controllers/ProformaController.php:52
 * @route '/proformas'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProformaController::index
 * @see app/Http/Controllers/ProformaController.php:52
 * @route '/proformas'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProformaController::create
 * @see app/Http/Controllers/ProformaController.php:79
 * @route '/proformas/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/proformas/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProformaController::create
 * @see app/Http/Controllers/ProformaController.php:79
 * @route '/proformas/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::create
 * @see app/Http/Controllers/ProformaController.php:79
 * @route '/proformas/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProformaController::create
 * @see app/Http/Controllers/ProformaController.php:79
 * @route '/proformas/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProformaController::store
 * @see app/Http/Controllers/ProformaController.php:362
 * @route '/proformas'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/proformas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProformaController::store
 * @see app/Http/Controllers/ProformaController.php:362
 * @route '/proformas'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::store
 * @see app/Http/Controllers/ProformaController.php:362
 * @route '/proformas'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProformaController::formatosDisponibles
 * @see app/Http/Controllers/ProformaController.php:917
 * @route '/proformas/formatos-disponibles'
 */
export const formatosDisponibles = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: formatosDisponibles.url(options),
    method: 'get',
})

formatosDisponibles.definition = {
    methods: ["get","head"],
    url: '/proformas/formatos-disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProformaController::formatosDisponibles
 * @see app/Http/Controllers/ProformaController.php:917
 * @route '/proformas/formatos-disponibles'
 */
formatosDisponibles.url = (options?: RouteQueryOptions) => {
    return formatosDisponibles.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::formatosDisponibles
 * @see app/Http/Controllers/ProformaController.php:917
 * @route '/proformas/formatos-disponibles'
 */
formatosDisponibles.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: formatosDisponibles.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProformaController::formatosDisponibles
 * @see app/Http/Controllers/ProformaController.php:917
 * @route '/proformas/formatos-disponibles'
 */
formatosDisponibles.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: formatosDisponibles.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProformaController::edit
 * @see app/Http/Controllers/ProformaController.php:102
 * @route '/proformas/{proforma}/edit'
 */
export const edit = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/proformas/{proforma}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProformaController::edit
 * @see app/Http/Controllers/ProformaController.php:102
 * @route '/proformas/{proforma}/edit'
 */
edit.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proforma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proforma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proforma: typeof args.proforma === 'object'
                ? args.proforma.id
                : args.proforma,
                }

    return edit.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::edit
 * @see app/Http/Controllers/ProformaController.php:102
 * @route '/proformas/{proforma}/edit'
 */
edit.get = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProformaController::edit
 * @see app/Http/Controllers/ProformaController.php:102
 * @route '/proformas/{proforma}/edit'
 */
edit.head = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProformaController::show
 * @see app/Http/Controllers/ProformaController.php:422
 * @route '/proformas/{proforma}'
 */
export const show = (args: { proforma: string | number } | [proforma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/proformas/{proforma}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProformaController::show
 * @see app/Http/Controllers/ProformaController.php:422
 * @route '/proformas/{proforma}'
 */
show.url = (args: { proforma: string | number } | [proforma: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proforma: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    proforma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proforma: args.proforma,
                }

    return show.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::show
 * @see app/Http/Controllers/ProformaController.php:422
 * @route '/proformas/{proforma}'
 */
show.get = (args: { proforma: string | number } | [proforma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProformaController::show
 * @see app/Http/Controllers/ProformaController.php:422
 * @route '/proformas/{proforma}'
 */
show.head = (args: { proforma: string | number } | [proforma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProformaController::aprobar
 * @see app/Http/Controllers/ProformaController.php:456
 * @route '/proformas/{id}/aprobar'
 */
export const aprobar = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: aprobar.url(args, options),
    method: 'post',
})

aprobar.definition = {
    methods: ["post"],
    url: '/proformas/{id}/aprobar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProformaController::aprobar
 * @see app/Http/Controllers/ProformaController.php:456
 * @route '/proformas/{id}/aprobar'
 */
aprobar.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return aprobar.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::aprobar
 * @see app/Http/Controllers/ProformaController.php:456
 * @route '/proformas/{id}/aprobar'
 */
aprobar.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: aprobar.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProformaController::rechazar
 * @see app/Http/Controllers/ProformaController.php:495
 * @route '/proformas/{id}/rechazar'
 */
export const rechazar = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rechazar.url(args, options),
    method: 'post',
})

rechazar.definition = {
    methods: ["post"],
    url: '/proformas/{id}/rechazar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProformaController::rechazar
 * @see app/Http/Controllers/ProformaController.php:495
 * @route '/proformas/{id}/rechazar'
 */
rechazar.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return rechazar.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::rechazar
 * @see app/Http/Controllers/ProformaController.php:495
 * @route '/proformas/{id}/rechazar'
 */
rechazar.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rechazar.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProformaController::procesarVenta
 * @see app/Http/Controllers/ProformaController.php:616
 * @route '/proformas/{id}/procesar-venta'
 */
export const procesarVenta = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: procesarVenta.url(args, options),
    method: 'post',
})

procesarVenta.definition = {
    methods: ["post"],
    url: '/proformas/{id}/procesar-venta',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProformaController::procesarVenta
 * @see app/Http/Controllers/ProformaController.php:616
 * @route '/proformas/{id}/procesar-venta'
 */
procesarVenta.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return procesarVenta.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::procesarVenta
 * @see app/Http/Controllers/ProformaController.php:616
 * @route '/proformas/{id}/procesar-venta'
 */
procesarVenta.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: procesarVenta.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProformaController::convertirAVenta
 * @see app/Http/Controllers/ProformaController.php:536
 * @route '/proformas/{id}/convertir-venta'
 */
export const convertirAVenta = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: convertirAVenta.url(args, options),
    method: 'post',
})

convertirAVenta.definition = {
    methods: ["post"],
    url: '/proformas/{id}/convertir-venta',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProformaController::convertirAVenta
 * @see app/Http/Controllers/ProformaController.php:536
 * @route '/proformas/{id}/convertir-venta'
 */
convertirAVenta.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return convertirAVenta.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::convertirAVenta
 * @see app/Http/Controllers/ProformaController.php:536
 * @route '/proformas/{id}/convertir-venta'
 */
convertirAVenta.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: convertirAVenta.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProformaController::renovarReservas
 * @see app/Http/Controllers/ProformaController.php:708
 * @route '/proformas/{id}/renovar-reservas'
 */
export const renovarReservas = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: renovarReservas.url(args, options),
    method: 'post',
})

renovarReservas.definition = {
    methods: ["post"],
    url: '/proformas/{id}/renovar-reservas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProformaController::renovarReservas
 * @see app/Http/Controllers/ProformaController.php:708
 * @route '/proformas/{id}/renovar-reservas'
 */
renovarReservas.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return renovarReservas.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProformaController::renovarReservas
 * @see app/Http/Controllers/ProformaController.php:708
 * @route '/proformas/{id}/renovar-reservas'
 */
renovarReservas.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: renovarReservas.url(args, options),
    method: 'post',
})
const ProformaController = { imprimir, preview, index, create, store, formatosDisponibles, edit, show, aprobar, rechazar, procesarVenta, convertirAVenta, renovarReservas }

export default ProformaController