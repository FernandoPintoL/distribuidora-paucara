import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\DetalleCompraController::index
 * @see app/Http/Controllers/DetalleCompraController.php:22
 * @route '/compras/{compra}/detalles'
 */
export const index = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/compras/{compra}/detalles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DetalleCompraController::index
 * @see app/Http/Controllers/DetalleCompraController.php:22
 * @route '/compras/{compra}/detalles'
 */
index.url = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return index.definition.url
            .replace('{compra}', parsedArgs.compra.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DetalleCompraController::index
 * @see app/Http/Controllers/DetalleCompraController.php:22
 * @route '/compras/{compra}/detalles'
 */
index.get = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\DetalleCompraController::index
 * @see app/Http/Controllers/DetalleCompraController.php:22
 * @route '/compras/{compra}/detalles'
 */
index.head = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\DetalleCompraController::index
 * @see app/Http/Controllers/DetalleCompraController.php:22
 * @route '/compras/{compra}/detalles'
 */
    const indexForm = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\DetalleCompraController::index
 * @see app/Http/Controllers/DetalleCompraController.php:22
 * @route '/compras/{compra}/detalles'
 */
        indexForm.get = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\DetalleCompraController::index
 * @see app/Http/Controllers/DetalleCompraController.php:22
 * @route '/compras/{compra}/detalles'
 */
        indexForm.head = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\DetalleCompraController::create
 * @see app/Http/Controllers/DetalleCompraController.php:0
 * @route '/compras/{compra}/detalles/create'
 */
export const create = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(args, options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/compras/{compra}/detalles/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DetalleCompraController::create
 * @see app/Http/Controllers/DetalleCompraController.php:0
 * @route '/compras/{compra}/detalles/create'
 */
create.url = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return create.definition.url
            .replace('{compra}', parsedArgs.compra.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DetalleCompraController::create
 * @see app/Http/Controllers/DetalleCompraController.php:0
 * @route '/compras/{compra}/detalles/create'
 */
create.get = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\DetalleCompraController::create
 * @see app/Http/Controllers/DetalleCompraController.php:0
 * @route '/compras/{compra}/detalles/create'
 */
create.head = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\DetalleCompraController::create
 * @see app/Http/Controllers/DetalleCompraController.php:0
 * @route '/compras/{compra}/detalles/create'
 */
    const createForm = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\DetalleCompraController::create
 * @see app/Http/Controllers/DetalleCompraController.php:0
 * @route '/compras/{compra}/detalles/create'
 */
        createForm.get = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\DetalleCompraController::create
 * @see app/Http/Controllers/DetalleCompraController.php:0
 * @route '/compras/{compra}/detalles/create'
 */
        createForm.head = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\DetalleCompraController::store
 * @see app/Http/Controllers/DetalleCompraController.php:36
 * @route '/compras/{compra}/detalles'
 */
export const store = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/compras/{compra}/detalles',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DetalleCompraController::store
 * @see app/Http/Controllers/DetalleCompraController.php:36
 * @route '/compras/{compra}/detalles'
 */
store.url = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return store.definition.url
            .replace('{compra}', parsedArgs.compra.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DetalleCompraController::store
 * @see app/Http/Controllers/DetalleCompraController.php:36
 * @route '/compras/{compra}/detalles'
 */
store.post = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\DetalleCompraController::store
 * @see app/Http/Controllers/DetalleCompraController.php:36
 * @route '/compras/{compra}/detalles'
 */
    const storeForm = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\DetalleCompraController::store
 * @see app/Http/Controllers/DetalleCompraController.php:36
 * @route '/compras/{compra}/detalles'
 */
        storeForm.post = (args: { compra: string | number } | [compra: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
const DetalleCompraController = { index, create, store }

export default DetalleCompraController