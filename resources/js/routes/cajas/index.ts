import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:21
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
 * @see app/Http/Controllers/CajaController.php:21
 * @route '/cajas'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:21
 * @route '/cajas'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:21
 * @route '/cajas'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:21
 * @route '/cajas'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:21
 * @route '/cajas'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CajaController::index
 * @see app/Http/Controllers/CajaController.php:21
 * @route '/cajas'
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
* @see \App\Http\Controllers\CajaController::abrir
 * @see app/Http/Controllers/CajaController.php:56
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
 * @see app/Http/Controllers/CajaController.php:56
 * @route '/cajas/abrir'
 */
abrir.url = (options?: RouteQueryOptions) => {
    return abrir.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::abrir
 * @see app/Http/Controllers/CajaController.php:56
 * @route '/cajas/abrir'
 */
abrir.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: abrir.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\CajaController::abrir
 * @see app/Http/Controllers/CajaController.php:56
 * @route '/cajas/abrir'
 */
    const abrirForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: abrir.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CajaController::abrir
 * @see app/Http/Controllers/CajaController.php:56
 * @route '/cajas/abrir'
 */
        abrirForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: abrir.url(options),
            method: 'post',
        })
    
    abrir.form = abrirForm
/**
* @see \App\Http\Controllers\CajaController::cerrar
 * @see app/Http/Controllers/CajaController.php:137
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
 * @see app/Http/Controllers/CajaController.php:137
 * @route '/cajas/cerrar'
 */
cerrar.url = (options?: RouteQueryOptions) => {
    return cerrar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::cerrar
 * @see app/Http/Controllers/CajaController.php:137
 * @route '/cajas/cerrar'
 */
cerrar.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cerrar.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\CajaController::cerrar
 * @see app/Http/Controllers/CajaController.php:137
 * @route '/cajas/cerrar'
 */
    const cerrarForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cerrar.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CajaController::cerrar
 * @see app/Http/Controllers/CajaController.php:137
 * @route '/cajas/cerrar'
 */
        cerrarForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cerrar.url(options),
            method: 'post',
        })
    
    cerrar.form = cerrarForm
/**
* @see \App\Http\Controllers\CajaController::estado
 * @see app/Http/Controllers/CajaController.php:221
 * @route '/cajas/estado'
 */
export const estado = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estado.url(options),
    method: 'get',
})

estado.definition = {
    methods: ["get","head"],
    url: '/cajas/estado',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CajaController::estado
 * @see app/Http/Controllers/CajaController.php:221
 * @route '/cajas/estado'
 */
estado.url = (options?: RouteQueryOptions) => {
    return estado.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::estado
 * @see app/Http/Controllers/CajaController.php:221
 * @route '/cajas/estado'
 */
estado.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estado.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CajaController::estado
 * @see app/Http/Controllers/CajaController.php:221
 * @route '/cajas/estado'
 */
estado.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: estado.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CajaController::estado
 * @see app/Http/Controllers/CajaController.php:221
 * @route '/cajas/estado'
 */
    const estadoForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: estado.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CajaController::estado
 * @see app/Http/Controllers/CajaController.php:221
 * @route '/cajas/estado'
 */
        estadoForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: estado.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CajaController::estado
 * @see app/Http/Controllers/CajaController.php:221
 * @route '/cajas/estado'
 */
        estadoForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: estado.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    estado.form = estadoForm
/**
* @see \App\Http\Controllers\CajaController::movimientos
 * @see app/Http/Controllers/CajaController.php:250
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
 * @see app/Http/Controllers/CajaController.php:250
 * @route '/cajas/movimientos'
 */
movimientos.url = (options?: RouteQueryOptions) => {
    return movimientos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CajaController::movimientos
 * @see app/Http/Controllers/CajaController.php:250
 * @route '/cajas/movimientos'
 */
movimientos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: movimientos.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CajaController::movimientos
 * @see app/Http/Controllers/CajaController.php:250
 * @route '/cajas/movimientos'
 */
movimientos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: movimientos.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CajaController::movimientos
 * @see app/Http/Controllers/CajaController.php:250
 * @route '/cajas/movimientos'
 */
    const movimientosForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: movimientos.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CajaController::movimientos
 * @see app/Http/Controllers/CajaController.php:250
 * @route '/cajas/movimientos'
 */
        movimientosForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: movimientos.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CajaController::movimientos
 * @see app/Http/Controllers/CajaController.php:250
 * @route '/cajas/movimientos'
 */
        movimientosForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: movimientos.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    movimientos.form = movimientosForm
const cajas = {
    index,
abrir,
cerrar,
estado,
movimientos,
}

export default cajas