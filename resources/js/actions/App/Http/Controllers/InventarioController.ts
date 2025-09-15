import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:547
 * @route '/api/inventario/buscar-productos'
 */
const buscarProductosa0c9f8a3561d0c0f68881a4fe070b90f = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: buscarProductosa0c9f8a3561d0c0f68881a4fe070b90f.url(options),
    method: 'get',
})

buscarProductosa0c9f8a3561d0c0f68881a4fe070b90f.definition = {
    methods: ["get","head"],
    url: '/api/inventario/buscar-productos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:547
 * @route '/api/inventario/buscar-productos'
 */
buscarProductosa0c9f8a3561d0c0f68881a4fe070b90f.url = (options?: RouteQueryOptions) => {
    return buscarProductosa0c9f8a3561d0c0f68881a4fe070b90f.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:547
 * @route '/api/inventario/buscar-productos'
 */
buscarProductosa0c9f8a3561d0c0f68881a4fe070b90f.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: buscarProductosa0c9f8a3561d0c0f68881a4fe070b90f.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:547
 * @route '/api/inventario/buscar-productos'
 */
buscarProductosa0c9f8a3561d0c0f68881a4fe070b90f.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: buscarProductosa0c9f8a3561d0c0f68881a4fe070b90f.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:547
 * @route '/api/inventario/buscar-productos'
 */
    const buscarProductosa0c9f8a3561d0c0f68881a4fe070b90fForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: buscarProductosa0c9f8a3561d0c0f68881a4fe070b90f.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:547
 * @route '/api/inventario/buscar-productos'
 */
        buscarProductosa0c9f8a3561d0c0f68881a4fe070b90fForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: buscarProductosa0c9f8a3561d0c0f68881a4fe070b90f.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:547
 * @route '/api/inventario/buscar-productos'
 */
        buscarProductosa0c9f8a3561d0c0f68881a4fe070b90fForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: buscarProductosa0c9f8a3561d0c0f68881a4fe070b90f.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    buscarProductosa0c9f8a3561d0c0f68881a4fe070b90f.form = buscarProductosa0c9f8a3561d0c0f68881a4fe070b90fForm
    /**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:547
 * @route '/api/buscar-productos'
 */
const buscarProductosd77b98140780f5a0474636de4fe8d46d = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: buscarProductosd77b98140780f5a0474636de4fe8d46d.url(options),
    method: 'get',
})

buscarProductosd77b98140780f5a0474636de4fe8d46d.definition = {
    methods: ["get","head"],
    url: '/api/buscar-productos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:547
 * @route '/api/buscar-productos'
 */
buscarProductosd77b98140780f5a0474636de4fe8d46d.url = (options?: RouteQueryOptions) => {
    return buscarProductosd77b98140780f5a0474636de4fe8d46d.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:547
 * @route '/api/buscar-productos'
 */
buscarProductosd77b98140780f5a0474636de4fe8d46d.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: buscarProductosd77b98140780f5a0474636de4fe8d46d.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:547
 * @route '/api/buscar-productos'
 */
buscarProductosd77b98140780f5a0474636de4fe8d46d.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: buscarProductosd77b98140780f5a0474636de4fe8d46d.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:547
 * @route '/api/buscar-productos'
 */
    const buscarProductosd77b98140780f5a0474636de4fe8d46dForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: buscarProductosd77b98140780f5a0474636de4fe8d46d.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:547
 * @route '/api/buscar-productos'
 */
        buscarProductosd77b98140780f5a0474636de4fe8d46dForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: buscarProductosd77b98140780f5a0474636de4fe8d46d.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::buscarProductos
 * @see app/Http/Controllers/InventarioController.php:547
 * @route '/api/buscar-productos'
 */
        buscarProductosd77b98140780f5a0474636de4fe8d46dForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: buscarProductosd77b98140780f5a0474636de4fe8d46d.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    buscarProductosd77b98140780f5a0474636de4fe8d46d.form = buscarProductosd77b98140780f5a0474636de4fe8d46dForm

export const buscarProductos = {
    '/api/inventario/buscar-productos': buscarProductosa0c9f8a3561d0c0f68881a4fe070b90f,
    '/api/buscar-productos': buscarProductosd77b98140780f5a0474636de4fe8d46d,
}

/**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:573
 * @route '/api/inventario/stock-producto/{producto}'
 */
const stockProducto15c61e29acd7119950557554200d876e = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stockProducto15c61e29acd7119950557554200d876e.url(args, options),
    method: 'get',
})

stockProducto15c61e29acd7119950557554200d876e.definition = {
    methods: ["get","head"],
    url: '/api/inventario/stock-producto/{producto}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:573
 * @route '/api/inventario/stock-producto/{producto}'
 */
stockProducto15c61e29acd7119950557554200d876e.url = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return stockProducto15c61e29acd7119950557554200d876e.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:573
 * @route '/api/inventario/stock-producto/{producto}'
 */
stockProducto15c61e29acd7119950557554200d876e.get = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stockProducto15c61e29acd7119950557554200d876e.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:573
 * @route '/api/inventario/stock-producto/{producto}'
 */
stockProducto15c61e29acd7119950557554200d876e.head = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: stockProducto15c61e29acd7119950557554200d876e.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:573
 * @route '/api/inventario/stock-producto/{producto}'
 */
    const stockProducto15c61e29acd7119950557554200d876eForm = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: stockProducto15c61e29acd7119950557554200d876e.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:573
 * @route '/api/inventario/stock-producto/{producto}'
 */
        stockProducto15c61e29acd7119950557554200d876eForm.get = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stockProducto15c61e29acd7119950557554200d876e.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:573
 * @route '/api/inventario/stock-producto/{producto}'
 */
        stockProducto15c61e29acd7119950557554200d876eForm.head = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stockProducto15c61e29acd7119950557554200d876e.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    stockProducto15c61e29acd7119950557554200d876e.form = stockProducto15c61e29acd7119950557554200d876eForm
    /**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:573
 * @route '/api/stock-producto/{producto}'
 */
const stockProducto08f071ac0e5d3f56eae7f48fddb01eb2 = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stockProducto08f071ac0e5d3f56eae7f48fddb01eb2.url(args, options),
    method: 'get',
})

stockProducto08f071ac0e5d3f56eae7f48fddb01eb2.definition = {
    methods: ["get","head"],
    url: '/api/stock-producto/{producto}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:573
 * @route '/api/stock-producto/{producto}'
 */
stockProducto08f071ac0e5d3f56eae7f48fddb01eb2.url = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return stockProducto08f071ac0e5d3f56eae7f48fddb01eb2.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:573
 * @route '/api/stock-producto/{producto}'
 */
stockProducto08f071ac0e5d3f56eae7f48fddb01eb2.get = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stockProducto08f071ac0e5d3f56eae7f48fddb01eb2.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:573
 * @route '/api/stock-producto/{producto}'
 */
stockProducto08f071ac0e5d3f56eae7f48fddb01eb2.head = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: stockProducto08f071ac0e5d3f56eae7f48fddb01eb2.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:573
 * @route '/api/stock-producto/{producto}'
 */
    const stockProducto08f071ac0e5d3f56eae7f48fddb01eb2Form = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: stockProducto08f071ac0e5d3f56eae7f48fddb01eb2.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:573
 * @route '/api/stock-producto/{producto}'
 */
        stockProducto08f071ac0e5d3f56eae7f48fddb01eb2Form.get = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stockProducto08f071ac0e5d3f56eae7f48fddb01eb2.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::stockProducto
 * @see app/Http/Controllers/InventarioController.php:573
 * @route '/api/stock-producto/{producto}'
 */
        stockProducto08f071ac0e5d3f56eae7f48fddb01eb2Form.head = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stockProducto08f071ac0e5d3f56eae7f48fddb01eb2.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    stockProducto08f071ac0e5d3f56eae7f48fddb01eb2.form = stockProducto08f071ac0e5d3f56eae7f48fddb01eb2Form

export const stockProducto = {
    '/api/inventario/stock-producto/{producto}': stockProducto15c61e29acd7119950557554200d876e,
    '/api/stock-producto/{producto}': stockProducto08f071ac0e5d3f56eae7f48fddb01eb2,
}

/**
* @see \App\Http\Controllers\InventarioController::procesarAjusteApi
 * @see app/Http/Controllers/InventarioController.php:429
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
 * @see app/Http/Controllers/InventarioController.php:429
 * @route '/api/inventario/ajustes'
 */
procesarAjusteApi.url = (options?: RouteQueryOptions) => {
    return procesarAjusteApi.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::procesarAjusteApi
 * @see app/Http/Controllers/InventarioController.php:429
 * @route '/api/inventario/ajustes'
 */
procesarAjusteApi.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: procesarAjusteApi.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::procesarAjusteApi
 * @see app/Http/Controllers/InventarioController.php:429
 * @route '/api/inventario/ajustes'
 */
    const procesarAjusteApiForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: procesarAjusteApi.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::procesarAjusteApi
 * @see app/Http/Controllers/InventarioController.php:429
 * @route '/api/inventario/ajustes'
 */
        procesarAjusteApiForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: procesarAjusteApi.url(options),
            method: 'post',
        })
    
    procesarAjusteApi.form = procesarAjusteApiForm
/**
* @see \App\Http\Controllers\InventarioController::movimientosApi
 * @see app/Http/Controllers/InventarioController.php:484
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
 * @see app/Http/Controllers/InventarioController.php:484
 * @route '/api/inventario/movimientos'
 */
movimientosApi.url = (options?: RouteQueryOptions) => {
    return movimientosApi.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::movimientosApi
 * @see app/Http/Controllers/InventarioController.php:484
 * @route '/api/inventario/movimientos'
 */
movimientosApi.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: movimientosApi.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::movimientosApi
 * @see app/Http/Controllers/InventarioController.php:484
 * @route '/api/inventario/movimientos'
 */
movimientosApi.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: movimientosApi.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::movimientosApi
 * @see app/Http/Controllers/InventarioController.php:484
 * @route '/api/inventario/movimientos'
 */
    const movimientosApiForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: movimientosApi.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::movimientosApi
 * @see app/Http/Controllers/InventarioController.php:484
 * @route '/api/inventario/movimientos'
 */
        movimientosApiForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: movimientosApi.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::movimientosApi
 * @see app/Http/Controllers/InventarioController.php:484
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
 * @see app/Http/Controllers/InventarioController.php:512
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
 * @see app/Http/Controllers/InventarioController.php:512
 * @route '/api/inventario/movimientos'
 */
crearMovimiento.url = (options?: RouteQueryOptions) => {
    return crearMovimiento.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::crearMovimiento
 * @see app/Http/Controllers/InventarioController.php:512
 * @route '/api/inventario/movimientos'
 */
crearMovimiento.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearMovimiento.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::crearMovimiento
 * @see app/Http/Controllers/InventarioController.php:512
 * @route '/api/inventario/movimientos'
 */
    const crearMovimientoForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: crearMovimiento.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::crearMovimiento
 * @see app/Http/Controllers/InventarioController.php:512
 * @route '/api/inventario/movimientos'
 */
        crearMovimientoForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: crearMovimiento.url(options),
            method: 'post',
        })
    
    crearMovimiento.form = crearMovimientoForm
/**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:31
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
 * @see app/Http/Controllers/InventarioController.php:31
 * @route '/inventario'
 */
dashboarda7d559eadbfce810b70b2659eca78e47.url = (options?: RouteQueryOptions) => {
    return dashboarda7d559eadbfce810b70b2659eca78e47.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:31
 * @route '/inventario'
 */
dashboarda7d559eadbfce810b70b2659eca78e47.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboarda7d559eadbfce810b70b2659eca78e47.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:31
 * @route '/inventario'
 */
dashboarda7d559eadbfce810b70b2659eca78e47.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboarda7d559eadbfce810b70b2659eca78e47.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:31
 * @route '/inventario'
 */
    const dashboarda7d559eadbfce810b70b2659eca78e47Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: dashboarda7d559eadbfce810b70b2659eca78e47.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:31
 * @route '/inventario'
 */
        dashboarda7d559eadbfce810b70b2659eca78e47Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboarda7d559eadbfce810b70b2659eca78e47.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:31
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
 * @see app/Http/Controllers/InventarioController.php:31
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
 * @see app/Http/Controllers/InventarioController.php:31
 * @route '/inventario/dashboard'
 */
dashboardb28409eff5a40d1acfd198fc09449f6b.url = (options?: RouteQueryOptions) => {
    return dashboardb28409eff5a40d1acfd198fc09449f6b.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:31
 * @route '/inventario/dashboard'
 */
dashboardb28409eff5a40d1acfd198fc09449f6b.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboardb28409eff5a40d1acfd198fc09449f6b.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:31
 * @route '/inventario/dashboard'
 */
dashboardb28409eff5a40d1acfd198fc09449f6b.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboardb28409eff5a40d1acfd198fc09449f6b.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:31
 * @route '/inventario/dashboard'
 */
    const dashboardb28409eff5a40d1acfd198fc09449f6bForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: dashboardb28409eff5a40d1acfd198fc09449f6b.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:31
 * @route '/inventario/dashboard'
 */
        dashboardb28409eff5a40d1acfd198fc09449f6bForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboardb28409eff5a40d1acfd198fc09449f6b.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::dashboard
 * @see app/Http/Controllers/InventarioController.php:31
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
 * @see app/Http/Controllers/InventarioController.php:87
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
 * @see app/Http/Controllers/InventarioController.php:87
 * @route '/inventario/stock-bajo'
 */
stockBajo.url = (options?: RouteQueryOptions) => {
    return stockBajo.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::stockBajo
 * @see app/Http/Controllers/InventarioController.php:87
 * @route '/inventario/stock-bajo'
 */
stockBajo.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stockBajo.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::stockBajo
 * @see app/Http/Controllers/InventarioController.php:87
 * @route '/inventario/stock-bajo'
 */
stockBajo.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: stockBajo.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::stockBajo
 * @see app/Http/Controllers/InventarioController.php:87
 * @route '/inventario/stock-bajo'
 */
    const stockBajoForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: stockBajo.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::stockBajo
 * @see app/Http/Controllers/InventarioController.php:87
 * @route '/inventario/stock-bajo'
 */
        stockBajoForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: stockBajo.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::stockBajo
 * @see app/Http/Controllers/InventarioController.php:87
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
 * @see app/Http/Controllers/InventarioController.php:147
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
 * @see app/Http/Controllers/InventarioController.php:147
 * @route '/inventario/proximos-vencer'
 */
proximosVencer.url = (options?: RouteQueryOptions) => {
    return proximosVencer.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::proximosVencer
 * @see app/Http/Controllers/InventarioController.php:147
 * @route '/inventario/proximos-vencer'
 */
proximosVencer.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: proximosVencer.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::proximosVencer
 * @see app/Http/Controllers/InventarioController.php:147
 * @route '/inventario/proximos-vencer'
 */
proximosVencer.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: proximosVencer.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::proximosVencer
 * @see app/Http/Controllers/InventarioController.php:147
 * @route '/inventario/proximos-vencer'
 */
    const proximosVencerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: proximosVencer.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::proximosVencer
 * @see app/Http/Controllers/InventarioController.php:147
 * @route '/inventario/proximos-vencer'
 */
        proximosVencerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: proximosVencer.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::proximosVencer
 * @see app/Http/Controllers/InventarioController.php:147
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
 * @see app/Http/Controllers/InventarioController.php:205
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
 * @see app/Http/Controllers/InventarioController.php:205
 * @route '/inventario/vencidos'
 */
vencidos.url = (options?: RouteQueryOptions) => {
    return vencidos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::vencidos
 * @see app/Http/Controllers/InventarioController.php:205
 * @route '/inventario/vencidos'
 */
vencidos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: vencidos.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::vencidos
 * @see app/Http/Controllers/InventarioController.php:205
 * @route '/inventario/vencidos'
 */
vencidos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: vencidos.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::vencidos
 * @see app/Http/Controllers/InventarioController.php:205
 * @route '/inventario/vencidos'
 */
    const vencidosForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: vencidos.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::vencidos
 * @see app/Http/Controllers/InventarioController.php:205
 * @route '/inventario/vencidos'
 */
        vencidosForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: vencidos.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::vencidos
 * @see app/Http/Controllers/InventarioController.php:205
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
 * @see app/Http/Controllers/InventarioController.php:258
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
 * @see app/Http/Controllers/InventarioController.php:258
 * @route '/inventario/movimientos'
 */
movimientos.url = (options?: RouteQueryOptions) => {
    return movimientos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::movimientos
 * @see app/Http/Controllers/InventarioController.php:258
 * @route '/inventario/movimientos'
 */
movimientos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: movimientos.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::movimientos
 * @see app/Http/Controllers/InventarioController.php:258
 * @route '/inventario/movimientos'
 */
movimientos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: movimientos.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::movimientos
 * @see app/Http/Controllers/InventarioController.php:258
 * @route '/inventario/movimientos'
 */
    const movimientosForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: movimientos.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::movimientos
 * @see app/Http/Controllers/InventarioController.php:258
 * @route '/inventario/movimientos'
 */
        movimientosForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: movimientos.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::movimientos
 * @see app/Http/Controllers/InventarioController.php:258
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
 * @see app/Http/Controllers/InventarioController.php:360
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
 * @see app/Http/Controllers/InventarioController.php:360
 * @route '/inventario/ajuste'
 */
ajusteForm.url = (options?: RouteQueryOptions) => {
    return ajusteForm.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::ajusteForm
 * @see app/Http/Controllers/InventarioController.php:360
 * @route '/inventario/ajuste'
 */
ajusteForm.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ajusteForm.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::ajusteForm
 * @see app/Http/Controllers/InventarioController.php:360
 * @route '/inventario/ajuste'
 */
ajusteForm.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ajusteForm.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::ajusteForm
 * @see app/Http/Controllers/InventarioController.php:360
 * @route '/inventario/ajuste'
 */
    const ajusteFormForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: ajusteForm.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::ajusteForm
 * @see app/Http/Controllers/InventarioController.php:360
 * @route '/inventario/ajuste'
 */
        ajusteFormForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ajusteForm.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::ajusteForm
 * @see app/Http/Controllers/InventarioController.php:360
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
 * @see app/Http/Controllers/InventarioController.php:384
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
 * @see app/Http/Controllers/InventarioController.php:384
 * @route '/inventario/ajuste'
 */
procesarAjuste.url = (options?: RouteQueryOptions) => {
    return procesarAjuste.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::procesarAjuste
 * @see app/Http/Controllers/InventarioController.php:384
 * @route '/inventario/ajuste'
 */
procesarAjuste.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: procesarAjuste.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::procesarAjuste
 * @see app/Http/Controllers/InventarioController.php:384
 * @route '/inventario/ajuste'
 */
    const procesarAjusteForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: procesarAjuste.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::procesarAjuste
 * @see app/Http/Controllers/InventarioController.php:384
 * @route '/inventario/ajuste'
 */
        procesarAjusteForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: procesarAjuste.url(options),
            method: 'post',
        })
    
    procesarAjuste.form = procesarAjusteForm
/**
* @see \App\Http\Controllers\InventarioController::reportes
 * @see app/Http/Controllers/InventarioController.php:598
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
 * @see app/Http/Controllers/InventarioController.php:598
 * @route '/inventario/reportes'
 */
reportes.url = (options?: RouteQueryOptions) => {
    return reportes.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::reportes
 * @see app/Http/Controllers/InventarioController.php:598
 * @route '/inventario/reportes'
 */
reportes.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportes.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::reportes
 * @see app/Http/Controllers/InventarioController.php:598
 * @route '/inventario/reportes'
 */
reportes.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reportes.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::reportes
 * @see app/Http/Controllers/InventarioController.php:598
 * @route '/inventario/reportes'
 */
    const reportesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: reportes.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::reportes
 * @see app/Http/Controllers/InventarioController.php:598
 * @route '/inventario/reportes'
 */
        reportesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reportes.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::reportes
 * @see app/Http/Controllers/InventarioController.php:598
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
 * @see app/Http/Controllers/InventarioController.php:612
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
 * @see app/Http/Controllers/InventarioController.php:612
 * @route '/inventario/transferencias'
 */
transferencias.url = (options?: RouteQueryOptions) => {
    return transferencias.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::transferencias
 * @see app/Http/Controllers/InventarioController.php:612
 * @route '/inventario/transferencias'
 */
transferencias.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: transferencias.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::transferencias
 * @see app/Http/Controllers/InventarioController.php:612
 * @route '/inventario/transferencias'
 */
transferencias.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: transferencias.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::transferencias
 * @see app/Http/Controllers/InventarioController.php:612
 * @route '/inventario/transferencias'
 */
    const transferenciasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: transferencias.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::transferencias
 * @see app/Http/Controllers/InventarioController.php:612
 * @route '/inventario/transferencias'
 */
        transferenciasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: transferencias.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::transferencias
 * @see app/Http/Controllers/InventarioController.php:612
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
 * @see app/Http/Controllers/InventarioController.php:762
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
 * @see app/Http/Controllers/InventarioController.php:762
 * @route '/inventario/transferencias/crear'
 */
formularioCrearTransferencia.url = (options?: RouteQueryOptions) => {
    return formularioCrearTransferencia.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::formularioCrearTransferencia
 * @see app/Http/Controllers/InventarioController.php:762
 * @route '/inventario/transferencias/crear'
 */
formularioCrearTransferencia.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: formularioCrearTransferencia.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::formularioCrearTransferencia
 * @see app/Http/Controllers/InventarioController.php:762
 * @route '/inventario/transferencias/crear'
 */
formularioCrearTransferencia.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: formularioCrearTransferencia.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::formularioCrearTransferencia
 * @see app/Http/Controllers/InventarioController.php:762
 * @route '/inventario/transferencias/crear'
 */
    const formularioCrearTransferenciaForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: formularioCrearTransferencia.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::formularioCrearTransferencia
 * @see app/Http/Controllers/InventarioController.php:762
 * @route '/inventario/transferencias/crear'
 */
        formularioCrearTransferenciaForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: formularioCrearTransferencia.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::formularioCrearTransferencia
 * @see app/Http/Controllers/InventarioController.php:762
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
 * @see app/Http/Controllers/InventarioController.php:656
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
 * @see app/Http/Controllers/InventarioController.php:656
 * @route '/inventario/transferencias/crear'
 */
crearTransferencia.url = (options?: RouteQueryOptions) => {
    return crearTransferencia.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::crearTransferencia
 * @see app/Http/Controllers/InventarioController.php:656
 * @route '/inventario/transferencias/crear'
 */
crearTransferencia.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearTransferencia.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::crearTransferencia
 * @see app/Http/Controllers/InventarioController.php:656
 * @route '/inventario/transferencias/crear'
 */
    const crearTransferenciaForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: crearTransferencia.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::crearTransferencia
 * @see app/Http/Controllers/InventarioController.php:656
 * @route '/inventario/transferencias/crear'
 */
        crearTransferenciaForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: crearTransferencia.url(options),
            method: 'post',
        })
    
    crearTransferencia.form = crearTransferenciaForm
/**
* @see \App\Http\Controllers\InventarioController::verTransferencia
 * @see app/Http/Controllers/InventarioController.php:802
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
 * @see app/Http/Controllers/InventarioController.php:802
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
 * @see app/Http/Controllers/InventarioController.php:802
 * @route '/inventario/transferencias/{transferencia}'
 */
verTransferencia.get = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verTransferencia.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::verTransferencia
 * @see app/Http/Controllers/InventarioController.php:802
 * @route '/inventario/transferencias/{transferencia}'
 */
verTransferencia.head = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: verTransferencia.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::verTransferencia
 * @see app/Http/Controllers/InventarioController.php:802
 * @route '/inventario/transferencias/{transferencia}'
 */
    const verTransferenciaForm = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: verTransferencia.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::verTransferencia
 * @see app/Http/Controllers/InventarioController.php:802
 * @route '/inventario/transferencias/{transferencia}'
 */
        verTransferenciaForm.get = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: verTransferencia.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::verTransferencia
 * @see app/Http/Controllers/InventarioController.php:802
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
 * @see app/Http/Controllers/InventarioController.php:954
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
 * @see app/Http/Controllers/InventarioController.php:954
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
 * @see app/Http/Controllers/InventarioController.php:954
 * @route '/inventario/transferencias/{transferencia}/edit'
 */
editarTransferencia.get = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: editarTransferencia.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::editarTransferencia
 * @see app/Http/Controllers/InventarioController.php:954
 * @route '/inventario/transferencias/{transferencia}/edit'
 */
editarTransferencia.head = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: editarTransferencia.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::editarTransferencia
 * @see app/Http/Controllers/InventarioController.php:954
 * @route '/inventario/transferencias/{transferencia}/edit'
 */
    const editarTransferenciaForm = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: editarTransferencia.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::editarTransferencia
 * @see app/Http/Controllers/InventarioController.php:954
 * @route '/inventario/transferencias/{transferencia}/edit'
 */
        editarTransferenciaForm.get = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: editarTransferencia.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::editarTransferencia
 * @see app/Http/Controllers/InventarioController.php:954
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
 * @see app/Http/Controllers/InventarioController.php:973
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
 * @see app/Http/Controllers/InventarioController.php:973
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
 * @see app/Http/Controllers/InventarioController.php:973
 * @route '/inventario/transferencias/{transferencia}'
 */
actualizarTransferencia.put = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: actualizarTransferencia.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\InventarioController::actualizarTransferencia
 * @see app/Http/Controllers/InventarioController.php:973
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
 * @see app/Http/Controllers/InventarioController.php:973
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
 * @see app/Http/Controllers/InventarioController.php:821
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
 * @see app/Http/Controllers/InventarioController.php:821
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
 * @see app/Http/Controllers/InventarioController.php:821
 * @route '/inventario/transferencias/{transferencia}/enviar'
 */
enviarTransferencia.post = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: enviarTransferencia.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::enviarTransferencia
 * @see app/Http/Controllers/InventarioController.php:821
 * @route '/inventario/transferencias/{transferencia}/enviar'
 */
    const enviarTransferenciaForm = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: enviarTransferencia.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::enviarTransferencia
 * @see app/Http/Controllers/InventarioController.php:821
 * @route '/inventario/transferencias/{transferencia}/enviar'
 */
        enviarTransferenciaForm.post = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: enviarTransferencia.url(args, options),
            method: 'post',
        })
    
    enviarTransferencia.form = enviarTransferenciaForm
/**
* @see \App\Http\Controllers\InventarioController::recibirTransferencia
 * @see app/Http/Controllers/InventarioController.php:842
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
 * @see app/Http/Controllers/InventarioController.php:842
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
 * @see app/Http/Controllers/InventarioController.php:842
 * @route '/inventario/transferencias/{transferencia}/recibir'
 */
recibirTransferencia.post = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: recibirTransferencia.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::recibirTransferencia
 * @see app/Http/Controllers/InventarioController.php:842
 * @route '/inventario/transferencias/{transferencia}/recibir'
 */
    const recibirTransferenciaForm = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: recibirTransferencia.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::recibirTransferencia
 * @see app/Http/Controllers/InventarioController.php:842
 * @route '/inventario/transferencias/{transferencia}/recibir'
 */
        recibirTransferenciaForm.post = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: recibirTransferencia.url(args, options),
            method: 'post',
        })
    
    recibirTransferencia.form = recibirTransferenciaForm
/**
* @see \App\Http\Controllers\InventarioController::cancelarTransferencia
 * @see app/Http/Controllers/InventarioController.php:863
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
 * @see app/Http/Controllers/InventarioController.php:863
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
 * @see app/Http/Controllers/InventarioController.php:863
 * @route '/inventario/transferencias/{transferencia}/cancelar'
 */
cancelarTransferencia.post = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelarTransferencia.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::cancelarTransferencia
 * @see app/Http/Controllers/InventarioController.php:863
 * @route '/inventario/transferencias/{transferencia}/cancelar'
 */
    const cancelarTransferenciaForm = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelarTransferencia.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::cancelarTransferencia
 * @see app/Http/Controllers/InventarioController.php:863
 * @route '/inventario/transferencias/{transferencia}/cancelar'
 */
        cancelarTransferenciaForm.post = (args: { transferencia: number | { id: number } } | [transferencia: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelarTransferencia.url(args, options),
            method: 'post',
        })
    
    cancelarTransferencia.form = cancelarTransferenciaForm
/**
* @see \App\Http\Controllers\InventarioController::mermas
 * @see app/Http/Controllers/InventarioController.php:888
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
 * @see app/Http/Controllers/InventarioController.php:888
 * @route '/inventario/mermas'
 */
mermas.url = (options?: RouteQueryOptions) => {
    return mermas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::mermas
 * @see app/Http/Controllers/InventarioController.php:888
 * @route '/inventario/mermas'
 */
mermas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mermas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::mermas
 * @see app/Http/Controllers/InventarioController.php:888
 * @route '/inventario/mermas'
 */
mermas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: mermas.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::mermas
 * @see app/Http/Controllers/InventarioController.php:888
 * @route '/inventario/mermas'
 */
    const mermasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: mermas.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::mermas
 * @see app/Http/Controllers/InventarioController.php:888
 * @route '/inventario/mermas'
 */
        mermasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: mermas.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::mermas
 * @see app/Http/Controllers/InventarioController.php:888
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
 * @see app/Http/Controllers/InventarioController.php:913
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
 * @see app/Http/Controllers/InventarioController.php:913
 * @route '/inventario/mermas/registrar'
 */
formularioRegistrarMerma.url = (options?: RouteQueryOptions) => {
    return formularioRegistrarMerma.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::formularioRegistrarMerma
 * @see app/Http/Controllers/InventarioController.php:913
 * @route '/inventario/mermas/registrar'
 */
formularioRegistrarMerma.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: formularioRegistrarMerma.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::formularioRegistrarMerma
 * @see app/Http/Controllers/InventarioController.php:913
 * @route '/inventario/mermas/registrar'
 */
formularioRegistrarMerma.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: formularioRegistrarMerma.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::formularioRegistrarMerma
 * @see app/Http/Controllers/InventarioController.php:913
 * @route '/inventario/mermas/registrar'
 */
    const formularioRegistrarMermaForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: formularioRegistrarMerma.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::formularioRegistrarMerma
 * @see app/Http/Controllers/InventarioController.php:913
 * @route '/inventario/mermas/registrar'
 */
        formularioRegistrarMermaForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: formularioRegistrarMerma.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::formularioRegistrarMerma
 * @see app/Http/Controllers/InventarioController.php:913
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
 * @see app/Http/Controllers/InventarioController.php:722
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
 * @see app/Http/Controllers/InventarioController.php:722
 * @route '/inventario/mermas/registrar'
 */
registrarMerma.url = (options?: RouteQueryOptions) => {
    return registrarMerma.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::registrarMerma
 * @see app/Http/Controllers/InventarioController.php:722
 * @route '/inventario/mermas/registrar'
 */
registrarMerma.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarMerma.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::registrarMerma
 * @see app/Http/Controllers/InventarioController.php:722
 * @route '/inventario/mermas/registrar'
 */
    const registrarMermaForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: registrarMerma.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::registrarMerma
 * @see app/Http/Controllers/InventarioController.php:722
 * @route '/inventario/mermas/registrar'
 */
        registrarMermaForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: registrarMerma.url(options),
            method: 'post',
        })
    
    registrarMerma.form = registrarMermaForm
/**
* @see \App\Http\Controllers\InventarioController::verMerma
 * @see app/Http/Controllers/InventarioController.php:1064
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
 * @see app/Http/Controllers/InventarioController.php:1064
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
 * @see app/Http/Controllers/InventarioController.php:1064
 * @route '/inventario/mermas/{merma}'
 */
verMerma.get = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verMerma.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::verMerma
 * @see app/Http/Controllers/InventarioController.php:1064
 * @route '/inventario/mermas/{merma}'
 */
verMerma.head = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: verMerma.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::verMerma
 * @see app/Http/Controllers/InventarioController.php:1064
 * @route '/inventario/mermas/{merma}'
 */
    const verMermaForm = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: verMerma.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::verMerma
 * @see app/Http/Controllers/InventarioController.php:1064
 * @route '/inventario/mermas/{merma}'
 */
        verMermaForm.get = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: verMerma.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::verMerma
 * @see app/Http/Controllers/InventarioController.php:1064
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
 * @see app/Http/Controllers/InventarioController.php:1087
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
 * @see app/Http/Controllers/InventarioController.php:1087
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
 * @see app/Http/Controllers/InventarioController.php:1087
 * @route '/inventario/mermas/{merma}/aprobar'
 */
aprobarMerma.post = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: aprobarMerma.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::aprobarMerma
 * @see app/Http/Controllers/InventarioController.php:1087
 * @route '/inventario/mermas/{merma}/aprobar'
 */
    const aprobarMermaForm = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: aprobarMerma.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::aprobarMerma
 * @see app/Http/Controllers/InventarioController.php:1087
 * @route '/inventario/mermas/{merma}/aprobar'
 */
        aprobarMermaForm.post = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: aprobarMerma.url(args, options),
            method: 'post',
        })
    
    aprobarMerma.form = aprobarMermaForm
/**
* @see \App\Http\Controllers\InventarioController::rechazarMerma
 * @see app/Http/Controllers/InventarioController.php:1104
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
 * @see app/Http/Controllers/InventarioController.php:1104
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
 * @see app/Http/Controllers/InventarioController.php:1104
 * @route '/inventario/mermas/{merma}/rechazar'
 */
rechazarMerma.post = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rechazarMerma.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InventarioController::rechazarMerma
 * @see app/Http/Controllers/InventarioController.php:1104
 * @route '/inventario/mermas/{merma}/rechazar'
 */
    const rechazarMermaForm = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rechazarMerma.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InventarioController::rechazarMerma
 * @see app/Http/Controllers/InventarioController.php:1104
 * @route '/inventario/mermas/{merma}/rechazar'
 */
        rechazarMermaForm.post = (args: { merma: string | number } | [merma: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rechazarMerma.url(args, options),
            method: 'post',
        })
    
    rechazarMerma.form = rechazarMermaForm
/**
* @see \App\Http\Controllers\InventarioController::apiVehiculos
 * @see app/Http/Controllers/InventarioController.php:925
 * @route '/api/vehiculos'
 */
export const apiVehiculos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: apiVehiculos.url(options),
    method: 'get',
})

apiVehiculos.definition = {
    methods: ["get","head"],
    url: '/api/vehiculos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::apiVehiculos
 * @see app/Http/Controllers/InventarioController.php:925
 * @route '/api/vehiculos'
 */
apiVehiculos.url = (options?: RouteQueryOptions) => {
    return apiVehiculos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::apiVehiculos
 * @see app/Http/Controllers/InventarioController.php:925
 * @route '/api/vehiculos'
 */
apiVehiculos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: apiVehiculos.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::apiVehiculos
 * @see app/Http/Controllers/InventarioController.php:925
 * @route '/api/vehiculos'
 */
apiVehiculos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: apiVehiculos.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::apiVehiculos
 * @see app/Http/Controllers/InventarioController.php:925
 * @route '/api/vehiculos'
 */
    const apiVehiculosForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: apiVehiculos.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::apiVehiculos
 * @see app/Http/Controllers/InventarioController.php:925
 * @route '/api/vehiculos'
 */
        apiVehiculosForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: apiVehiculos.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::apiVehiculos
 * @see app/Http/Controllers/InventarioController.php:925
 * @route '/api/vehiculos'
 */
        apiVehiculosForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: apiVehiculos.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    apiVehiculos.form = apiVehiculosForm
/**
* @see \App\Http\Controllers\InventarioController::apiChoferes
 * @see app/Http/Controllers/InventarioController.php:935
 * @route '/api/choferes'
 */
export const apiChoferes = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: apiChoferes.url(options),
    method: 'get',
})

apiChoferes.definition = {
    methods: ["get","head"],
    url: '/api/choferes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::apiChoferes
 * @see app/Http/Controllers/InventarioController.php:935
 * @route '/api/choferes'
 */
apiChoferes.url = (options?: RouteQueryOptions) => {
    return apiChoferes.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::apiChoferes
 * @see app/Http/Controllers/InventarioController.php:935
 * @route '/api/choferes'
 */
apiChoferes.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: apiChoferes.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::apiChoferes
 * @see app/Http/Controllers/InventarioController.php:935
 * @route '/api/choferes'
 */
apiChoferes.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: apiChoferes.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::apiChoferes
 * @see app/Http/Controllers/InventarioController.php:935
 * @route '/api/choferes'
 */
    const apiChoferesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: apiChoferes.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::apiChoferes
 * @see app/Http/Controllers/InventarioController.php:935
 * @route '/api/choferes'
 */
        apiChoferesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: apiChoferes.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::apiChoferes
 * @see app/Http/Controllers/InventarioController.php:935
 * @route '/api/choferes'
 */
        apiChoferesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: apiChoferes.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    apiChoferes.form = apiChoferesForm
const InventarioController = { buscarProductos, stockProducto, procesarAjusteApi, movimientosApi, crearMovimiento, dashboard, stockBajo, proximosVencer, vencidos, movimientos, ajusteForm, procesarAjuste, reportes, transferencias, formularioCrearTransferencia, crearTransferencia, verTransferencia, editarTransferencia, actualizarTransferencia, enviarTransferencia, recibirTransferencia, cancelarTransferencia, mermas, formularioRegistrarMerma, registrarMerma, verMerma, aprobarMerma, rechazarMerma, apiVehiculos, apiChoferes }

export default InventarioController