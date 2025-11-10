import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\EnvioController::rechazar
* @see app/Http/Controllers/EnvioController.php:302
* @route '/api/app/envios/{envio}/rechazar'
*/
export const rechazar = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: rechazar.url(args, options),
    method: 'put',
})

rechazar.definition = {
    methods: ["put"],
    url: '/api/app/envios/{envio}/rechazar',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\EnvioController::rechazar
* @see app/Http/Controllers/EnvioController.php:302
* @route '/api/app/envios/{envio}/rechazar'
*/
rechazar.url = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return rechazar.definition.url
            .replace('{envio}', parsedArgs.envio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EnvioController::rechazar
* @see app/Http/Controllers/EnvioController.php:302
* @route '/api/app/envios/{envio}/rechazar'
*/
rechazar.put = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: rechazar.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\EnvioController::rechazar
* @see app/Http/Controllers/EnvioController.php:302
* @route '/api/app/envios/{envio}/rechazar'
*/
const rechazarForm = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: rechazar.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EnvioController::rechazar
* @see app/Http/Controllers/EnvioController.php:302
* @route '/api/app/envios/{envio}/rechazar'
*/
rechazarForm.put = (args: { envio: number | { id: number } } | [envio: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: rechazar.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

rechazar.form = rechazarForm

const envios = {
    rechazar,
}

export default envios