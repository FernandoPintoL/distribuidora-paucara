import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\InventarioController::form
 * @see app/Http/Controllers/InventarioController.php:572
 * @route '/inventario/ajuste'
 */
export const form = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: form.url(options),
    method: 'get',
})

form.definition = {
    methods: ["get","head"],
    url: '/inventario/ajuste',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::form
 * @see app/Http/Controllers/InventarioController.php:572
 * @route '/inventario/ajuste'
 */
form.url = (options?: RouteQueryOptions) => {
    return form.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::form
 * @see app/Http/Controllers/InventarioController.php:572
 * @route '/inventario/ajuste'
 */
form.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: form.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::form
 * @see app/Http/Controllers/InventarioController.php:572
 * @route '/inventario/ajuste'
 */
form.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: form.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::form
 * @see app/Http/Controllers/InventarioController.php:572
 * @route '/inventario/ajuste'
 */
    const formForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: form.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::form
 * @see app/Http/Controllers/InventarioController.php:572
 * @route '/inventario/ajuste'
 */
        formForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: form.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::form
 * @see app/Http/Controllers/InventarioController.php:572
 * @route '/inventario/ajuste'
 */
        formForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: form.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    form.form = formForm
/**
* @see \App\Http\Controllers\InventarioController::procesar
 * @see app/Http/Controllers/InventarioController.php:596
 * @route '/inventario/ajuste'
 */
export const procesar = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: procesar.url(options),
    method: 'post',
})

procesar.definition = {
    methods: ["post"],
    url: '/inventario/ajuste',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventarioController::procesar
 * @see app/Http/Controllers/InventarioController.php:596
 * @route '/inventario/ajuste'
 */
procesar.url = (options?: RouteQueryOptions) => {
    return procesar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::procesar
 * @see app/Http/Controllers/InventarioController.php:596
 * @route '/inventario/ajuste'
 */
procesar.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: procesar.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::procesar
 * @see app/Http/Controllers/InventarioController.php:596
 * @route '/inventario/ajuste'
 */
    const procesarForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: procesar.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::procesar
 * @see app/Http/Controllers/InventarioController.php:596
 * @route '/inventario/ajuste'
 */
        procesarForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: procesar.url(options),
            method: 'post',
        })
    
    procesar.form = procesarForm
const ajuste = {
    form,
procesar,
}

export default ajuste