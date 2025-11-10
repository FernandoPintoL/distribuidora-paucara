import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ProductoController::indexApi
* @see app/Http/Controllers/ProductoController.php:850
* @route '/api/app/productos'
*/
const indexApi5f94bd91c3d48d955f7b536c0a3189e1 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexApi5f94bd91c3d48d955f7b536c0a3189e1.url(options),
    method: 'get',
})

indexApi5f94bd91c3d48d955f7b536c0a3189e1.definition = {
    methods: ["get","head"],
    url: '/api/app/productos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductoController::indexApi
* @see app/Http/Controllers/ProductoController.php:850
* @route '/api/app/productos'
*/
indexApi5f94bd91c3d48d955f7b536c0a3189e1.url = (options?: RouteQueryOptions) => {
    return indexApi5f94bd91c3d48d955f7b536c0a3189e1.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::indexApi
* @see app/Http/Controllers/ProductoController.php:850
* @route '/api/app/productos'
*/
indexApi5f94bd91c3d48d955f7b536c0a3189e1.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexApi5f94bd91c3d48d955f7b536c0a3189e1.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::indexApi
* @see app/Http/Controllers/ProductoController.php:850
* @route '/api/app/productos'
*/
indexApi5f94bd91c3d48d955f7b536c0a3189e1.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: indexApi5f94bd91c3d48d955f7b536c0a3189e1.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductoController::indexApi
* @see app/Http/Controllers/ProductoController.php:850
* @route '/api/app/productos'
*/
const indexApi5f94bd91c3d48d955f7b536c0a3189e1Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: indexApi5f94bd91c3d48d955f7b536c0a3189e1.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::indexApi
* @see app/Http/Controllers/ProductoController.php:850
* @route '/api/app/productos'
*/
indexApi5f94bd91c3d48d955f7b536c0a3189e1Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: indexApi5f94bd91c3d48d955f7b536c0a3189e1.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::indexApi
* @see app/Http/Controllers/ProductoController.php:850
* @route '/api/app/productos'
*/
indexApi5f94bd91c3d48d955f7b536c0a3189e1Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: indexApi5f94bd91c3d48d955f7b536c0a3189e1.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

indexApi5f94bd91c3d48d955f7b536c0a3189e1.form = indexApi5f94bd91c3d48d955f7b536c0a3189e1Form
/**
* @see \App\Http\Controllers\ProductoController::indexApi
* @see app/Http/Controllers/ProductoController.php:850
* @route '/api/productos'
*/
const indexApica1ca34b4a118f4e84d7e3af666cfc55 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexApica1ca34b4a118f4e84d7e3af666cfc55.url(options),
    method: 'get',
})

indexApica1ca34b4a118f4e84d7e3af666cfc55.definition = {
    methods: ["get","head"],
    url: '/api/productos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductoController::indexApi
* @see app/Http/Controllers/ProductoController.php:850
* @route '/api/productos'
*/
indexApica1ca34b4a118f4e84d7e3af666cfc55.url = (options?: RouteQueryOptions) => {
    return indexApica1ca34b4a118f4e84d7e3af666cfc55.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::indexApi
* @see app/Http/Controllers/ProductoController.php:850
* @route '/api/productos'
*/
indexApica1ca34b4a118f4e84d7e3af666cfc55.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexApica1ca34b4a118f4e84d7e3af666cfc55.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::indexApi
* @see app/Http/Controllers/ProductoController.php:850
* @route '/api/productos'
*/
indexApica1ca34b4a118f4e84d7e3af666cfc55.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: indexApica1ca34b4a118f4e84d7e3af666cfc55.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductoController::indexApi
* @see app/Http/Controllers/ProductoController.php:850
* @route '/api/productos'
*/
const indexApica1ca34b4a118f4e84d7e3af666cfc55Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: indexApica1ca34b4a118f4e84d7e3af666cfc55.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::indexApi
* @see app/Http/Controllers/ProductoController.php:850
* @route '/api/productos'
*/
indexApica1ca34b4a118f4e84d7e3af666cfc55Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: indexApica1ca34b4a118f4e84d7e3af666cfc55.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::indexApi
* @see app/Http/Controllers/ProductoController.php:850
* @route '/api/productos'
*/
indexApica1ca34b4a118f4e84d7e3af666cfc55Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: indexApica1ca34b4a118f4e84d7e3af666cfc55.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

indexApica1ca34b4a118f4e84d7e3af666cfc55.form = indexApica1ca34b4a118f4e84d7e3af666cfc55Form

export const indexApi = {
    '/api/app/productos': indexApi5f94bd91c3d48d955f7b536c0a3189e1,
    '/api/productos': indexApica1ca34b4a118f4e84d7e3af666cfc55,
}

/**
* @see \App\Http\Controllers\ProductoController::showApi
* @see app/Http/Controllers/ProductoController.php:1008
* @route '/api/app/productos/{producto}'
*/
const showApibf7395ef11ddc0ca3b5c235b5d86f8b9 = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showApibf7395ef11ddc0ca3b5c235b5d86f8b9.url(args, options),
    method: 'get',
})

showApibf7395ef11ddc0ca3b5c235b5d86f8b9.definition = {
    methods: ["get","head"],
    url: '/api/app/productos/{producto}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductoController::showApi
* @see app/Http/Controllers/ProductoController.php:1008
* @route '/api/app/productos/{producto}'
*/
showApibf7395ef11ddc0ca3b5c235b5d86f8b9.url = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { producto: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { producto: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            producto: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        producto: typeof args.producto === 'object'
        ? args.producto.id
        : args.producto,
    }

    return showApibf7395ef11ddc0ca3b5c235b5d86f8b9.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::showApi
* @see app/Http/Controllers/ProductoController.php:1008
* @route '/api/app/productos/{producto}'
*/
showApibf7395ef11ddc0ca3b5c235b5d86f8b9.get = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showApibf7395ef11ddc0ca3b5c235b5d86f8b9.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::showApi
* @see app/Http/Controllers/ProductoController.php:1008
* @route '/api/app/productos/{producto}'
*/
showApibf7395ef11ddc0ca3b5c235b5d86f8b9.head = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showApibf7395ef11ddc0ca3b5c235b5d86f8b9.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductoController::showApi
* @see app/Http/Controllers/ProductoController.php:1008
* @route '/api/app/productos/{producto}'
*/
const showApibf7395ef11ddc0ca3b5c235b5d86f8b9Form = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: showApibf7395ef11ddc0ca3b5c235b5d86f8b9.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::showApi
* @see app/Http/Controllers/ProductoController.php:1008
* @route '/api/app/productos/{producto}'
*/
showApibf7395ef11ddc0ca3b5c235b5d86f8b9Form.get = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: showApibf7395ef11ddc0ca3b5c235b5d86f8b9.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::showApi
* @see app/Http/Controllers/ProductoController.php:1008
* @route '/api/app/productos/{producto}'
*/
showApibf7395ef11ddc0ca3b5c235b5d86f8b9Form.head = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: showApibf7395ef11ddc0ca3b5c235b5d86f8b9.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

showApibf7395ef11ddc0ca3b5c235b5d86f8b9.form = showApibf7395ef11ddc0ca3b5c235b5d86f8b9Form
/**
* @see \App\Http\Controllers\ProductoController::showApi
* @see app/Http/Controllers/ProductoController.php:1008
* @route '/api/productos/{producto}'
*/
const showApib4e9327e675be9b4660423209f3885e4 = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showApib4e9327e675be9b4660423209f3885e4.url(args, options),
    method: 'get',
})

showApib4e9327e675be9b4660423209f3885e4.definition = {
    methods: ["get","head"],
    url: '/api/productos/{producto}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductoController::showApi
* @see app/Http/Controllers/ProductoController.php:1008
* @route '/api/productos/{producto}'
*/
showApib4e9327e675be9b4660423209f3885e4.url = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { producto: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { producto: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            producto: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        producto: typeof args.producto === 'object'
        ? args.producto.id
        : args.producto,
    }

    return showApib4e9327e675be9b4660423209f3885e4.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::showApi
* @see app/Http/Controllers/ProductoController.php:1008
* @route '/api/productos/{producto}'
*/
showApib4e9327e675be9b4660423209f3885e4.get = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showApib4e9327e675be9b4660423209f3885e4.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::showApi
* @see app/Http/Controllers/ProductoController.php:1008
* @route '/api/productos/{producto}'
*/
showApib4e9327e675be9b4660423209f3885e4.head = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showApib4e9327e675be9b4660423209f3885e4.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductoController::showApi
* @see app/Http/Controllers/ProductoController.php:1008
* @route '/api/productos/{producto}'
*/
const showApib4e9327e675be9b4660423209f3885e4Form = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: showApib4e9327e675be9b4660423209f3885e4.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::showApi
* @see app/Http/Controllers/ProductoController.php:1008
* @route '/api/productos/{producto}'
*/
showApib4e9327e675be9b4660423209f3885e4Form.get = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: showApib4e9327e675be9b4660423209f3885e4.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::showApi
* @see app/Http/Controllers/ProductoController.php:1008
* @route '/api/productos/{producto}'
*/
showApib4e9327e675be9b4660423209f3885e4Form.head = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: showApib4e9327e675be9b4660423209f3885e4.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

showApib4e9327e675be9b4660423209f3885e4.form = showApib4e9327e675be9b4660423209f3885e4Form

export const showApi = {
    '/api/app/productos/{producto}': showApibf7395ef11ddc0ca3b5c235b5d86f8b9,
    '/api/productos/{producto}': showApib4e9327e675be9b4660423209f3885e4,
}

/**
* @see \App\Http\Controllers\ProductoController::buscarApi
* @see app/Http/Controllers/ProductoController.php:1251
* @route '/api/app/productos/buscar'
*/
const buscarApi2f647e659f2ae29cad5423e3d6248ee7 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: buscarApi2f647e659f2ae29cad5423e3d6248ee7.url(options),
    method: 'get',
})

buscarApi2f647e659f2ae29cad5423e3d6248ee7.definition = {
    methods: ["get","head"],
    url: '/api/app/productos/buscar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductoController::buscarApi
* @see app/Http/Controllers/ProductoController.php:1251
* @route '/api/app/productos/buscar'
*/
buscarApi2f647e659f2ae29cad5423e3d6248ee7.url = (options?: RouteQueryOptions) => {
    return buscarApi2f647e659f2ae29cad5423e3d6248ee7.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::buscarApi
* @see app/Http/Controllers/ProductoController.php:1251
* @route '/api/app/productos/buscar'
*/
buscarApi2f647e659f2ae29cad5423e3d6248ee7.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: buscarApi2f647e659f2ae29cad5423e3d6248ee7.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::buscarApi
* @see app/Http/Controllers/ProductoController.php:1251
* @route '/api/app/productos/buscar'
*/
buscarApi2f647e659f2ae29cad5423e3d6248ee7.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: buscarApi2f647e659f2ae29cad5423e3d6248ee7.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductoController::buscarApi
* @see app/Http/Controllers/ProductoController.php:1251
* @route '/api/app/productos/buscar'
*/
const buscarApi2f647e659f2ae29cad5423e3d6248ee7Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: buscarApi2f647e659f2ae29cad5423e3d6248ee7.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::buscarApi
* @see app/Http/Controllers/ProductoController.php:1251
* @route '/api/app/productos/buscar'
*/
buscarApi2f647e659f2ae29cad5423e3d6248ee7Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: buscarApi2f647e659f2ae29cad5423e3d6248ee7.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::buscarApi
* @see app/Http/Controllers/ProductoController.php:1251
* @route '/api/app/productos/buscar'
*/
buscarApi2f647e659f2ae29cad5423e3d6248ee7Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: buscarApi2f647e659f2ae29cad5423e3d6248ee7.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

buscarApi2f647e659f2ae29cad5423e3d6248ee7.form = buscarApi2f647e659f2ae29cad5423e3d6248ee7Form
/**
* @see \App\Http\Controllers\ProductoController::buscarApi
* @see app/Http/Controllers/ProductoController.php:1251
* @route '/api/productos/buscar'
*/
const buscarApi124bf748977a65c9d7e76c3fc9c13e6d = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: buscarApi124bf748977a65c9d7e76c3fc9c13e6d.url(options),
    method: 'get',
})

buscarApi124bf748977a65c9d7e76c3fc9c13e6d.definition = {
    methods: ["get","head"],
    url: '/api/productos/buscar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductoController::buscarApi
* @see app/Http/Controllers/ProductoController.php:1251
* @route '/api/productos/buscar'
*/
buscarApi124bf748977a65c9d7e76c3fc9c13e6d.url = (options?: RouteQueryOptions) => {
    return buscarApi124bf748977a65c9d7e76c3fc9c13e6d.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::buscarApi
* @see app/Http/Controllers/ProductoController.php:1251
* @route '/api/productos/buscar'
*/
buscarApi124bf748977a65c9d7e76c3fc9c13e6d.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: buscarApi124bf748977a65c9d7e76c3fc9c13e6d.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::buscarApi
* @see app/Http/Controllers/ProductoController.php:1251
* @route '/api/productos/buscar'
*/
buscarApi124bf748977a65c9d7e76c3fc9c13e6d.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: buscarApi124bf748977a65c9d7e76c3fc9c13e6d.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductoController::buscarApi
* @see app/Http/Controllers/ProductoController.php:1251
* @route '/api/productos/buscar'
*/
const buscarApi124bf748977a65c9d7e76c3fc9c13e6dForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: buscarApi124bf748977a65c9d7e76c3fc9c13e6d.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::buscarApi
* @see app/Http/Controllers/ProductoController.php:1251
* @route '/api/productos/buscar'
*/
buscarApi124bf748977a65c9d7e76c3fc9c13e6dForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: buscarApi124bf748977a65c9d7e76c3fc9c13e6d.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::buscarApi
* @see app/Http/Controllers/ProductoController.php:1251
* @route '/api/productos/buscar'
*/
buscarApi124bf748977a65c9d7e76c3fc9c13e6dForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: buscarApi124bf748977a65c9d7e76c3fc9c13e6d.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

buscarApi124bf748977a65c9d7e76c3fc9c13e6d.form = buscarApi124bf748977a65c9d7e76c3fc9c13e6dForm

export const buscarApi = {
    '/api/app/productos/buscar': buscarApi2f647e659f2ae29cad5423e3d6248ee7,
    '/api/productos/buscar': buscarApi124bf748977a65c9d7e76c3fc9c13e6d,
}

/**
* @see \App\Http\Controllers\ProductoController::storeApi
* @see app/Http/Controllers/ProductoController.php:1133
* @route '/api/productos'
*/
export const storeApi = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeApi.url(options),
    method: 'post',
})

storeApi.definition = {
    methods: ["post"],
    url: '/api/productos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProductoController::storeApi
* @see app/Http/Controllers/ProductoController.php:1133
* @route '/api/productos'
*/
storeApi.url = (options?: RouteQueryOptions) => {
    return storeApi.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::storeApi
* @see app/Http/Controllers/ProductoController.php:1133
* @route '/api/productos'
*/
storeApi.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeApi.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductoController::storeApi
* @see app/Http/Controllers/ProductoController.php:1133
* @route '/api/productos'
*/
const storeApiForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: storeApi.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductoController::storeApi
* @see app/Http/Controllers/ProductoController.php:1133
* @route '/api/productos'
*/
storeApiForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: storeApi.url(options),
    method: 'post',
})

storeApi.form = storeApiForm

/**
* @see \App\Http\Controllers\ProductoController::updateApi
* @see app/Http/Controllers/ProductoController.php:1179
* @route '/api/productos/{producto}'
*/
export const updateApi = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateApi.url(args, options),
    method: 'put',
})

updateApi.definition = {
    methods: ["put"],
    url: '/api/productos/{producto}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\ProductoController::updateApi
* @see app/Http/Controllers/ProductoController.php:1179
* @route '/api/productos/{producto}'
*/
updateApi.url = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { producto: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { producto: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            producto: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        producto: typeof args.producto === 'object'
        ? args.producto.id
        : args.producto,
    }

    return updateApi.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::updateApi
* @see app/Http/Controllers/ProductoController.php:1179
* @route '/api/productos/{producto}'
*/
updateApi.put = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateApi.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\ProductoController::updateApi
* @see app/Http/Controllers/ProductoController.php:1179
* @route '/api/productos/{producto}'
*/
const updateApiForm = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateApi.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductoController::updateApi
* @see app/Http/Controllers/ProductoController.php:1179
* @route '/api/productos/{producto}'
*/
updateApiForm.put = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateApi.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

updateApi.form = updateApiForm

/**
* @see \App\Http\Controllers\ProductoController::destroyApi
* @see app/Http/Controllers/ProductoController.php:1213
* @route '/api/productos/{producto}'
*/
export const destroyApi = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyApi.url(args, options),
    method: 'delete',
})

destroyApi.definition = {
    methods: ["delete"],
    url: '/api/productos/{producto}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ProductoController::destroyApi
* @see app/Http/Controllers/ProductoController.php:1213
* @route '/api/productos/{producto}'
*/
destroyApi.url = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { producto: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { producto: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            producto: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        producto: typeof args.producto === 'object'
        ? args.producto.id
        : args.producto,
    }

    return destroyApi.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::destroyApi
* @see app/Http/Controllers/ProductoController.php:1213
* @route '/api/productos/{producto}'
*/
destroyApi.delete = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyApi.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\ProductoController::destroyApi
* @see app/Http/Controllers/ProductoController.php:1213
* @route '/api/productos/{producto}'
*/
const destroyApiForm = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroyApi.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductoController::destroyApi
* @see app/Http/Controllers/ProductoController.php:1213
* @route '/api/productos/{producto}'
*/
destroyApiForm.delete = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroyApi.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroyApi.form = destroyApiForm

/**
* @see \App\Http\Controllers\ProductoController::historialPrecios
* @see app/Http/Controllers/ProductoController.php:25
* @route '/api/productos/{producto}/historial-precios'
*/
const historialPrecios0c937dd5e26e036352e6a5c6b0e5435f = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: historialPrecios0c937dd5e26e036352e6a5c6b0e5435f.url(args, options),
    method: 'get',
})

historialPrecios0c937dd5e26e036352e6a5c6b0e5435f.definition = {
    methods: ["get","head"],
    url: '/api/productos/{producto}/historial-precios',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductoController::historialPrecios
* @see app/Http/Controllers/ProductoController.php:25
* @route '/api/productos/{producto}/historial-precios'
*/
historialPrecios0c937dd5e26e036352e6a5c6b0e5435f.url = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { producto: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { producto: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            producto: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        producto: typeof args.producto === 'object'
        ? args.producto.id
        : args.producto,
    }

    return historialPrecios0c937dd5e26e036352e6a5c6b0e5435f.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::historialPrecios
* @see app/Http/Controllers/ProductoController.php:25
* @route '/api/productos/{producto}/historial-precios'
*/
historialPrecios0c937dd5e26e036352e6a5c6b0e5435f.get = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: historialPrecios0c937dd5e26e036352e6a5c6b0e5435f.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::historialPrecios
* @see app/Http/Controllers/ProductoController.php:25
* @route '/api/productos/{producto}/historial-precios'
*/
historialPrecios0c937dd5e26e036352e6a5c6b0e5435f.head = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: historialPrecios0c937dd5e26e036352e6a5c6b0e5435f.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductoController::historialPrecios
* @see app/Http/Controllers/ProductoController.php:25
* @route '/api/productos/{producto}/historial-precios'
*/
const historialPrecios0c937dd5e26e036352e6a5c6b0e5435fForm = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: historialPrecios0c937dd5e26e036352e6a5c6b0e5435f.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::historialPrecios
* @see app/Http/Controllers/ProductoController.php:25
* @route '/api/productos/{producto}/historial-precios'
*/
historialPrecios0c937dd5e26e036352e6a5c6b0e5435fForm.get = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: historialPrecios0c937dd5e26e036352e6a5c6b0e5435f.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::historialPrecios
* @see app/Http/Controllers/ProductoController.php:25
* @route '/api/productos/{producto}/historial-precios'
*/
historialPrecios0c937dd5e26e036352e6a5c6b0e5435fForm.head = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: historialPrecios0c937dd5e26e036352e6a5c6b0e5435f.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

historialPrecios0c937dd5e26e036352e6a5c6b0e5435f.form = historialPrecios0c937dd5e26e036352e6a5c6b0e5435fForm
/**
* @see \App\Http\Controllers\ProductoController::historialPrecios
* @see app/Http/Controllers/ProductoController.php:25
* @route '/productos/{producto}/historial-precios'
*/
const historialPrecios91e45b35dc8bead9d21dd496abe33a36 = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: historialPrecios91e45b35dc8bead9d21dd496abe33a36.url(args, options),
    method: 'get',
})

historialPrecios91e45b35dc8bead9d21dd496abe33a36.definition = {
    methods: ["get","head"],
    url: '/productos/{producto}/historial-precios',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductoController::historialPrecios
* @see app/Http/Controllers/ProductoController.php:25
* @route '/productos/{producto}/historial-precios'
*/
historialPrecios91e45b35dc8bead9d21dd496abe33a36.url = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { producto: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { producto: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            producto: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        producto: typeof args.producto === 'object'
        ? args.producto.id
        : args.producto,
    }

    return historialPrecios91e45b35dc8bead9d21dd496abe33a36.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::historialPrecios
* @see app/Http/Controllers/ProductoController.php:25
* @route '/productos/{producto}/historial-precios'
*/
historialPrecios91e45b35dc8bead9d21dd496abe33a36.get = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: historialPrecios91e45b35dc8bead9d21dd496abe33a36.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::historialPrecios
* @see app/Http/Controllers/ProductoController.php:25
* @route '/productos/{producto}/historial-precios'
*/
historialPrecios91e45b35dc8bead9d21dd496abe33a36.head = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: historialPrecios91e45b35dc8bead9d21dd496abe33a36.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductoController::historialPrecios
* @see app/Http/Controllers/ProductoController.php:25
* @route '/productos/{producto}/historial-precios'
*/
const historialPrecios91e45b35dc8bead9d21dd496abe33a36Form = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: historialPrecios91e45b35dc8bead9d21dd496abe33a36.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::historialPrecios
* @see app/Http/Controllers/ProductoController.php:25
* @route '/productos/{producto}/historial-precios'
*/
historialPrecios91e45b35dc8bead9d21dd496abe33a36Form.get = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: historialPrecios91e45b35dc8bead9d21dd496abe33a36.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::historialPrecios
* @see app/Http/Controllers/ProductoController.php:25
* @route '/productos/{producto}/historial-precios'
*/
historialPrecios91e45b35dc8bead9d21dd496abe33a36Form.head = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: historialPrecios91e45b35dc8bead9d21dd496abe33a36.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

historialPrecios91e45b35dc8bead9d21dd496abe33a36.form = historialPrecios91e45b35dc8bead9d21dd496abe33a36Form

export const historialPrecios = {
    '/api/productos/{producto}/historial-precios': historialPrecios0c937dd5e26e036352e6a5c6b0e5435f,
    '/productos/{producto}/historial-precios': historialPrecios91e45b35dc8bead9d21dd496abe33a36,
}

/**
* @see \App\Http\Controllers\ProductoController::index
* @see app/Http/Controllers/ProductoController.php:52
* @route '/productos'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/productos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductoController::index
* @see app/Http/Controllers/ProductoController.php:52
* @route '/productos'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::index
* @see app/Http/Controllers/ProductoController.php:52
* @route '/productos'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::index
* @see app/Http/Controllers/ProductoController.php:52
* @route '/productos'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductoController::index
* @see app/Http/Controllers/ProductoController.php:52
* @route '/productos'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::index
* @see app/Http/Controllers/ProductoController.php:52
* @route '/productos'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::index
* @see app/Http/Controllers/ProductoController.php:52
* @route '/productos'
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
* @see \App\Http\Controllers\ProductoController::create
* @see app/Http/Controllers/ProductoController.php:198
* @route '/productos/create'
*/
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/productos/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductoController::create
* @see app/Http/Controllers/ProductoController.php:198
* @route '/productos/create'
*/
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::create
* @see app/Http/Controllers/ProductoController.php:198
* @route '/productos/create'
*/
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::create
* @see app/Http/Controllers/ProductoController.php:198
* @route '/productos/create'
*/
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductoController::create
* @see app/Http/Controllers/ProductoController.php:198
* @route '/productos/create'
*/
const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::create
* @see app/Http/Controllers/ProductoController.php:198
* @route '/productos/create'
*/
createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::create
* @see app/Http/Controllers/ProductoController.php:198
* @route '/productos/create'
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
* @see \App\Http\Controllers\ProductoController::store
* @see app/Http/Controllers/ProductoController.php:227
* @route '/productos'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/productos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProductoController::store
* @see app/Http/Controllers/ProductoController.php:227
* @route '/productos'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::store
* @see app/Http/Controllers/ProductoController.php:227
* @route '/productos'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductoController::store
* @see app/Http/Controllers/ProductoController.php:227
* @route '/productos'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductoController::store
* @see app/Http/Controllers/ProductoController.php:227
* @route '/productos'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\ProductoController::edit
* @see app/Http/Controllers/ProductoController.php:478
* @route '/productos/{producto}/edit'
*/
export const edit = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/productos/{producto}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductoController::edit
* @see app/Http/Controllers/ProductoController.php:478
* @route '/productos/{producto}/edit'
*/
edit.url = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { producto: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { producto: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            producto: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        producto: typeof args.producto === 'object'
        ? args.producto.id
        : args.producto,
    }

    return edit.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::edit
* @see app/Http/Controllers/ProductoController.php:478
* @route '/productos/{producto}/edit'
*/
edit.get = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::edit
* @see app/Http/Controllers/ProductoController.php:478
* @route '/productos/{producto}/edit'
*/
edit.head = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductoController::edit
* @see app/Http/Controllers/ProductoController.php:478
* @route '/productos/{producto}/edit'
*/
const editForm = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::edit
* @see app/Http/Controllers/ProductoController.php:478
* @route '/productos/{producto}/edit'
*/
editForm.get = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::edit
* @see app/Http/Controllers/ProductoController.php:478
* @route '/productos/{producto}/edit'
*/
editForm.head = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\ProductoController::update
* @see app/Http/Controllers/ProductoController.php:583
* @route '/productos/{producto}'
*/
export const update = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/productos/{producto}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\ProductoController::update
* @see app/Http/Controllers/ProductoController.php:583
* @route '/productos/{producto}'
*/
update.url = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { producto: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { producto: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            producto: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        producto: typeof args.producto === 'object'
        ? args.producto.id
        : args.producto,
    }

    return update.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::update
* @see app/Http/Controllers/ProductoController.php:583
* @route '/productos/{producto}'
*/
update.put = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\ProductoController::update
* @see app/Http/Controllers/ProductoController.php:583
* @route '/productos/{producto}'
*/
update.patch = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\ProductoController::update
* @see app/Http/Controllers/ProductoController.php:583
* @route '/productos/{producto}'
*/
const updateForm = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductoController::update
* @see app/Http/Controllers/ProductoController.php:583
* @route '/productos/{producto}'
*/
updateForm.put = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductoController::update
* @see app/Http/Controllers/ProductoController.php:583
* @route '/productos/{producto}'
*/
updateForm.patch = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\ProductoController::destroy
* @see app/Http/Controllers/ProductoController.php:787
* @route '/productos/{producto}'
*/
export const destroy = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/productos/{producto}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ProductoController::destroy
* @see app/Http/Controllers/ProductoController.php:787
* @route '/productos/{producto}'
*/
destroy.url = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { producto: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { producto: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            producto: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        producto: typeof args.producto === 'object'
        ? args.producto.id
        : args.producto,
    }

    return destroy.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::destroy
* @see app/Http/Controllers/ProductoController.php:787
* @route '/productos/{producto}'
*/
destroy.delete = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\ProductoController::destroy
* @see app/Http/Controllers/ProductoController.php:787
* @route '/productos/{producto}'
*/
const destroyForm = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductoController::destroy
* @see app/Http/Controllers/ProductoController.php:787
* @route '/productos/{producto}'
*/
destroyForm.delete = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\ProductoController::createModerno
* @see app/Http/Controllers/ProductoController.php:215
* @route '/productos/crear/moderno'
*/
export const createModerno = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: createModerno.url(options),
    method: 'get',
})

createModerno.definition = {
    methods: ["get","head"],
    url: '/productos/crear/moderno',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductoController::createModerno
* @see app/Http/Controllers/ProductoController.php:215
* @route '/productos/crear/moderno'
*/
createModerno.url = (options?: RouteQueryOptions) => {
    return createModerno.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::createModerno
* @see app/Http/Controllers/ProductoController.php:215
* @route '/productos/crear/moderno'
*/
createModerno.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: createModerno.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::createModerno
* @see app/Http/Controllers/ProductoController.php:215
* @route '/productos/crear/moderno'
*/
createModerno.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: createModerno.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductoController::createModerno
* @see app/Http/Controllers/ProductoController.php:215
* @route '/productos/crear/moderno'
*/
const createModernoForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: createModerno.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::createModerno
* @see app/Http/Controllers/ProductoController.php:215
* @route '/productos/crear/moderno'
*/
createModernoForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: createModerno.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductoController::createModerno
* @see app/Http/Controllers/ProductoController.php:215
* @route '/productos/crear/moderno'
*/
createModernoForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: createModerno.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

createModerno.form = createModernoForm

const ProductoController = { indexApi, showApi, buscarApi, storeApi, updateApi, destroyApi, historialPrecios, index, create, store, edit, update, destroy, createModerno }

export default ProductoController