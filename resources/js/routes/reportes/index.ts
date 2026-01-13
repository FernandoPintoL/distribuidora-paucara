import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import codigosBarra from './codigos-barra'
import precios from './precios'
import ganancias from './ganancias'
import credito from './credito'
import inventario from './inventario'
/**
* @see \App\Http\Controllers\ReporteCargoListController::estadisticas
 * @see app/Http/Controllers/ReporteCargoListController.php:185
 * @route '/api/reportes/estadisticas'
 */
export const estadisticas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estadisticas.url(options),
    method: 'get',
})

estadisticas.definition = {
    methods: ["get","head"],
    url: '/api/reportes/estadisticas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteCargoListController::estadisticas
 * @see app/Http/Controllers/ReporteCargoListController.php:185
 * @route '/api/reportes/estadisticas'
 */
estadisticas.url = (options?: RouteQueryOptions) => {
    return estadisticas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteCargoListController::estadisticas
 * @see app/Http/Controllers/ReporteCargoListController.php:185
 * @route '/api/reportes/estadisticas'
 */
estadisticas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estadisticas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteCargoListController::estadisticas
 * @see app/Http/Controllers/ReporteCargoListController.php:185
 * @route '/api/reportes/estadisticas'
 */
estadisticas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: estadisticas.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReporteCargoListController::estadisticas
 * @see app/Http/Controllers/ReporteCargoListController.php:185
 * @route '/api/reportes/estadisticas'
 */
    const estadisticasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: estadisticas.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReporteCargoListController::estadisticas
 * @see app/Http/Controllers/ReporteCargoListController.php:185
 * @route '/api/reportes/estadisticas'
 */
        estadisticasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: estadisticas.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReporteCargoListController::estadisticas
 * @see app/Http/Controllers/ReporteCargoListController.php:185
 * @route '/api/reportes/estadisticas'
 */
        estadisticasForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: estadisticas.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    estadisticas.form = estadisticasForm
/**
* @see \App\Http\Controllers\ReporteCargoListController::exportarZip
 * @see app/Http/Controllers/ReporteCargoListController.php:202
 * @route '/api/reportes/exportar-zip'
 */
export const exportarZip = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: exportarZip.url(options),
    method: 'post',
})

exportarZip.definition = {
    methods: ["post"],
    url: '/api/reportes/exportar-zip',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ReporteCargoListController::exportarZip
 * @see app/Http/Controllers/ReporteCargoListController.php:202
 * @route '/api/reportes/exportar-zip'
 */
exportarZip.url = (options?: RouteQueryOptions) => {
    return exportarZip.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteCargoListController::exportarZip
 * @see app/Http/Controllers/ReporteCargoListController.php:202
 * @route '/api/reportes/exportar-zip'
 */
exportarZip.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: exportarZip.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ReporteCargoListController::exportarZip
 * @see app/Http/Controllers/ReporteCargoListController.php:202
 * @route '/api/reportes/exportar-zip'
 */
    const exportarZipForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: exportarZip.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ReporteCargoListController::exportarZip
 * @see app/Http/Controllers/ReporteCargoListController.php:202
 * @route '/api/reportes/exportar-zip'
 */
        exportarZipForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: exportarZip.url(options),
            method: 'post',
        })
    
    exportarZip.form = exportarZipForm
const reportes = {
    estadisticas,
exportarZip,
codigosBarra,
precios,
ganancias,
credito,
inventario,
}

export default reportes