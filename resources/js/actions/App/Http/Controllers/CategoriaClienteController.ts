import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CategoriaClienteController::indexApi
 * @see app/Http/Controllers/CategoriaClienteController.php:16
 * @route '/api/categorias-cliente'
 */
export const indexApi = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexApi.url(options),
    method: 'get',
})

indexApi.definition = {
    methods: ["get","head"],
    url: '/api/categorias-cliente',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CategoriaClienteController::indexApi
 * @see app/Http/Controllers/CategoriaClienteController.php:16
 * @route '/api/categorias-cliente'
 */
indexApi.url = (options?: RouteQueryOptions) => {
    return indexApi.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CategoriaClienteController::indexApi
 * @see app/Http/Controllers/CategoriaClienteController.php:16
 * @route '/api/categorias-cliente'
 */
indexApi.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexApi.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CategoriaClienteController::indexApi
 * @see app/Http/Controllers/CategoriaClienteController.php:16
 * @route '/api/categorias-cliente'
 */
indexApi.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: indexApi.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CategoriaClienteController::storeApi
 * @see app/Http/Controllers/CategoriaClienteController.php:44
 * @route '/api/categorias-cliente'
 */
export const storeApi = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeApi.url(options),
    method: 'post',
})

storeApi.definition = {
    methods: ["post"],
    url: '/api/categorias-cliente',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CategoriaClienteController::storeApi
 * @see app/Http/Controllers/CategoriaClienteController.php:44
 * @route '/api/categorias-cliente'
 */
storeApi.url = (options?: RouteQueryOptions) => {
    return storeApi.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CategoriaClienteController::storeApi
 * @see app/Http/Controllers/CategoriaClienteController.php:44
 * @route '/api/categorias-cliente'
 */
storeApi.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeApi.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CategoriaClienteController::showApi
 * @see app/Http/Controllers/CategoriaClienteController.php:63
 * @route '/api/categorias-cliente/{categoria}'
 */
export const showApi = (args: { categoria: number | { id: number } } | [categoria: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showApi.url(args, options),
    method: 'get',
})

showApi.definition = {
    methods: ["get","head"],
    url: '/api/categorias-cliente/{categoria}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CategoriaClienteController::showApi
 * @see app/Http/Controllers/CategoriaClienteController.php:63
 * @route '/api/categorias-cliente/{categoria}'
 */
showApi.url = (args: { categoria: number | { id: number } } | [categoria: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { categoria: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { categoria: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    categoria: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        categoria: typeof args.categoria === 'object'
                ? args.categoria.id
                : args.categoria,
                }

    return showApi.definition.url
            .replace('{categoria}', parsedArgs.categoria.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CategoriaClienteController::showApi
 * @see app/Http/Controllers/CategoriaClienteController.php:63
 * @route '/api/categorias-cliente/{categoria}'
 */
showApi.get = (args: { categoria: number | { id: number } } | [categoria: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showApi.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CategoriaClienteController::showApi
 * @see app/Http/Controllers/CategoriaClienteController.php:63
 * @route '/api/categorias-cliente/{categoria}'
 */
showApi.head = (args: { categoria: number | { id: number } } | [categoria: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showApi.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CategoriaClienteController::updateApi
 * @see app/Http/Controllers/CategoriaClienteController.php:74
 * @route '/api/categorias-cliente/{categoria}'
 */
export const updateApi = (args: { categoria: number | { id: number } } | [categoria: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateApi.url(args, options),
    method: 'put',
})

updateApi.definition = {
    methods: ["put"],
    url: '/api/categorias-cliente/{categoria}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\CategoriaClienteController::updateApi
 * @see app/Http/Controllers/CategoriaClienteController.php:74
 * @route '/api/categorias-cliente/{categoria}'
 */
updateApi.url = (args: { categoria: number | { id: number } } | [categoria: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { categoria: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { categoria: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    categoria: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        categoria: typeof args.categoria === 'object'
                ? args.categoria.id
                : args.categoria,
                }

    return updateApi.definition.url
            .replace('{categoria}', parsedArgs.categoria.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CategoriaClienteController::updateApi
 * @see app/Http/Controllers/CategoriaClienteController.php:74
 * @route '/api/categorias-cliente/{categoria}'
 */
updateApi.put = (args: { categoria: number | { id: number } } | [categoria: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateApi.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\CategoriaClienteController::destroyApi
 * @see app/Http/Controllers/CategoriaClienteController.php:91
 * @route '/api/categorias-cliente/{categoria}'
 */
export const destroyApi = (args: { categoria: number | { id: number } } | [categoria: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyApi.url(args, options),
    method: 'delete',
})

destroyApi.definition = {
    methods: ["delete"],
    url: '/api/categorias-cliente/{categoria}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\CategoriaClienteController::destroyApi
 * @see app/Http/Controllers/CategoriaClienteController.php:91
 * @route '/api/categorias-cliente/{categoria}'
 */
destroyApi.url = (args: { categoria: number | { id: number } } | [categoria: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { categoria: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { categoria: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    categoria: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        categoria: typeof args.categoria === 'object'
                ? args.categoria.id
                : args.categoria,
                }

    return destroyApi.definition.url
            .replace('{categoria}', parsedArgs.categoria.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CategoriaClienteController::destroyApi
 * @see app/Http/Controllers/CategoriaClienteController.php:91
 * @route '/api/categorias-cliente/{categoria}'
 */
destroyApi.delete = (args: { categoria: number | { id: number } } | [categoria: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyApi.url(args, options),
    method: 'delete',
})
const CategoriaClienteController = { indexApi, storeApi, showApi, updateApi, destroyApi }

export default CategoriaClienteController