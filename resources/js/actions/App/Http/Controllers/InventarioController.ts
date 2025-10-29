import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\InventarioController::importarAjustesMasivos
 * @see app/Http/Controllers/InventarioController.php:1287
 * @route '/api/inventario/ajustes-masivos'
 */
export const importarAjustesMasivos = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importarAjustesMasivos.url(options),
    method: 'post',
})

importarAjustesMasivos.definition = {
    methods: ["post"],
    url: '/api/inventario/ajustes-masivos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventarioController::importarAjustesMasivos
 * @see app/Http/Controllers/InventarioController.php:1287
 * @route '/api/inventario/ajustes-masivos'
 */
importarAjustesMasivos.url = (options?: RouteQueryOptions) => {
    return importarAjustesMasivos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::importarAjustesMasivos
 * @see app/Http/Controllers/InventarioController.php:1287
 * @route '/api/inventario/ajustes-masivos'
 */
importarAjustesMasivos.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importarAjustesMasivos.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::importarAjustesMasivos
 * @see app/Http/Controllers/InventarioController.php:1287
 * @route '/api/inventario/ajustes-masivos'
 */
    const importarAjustesMasivosForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: importarAjustesMasivos.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::importarAjustesMasivos
 * @see app/Http/Controllers/InventarioController.php:1287
 * @route '/api/inventario/ajustes-masivos'
 */
        importarAjustesMasivosForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: importarAjustesMasivos.url(options),
            method: 'post',
        })
    
    importarAjustesMasivos.form = importarAjustesMasivosForm
/**
* @see \App\Http\Controllers\InventarioController::listarCargosCsv
 * @see app/Http/Controllers/InventarioController.php:1466
 * @route '/api/inventario/cargos-csv'
 */
export const listarCargosCsv = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: listarCargosCsv.url(options),
    method: 'get',
})

listarCargosCsv.definition = {
    methods: ["get","head"],
    url: '/api/inventario/cargos-csv',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::listarCargosCsv
 * @see app/Http/Controllers/InventarioController.php:1466
 * @route '/api/inventario/cargos-csv'
 */
listarCargosCsv.url = (options?: RouteQueryOptions) => {
    return listarCargosCsv.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::listarCargosCsv
 * @see app/Http/Controllers/InventarioController.php:1466
 * @route '/api/inventario/cargos-csv'
 */
listarCargosCsv.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: listarCargosCsv.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::listarCargosCsv
 * @see app/Http/Controllers/InventarioController.php:1466
 * @route '/api/inventario/cargos-csv'
 */
listarCargosCsv.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: listarCargosCsv.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::listarCargosCsv
 * @see app/Http/Controllers/InventarioController.php:1466
 * @route '/api/inventario/cargos-csv'
 */
    const listarCargosCsvForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: listarCargosCsv.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::listarCargosCsv
 * @see app/Http/Controllers/InventarioController.php:1466
 * @route '/api/inventario/cargos-csv'
 */
        listarCargosCsvForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: listarCargosCsv.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::listarCargosCsv
 * @see app/Http/Controllers/InventarioController.php:1466
 * @route '/api/inventario/cargos-csv'
 */
        listarCargosCsvForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: listarCargosCsv.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    listarCargosCsv.form = listarCargosCsvForm
/**
* @see \App\Http\Controllers\InventarioController::obtenerDetalleCargo
 * @see app/Http/Controllers/InventarioController.php:1510
 * @route '/api/inventario/cargos-csv/{cargo}'
 */
export const obtenerDetalleCargo = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerDetalleCargo.url(args, options),
    method: 'get',
})

obtenerDetalleCargo.definition = {
    methods: ["get","head"],
    url: '/api/inventario/cargos-csv/{cargo}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::obtenerDetalleCargo
 * @see app/Http/Controllers/InventarioController.php:1510
 * @route '/api/inventario/cargos-csv/{cargo}'
 */
obtenerDetalleCargo.url = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cargo: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cargo: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cargo: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cargo: typeof args.cargo === 'object'
                ? args.cargo.id
                : args.cargo,
                }

    return obtenerDetalleCargo.definition.url
            .replace('{cargo}', parsedArgs.cargo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::obtenerDetalleCargo
 * @see app/Http/Controllers/InventarioController.php:1510
 * @route '/api/inventario/cargos-csv/{cargo}'
 */
obtenerDetalleCargo.get = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerDetalleCargo.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::obtenerDetalleCargo
 * @see app/Http/Controllers/InventarioController.php:1510
 * @route '/api/inventario/cargos-csv/{cargo}'
 */
obtenerDetalleCargo.head = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerDetalleCargo.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::obtenerDetalleCargo
 * @see app/Http/Controllers/InventarioController.php:1510
 * @route '/api/inventario/cargos-csv/{cargo}'
 */
    const obtenerDetalleCargoForm = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: obtenerDetalleCargo.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::obtenerDetalleCargo
 * @see app/Http/Controllers/InventarioController.php:1510
 * @route '/api/inventario/cargos-csv/{cargo}'
 */
        obtenerDetalleCargoForm.get = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerDetalleCargo.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::obtenerDetalleCargo
 * @see app/Http/Controllers/InventarioController.php:1510
 * @route '/api/inventario/cargos-csv/{cargo}'
 */
        obtenerDetalleCargoForm.head = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: obtenerDetalleCargo.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    obtenerDetalleCargo.form = obtenerDetalleCargoForm
/**
* @see \App\Http\Controllers\InventarioController::revertirCargo
 * @see app/Http/Controllers/InventarioController.php:1550
 * @route '/api/inventario/cargos-csv/{cargo}/revertir'
 */
export const revertirCargo = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: revertirCargo.url(args, options),
    method: 'post',
})

revertirCargo.definition = {
    methods: ["post"],
    url: '/api/inventario/cargos-csv/{cargo}/revertir',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventarioController::revertirCargo
 * @see app/Http/Controllers/InventarioController.php:1550
 * @route '/api/inventario/cargos-csv/{cargo}/revertir'
 */
revertirCargo.url = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cargo: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cargo: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cargo: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cargo: typeof args.cargo === 'object'
                ? args.cargo.id
                : args.cargo,
                }

    return revertirCargo.definition.url
            .replace('{cargo}', parsedArgs.cargo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::revertirCargo
 * @see app/Http/Controllers/InventarioController.php:1550
 * @route '/api/inventario/cargos-csv/{cargo}/revertir'
 */
revertirCargo.post = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: revertirCargo.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::revertirCargo
 * @see app/Http/Controllers/InventarioController.php:1550
 * @route '/api/inventario/cargos-csv/{cargo}/revertir'
 */
    const revertirCargoForm = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: revertirCargo.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::revertirCargo
 * @see app/Http/Controllers/InventarioController.php:1550
 * @route '/api/inventario/cargos-csv/{cargo}/revertir'
 */
        revertirCargoForm.post = (args: { cargo: number | { id: number } } | [cargo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: revertirCargo.url(args, options),
            method: 'post',
        })
    
    revertirCargo.form = revertirCargoForm
/**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:609
 * @route '/api/inventario/buscar-productos'
 */
export const buscarProductos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: buscarProductos.url(options),
    method: 'get',
})

buscarProductos.definition = {
    methods: ["get","head"],
    url: '/api/inventario/buscar-productos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:609
 * @route '/api/inventario/buscar-productos'
 */
buscarProductos.url = (options?: RouteQueryOptions) => {
    return buscarProductos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:609
 * @route '/api/inventario/buscar-productos'
 */
buscarProductos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: buscarProductos.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:609
 * @route '/api/inventario/buscar-productos'
 */
buscarProductos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: buscarProductos.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:609
 * @route '/api/inventario/buscar-productos'
 */
    const buscarProductosForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: buscarProductos.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:609
 * @route '/api/inventario/buscar-productos'
 */
        buscarProductosForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: buscarProductos.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:609
 * @route '/api/inventario/buscar-productos'
 */
        buscarProductosForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: buscarProductos.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    buscarProductos.form = buscarProductosForm
/**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:636
 * @route '/api/inventario/stock-producto/{producto}'
 */
export const stockProducto = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stockProducto.url(args, options),
    method: 'get',
})

stockProducto.definition = {
    methods: ["get","head"],
    url: '/api/inventario/stock-producto/{producto}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:636
 * @route '/api/inventario/stock-producto/{producto}'
 */
stockProducto.url = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { producto: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { producto: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    producto: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        producto: typeof args.producto === 'object'
                ? args.producto.id
                : args.producto,
                }

    return stockProducto.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:636
 * @route '/api/inventario/stock-producto/{producto}'
 */
stockProducto.get = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stockProducto.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:636
 * @route '/api/inventario/stock-producto/{producto}'
 */
stockProducto.head = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: stockProducto.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:636
 * @route '/api/inventario/stock-producto/{producto}'
 */
    const stockProductoForm = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: stockProducto.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:636
 * @route '/api/inventario/stock-producto/{producto}'
 */
        stockProductoForm.get = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stockProducto.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:636
 * @route '/api/inventario/stock-producto/{producto}'
 */
        stockProductoForm.head = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stockProducto.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    stockProducto.form = stockProductoForm
/**
* @see \App\Http\Controllers\InventarioController::procesarAjusteApi
 * @see app/Http/Controllers/InventarioController.php:482
 * @route '/api/inventario/ajustes'
 */
export const procesarAjusteApi = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: procesarAjusteApi.url(options),
    method: 'post',
})

procesarAjusteApi.definition = {
    methods: ["post"],
    url: '/api/inventario/ajustes',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventarioController::procesarAjusteApi
 * @see app/Http/Controllers/InventarioController.php:482
 * @route '/api/inventario/ajustes'
 */
procesarAjusteApi.url = (options?: RouteQueryOptions) => {
    return procesarAjusteApi.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::procesarAjusteApi
 * @see app/Http/Controllers/InventarioController.php:482
 * @route '/api/inventario/ajustes'
 */
procesarAjusteApi.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: procesarAjusteApi.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::procesarAjusteApi
 * @see app/Http/Controllers/InventarioController.php:482
 * @route '/api/inventario/ajustes'
 */
    const procesarAjusteApiForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: procesarAjusteApi.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::procesarAjusteApi
 * @see app/Http/Controllers/InventarioController.php:482
 * @route '/api/inventario/ajustes'
 */
        procesarAjusteApiForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: procesarAjusteApi.url(options),
            method: 'post',
        })
    
    procesarAjusteApi.form = procesarAjusteApiForm
/**
* @see \App\Http\Controllers\InventarioController::movimientosApi
 * @see app/Http/Controllers/InventarioController.php:546
 * @route '/api/inventario/movimientos'
 */
export const movimientosApi = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: movimientosApi.url(options),
    method: 'get',
})

movimientosApi.definition = {
    methods: ["get","head"],
    url: '/api/inventario/movimientos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::movimientosApi
 * @see app/Http/Controllers/InventarioController.php:546
 * @route '/api/inventario/movimientos'
 */
movimientosApi.url = (options?: RouteQueryOptions) => {
    return movimientosApi.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::movimientosApi
 * @see app/Http/Controllers/InventarioController.php:546
 * @route '/api/inventario/movimientos'
 */
movimientosApi.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: movimientosApi.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::movimientosApi
 * @see app/Http/Controllers/InventarioController.php:546
 * @route '/api/inventario/movimientos'
 */
movimientosApi.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: movimientosApi.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::movimientosApi
 * @see app/Http/Controllers/InventarioController.php:546
 * @route '/api/inventario/movimientos'
 */
    const movimientosApiForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: movimientosApi.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::movimientosApi
 * @see app/Http/Controllers/InventarioController.php:546
 * @route '/api/inventario/movimientos'
 */
        movimientosApiForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: movimientosApi.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::movimientosApi
 * @see app/Http/Controllers/InventarioController.php:546
 * @route '/api/inventario/movimientos'
 */
        movimientosApiForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: movimientosApi.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    movimientosApi.form = movimientosApiForm
/**
* @see \App\Http\Controllers\InventarioController::crearMovimiento
 * @see app/Http/Controllers/InventarioController.php:574
 * @route '/api/inventario/movimientos'
 */
export const crearMovimiento = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearMovimiento.url(options),
    method: 'post',
})

crearMovimiento.definition = {
    methods: ["post"],
    url: '/api/inventario/movimientos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventarioController::crearMovimiento
 * @see app/Http/Controllers/InventarioController.php:574
 * @route '/api/inventario/movimientos'
 */
crearMovimiento.url = (options?: RouteQueryOptions) => {
    return crearMovimiento.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::crearMovimiento
 * @see app/Http/Controllers/InventarioController.php:574
 * @route '/api/inventario/movimientos'
 */
crearMovimiento.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearMovimiento.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::crearMovimiento
 * @see app/Http/Controllers/InventarioController.php:574
 * @route '/api/inventario/movimientos'
 */
    const crearMovimientoForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: crearMovimiento.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::crearMovimiento
 * @see app/Http/Controllers/InventarioController.php:574
 * @route '/api/inventario/movimientos'
 */
        crearMovimientoForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: crearMovimiento.url(options),
            method: 'post',
        })
    
    crearMovimiento.form = crearMovimientoForm
/**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:80
 * @route '/inventario'
 */
const dashboarda7d559eadbfce810b70b2659eca78e47 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboarda7d559eadbfce810b70b2659eca78e47.url(options),
    method: 'get',
})

dashboarda7d559eadbfce810b70b2659eca78e47.definition = {
    methods: ["get","head"],
    url: '/inventario',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:80
 * @route '/inventario'
 */
dashboarda7d559eadbfce810b70b2659eca78e47.url = (options?: RouteQueryOptions) => {
    return dashboarda7d559eadbfce810b70b2659eca78e47.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:80
 * @route '/inventario'
 */
dashboarda7d559eadbfce810b70b2659eca78e47.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboarda7d559eadbfce810b70b2659eca78e47.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:80
 * @route '/inventario'
 */
dashboarda7d559eadbfce810b70b2659eca78e47.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboarda7d559eadbfce810b70b2659eca78e47.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:80
 * @route '/inventario'
 */
    const dashboarda7d559eadbfce810b70b2659eca78e47Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: dashboarda7d559eadbfce810b70b2659eca78e47.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:80
 * @route '/inventario'
 */
        dashboarda7d559eadbfce810b70b2659eca78e47Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboarda7d559eadbfce810b70b2659eca78e47.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:80
 * @route '/inventario'
 */
        dashboarda7d559eadbfce810b70b2659eca78e47Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboarda7d559eadbfce810b70b2659eca78e47.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    dashboarda7d559eadbfce810b70b2659eca78e47.form = dashboarda7d559eadbfce810b70b2659eca78e47Form
    /**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:80
 * @route '/inventario/dashboard'
 */
const dashboardb28409eff5a40d1acfd198fc09449f6b = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboardb28409eff5a40d1acfd198fc09449f6b.url(options),
    method: 'get',
})

dashboardb28409eff5a40d1acfd198fc09449f6b.definition = {
    methods: ["get","head"],
    url: '/inventario/dashboard',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:80
 * @route '/inventario/dashboard'
 */
dashboardb28409eff5a40d1acfd198fc09449f6b.url = (options?: RouteQueryOptions) => {
    return dashboardb28409eff5a40d1acfd198fc09449f6b.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:80
 * @route '/inventario/dashboard'
 */
dashboardb28409eff5a40d1acfd198fc09449f6b.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboardb28409eff5a40d1acfd198fc09449f6b.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:80
 * @route '/inventario/dashboard'
 */
dashboardb28409eff5a40d1acfd198fc09449f6b.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboardb28409eff5a40d1acfd198fc09449f6b.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:80
 * @route '/inventario/dashboard'
 */
    const dashboardb28409eff5a40d1acfd198fc09449f6bForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: dashboardb28409eff5a40d1acfd198fc09449f6b.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:80
 * @route '/inventario/dashboard'
 */
        dashboardb28409eff5a40d1acfd198fc09449f6bForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboardb28409eff5a40d1acfd198fc09449f6b.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:80
 * @route '/inventario/dashboard'
 */
        dashboardb28409eff5a40d1acfd198fc09449f6bForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboardb28409eff5a40d1acfd198fc09449f6b.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    dashboardb28409eff5a40d1acfd198fc09449f6b.form = dashboardb28409eff5a40d1acfd198fc09449f6bForm

export const dashboard = {
    '/inventario': dashboarda7d559eadbfce810b70b2659eca78e47,
    '/inventario/dashboard': dashboardb28409eff5a40d1acfd198fc09449f6b,
}

/**
* @see \App\Http\Controllers\InventarioController::stockBajo
 * @see app/Http/Controllers/InventarioController.php:154
 * @route '/inventario/stock-bajo'
 */
export const stockBajo = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stockBajo.url(options),
    method: 'get',
})

stockBajo.definition = {
    methods: ["get","head"],
    url: '/inventario/stock-bajo',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::stockBajo
 * @see app/Http/Controllers/InventarioController.php:154
 * @route '/inventario/stock-bajo'
 */
stockBajo.url = (options?: RouteQueryOptions) => {
    return stockBajo.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::stockBajo
 * @see app/Http/Controllers/InventarioController.php:154
 * @route '/inventario/stock-bajo'
 */
stockBajo.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stockBajo.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::stockBajo
 * @see app/Http/Controllers/InventarioController.php:154
 * @route '/inventario/stock-bajo'
 */
stockBajo.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: stockBajo.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::stockBajo
 * @see app/Http/Controllers/InventarioController.php:154
 * @route '/inventario/stock-bajo'
 */
    const stockBajoForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: stockBajo.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::stockBajo
 * @see app/Http/Controllers/InventarioController.php:154
 * @route '/inventario/stock-bajo'
 */
        stockBajoForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stockBajo.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::stockBajo
 * @see app/Http/Controllers/InventarioController.php:154
 * @route '/inventario/stock-bajo'
 */
        stockBajoForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stockBajo.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    stockBajo.form = stockBajoForm
/**
* @see \App\Http\Controllers\InventarioController::proximosVencer
 * @see app/Http/Controllers/InventarioController.php:215
 * @route '/inventario/proximos-vencer'
 */
export const proximosVencer = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: proximosVencer.url(options),
    method: 'get',
})

proximosVencer.definition = {
    methods: ["get","head"],
    url: '/inventario/proximos-vencer',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::proximosVencer
 * @see app/Http/Controllers/InventarioController.php:215
 * @route '/inventario/proximos-vencer'
 */
proximosVencer.url = (options?: RouteQueryOptions) => {
    return proximosVencer.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::proximosVencer
 * @see app/Http/Controllers/InventarioController.php:215
 * @route '/inventario/proximos-vencer'
 */
proximosVencer.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: proximosVencer.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::proximosVencer
 * @see app/Http/Controllers/InventarioController.php:215
 * @route '/inventario/proximos-vencer'
 */
proximosVencer.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: proximosVencer.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::proximosVencer
 * @see app/Http/Controllers/InventarioController.php:215
 * @route '/inventario/proximos-vencer'
 */
    const proximosVencerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: proximosVencer.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::proximosVencer
 * @see app/Http/Controllers/InventarioController.php:215
 * @route '/inventario/proximos-vencer'
 */
        proximosVencerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: proximosVencer.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::proximosVencer
 * @see app/Http/Controllers/InventarioController.php:215
 * @route '/inventario/proximos-vencer'
 */
        proximosVencerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: proximosVencer.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    proximosVencer.form = proximosVencerForm
/**
* @see \App\Http\Controllers\InventarioController::vencidos
 * @see app/Http/Controllers/InventarioController.php:273
 * @route '/inventario/vencidos'
 */
export const vencidos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: vencidos.url(options),
    method: 'get',
})

vencidos.definition = {
    methods: ["get","head"],
    url: '/inventario/vencidos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::vencidos
 * @see app/Http/Controllers/InventarioController.php:273
 * @route '/inventario/vencidos'
 */
vencidos.url = (options?: RouteQueryOptions) => {
    return vencidos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::vencidos
 * @see app/Http/Controllers/InventarioController.php:273
 * @route '/inventario/vencidos'
 */
vencidos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: vencidos.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::vencidos
 * @see app/Http/Controllers/InventarioController.php:273
 * @route '/inventario/vencidos'
 */
vencidos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: vencidos.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::vencidos
 * @see app/Http/Controllers/InventarioController.php:273
 * @route '/inventario/vencidos'
 */
    const vencidosForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: vencidos.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::vencidos
 * @see app/Http/Controllers/InventarioController.php:273
 * @route '/inventario/vencidos'
 */
        vencidosForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: vencidos.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::vencidos
 * @see app/Http/Controllers/InventarioController.php:273
 * @route '/inventario/vencidos'
 */
        vencidosForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: vencidos.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    vencidos.form = vencidosForm
/**
* @see \App\Http\Controllers\InventarioController::movimientos
 * @see app/Http/Controllers/InventarioController.php:326
 * @route '/inventario/movimientos'
 */
export const movimientos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: movimientos.url(options),
    method: 'get',
})

movimientos.definition = {
    methods: ["get","head"],
    url: '/inventario/movimientos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::movimientos
 * @see app/Http/Controllers/InventarioController.php:326
 * @route '/inventario/movimientos'
 */
movimientos.url = (options?: RouteQueryOptions) => {
    return movimientos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::movimientos
 * @see app/Http/Controllers/InventarioController.php:326
 * @route '/inventario/movimientos'
 */
movimientos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: movimientos.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::movimientos
 * @see app/Http/Controllers/InventarioController.php:326
 * @route '/inventario/movimientos'
 */
movimientos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: movimientos.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::movimientos
 * @see app/Http/Controllers/InventarioController.php:326
 * @route '/inventario/movimientos'
 */
    const movimientosForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: movimientos.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::movimientos
 * @see app/Http/Controllers/InventarioController.php:326
 * @route '/inventario/movimientos'
 */
        movimientosForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: movimientos.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::movimientos
 * @see app/Http/Controllers/InventarioController.php:326
 * @route '/inventario/movimientos'
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
/**
* @see \App\Http\Controllers\InventarioController::ajusteForm
 * @see app/Http/Controllers/InventarioController.php:432
 * @route '/inventario/ajuste'
 */
export const ajusteForm = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ajusteForm.url(options),
    method: 'get',
})

ajusteForm.definition = {
    methods: ["get","head"],
    url: '/inventario/ajuste',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::ajusteForm
 * @see app/Http/Controllers/InventarioController.php:432
 * @route '/inventario/ajuste'
 */
ajusteForm.url = (options?: RouteQueryOptions) => {
    return ajusteForm.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::ajusteForm
 * @see app/Http/Controllers/InventarioController.php:432
 * @route '/inventario/ajuste'
 */
ajusteForm.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ajusteForm.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::ajusteForm
 * @see app/Http/Controllers/InventarioController.php:432
 * @route '/inventario/ajuste'
 */
ajusteForm.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ajusteForm.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::ajusteForm
 * @see app/Http/Controllers/InventarioController.php:432
 * @route '/inventario/ajuste'
 */
    const ajusteFormForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: ajusteForm.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::ajusteForm
 * @see app/Http/Controllers/InventarioController.php:432
 * @route '/inventario/ajuste'
 */
        ajusteFormForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ajusteForm.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::ajusteForm
 * @see app/Http/Controllers/InventarioController.php:432
 * @route '/inventario/ajuste'
 */
        ajusteFormForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ajusteForm.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    ajusteForm.form = ajusteFormForm
/**
* @see \App\Http\Controllers\InventarioController::procesarAjuste
 * @see app/Http/Controllers/InventarioController.php:456
 * @route '/inventario/ajuste'
 */
export const procesarAjuste = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: procesarAjuste.url(options),
    method: 'post',
})

procesarAjuste.definition = {
    methods: ["post"],
    url: '/inventario/ajuste',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventarioController::procesarAjuste
 * @see app/Http/Controllers/InventarioController.php:456
 * @route '/inventario/ajuste'
 */
procesarAjuste.url = (options?: RouteQueryOptions) => {
    return procesarAjuste.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::procesarAjuste
 * @see app/Http/Controllers/InventarioController.php:456
 * @route '/inventario/ajuste'
 */
procesarAjuste.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: procesarAjuste.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::procesarAjuste
 * @see app/Http/Controllers/InventarioController.php:456
 * @route '/inventario/ajuste'
 */
    const procesarAjusteForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: procesarAjuste.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::procesarAjuste
 * @see app/Http/Controllers/InventarioController.php:456
 * @route '/inventario/ajuste'
 */
        procesarAjusteForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: procesarAjuste.url(options),
            method: 'post',
        })
    
    procesarAjuste.form = procesarAjusteForm
/**
* @see \App\Http\Controllers\InventarioController::ajusteMasivoForm
 * @see app/Http/Controllers/InventarioController.php:1263
 * @route '/inventario/ajuste-masivo'
 */
export const ajusteMasivoForm = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ajusteMasivoForm.url(options),
    method: 'get',
})

ajusteMasivoForm.definition = {
    methods: ["get","head"],
    url: '/inventario/ajuste-masivo',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::ajusteMasivoForm
 * @see app/Http/Controllers/InventarioController.php:1263
 * @route '/inventario/ajuste-masivo'
 */
ajusteMasivoForm.url = (options?: RouteQueryOptions) => {
    return ajusteMasivoForm.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::ajusteMasivoForm
 * @see app/Http/Controllers/InventarioController.php:1263
 * @route '/inventario/ajuste-masivo'
 */
ajusteMasivoForm.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ajusteMasivoForm.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::ajusteMasivoForm
 * @see app/Http/Controllers/InventarioController.php:1263
 * @route '/inventario/ajuste-masivo'
 */
ajusteMasivoForm.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ajusteMasivoForm.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::ajusteMasivoForm
 * @see app/Http/Controllers/InventarioController.php:1263
 * @route '/inventario/ajuste-masivo'
 */
    const ajusteMasivoFormForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: ajusteMasivoForm.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::ajusteMasivoForm
 * @see app/Http/Controllers/InventarioController.php:1263
 * @route '/inventario/ajuste-masivo'
 */
        ajusteMasivoFormForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ajusteMasivoForm.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::ajusteMasivoForm
 * @see app/Http/Controllers/InventarioController.php:1263
 * @route '/inventario/ajuste-masivo'
 */
        ajusteMasivoFormForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ajusteMasivoForm.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    ajusteMasivoForm.form = ajusteMasivoFormForm
/**
* @see \App\Http\Controllers\InventarioController::historialCargasForm
 * @see app/Http/Controllers/InventarioController.php:1456
 * @route '/inventario/historial-cargas'
 */
export const historialCargasForm = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: historialCargasForm.url(options),
    method: 'get',
})

historialCargasForm.definition = {
    methods: ["get","head"],
    url: '/inventario/historial-cargas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::historialCargasForm
 * @see app/Http/Controllers/InventarioController.php:1456
 * @route '/inventario/historial-cargas'
 */
historialCargasForm.url = (options?: RouteQueryOptions) => {
    return historialCargasForm.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::historialCargasForm
 * @see app/Http/Controllers/InventarioController.php:1456
 * @route '/inventario/historial-cargas'
 */
historialCargasForm.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: historialCargasForm.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::historialCargasForm
 * @see app/Http/Controllers/InventarioController.php:1456
 * @route '/inventario/historial-cargas'
 */
historialCargasForm.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: historialCargasForm.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::historialCargasForm
 * @see app/Http/Controllers/InventarioController.php:1456
 * @route '/inventario/historial-cargas'
 */
    const historialCargasFormForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: historialCargasForm.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::historialCargasForm
 * @see app/Http/Controllers/InventarioController.php:1456
 * @route '/inventario/historial-cargas'
 */
        historialCargasFormForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: historialCargasForm.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::historialCargasForm
 * @see app/Http/Controllers/InventarioController.php:1456
 * @route '/inventario/historial-cargas'
 */
        historialCargasFormForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: historialCargasForm.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    historialCargasForm.form = historialCargasFormForm
/**
* @see \App\Http\Controllers\InventarioController::reportes
 * @see app/Http/Controllers/InventarioController.php:661
 * @route '/inventario/reportes'
 */
export const reportes = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportes.url(options),
    method: 'get',
})

reportes.definition = {
    methods: ["get","head"],
    url: '/inventario/reportes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::reportes
 * @see app/Http/Controllers/InventarioController.php:661
 * @route '/inventario/reportes'
 */
reportes.url = (options?: RouteQueryOptions) => {
    return reportes.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::reportes
 * @see app/Http/Controllers/InventarioController.php:661
 * @route '/inventario/reportes'
 */
reportes.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportes.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::reportes
 * @see app/Http/Controllers/InventarioController.php:661
 * @route '/inventario/reportes'
 */
reportes.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reportes.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::reportes
 * @see app/Http/Controllers/InventarioController.php:661
 * @route '/inventario/reportes'
 */
    const reportesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: reportes.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::reportes
 * @see app/Http/Controllers/InventarioController.php:661
 * @route '/inventario/reportes'
 */
        reportesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reportes.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::reportes
 * @see app/Http/Controllers/InventarioController.php:661
 * @route '/inventario/reportes'
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
/**
* @see \App\Http\Controllers\InventarioController::transferencias
 * @see app/Http/Controllers/InventarioController.php:675
 * @route '/inventario/transferencias'
 */
export const transferencias = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: transferencias.url(options),
    method: 'get',
})

transferencias.definition = {
    methods: ["get","head"],
    url: '/inventario/transferencias',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::transferencias
 * @see app/Http/Controllers/InventarioController.php:675
 * @route '/inventario/transferencias'
 */
transferencias.url = (options?: RouteQueryOptions) => {
    return transferencias.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::transferencias
 * @see app/Http/Controllers/InventarioController.php:675
 * @route '/inventario/transferencias'
 */
transferencias.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: transferencias.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::transferencias
 * @see app/Http/Controllers/InventarioController.php:675
 * @route '/inventario/transferencias'
 */
transferencias.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: transferencias.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::transferencias
 * @see app/Http/Controllers/InventarioController.php:675
 * @route '/inventario/transferencias'
 */
    const transferenciasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: transferencias.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::transferencias
 * @see app/Http/Controllers/InventarioController.php:675
 * @route '/inventario/transferencias'
 */
        transferenciasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: transferencias.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::transferencias
 * @see app/Http/Controllers/InventarioController.php:675
 * @route '/inventario/transferencias'
 */
        transferenciasForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: transferencias.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    transferencias.form = transferenciasForm
/**
* @see \App\Http\Controllers\InventarioController::formularioCrearTransferencia
 * @see app/Http/Controllers/InventarioController.php:809
 * @route '/inventario/transferencias/crear'
 */
export const formularioCrearTransferencia = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: formularioCrearTransferencia.url(options),
    method: 'get',
})

formularioCrearTransferencia.definition = {
    methods: ["get","head"],
    url: '/inventario/transferencias/crear',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::formularioCrearTransferencia
 * @see app/Http/Controllers/InventarioController.php:809
 * @route '/inventario/transferencias/crear'
 */
formularioCrearTransferencia.url = (options?: RouteQueryOptions) => {
    return formularioCrearTransferencia.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::formularioCrearTransferencia
 * @see app/Http/Controllers/InventarioController.php:809
 * @route '/inventario/transferencias/crear'
 */
formularioCrearTransferencia.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: formularioCrearTransferencia.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::formularioCrearTransferencia
 * @see app/Http/Controllers/InventarioController.php:809
 * @route '/inventario/transferencias/crear'
 */
formularioCrearTransferencia.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: formularioCrearTransferencia.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::formularioCrearTransferencia
 * @see app/Http/Controllers/InventarioController.php:809
 * @route '/inventario/transferencias/crear'
 */
    const formularioCrearTransferenciaForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: formularioCrearTransferencia.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::formularioCrearTransferencia
 * @see app/Http/Controllers/InventarioController.php:809
 * @route '/inventario/transferencias/crear'
 */
        formularioCrearTransferenciaForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: formularioCrearTransferencia.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::formularioCrearTransferencia
 * @see app/Http/Controllers/InventarioController.php:809
 * @route '/inventario/transferencias/crear'
 */
        formularioCrearTransferenciaForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: formularioCrearTransferencia.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    formularioCrearTransferencia.form = formularioCrearTransferenciaForm
/**
* @see \App\Http\Controllers\InventarioController::crearTransferencia
 * @see app/Http/Controllers/InventarioController.php:719
 * @route '/inventario/transferencias/crear'
 */
export const crearTransferencia = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearTransferencia.url(options),
    method: 'post',
})

crearTransferencia.definition = {
    methods: ["post"],
    url: '/inventario/transferencias/crear',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventarioController::crearTransferencia
 * @see app/Http/Controllers/InventarioController.php:719
 * @route '/inventario/transferencias/crear'
 */
crearTransferencia.url = (options?: RouteQueryOptions) => {
    return crearTransferencia.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::crearTransferencia
 * @see app/Http/Controllers/InventarioController.php:719
 * @route '/inventario/transferencias/crear'
 */
crearTransferencia.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearTransferencia.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::crearTransferencia
 * @see app/Http/Controllers/InventarioController.php:719
 * @route '/inventario/transferencias/crear'
 */
    const crearTransferenciaForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: crearTransferencia.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::crearTransferencia
 * @see app/Http/Controllers/InventarioController.php:719
 * @route '/inventario/transferencias/crear'
 */
        crearTransferenciaForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: crearTransferencia.url(options),
            method: 'post',
        })
    
    crearTransferencia.form = crearTransferenciaForm
/**
* @see \App\Http\Controllers\InventarioController::verTransferencia
 * @see app/Http/Controllers/InventarioController.php:849
 * @route '/inventario/transferencias/{transferencia}'
 */
export const verTransferencia = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verTransferencia.url(args, options),
    method: 'get',
})

verTransferencia.definition = {
    methods: ["get","head"],
    url: '/inventario/transferencias/{transferencia}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::verTransferencia
 * @see app/Http/Controllers/InventarioController.php:849
 * @route '/inventario/transferencias/{transferencia}'
 */
verTransferencia.url = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { transferencia: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { transferencia: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    transferencia: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        transferencia: typeof args.transferencia === 'object'
                ? args.transferencia.id
                : args.transferencia,
                }

    return verTransferencia.definition.url
            .replace('{transferencia}', parsedArgs.transferencia.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::verTransferencia
 * @see app/Http/Controllers/InventarioController.php:849
 * @route '/inventario/transferencias/{transferencia}'
 */
verTransferencia.get = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verTransferencia.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::verTransferencia
 * @see app/Http/Controllers/InventarioController.php:849
 * @route '/inventario/transferencias/{transferencia}'
 */
verTransferencia.head = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: verTransferencia.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::verTransferencia
 * @see app/Http/Controllers/InventarioController.php:849
 * @route '/inventario/transferencias/{transferencia}'
 */
    const verTransferenciaForm = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: verTransferencia.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::verTransferencia
 * @see app/Http/Controllers/InventarioController.php:849
 * @route '/inventario/transferencias/{transferencia}'
 */
        verTransferenciaForm.get = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: verTransferencia.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::verTransferencia
 * @see app/Http/Controllers/InventarioController.php:849
 * @route '/inventario/transferencias/{transferencia}'
 */
        verTransferenciaForm.head = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: verTransferencia.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    verTransferencia.form = verTransferenciaForm
/**
* @see \App\Http\Controllers\InventarioController::editarTransferencia
 * @see app/Http/Controllers/InventarioController.php:1001
 * @route '/inventario/transferencias/{transferencia}/edit'
 */
export const editarTransferencia = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: editarTransferencia.url(args, options),
    method: 'get',
})

editarTransferencia.definition = {
    methods: ["get","head"],
    url: '/inventario/transferencias/{transferencia}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::editarTransferencia
 * @see app/Http/Controllers/InventarioController.php:1001
 * @route '/inventario/transferencias/{transferencia}/edit'
 */
editarTransferencia.url = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { transferencia: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { transferencia: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    transferencia: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        transferencia: typeof args.transferencia === 'object'
                ? args.transferencia.id
                : args.transferencia,
                }

    return editarTransferencia.definition.url
            .replace('{transferencia}', parsedArgs.transferencia.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::editarTransferencia
 * @see app/Http/Controllers/InventarioController.php:1001
 * @route '/inventario/transferencias/{transferencia}/edit'
 */
editarTransferencia.get = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: editarTransferencia.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::editarTransferencia
 * @see app/Http/Controllers/InventarioController.php:1001
 * @route '/inventario/transferencias/{transferencia}/edit'
 */
editarTransferencia.head = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: editarTransferencia.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::editarTransferencia
 * @see app/Http/Controllers/InventarioController.php:1001
 * @route '/inventario/transferencias/{transferencia}/edit'
 */
    const editarTransferenciaForm = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: editarTransferencia.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::editarTransferencia
 * @see app/Http/Controllers/InventarioController.php:1001
 * @route '/inventario/transferencias/{transferencia}/edit'
 */
        editarTransferenciaForm.get = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: editarTransferencia.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::editarTransferencia
 * @see app/Http/Controllers/InventarioController.php:1001
 * @route '/inventario/transferencias/{transferencia}/edit'
 */
        editarTransferenciaForm.head = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: editarTransferencia.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    editarTransferencia.form = editarTransferenciaForm
/**
* @see \App\Http\Controllers\InventarioController::actualizarTransferencia
 * @see app/Http/Controllers/InventarioController.php:1020
 * @route '/inventario/transferencias/{transferencia}'
 */
export const actualizarTransferencia = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: actualizarTransferencia.url(args, options),
    method: 'put',
})

actualizarTransferencia.definition = {
    methods: ["put"],
    url: '/inventario/transferencias/{transferencia}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\InventarioController::actualizarTransferencia
 * @see app/Http/Controllers/InventarioController.php:1020
 * @route '/inventario/transferencias/{transferencia}'
 */
actualizarTransferencia.url = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { transferencia: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { transferencia: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    transferencia: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        transferencia: typeof args.transferencia === 'object'
                ? args.transferencia.id
                : args.transferencia,
                }

    return actualizarTransferencia.definition.url
            .replace('{transferencia}', parsedArgs.transferencia.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::actualizarTransferencia
 * @see app/Http/Controllers/InventarioController.php:1020
 * @route '/inventario/transferencias/{transferencia}'
 */
actualizarTransferencia.put = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: actualizarTransferencia.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\InventarioController::actualizarTransferencia
 * @see app/Http/Controllers/InventarioController.php:1020
 * @route '/inventario/transferencias/{transferencia}'
 */
    const actualizarTransferenciaForm = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: actualizarTransferencia.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::actualizarTransferencia
 * @see app/Http/Controllers/InventarioController.php:1020
 * @route '/inventario/transferencias/{transferencia}'
 */
        actualizarTransferenciaForm.put = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: actualizarTransferencia.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    actualizarTransferencia.form = actualizarTransferenciaForm
/**
* @see \App\Http\Controllers\InventarioController::enviarTransferencia
 * @see app/Http/Controllers/InventarioController.php:868
 * @route '/inventario/transferencias/{transferencia}/enviar'
 */
export const enviarTransferencia = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: enviarTransferencia.url(args, options),
    method: 'post',
})

enviarTransferencia.definition = {
    methods: ["post"],
    url: '/inventario/transferencias/{transferencia}/enviar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventarioController::enviarTransferencia
 * @see app/Http/Controllers/InventarioController.php:868
 * @route '/inventario/transferencias/{transferencia}/enviar'
 */
enviarTransferencia.url = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { transferencia: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { transferencia: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    transferencia: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        transferencia: typeof args.transferencia === 'object'
                ? args.transferencia.id
                : args.transferencia,
                }

    return enviarTransferencia.definition.url
            .replace('{transferencia}', parsedArgs.transferencia.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::enviarTransferencia
 * @see app/Http/Controllers/InventarioController.php:868
 * @route '/inventario/transferencias/{transferencia}/enviar'
 */
enviarTransferencia.post = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: enviarTransferencia.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::enviarTransferencia
 * @see app/Http/Controllers/InventarioController.php:868
 * @route '/inventario/transferencias/{transferencia}/enviar'
 */
    const enviarTransferenciaForm = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: enviarTransferencia.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::enviarTransferencia
 * @see app/Http/Controllers/InventarioController.php:868
 * @route '/inventario/transferencias/{transferencia}/enviar'
 */
        enviarTransferenciaForm.post = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: enviarTransferencia.url(args, options),
            method: 'post',
        })
    
    enviarTransferencia.form = enviarTransferenciaForm
/**
* @see \App\Http\Controllers\InventarioController::recibirTransferencia
 * @see app/Http/Controllers/InventarioController.php:889
 * @route '/inventario/transferencias/{transferencia}/recibir'
 */
export const recibirTransferencia = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: recibirTransferencia.url(args, options),
    method: 'post',
})

recibirTransferencia.definition = {
    methods: ["post"],
    url: '/inventario/transferencias/{transferencia}/recibir',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventarioController::recibirTransferencia
 * @see app/Http/Controllers/InventarioController.php:889
 * @route '/inventario/transferencias/{transferencia}/recibir'
 */
recibirTransferencia.url = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { transferencia: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { transferencia: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    transferencia: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        transferencia: typeof args.transferencia === 'object'
                ? args.transferencia.id
                : args.transferencia,
                }

    return recibirTransferencia.definition.url
            .replace('{transferencia}', parsedArgs.transferencia.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::recibirTransferencia
 * @see app/Http/Controllers/InventarioController.php:889
 * @route '/inventario/transferencias/{transferencia}/recibir'
 */
recibirTransferencia.post = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: recibirTransferencia.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::recibirTransferencia
 * @see app/Http/Controllers/InventarioController.php:889
 * @route '/inventario/transferencias/{transferencia}/recibir'
 */
    const recibirTransferenciaForm = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: recibirTransferencia.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::recibirTransferencia
 * @see app/Http/Controllers/InventarioController.php:889
 * @route '/inventario/transferencias/{transferencia}/recibir'
 */
        recibirTransferenciaForm.post = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: recibirTransferencia.url(args, options),
            method: 'post',
        })
    
    recibirTransferencia.form = recibirTransferenciaForm
/**
* @see \App\Http\Controllers\InventarioController::cancelarTransferencia
 * @see app/Http/Controllers/InventarioController.php:910
 * @route '/inventario/transferencias/{transferencia}/cancelar'
 */
export const cancelarTransferencia = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelarTransferencia.url(args, options),
    method: 'post',
})

cancelarTransferencia.definition = {
    methods: ["post"],
    url: '/inventario/transferencias/{transferencia}/cancelar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventarioController::cancelarTransferencia
 * @see app/Http/Controllers/InventarioController.php:910
 * @route '/inventario/transferencias/{transferencia}/cancelar'
 */
cancelarTransferencia.url = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { transferencia: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { transferencia: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    transferencia: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        transferencia: typeof args.transferencia === 'object'
                ? args.transferencia.id
                : args.transferencia,
                }

    return cancelarTransferencia.definition.url
            .replace('{transferencia}', parsedArgs.transferencia.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::cancelarTransferencia
 * @see app/Http/Controllers/InventarioController.php:910
 * @route '/inventario/transferencias/{transferencia}/cancelar'
 */
cancelarTransferencia.post = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelarTransferencia.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::cancelarTransferencia
 * @see app/Http/Controllers/InventarioController.php:910
 * @route '/inventario/transferencias/{transferencia}/cancelar'
 */
    const cancelarTransferenciaForm = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelarTransferencia.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::cancelarTransferencia
 * @see app/Http/Controllers/InventarioController.php:910
 * @route '/inventario/transferencias/{transferencia}/cancelar'
 */
        cancelarTransferenciaForm.post = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelarTransferencia.url(args, options),
            method: 'post',
        })
    
    cancelarTransferencia.form = cancelarTransferenciaForm
/**
* @see \App\Http\Controllers\InventarioController::mermas
 * @see app/Http/Controllers/InventarioController.php:935
 * @route '/inventario/mermas'
 */
export const mermas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mermas.url(options),
    method: 'get',
})

mermas.definition = {
    methods: ["get","head"],
    url: '/inventario/mermas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::mermas
 * @see app/Http/Controllers/InventarioController.php:935
 * @route '/inventario/mermas'
 */
mermas.url = (options?: RouteQueryOptions) => {
    return mermas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::mermas
 * @see app/Http/Controllers/InventarioController.php:935
 * @route '/inventario/mermas'
 */
mermas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mermas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::mermas
 * @see app/Http/Controllers/InventarioController.php:935
 * @route '/inventario/mermas'
 */
mermas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: mermas.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::mermas
 * @see app/Http/Controllers/InventarioController.php:935
 * @route '/inventario/mermas'
 */
    const mermasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: mermas.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::mermas
 * @see app/Http/Controllers/InventarioController.php:935
 * @route '/inventario/mermas'
 */
        mermasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: mermas.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::mermas
 * @see app/Http/Controllers/InventarioController.php:935
 * @route '/inventario/mermas'
 */
        mermasForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: mermas.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    mermas.form = mermasForm
/**
* @see \App\Http\Controllers\InventarioController::formularioRegistrarMerma
 * @see app/Http/Controllers/InventarioController.php:960
 * @route '/inventario/mermas/registrar'
 */
export const formularioRegistrarMerma = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: formularioRegistrarMerma.url(options),
    method: 'get',
})

formularioRegistrarMerma.definition = {
    methods: ["get","head"],
    url: '/inventario/mermas/registrar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::formularioRegistrarMerma
 * @see app/Http/Controllers/InventarioController.php:960
 * @route '/inventario/mermas/registrar'
 */
formularioRegistrarMerma.url = (options?: RouteQueryOptions) => {
    return formularioRegistrarMerma.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::formularioRegistrarMerma
 * @see app/Http/Controllers/InventarioController.php:960
 * @route '/inventario/mermas/registrar'
 */
formularioRegistrarMerma.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: formularioRegistrarMerma.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::formularioRegistrarMerma
 * @see app/Http/Controllers/InventarioController.php:960
 * @route '/inventario/mermas/registrar'
 */
formularioRegistrarMerma.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: formularioRegistrarMerma.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::formularioRegistrarMerma
 * @see app/Http/Controllers/InventarioController.php:960
 * @route '/inventario/mermas/registrar'
 */
    const formularioRegistrarMermaForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: formularioRegistrarMerma.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::formularioRegistrarMerma
 * @see app/Http/Controllers/InventarioController.php:960
 * @route '/inventario/mermas/registrar'
 */
        formularioRegistrarMermaForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: formularioRegistrarMerma.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::formularioRegistrarMerma
 * @see app/Http/Controllers/InventarioController.php:960
 * @route '/inventario/mermas/registrar'
 */
        formularioRegistrarMermaForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: formularioRegistrarMerma.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    formularioRegistrarMerma.form = formularioRegistrarMermaForm
/**
* @see \App\Http\Controllers\InventarioController::registrarMerma
 * @see app/Http/Controllers/InventarioController.php:774
 * @route '/inventario/mermas/registrar'
 */
export const registrarMerma = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarMerma.url(options),
    method: 'post',
})

registrarMerma.definition = {
    methods: ["post"],
    url: '/inventario/mermas/registrar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventarioController::registrarMerma
 * @see app/Http/Controllers/InventarioController.php:774
 * @route '/inventario/mermas/registrar'
 */
registrarMerma.url = (options?: RouteQueryOptions) => {
    return registrarMerma.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::registrarMerma
 * @see app/Http/Controllers/InventarioController.php:774
 * @route '/inventario/mermas/registrar'
 */
registrarMerma.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarMerma.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::registrarMerma
 * @see app/Http/Controllers/InventarioController.php:774
 * @route '/inventario/mermas/registrar'
 */
    const registrarMermaForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: registrarMerma.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::registrarMerma
 * @see app/Http/Controllers/InventarioController.php:774
 * @route '/inventario/mermas/registrar'
 */
        registrarMermaForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: registrarMerma.url(options),
            method: 'post',
        })
    
    registrarMerma.form = registrarMermaForm
/**
* @see \App\Http\Controllers\InventarioController::verMerma
 * @see app/Http/Controllers/InventarioController.php:1111
 * @route '/inventario/mermas/{merma}'
 */
export const verMerma = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verMerma.url(args, options),
    method: 'get',
})

verMerma.definition = {
    methods: ["get","head"],
    url: '/inventario/mermas/{merma}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::verMerma
 * @see app/Http/Controllers/InventarioController.php:1111
 * @route '/inventario/mermas/{merma}'
 */
verMerma.url = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { merma: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    merma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        merma: args.merma,
                }

    return verMerma.definition.url
            .replace('{merma}', parsedArgs.merma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::verMerma
 * @see app/Http/Controllers/InventarioController.php:1111
 * @route '/inventario/mermas/{merma}'
 */
verMerma.get = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verMerma.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::verMerma
 * @see app/Http/Controllers/InventarioController.php:1111
 * @route '/inventario/mermas/{merma}'
 */
verMerma.head = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: verMerma.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::verMerma
 * @see app/Http/Controllers/InventarioController.php:1111
 * @route '/inventario/mermas/{merma}'
 */
    const verMermaForm = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: verMerma.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::verMerma
 * @see app/Http/Controllers/InventarioController.php:1111
 * @route '/inventario/mermas/{merma}'
 */
        verMermaForm.get = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: verMerma.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::verMerma
 * @see app/Http/Controllers/InventarioController.php:1111
 * @route '/inventario/mermas/{merma}'
 */
        verMermaForm.head = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: verMerma.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    verMerma.form = verMermaForm
/**
* @see \App\Http\Controllers\InventarioController::aprobarMerma
 * @see app/Http/Controllers/InventarioController.php:1168
 * @route '/inventario/mermas/{merma}/aprobar'
 */
export const aprobarMerma = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: aprobarMerma.url(args, options),
    method: 'post',
})

aprobarMerma.definition = {
    methods: ["post"],
    url: '/inventario/mermas/{merma}/aprobar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventarioController::aprobarMerma
 * @see app/Http/Controllers/InventarioController.php:1168
 * @route '/inventario/mermas/{merma}/aprobar'
 */
aprobarMerma.url = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { merma: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    merma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        merma: args.merma,
                }

    return aprobarMerma.definition.url
            .replace('{merma}', parsedArgs.merma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::aprobarMerma
 * @see app/Http/Controllers/InventarioController.php:1168
 * @route '/inventario/mermas/{merma}/aprobar'
 */
aprobarMerma.post = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: aprobarMerma.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::aprobarMerma
 * @see app/Http/Controllers/InventarioController.php:1168
 * @route '/inventario/mermas/{merma}/aprobar'
 */
    const aprobarMermaForm = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: aprobarMerma.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::aprobarMerma
 * @see app/Http/Controllers/InventarioController.php:1168
 * @route '/inventario/mermas/{merma}/aprobar'
 */
        aprobarMermaForm.post = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: aprobarMerma.url(args, options),
            method: 'post',
        })
    
    aprobarMerma.form = aprobarMermaForm
/**
* @see \App\Http\Controllers\InventarioController::rechazarMerma
 * @see app/Http/Controllers/InventarioController.php:1218
 * @route '/inventario/mermas/{merma}/rechazar'
 */
export const rechazarMerma = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rechazarMerma.url(args, options),
    method: 'post',
})

rechazarMerma.definition = {
    methods: ["post"],
    url: '/inventario/mermas/{merma}/rechazar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventarioController::rechazarMerma
 * @see app/Http/Controllers/InventarioController.php:1218
 * @route '/inventario/mermas/{merma}/rechazar'
 */
rechazarMerma.url = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { merma: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    merma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        merma: args.merma,
                }

    return rechazarMerma.definition.url
            .replace('{merma}', parsedArgs.merma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::rechazarMerma
 * @see app/Http/Controllers/InventarioController.php:1218
 * @route '/inventario/mermas/{merma}/rechazar'
 */
rechazarMerma.post = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rechazarMerma.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::rechazarMerma
 * @see app/Http/Controllers/InventarioController.php:1218
 * @route '/inventario/mermas/{merma}/rechazar'
 */
    const rechazarMermaForm = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rechazarMerma.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::rechazarMerma
 * @see app/Http/Controllers/InventarioController.php:1218
 * @route '/inventario/mermas/{merma}/rechazar'
 */
        rechazarMermaForm.post = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rechazarMerma.url(args, options),
            method: 'post',
        })
    
    rechazarMerma.form = rechazarMermaForm
const InventarioController = { importarAjustesMasivos, listarCargosCsv, obtenerDetalleCargo, revertirCargo, buscarProductos, stockProducto, procesarAjusteApi, movimientosApi, crearMovimiento, dashboard, stockBajo, proximosVencer, vencidos, movimientos, ajusteForm, procesarAjuste, ajusteMasivoForm, historialCargasForm, reportes, transferencias, formularioCrearTransferencia, crearTransferencia, verTransferencia, editarTransferencia, actualizarTransferencia, enviarTransferencia, recibirTransferencia, cancelarTransferencia, mermas, formularioRegistrarMerma, registrarMerma, verMerma, aprobarMerma, rechazarMerma }

export default InventarioController