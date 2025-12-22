import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ApiProformaController::confirmar
 * @see app/Http/Controllers/Api/ApiProformaController.php:1530
 * @route '/api/proformas/{proforma}/confirmar'
 */
export const confirmar = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmar.url(args, options),
    method: 'post',
})

confirmar.definition = {
    methods: ["post"],
    url: '/api/proformas/{proforma}/confirmar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::confirmar
 * @see app/Http/Controllers/Api/ApiProformaController.php:1530
 * @route '/api/proformas/{proforma}/confirmar'
 */
confirmar.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return confirmar.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::confirmar
 * @see app/Http/Controllers/Api/ApiProformaController.php:1530
 * @route '/api/proformas/{proforma}/confirmar'
 */
confirmar.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmar.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::confirmar
 * @see app/Http/Controllers/Api/ApiProformaController.php:1530
 * @route '/api/proformas/{proforma}/confirmar'
 */
    const confirmarForm = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: confirmar.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::confirmar
 * @see app/Http/Controllers/Api/ApiProformaController.php:1530
 * @route '/api/proformas/{proforma}/confirmar'
 */
        confirmarForm.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: confirmar.url(args, options),
            method: 'post',
        })
    
    confirmar.form = confirmarForm
/**
* @see \App\Http\Controllers\Api\ApiProformaController::coordinar
 * @see app/Http/Controllers/Api/ApiProformaController.php:741
 * @route '/api/proformas/{proforma}/coordinar'
 */
export const coordinar = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: coordinar.url(args, options),
    method: 'post',
})

coordinar.definition = {
    methods: ["post"],
    url: '/api/proformas/{proforma}/coordinar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ApiProformaController::coordinar
 * @see app/Http/Controllers/Api/ApiProformaController.php:741
 * @route '/api/proformas/{proforma}/coordinar'
 */
coordinar.url = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return coordinar.definition.url
            .replace('{proforma}', parsedArgs.proforma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ApiProformaController::coordinar
 * @see app/Http/Controllers/Api/ApiProformaController.php:741
 * @route '/api/proformas/{proforma}/coordinar'
 */
coordinar.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: coordinar.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ApiProformaController::coordinar
 * @see app/Http/Controllers/Api/ApiProformaController.php:741
 * @route '/api/proformas/{proforma}/coordinar'
 */
    const coordinarForm = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: coordinar.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ApiProformaController::coordinar
 * @see app/Http/Controllers/Api/ApiProformaController.php:741
 * @route '/api/proformas/{proforma}/coordinar'
 */
        coordinarForm.post = (args: { proforma: number | { id: number } } | [proforma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: coordinar.url(args, options),
            method: 'post',
        })
    
    coordinar.form = coordinarForm
const proformas = {
    confirmar,
coordinar,
}

export default proformas