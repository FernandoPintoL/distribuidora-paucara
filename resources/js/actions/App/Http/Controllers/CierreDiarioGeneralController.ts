import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CierreDiarioGeneralController::index
 * @see app/Http/Controllers/CierreDiarioGeneralController.php:21
 * @route '/cajas/admin/reportes-diarios'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/cajas/admin/reportes-diarios',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CierreDiarioGeneralController::index
 * @see app/Http/Controllers/CierreDiarioGeneralController.php:21
 * @route '/cajas/admin/reportes-diarios'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CierreDiarioGeneralController::index
 * @see app/Http/Controllers/CierreDiarioGeneralController.php:21
 * @route '/cajas/admin/reportes-diarios'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CierreDiarioGeneralController::index
 * @see app/Http/Controllers/CierreDiarioGeneralController.php:21
 * @route '/cajas/admin/reportes-diarios'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CierreDiarioGeneralController::show
 * @see app/Http/Controllers/CierreDiarioGeneralController.php:82
 * @route '/cajas/admin/reportes-diarios/{cierreDiarioGeneral}'
 */
export const show = (args: { cierreDiarioGeneral: number | { id: number } } | [cierreDiarioGeneral: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/cajas/admin/reportes-diarios/{cierreDiarioGeneral}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CierreDiarioGeneralController::show
 * @see app/Http/Controllers/CierreDiarioGeneralController.php:82
 * @route '/cajas/admin/reportes-diarios/{cierreDiarioGeneral}'
 */
show.url = (args: { cierreDiarioGeneral: number | { id: number } } | [cierreDiarioGeneral: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cierreDiarioGeneral: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cierreDiarioGeneral: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cierreDiarioGeneral: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cierreDiarioGeneral: typeof args.cierreDiarioGeneral === 'object'
                ? args.cierreDiarioGeneral.id
                : args.cierreDiarioGeneral,
                }

    return show.definition.url
            .replace('{cierreDiarioGeneral}', parsedArgs.cierreDiarioGeneral.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CierreDiarioGeneralController::show
 * @see app/Http/Controllers/CierreDiarioGeneralController.php:82
 * @route '/cajas/admin/reportes-diarios/{cierreDiarioGeneral}'
 */
show.get = (args: { cierreDiarioGeneral: number | { id: number } } | [cierreDiarioGeneral: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CierreDiarioGeneralController::show
 * @see app/Http/Controllers/CierreDiarioGeneralController.php:82
 * @route '/cajas/admin/reportes-diarios/{cierreDiarioGeneral}'
 */
show.head = (args: { cierreDiarioGeneral: number | { id: number } } | [cierreDiarioGeneral: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CierreDiarioGeneralController::descargar
 * @see app/Http/Controllers/CierreDiarioGeneralController.php:96
 * @route '/cajas/admin/reportes-diarios/{cierreDiarioGeneral}/descargar'
 */
export const descargar = (args: { cierreDiarioGeneral: number | { id: number } } | [cierreDiarioGeneral: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: descargar.url(args, options),
    method: 'get',
})

descargar.definition = {
    methods: ["get","head"],
    url: '/cajas/admin/reportes-diarios/{cierreDiarioGeneral}/descargar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CierreDiarioGeneralController::descargar
 * @see app/Http/Controllers/CierreDiarioGeneralController.php:96
 * @route '/cajas/admin/reportes-diarios/{cierreDiarioGeneral}/descargar'
 */
descargar.url = (args: { cierreDiarioGeneral: number | { id: number } } | [cierreDiarioGeneral: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cierreDiarioGeneral: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cierreDiarioGeneral: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cierreDiarioGeneral: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cierreDiarioGeneral: typeof args.cierreDiarioGeneral === 'object'
                ? args.cierreDiarioGeneral.id
                : args.cierreDiarioGeneral,
                }

    return descargar.definition.url
            .replace('{cierreDiarioGeneral}', parsedArgs.cierreDiarioGeneral.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CierreDiarioGeneralController::descargar
 * @see app/Http/Controllers/CierreDiarioGeneralController.php:96
 * @route '/cajas/admin/reportes-diarios/{cierreDiarioGeneral}/descargar'
 */
descargar.get = (args: { cierreDiarioGeneral: number | { id: number } } | [cierreDiarioGeneral: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: descargar.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CierreDiarioGeneralController::descargar
 * @see app/Http/Controllers/CierreDiarioGeneralController.php:96
 * @route '/cajas/admin/reportes-diarios/{cierreDiarioGeneral}/descargar'
 */
descargar.head = (args: { cierreDiarioGeneral: number | { id: number } } | [cierreDiarioGeneral: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: descargar.url(args, options),
    method: 'head',
})
const CierreDiarioGeneralController = { index, show, descargar }

export default CierreDiarioGeneralController