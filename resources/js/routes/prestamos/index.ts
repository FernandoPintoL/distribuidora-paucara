import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import clientes from './clientes'
import proveedores from './proveedores'
/**
* @see \App\Http\Controllers\PrestamosInertiaController::index
 * @see app/Http/Controllers/PrestamosInertiaController.php:18
 * @route '/prestamos'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/prestamos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestamosInertiaController::index
 * @see app/Http/Controllers/PrestamosInertiaController.php:18
 * @route '/prestamos'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamosInertiaController::index
 * @see app/Http/Controllers/PrestamosInertiaController.php:18
 * @route '/prestamos'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestamosInertiaController::index
 * @see app/Http/Controllers/PrestamosInertiaController.php:18
 * @route '/prestamos'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestamosInertiaController::index
 * @see app/Http/Controllers/PrestamosInertiaController.php:18
 * @route '/prestamos'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestamosInertiaController::index
 * @see app/Http/Controllers/PrestamosInertiaController.php:18
 * @route '/prestamos'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestamosInertiaController::index
 * @see app/Http/Controllers/PrestamosInertiaController.php:18
 * @route '/prestamos'
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
* @see \App\Http\Controllers\PrestamosInertiaController::prestables
 * @see app/Http/Controllers/PrestamosInertiaController.php:26
 * @route '/prestamos/prestables'
 */
export const prestables = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: prestables.url(options),
    method: 'get',
})

prestables.definition = {
    methods: ["get","head"],
    url: '/prestamos/prestables',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestamosInertiaController::prestables
 * @see app/Http/Controllers/PrestamosInertiaController.php:26
 * @route '/prestamos/prestables'
 */
prestables.url = (options?: RouteQueryOptions) => {
    return prestables.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamosInertiaController::prestables
 * @see app/Http/Controllers/PrestamosInertiaController.php:26
 * @route '/prestamos/prestables'
 */
prestables.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: prestables.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestamosInertiaController::prestables
 * @see app/Http/Controllers/PrestamosInertiaController.php:26
 * @route '/prestamos/prestables'
 */
prestables.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: prestables.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestamosInertiaController::prestables
 * @see app/Http/Controllers/PrestamosInertiaController.php:26
 * @route '/prestamos/prestables'
 */
    const prestablesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: prestables.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestamosInertiaController::prestables
 * @see app/Http/Controllers/PrestamosInertiaController.php:26
 * @route '/prestamos/prestables'
 */
        prestablesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: prestables.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestamosInertiaController::prestables
 * @see app/Http/Controllers/PrestamosInertiaController.php:26
 * @route '/prestamos/prestables'
 */
        prestablesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: prestables.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    prestables.form = prestablesForm
/**
* @see \App\Http\Controllers\PrestamosInertiaController::stock
 * @see app/Http/Controllers/PrestamosInertiaController.php:34
 * @route '/prestamos/stock'
 */
export const stock = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stock.url(options),
    method: 'get',
})

stock.definition = {
    methods: ["get","head"],
    url: '/prestamos/stock',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestamosInertiaController::stock
 * @see app/Http/Controllers/PrestamosInertiaController.php:34
 * @route '/prestamos/stock'
 */
stock.url = (options?: RouteQueryOptions) => {
    return stock.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamosInertiaController::stock
 * @see app/Http/Controllers/PrestamosInertiaController.php:34
 * @route '/prestamos/stock'
 */
stock.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stock.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestamosInertiaController::stock
 * @see app/Http/Controllers/PrestamosInertiaController.php:34
 * @route '/prestamos/stock'
 */
stock.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: stock.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestamosInertiaController::stock
 * @see app/Http/Controllers/PrestamosInertiaController.php:34
 * @route '/prestamos/stock'
 */
    const stockForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: stock.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestamosInertiaController::stock
 * @see app/Http/Controllers/PrestamosInertiaController.php:34
 * @route '/prestamos/stock'
 */
        stockForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stock.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestamosInertiaController::stock
 * @see app/Http/Controllers/PrestamosInertiaController.php:34
 * @route '/prestamos/stock'
 */
        stockForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stock.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    stock.form = stockForm
/**
* @see \App\Http\Controllers\PrestamosInertiaController::reportes
 * @see app/Http/Controllers/PrestamosInertiaController.php:122
 * @route '/prestamos/reportes'
 */
export const reportes = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportes.url(options),
    method: 'get',
})

reportes.definition = {
    methods: ["get","head"],
    url: '/prestamos/reportes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestamosInertiaController::reportes
 * @see app/Http/Controllers/PrestamosInertiaController.php:122
 * @route '/prestamos/reportes'
 */
reportes.url = (options?: RouteQueryOptions) => {
    return reportes.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamosInertiaController::reportes
 * @see app/Http/Controllers/PrestamosInertiaController.php:122
 * @route '/prestamos/reportes'
 */
reportes.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportes.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestamosInertiaController::reportes
 * @see app/Http/Controllers/PrestamosInertiaController.php:122
 * @route '/prestamos/reportes'
 */
reportes.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reportes.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestamosInertiaController::reportes
 * @see app/Http/Controllers/PrestamosInertiaController.php:122
 * @route '/prestamos/reportes'
 */
    const reportesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: reportes.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestamosInertiaController::reportes
 * @see app/Http/Controllers/PrestamosInertiaController.php:122
 * @route '/prestamos/reportes'
 */
        reportesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reportes.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestamosInertiaController::reportes
 * @see app/Http/Controllers/PrestamosInertiaController.php:122
 * @route '/prestamos/reportes'
 */
        reportesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reportes.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    reportes.form = reportesForm
const prestamos = {
    index,
prestables,
stock,
clientes,
proveedores,
reportes,
}

export default prestamos