import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Web\LogisticaController::seguimiento
 * @see app/Http/Controllers/Web/LogisticaController.php:77
 * @route '/logistica/envios/{envio}/seguimiento'
 */
export const seguimiento = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: seguimiento.url(args, options),
    method: 'get',
})

seguimiento.definition = {
    methods: ["get","head"],
    url: '/logistica/envios/{envio}/seguimiento',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Web\LogisticaController::seguimiento
 * @see app/Http/Controllers/Web/LogisticaController.php:77
 * @route '/logistica/envios/{envio}/seguimiento'
 */
seguimiento.url = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { envio: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { envio: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    envio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        envio: typeof args.envio === 'object'
                ? args.envio.id
                : args.envio,
                }

    return seguimiento.definition.url
            .replace('{envio}', parsedArgs.envio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Web\LogisticaController::seguimiento
 * @see app/Http/Controllers/Web/LogisticaController.php:77
 * @route '/logistica/envios/{envio}/seguimiento'
 */
seguimiento.get = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: seguimiento.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Web\LogisticaController::seguimiento
 * @see app/Http/Controllers/Web/LogisticaController.php:77
 * @route '/logistica/envios/{envio}/seguimiento'
 */
seguimiento.head = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: seguimiento.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Web\LogisticaController::seguimiento
 * @see app/Http/Controllers/Web/LogisticaController.php:77
 * @route '/logistica/envios/{envio}/seguimiento'
 */
    const seguimientoForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: seguimiento.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Web\LogisticaController::seguimiento
 * @see app/Http/Controllers/Web/LogisticaController.php:77
 * @route '/logistica/envios/{envio}/seguimiento'
 */
        seguimientoForm.get = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: seguimiento.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Web\LogisticaController::seguimiento
 * @see app/Http/Controllers/Web/LogisticaController.php:77
 * @route '/logistica/envios/{envio}/seguimiento'
 */
        seguimientoForm.head = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: seguimiento.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    seguimiento.form = seguimientoForm
const envios = {
    seguimiento,
}

export default envios