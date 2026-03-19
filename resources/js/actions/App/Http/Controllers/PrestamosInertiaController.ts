import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
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
* @see \App\Http\Controllers\PrestamosInertiaController::clientesIndex
 * @see app/Http/Controllers/PrestamosInertiaController.php:42
 * @route '/prestamos/clientes'
 */
export const clientesIndex = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: clientesIndex.url(options),
    method: 'get',
})

clientesIndex.definition = {
    methods: ["get","head"],
    url: '/prestamos/clientes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestamosInertiaController::clientesIndex
 * @see app/Http/Controllers/PrestamosInertiaController.php:42
 * @route '/prestamos/clientes'
 */
clientesIndex.url = (options?: RouteQueryOptions) => {
    return clientesIndex.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamosInertiaController::clientesIndex
 * @see app/Http/Controllers/PrestamosInertiaController.php:42
 * @route '/prestamos/clientes'
 */
clientesIndex.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: clientesIndex.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestamosInertiaController::clientesIndex
 * @see app/Http/Controllers/PrestamosInertiaController.php:42
 * @route '/prestamos/clientes'
 */
clientesIndex.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: clientesIndex.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestamosInertiaController::clientesIndex
 * @see app/Http/Controllers/PrestamosInertiaController.php:42
 * @route '/prestamos/clientes'
 */
    const clientesIndexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: clientesIndex.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestamosInertiaController::clientesIndex
 * @see app/Http/Controllers/PrestamosInertiaController.php:42
 * @route '/prestamos/clientes'
 */
        clientesIndexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: clientesIndex.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestamosInertiaController::clientesIndex
 * @see app/Http/Controllers/PrestamosInertiaController.php:42
 * @route '/prestamos/clientes'
 */
        clientesIndexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: clientesIndex.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    clientesIndex.form = clientesIndexForm
/**
* @see \App\Http\Controllers\PrestamosInertiaController::clientesCrear
 * @see app/Http/Controllers/PrestamosInertiaController.php:50
 * @route '/prestamos/clientes/crear'
 */
export const clientesCrear = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: clientesCrear.url(options),
    method: 'get',
})

clientesCrear.definition = {
    methods: ["get","head"],
    url: '/prestamos/clientes/crear',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestamosInertiaController::clientesCrear
 * @see app/Http/Controllers/PrestamosInertiaController.php:50
 * @route '/prestamos/clientes/crear'
 */
clientesCrear.url = (options?: RouteQueryOptions) => {
    return clientesCrear.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamosInertiaController::clientesCrear
 * @see app/Http/Controllers/PrestamosInertiaController.php:50
 * @route '/prestamos/clientes/crear'
 */
clientesCrear.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: clientesCrear.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestamosInertiaController::clientesCrear
 * @see app/Http/Controllers/PrestamosInertiaController.php:50
 * @route '/prestamos/clientes/crear'
 */
clientesCrear.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: clientesCrear.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestamosInertiaController::clientesCrear
 * @see app/Http/Controllers/PrestamosInertiaController.php:50
 * @route '/prestamos/clientes/crear'
 */
    const clientesCrearForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: clientesCrear.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestamosInertiaController::clientesCrear
 * @see app/Http/Controllers/PrestamosInertiaController.php:50
 * @route '/prestamos/clientes/crear'
 */
        clientesCrearForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: clientesCrear.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestamosInertiaController::clientesCrear
 * @see app/Http/Controllers/PrestamosInertiaController.php:50
 * @route '/prestamos/clientes/crear'
 */
        clientesCrearForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: clientesCrear.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    clientesCrear.form = clientesCrearForm
/**
* @see \App\Http\Controllers\PrestamosInertiaController::clientesStore
 * @see app/Http/Controllers/PrestamosInertiaController.php:80
 * @route '/prestamos/clientes'
 */
export const clientesStore = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: clientesStore.url(options),
    method: 'post',
})

clientesStore.definition = {
    methods: ["post"],
    url: '/prestamos/clientes',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PrestamosInertiaController::clientesStore
 * @see app/Http/Controllers/PrestamosInertiaController.php:80
 * @route '/prestamos/clientes'
 */
clientesStore.url = (options?: RouteQueryOptions) => {
    return clientesStore.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamosInertiaController::clientesStore
 * @see app/Http/Controllers/PrestamosInertiaController.php:80
 * @route '/prestamos/clientes'
 */
clientesStore.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: clientesStore.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PrestamosInertiaController::clientesStore
 * @see app/Http/Controllers/PrestamosInertiaController.php:80
 * @route '/prestamos/clientes'
 */
    const clientesStoreForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: clientesStore.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PrestamosInertiaController::clientesStore
 * @see app/Http/Controllers/PrestamosInertiaController.php:80
 * @route '/prestamos/clientes'
 */
        clientesStoreForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: clientesStore.url(options),
            method: 'post',
        })
    
    clientesStore.form = clientesStoreForm
/**
* @see \App\Http\Controllers\PrestamosInertiaController::proveedoresIndex
 * @see app/Http/Controllers/PrestamosInertiaController.php:89
 * @route '/prestamos/proveedores'
 */
export const proveedoresIndex = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: proveedoresIndex.url(options),
    method: 'get',
})

proveedoresIndex.definition = {
    methods: ["get","head"],
    url: '/prestamos/proveedores',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestamosInertiaController::proveedoresIndex
 * @see app/Http/Controllers/PrestamosInertiaController.php:89
 * @route '/prestamos/proveedores'
 */
proveedoresIndex.url = (options?: RouteQueryOptions) => {
    return proveedoresIndex.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamosInertiaController::proveedoresIndex
 * @see app/Http/Controllers/PrestamosInertiaController.php:89
 * @route '/prestamos/proveedores'
 */
proveedoresIndex.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: proveedoresIndex.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestamosInertiaController::proveedoresIndex
 * @see app/Http/Controllers/PrestamosInertiaController.php:89
 * @route '/prestamos/proveedores'
 */
proveedoresIndex.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: proveedoresIndex.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestamosInertiaController::proveedoresIndex
 * @see app/Http/Controllers/PrestamosInertiaController.php:89
 * @route '/prestamos/proveedores'
 */
    const proveedoresIndexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: proveedoresIndex.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestamosInertiaController::proveedoresIndex
 * @see app/Http/Controllers/PrestamosInertiaController.php:89
 * @route '/prestamos/proveedores'
 */
        proveedoresIndexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: proveedoresIndex.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestamosInertiaController::proveedoresIndex
 * @see app/Http/Controllers/PrestamosInertiaController.php:89
 * @route '/prestamos/proveedores'
 */
        proveedoresIndexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: proveedoresIndex.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    proveedoresIndex.form = proveedoresIndexForm
/**
* @see \App\Http\Controllers\PrestamosInertiaController::proveedoresCrear
 * @see app/Http/Controllers/PrestamosInertiaController.php:97
 * @route '/prestamos/proveedores/crear'
 */
export const proveedoresCrear = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: proveedoresCrear.url(options),
    method: 'get',
})

proveedoresCrear.definition = {
    methods: ["get","head"],
    url: '/prestamos/proveedores/crear',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PrestamosInertiaController::proveedoresCrear
 * @see app/Http/Controllers/PrestamosInertiaController.php:97
 * @route '/prestamos/proveedores/crear'
 */
proveedoresCrear.url = (options?: RouteQueryOptions) => {
    return proveedoresCrear.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamosInertiaController::proveedoresCrear
 * @see app/Http/Controllers/PrestamosInertiaController.php:97
 * @route '/prestamos/proveedores/crear'
 */
proveedoresCrear.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: proveedoresCrear.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PrestamosInertiaController::proveedoresCrear
 * @see app/Http/Controllers/PrestamosInertiaController.php:97
 * @route '/prestamos/proveedores/crear'
 */
proveedoresCrear.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: proveedoresCrear.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PrestamosInertiaController::proveedoresCrear
 * @see app/Http/Controllers/PrestamosInertiaController.php:97
 * @route '/prestamos/proveedores/crear'
 */
    const proveedoresCrearForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: proveedoresCrear.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PrestamosInertiaController::proveedoresCrear
 * @see app/Http/Controllers/PrestamosInertiaController.php:97
 * @route '/prestamos/proveedores/crear'
 */
        proveedoresCrearForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: proveedoresCrear.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PrestamosInertiaController::proveedoresCrear
 * @see app/Http/Controllers/PrestamosInertiaController.php:97
 * @route '/prestamos/proveedores/crear'
 */
        proveedoresCrearForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: proveedoresCrear.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    proveedoresCrear.form = proveedoresCrearForm
/**
* @see \App\Http\Controllers\PrestamosInertiaController::proveedoresStore
 * @see app/Http/Controllers/PrestamosInertiaController.php:113
 * @route '/prestamos/proveedores'
 */
export const proveedoresStore = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: proveedoresStore.url(options),
    method: 'post',
})

proveedoresStore.definition = {
    methods: ["post"],
    url: '/prestamos/proveedores',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PrestamosInertiaController::proveedoresStore
 * @see app/Http/Controllers/PrestamosInertiaController.php:113
 * @route '/prestamos/proveedores'
 */
proveedoresStore.url = (options?: RouteQueryOptions) => {
    return proveedoresStore.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PrestamosInertiaController::proveedoresStore
 * @see app/Http/Controllers/PrestamosInertiaController.php:113
 * @route '/prestamos/proveedores'
 */
proveedoresStore.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: proveedoresStore.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PrestamosInertiaController::proveedoresStore
 * @see app/Http/Controllers/PrestamosInertiaController.php:113
 * @route '/prestamos/proveedores'
 */
    const proveedoresStoreForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: proveedoresStore.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PrestamosInertiaController::proveedoresStore
 * @see app/Http/Controllers/PrestamosInertiaController.php:113
 * @route '/prestamos/proveedores'
 */
        proveedoresStoreForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: proveedoresStore.url(options),
            method: 'post',
        })
    
    proveedoresStore.form = proveedoresStoreForm
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
const PrestamosInertiaController = { index, prestables, stock, clientesIndex, clientesCrear, clientesStore, proveedoresIndex, proveedoresCrear, proveedoresStore, reportes }

export default PrestamosInertiaController