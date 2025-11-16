import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ApiProformaController::index
* @see app/Http/Controllers/Api/ApiProformaController.php:1867
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
* @see \App\Http\Controllers\Api\ApiProformaController::index
* @see app/Http/Controllers/Api/ApiProformaController.php:1867
* @route '/proformas'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::index
* @see app/Http/Controllers/Api/ApiProformaController.php:1867
* @route '/proformas'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::index
* @see app/Http/Controllers/Api/ApiProformaController.php:1867
* @route '/proformas'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::index
* @see app/Http/Controllers/Api/ApiProformaController.php:1867
* @route '/proformas'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::index
* @see app/Http/Controllers/Api/ApiProformaController.php:1867
* @route '/proformas'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::index
* @see app/Http/Controllers/Api/ApiProformaController.php:1867
* @route '/proformas'
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
* @see \App\Http\Controllers\Api\ApiProformaController::show
* @see app/Http/Controllers/Api/ApiProformaController.php:1940
* @route '/proformas/{proforma}'
*/
export const show = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/proformas/{proforma}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::show
* @see app/Http/Controllers/Api/ApiProformaController.php:1940
* @route '/proformas/{proforma}'
*/
show.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::show
* @see app/Http/Controllers/Api/ApiProformaController.php:1940
* @route '/proformas/{proforma}'
*/
show.get = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::show
* @see app/Http/Controllers/Api/ApiProformaController.php:1940
* @route '/proformas/{proforma}'
*/
show.head = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::show
* @see app/Http/Controllers/Api/ApiProformaController.php:1940
* @route '/proformas/{proforma}'
*/
const showForm = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::show
* @see app/Http/Controllers/Api/ApiProformaController.php:1940
* @route '/proformas/{proforma}'
*/
showForm.get = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ApiProformaController::show
* @see app/Http/Controllers/Api/ApiProformaController.php:1940
* @route '/proformas/{proforma}'
*/
showForm.head = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

const proformas = {
    index,
    show,
}

export default proformas