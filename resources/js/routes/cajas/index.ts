import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../wayfinder'
import movimientos from './movimientos'
import gastos from './gastos'
import cierre from './cierre'
import admin from './admin'
/**
* @see \App\Http\Controllers\CajaController::show
 * @see app/Http/Controllers/CajaController.php:39
 * @route '/cajas/{aperturaCaja}'
 */
export const show = (args: { aperturaCaja: number | { id: number } } | [aperturaCaja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/cajas/{aperturaCaja}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CajaController::show
 * @see app/Http/Controllers/CajaController.php:39
 * @route '/cajas/{aperturaCaja}'
 */
show.url = (args: { aperturaCaja: number | { id: number } } | [aperturaCaja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { aperturaCaja: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { aperturaCaja: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    aperturaCaja: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        aperturaCaja: typeof args.aperturaCaja === 'object'
                ? args.aperturaCaja.id
                : args.aperturaCaja,
                }

    return show.definition.url
            .replace('{aperturaCaja}', parsedArgs.aperturaCaja.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::show
 * @see app/Http/Controllers/CajaController.php:39
 * @route '/cajas/{aperturaCaja}'
 */
show.get = (args: { aperturaCaja: number | { id: number } } | [aperturaCaja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CajaController::show
 * @see app/Http/Controllers/CajaController.php:39
 * @route '/cajas/{aperturaCaja}'
 */
show.head = (args: { aperturaCaja: number | { id: number } } | [aperturaCaja: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:39
 * @route '/cajas'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/cajas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:39
 * @route '/cajas'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:39
 * @route '/cajas'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:39
 * @route '/cajas'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CajaController::abrir
 * @see app/Http/Controllers/CajaController.php:118
 * @route '/cajas/abrir'
 */
export const abrir = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: abrir.url(options),
    method: 'post',
})

abrir.definition = {
    methods: ["post"],
    url: '/cajas/abrir',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CajaController::abrir
 * @see app/Http/Controllers/CajaController.php:118
 * @route '/cajas/abrir'
 */
abrir.url = (options?: RouteQueryOptions) => {
    return abrir.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::abrir
 * @see app/Http/Controllers/CajaController.php:118
 * @route '/cajas/abrir'
 */
abrir.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: abrir.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CajaController::cerrar
 * @see app/Http/Controllers/CajaController.php:209
 * @route '/cajas/cerrar'
 */
export const cerrar = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cerrar.url(options),
    method: 'post',
})

cerrar.definition = {
    methods: ["post"],
    url: '/cajas/cerrar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CajaController::cerrar
 * @see app/Http/Controllers/CajaController.php:209
 * @route '/cajas/cerrar'
 */
cerrar.url = (options?: RouteQueryOptions) => {
    return cerrar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::cerrar
 * @see app/Http/Controllers/CajaController.php:209
 * @route '/cajas/cerrar'
 */
cerrar.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cerrar.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CajaController::movimientos
 * @see app/Http/Controllers/CajaController.php:349
 * @route '/cajas/movimientos'
 */
export const movimientos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: movimientos.url(options),
    method: 'get',
})

movimientos.definition = {
    methods: ["get","head"],
    url: '/cajas/movimientos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CajaController::movimientos
 * @see app/Http/Controllers/CajaController.php:349
 * @route '/cajas/movimientos'
 */
movimientos.url = (options?: RouteQueryOptions) => {
    return movimientos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::movimientos
 * @see app/Http/Controllers/CajaController.php:349
 * @route '/cajas/movimientos'
 */
movimientos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: movimientos.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CajaController::movimientos
 * @see app/Http/Controllers/CajaController.php:349
 * @route '/cajas/movimientos'
 */
movimientos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: movimientos.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CajaController::registrarMovimiento
 * @see app/Http/Controllers/CajaController.php:705
 * @route '/cajas/movimientos'
 */
export const registrarMovimiento = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarMovimiento.url(options),
    method: 'post',
})

registrarMovimiento.definition = {
    methods: ["post"],
    url: '/cajas/movimientos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CajaController::registrarMovimiento
 * @see app/Http/Controllers/CajaController.php:705
 * @route '/cajas/movimientos'
 */
registrarMovimiento.url = (options?: RouteQueryOptions) => {
    return registrarMovimiento.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::registrarMovimiento
 * @see app/Http/Controllers/CajaController.php:705
 * @route '/cajas/movimientos'
 */
registrarMovimiento.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarMovimiento.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CajaController::aperturaMovimientos
 * @see app/Http/Controllers/CajaController.php:393
 * @route '/cajas/apertura/{aperturaId}/movimientos'
 */
export const aperturaMovimientos = (args: { aperturaId: string | number } | [aperturaId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: aperturaMovimientos.url(args, options),
    method: 'get',
})

aperturaMovimientos.definition = {
    methods: ["get","head"],
    url: '/cajas/apertura/{aperturaId}/movimientos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CajaController::aperturaMovimientos
 * @see app/Http/Controllers/CajaController.php:393
 * @route '/cajas/apertura/{aperturaId}/movimientos'
 */
aperturaMovimientos.url = (args: { aperturaId: string | number } | [aperturaId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { aperturaId: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    aperturaId: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        aperturaId: args.aperturaId,
                }

    return aperturaMovimientos.definition.url
            .replace('{aperturaId}', parsedArgs.aperturaId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::aperturaMovimientos
 * @see app/Http/Controllers/CajaController.php:393
 * @route '/cajas/apertura/{aperturaId}/movimientos'
 */
aperturaMovimientos.get = (args: { aperturaId: string | number } | [aperturaId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: aperturaMovimientos.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CajaController::aperturaMovimientos
 * @see app/Http/Controllers/CajaController.php:393
 * @route '/cajas/apertura/{aperturaId}/movimientos'
 */
aperturaMovimientos.head = (args: { aperturaId: string | number } | [aperturaId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: aperturaMovimientos.url(args, options),
    method: 'head',
})
const cajas = {
    show,
index,
abrir,
cerrar,
movimientos,
registrarMovimiento,
gastos,
aperturaMovimientos,
cierre,
admin,
}

export default cajas