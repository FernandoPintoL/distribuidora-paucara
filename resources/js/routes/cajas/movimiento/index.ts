import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\CajaController::imprimir
 * @see app/Http/Controllers/CajaController.php:1667
 * @route '/cajas/movimiento/{movimiento}/imprimir'
 */
export const imprimir = (args: { movimiento: number | { id: number } } | [movimiento: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir.url(args, options),
    method: 'get',
})

imprimir.definition = {
    methods: ["get","head"],
    url: '/cajas/movimiento/{movimiento}/imprimir',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CajaController::imprimir
 * @see app/Http/Controllers/CajaController.php:1667
 * @route '/cajas/movimiento/{movimiento}/imprimir'
 */
imprimir.url = (args: { movimiento: number | { id: number } } | [movimiento: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { movimiento: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { movimiento: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    movimiento: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        movimiento: typeof args.movimiento === 'object'
                ? args.movimiento.id
                : args.movimiento,
                }

    return imprimir.definition.url
            .replace('{movimiento}', parsedArgs.movimiento.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::imprimir
 * @see app/Http/Controllers/CajaController.php:1667
 * @route '/cajas/movimiento/{movimiento}/imprimir'
 */
imprimir.get = (args: { movimiento: number | { id: number } } | [movimiento: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CajaController::imprimir
 * @see app/Http/Controllers/CajaController.php:1667
 * @route '/cajas/movimiento/{movimiento}/imprimir'
 */
imprimir.head = (args: { movimiento: number | { id: number } } | [movimiento: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imprimir.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CajaController::imprimir
 * @see app/Http/Controllers/CajaController.php:1667
 * @route '/cajas/movimiento/{movimiento}/imprimir'
 */
    const imprimirForm = (args: { movimiento: number | { id: number } } | [movimiento: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: imprimir.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CajaController::imprimir
 * @see app/Http/Controllers/CajaController.php:1667
 * @route '/cajas/movimiento/{movimiento}/imprimir'
 */
        imprimirForm.get = (args: { movimiento: number | { id: number } } | [movimiento: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimir.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CajaController::imprimir
 * @see app/Http/Controllers/CajaController.php:1667
 * @route '/cajas/movimiento/{movimiento}/imprimir'
 */
        imprimirForm.head = (args: { movimiento: number | { id: number } } | [movimiento: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimir.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    imprimir.form = imprimirForm
const movimiento = {
    imprimir,
}

export default movimiento