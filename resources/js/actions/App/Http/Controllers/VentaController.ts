import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\VentaController::ventasCliente
 * @see app/Http/Controllers/VentaController.php:0
 * @route '/api/app/cliente/ventas'
 */
export const ventasCliente = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ventasCliente.url(options),
    method: 'get',
})

ventasCliente.definition = {
    methods: ["get","head"],
    url: '/api/app/cliente/ventas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VentaController::ventasCliente
 * @see app/Http/Controllers/VentaController.php:0
 * @route '/api/app/cliente/ventas'
 */
ventasCliente.url = (options?: RouteQueryOptions) => {
    return ventasCliente.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::ventasCliente
 * @see app/Http/Controllers/VentaController.php:0
 * @route '/api/app/cliente/ventas'
 */
ventasCliente.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ventasCliente.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VentaController::ventasCliente
 * @see app/Http/Controllers/VentaController.php:0
 * @route '/api/app/cliente/ventas'
 */
ventasCliente.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ventasCliente.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\VentaController::registrarPago
 * @see app/Http/Controllers/VentaController.php:512
 * @route '/api/app/ventas/{venta}/pagos'
 */
export const registrarPago = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarPago.url(args, options),
    method: 'post',
})

registrarPago.definition = {
    methods: ["post"],
    url: '/api/app/ventas/{venta}/pagos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\VentaController::registrarPago
 * @see app/Http/Controllers/VentaController.php:512
 * @route '/api/app/ventas/{venta}/pagos'
 */
registrarPago.url = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: args.venta,
                }

    return registrarPago.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::registrarPago
 * @see app/Http/Controllers/VentaController.php:512
 * @route '/api/app/ventas/{venta}/pagos'
 */
registrarPago.post = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarPago.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\VentaController::index
 * @see app/Http/Controllers/VentaController.php:67
 * @route '/api/ventas'
 */
const index2095395a67e3a716b06f7426c7cb10aa = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index2095395a67e3a716b06f7426c7cb10aa.url(options),
    method: 'get',
})

index2095395a67e3a716b06f7426c7cb10aa.definition = {
    methods: ["get","head"],
    url: '/api/ventas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VentaController::index
 * @see app/Http/Controllers/VentaController.php:67
 * @route '/api/ventas'
 */
index2095395a67e3a716b06f7426c7cb10aa.url = (options?: RouteQueryOptions) => {
    return index2095395a67e3a716b06f7426c7cb10aa.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::index
 * @see app/Http/Controllers/VentaController.php:67
 * @route '/api/ventas'
 */
index2095395a67e3a716b06f7426c7cb10aa.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index2095395a67e3a716b06f7426c7cb10aa.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VentaController::index
 * @see app/Http/Controllers/VentaController.php:67
 * @route '/api/ventas'
 */
index2095395a67e3a716b06f7426c7cb10aa.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index2095395a67e3a716b06f7426c7cb10aa.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\VentaController::index
 * @see app/Http/Controllers/VentaController.php:67
 * @route '/ventas'
 */
const index62656055d2cbb9a98ec927b8a0af2335 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index62656055d2cbb9a98ec927b8a0af2335.url(options),
    method: 'get',
})

index62656055d2cbb9a98ec927b8a0af2335.definition = {
    methods: ["get","head"],
    url: '/ventas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VentaController::index
 * @see app/Http/Controllers/VentaController.php:67
 * @route '/ventas'
 */
index62656055d2cbb9a98ec927b8a0af2335.url = (options?: RouteQueryOptions) => {
    return index62656055d2cbb9a98ec927b8a0af2335.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::index
 * @see app/Http/Controllers/VentaController.php:67
 * @route '/ventas'
 */
index62656055d2cbb9a98ec927b8a0af2335.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index62656055d2cbb9a98ec927b8a0af2335.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VentaController::index
 * @see app/Http/Controllers/VentaController.php:67
 * @route '/ventas'
 */
index62656055d2cbb9a98ec927b8a0af2335.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index62656055d2cbb9a98ec927b8a0af2335.url(options),
    method: 'head',
})

export const index = {
    '/api/ventas': index2095395a67e3a716b06f7426c7cb10aa,
    '/ventas': index62656055d2cbb9a98ec927b8a0af2335,
}

/**
* @see \App\Http\Controllers\VentaController::store
 * @see app/Http/Controllers/VentaController.php:220
 * @route '/api/ventas'
 */
const store2095395a67e3a716b06f7426c7cb10aa = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store2095395a67e3a716b06f7426c7cb10aa.url(options),
    method: 'post',
})

store2095395a67e3a716b06f7426c7cb10aa.definition = {
    methods: ["post"],
    url: '/api/ventas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\VentaController::store
 * @see app/Http/Controllers/VentaController.php:220
 * @route '/api/ventas'
 */
store2095395a67e3a716b06f7426c7cb10aa.url = (options?: RouteQueryOptions) => {
    return store2095395a67e3a716b06f7426c7cb10aa.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::store
 * @see app/Http/Controllers/VentaController.php:220
 * @route '/api/ventas'
 */
store2095395a67e3a716b06f7426c7cb10aa.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store2095395a67e3a716b06f7426c7cb10aa.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\VentaController::store
 * @see app/Http/Controllers/VentaController.php:220
 * @route '/ventas'
 */
const store62656055d2cbb9a98ec927b8a0af2335 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store62656055d2cbb9a98ec927b8a0af2335.url(options),
    method: 'post',
})

store62656055d2cbb9a98ec927b8a0af2335.definition = {
    methods: ["post"],
    url: '/ventas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\VentaController::store
 * @see app/Http/Controllers/VentaController.php:220
 * @route '/ventas'
 */
store62656055d2cbb9a98ec927b8a0af2335.url = (options?: RouteQueryOptions) => {
    return store62656055d2cbb9a98ec927b8a0af2335.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::store
 * @see app/Http/Controllers/VentaController.php:220
 * @route '/ventas'
 */
store62656055d2cbb9a98ec927b8a0af2335.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store62656055d2cbb9a98ec927b8a0af2335.url(options),
    method: 'post',
})

export const store = {
    '/api/ventas': store2095395a67e3a716b06f7426c7cb10aa,
    '/ventas': store62656055d2cbb9a98ec927b8a0af2335,
}

/**
* @see \App\Http\Controllers\VentaController::show
 * @see app/Http/Controllers/VentaController.php:305
 * @route '/api/ventas/{venta}'
 */
const show8a5319b95720abf558e2089cc13e71ec = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show8a5319b95720abf558e2089cc13e71ec.url(args, options),
    method: 'get',
})

show8a5319b95720abf558e2089cc13e71ec.definition = {
    methods: ["get","head"],
    url: '/api/ventas/{venta}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VentaController::show
 * @see app/Http/Controllers/VentaController.php:305
 * @route '/api/ventas/{venta}'
 */
show8a5319b95720abf558e2089cc13e71ec.url = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: args.venta,
                }

    return show8a5319b95720abf558e2089cc13e71ec.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::show
 * @see app/Http/Controllers/VentaController.php:305
 * @route '/api/ventas/{venta}'
 */
show8a5319b95720abf558e2089cc13e71ec.get = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show8a5319b95720abf558e2089cc13e71ec.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VentaController::show
 * @see app/Http/Controllers/VentaController.php:305
 * @route '/api/ventas/{venta}'
 */
show8a5319b95720abf558e2089cc13e71ec.head = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show8a5319b95720abf558e2089cc13e71ec.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\VentaController::show
 * @see app/Http/Controllers/VentaController.php:305
 * @route '/ventas/{venta}'
 */
const show62967f9ad1b2d371e97b4ac4abfbeb93 = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show62967f9ad1b2d371e97b4ac4abfbeb93.url(args, options),
    method: 'get',
})

show62967f9ad1b2d371e97b4ac4abfbeb93.definition = {
    methods: ["get","head"],
    url: '/ventas/{venta}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VentaController::show
 * @see app/Http/Controllers/VentaController.php:305
 * @route '/ventas/{venta}'
 */
show62967f9ad1b2d371e97b4ac4abfbeb93.url = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: args.venta,
                }

    return show62967f9ad1b2d371e97b4ac4abfbeb93.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::show
 * @see app/Http/Controllers/VentaController.php:305
 * @route '/ventas/{venta}'
 */
show62967f9ad1b2d371e97b4ac4abfbeb93.get = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show62967f9ad1b2d371e97b4ac4abfbeb93.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VentaController::show
 * @see app/Http/Controllers/VentaController.php:305
 * @route '/ventas/{venta}'
 */
show62967f9ad1b2d371e97b4ac4abfbeb93.head = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show62967f9ad1b2d371e97b4ac4abfbeb93.url(args, options),
    method: 'head',
})

export const show = {
    '/api/ventas/{venta}': show8a5319b95720abf558e2089cc13e71ec,
    '/ventas/{venta}': show62967f9ad1b2d371e97b4ac4abfbeb93,
}

/**
* @see \App\Http\Controllers\VentaController::update
 * @see app/Http/Controllers/VentaController.php:361
 * @route '/api/ventas/{venta}'
 */
const update8a5319b95720abf558e2089cc13e71ec = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update8a5319b95720abf558e2089cc13e71ec.url(args, options),
    method: 'put',
})

update8a5319b95720abf558e2089cc13e71ec.definition = {
    methods: ["put","patch"],
    url: '/api/ventas/{venta}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\VentaController::update
 * @see app/Http/Controllers/VentaController.php:361
 * @route '/api/ventas/{venta}'
 */
update8a5319b95720abf558e2089cc13e71ec.url = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: args.venta,
                }

    return update8a5319b95720abf558e2089cc13e71ec.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::update
 * @see app/Http/Controllers/VentaController.php:361
 * @route '/api/ventas/{venta}'
 */
update8a5319b95720abf558e2089cc13e71ec.put = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update8a5319b95720abf558e2089cc13e71ec.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\VentaController::update
 * @see app/Http/Controllers/VentaController.php:361
 * @route '/api/ventas/{venta}'
 */
update8a5319b95720abf558e2089cc13e71ec.patch = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update8a5319b95720abf558e2089cc13e71ec.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\VentaController::update
 * @see app/Http/Controllers/VentaController.php:361
 * @route '/ventas/{venta}'
 */
const update62967f9ad1b2d371e97b4ac4abfbeb93 = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update62967f9ad1b2d371e97b4ac4abfbeb93.url(args, options),
    method: 'put',
})

update62967f9ad1b2d371e97b4ac4abfbeb93.definition = {
    methods: ["put","patch"],
    url: '/ventas/{venta}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\VentaController::update
 * @see app/Http/Controllers/VentaController.php:361
 * @route '/ventas/{venta}'
 */
update62967f9ad1b2d371e97b4ac4abfbeb93.url = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: args.venta,
                }

    return update62967f9ad1b2d371e97b4ac4abfbeb93.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::update
 * @see app/Http/Controllers/VentaController.php:361
 * @route '/ventas/{venta}'
 */
update62967f9ad1b2d371e97b4ac4abfbeb93.put = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update62967f9ad1b2d371e97b4ac4abfbeb93.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\VentaController::update
 * @see app/Http/Controllers/VentaController.php:361
 * @route '/ventas/{venta}'
 */
update62967f9ad1b2d371e97b4ac4abfbeb93.patch = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update62967f9ad1b2d371e97b4ac4abfbeb93.url(args, options),
    method: 'patch',
})

export const update = {
    '/api/ventas/{venta}': update8a5319b95720abf558e2089cc13e71ec,
    '/ventas/{venta}': update62967f9ad1b2d371e97b4ac4abfbeb93,
}

/**
* @see \App\Http\Controllers\VentaController::destroy
 * @see app/Http/Controllers/VentaController.php:394
 * @route '/api/ventas/{venta}'
 */
const destroy8a5319b95720abf558e2089cc13e71ec = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy8a5319b95720abf558e2089cc13e71ec.url(args, options),
    method: 'delete',
})

destroy8a5319b95720abf558e2089cc13e71ec.definition = {
    methods: ["delete"],
    url: '/api/ventas/{venta}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\VentaController::destroy
 * @see app/Http/Controllers/VentaController.php:394
 * @route '/api/ventas/{venta}'
 */
destroy8a5319b95720abf558e2089cc13e71ec.url = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: args.venta,
                }

    return destroy8a5319b95720abf558e2089cc13e71ec.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::destroy
 * @see app/Http/Controllers/VentaController.php:394
 * @route '/api/ventas/{venta}'
 */
destroy8a5319b95720abf558e2089cc13e71ec.delete = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy8a5319b95720abf558e2089cc13e71ec.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\VentaController::destroy
 * @see app/Http/Controllers/VentaController.php:394
 * @route '/ventas/{venta}'
 */
const destroy62967f9ad1b2d371e97b4ac4abfbeb93 = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy62967f9ad1b2d371e97b4ac4abfbeb93.url(args, options),
    method: 'delete',
})

destroy62967f9ad1b2d371e97b4ac4abfbeb93.definition = {
    methods: ["delete"],
    url: '/ventas/{venta}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\VentaController::destroy
 * @see app/Http/Controllers/VentaController.php:394
 * @route '/ventas/{venta}'
 */
destroy62967f9ad1b2d371e97b4ac4abfbeb93.url = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: args.venta,
                }

    return destroy62967f9ad1b2d371e97b4ac4abfbeb93.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::destroy
 * @see app/Http/Controllers/VentaController.php:394
 * @route '/ventas/{venta}'
 */
destroy62967f9ad1b2d371e97b4ac4abfbeb93.delete = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy62967f9ad1b2d371e97b4ac4abfbeb93.url(args, options),
    method: 'delete',
})

export const destroy = {
    '/api/ventas/{venta}': destroy8a5319b95720abf558e2089cc13e71ec,
    '/ventas/{venta}': destroy62967f9ad1b2d371e97b4ac4abfbeb93,
}

/**
* @see \App\Http\Controllers\VentaController::verificarStock
 * @see app/Http/Controllers/VentaController.php:612
 * @route '/api/ventas/verificar-stock'
 */
const verificarStock7a87796bd2849517a48df1ab60ff5975 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verificarStock7a87796bd2849517a48df1ab60ff5975.url(options),
    method: 'post',
})

verificarStock7a87796bd2849517a48df1ab60ff5975.definition = {
    methods: ["post"],
    url: '/api/ventas/verificar-stock',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\VentaController::verificarStock
 * @see app/Http/Controllers/VentaController.php:612
 * @route '/api/ventas/verificar-stock'
 */
verificarStock7a87796bd2849517a48df1ab60ff5975.url = (options?: RouteQueryOptions) => {
    return verificarStock7a87796bd2849517a48df1ab60ff5975.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::verificarStock
 * @see app/Http/Controllers/VentaController.php:612
 * @route '/api/ventas/verificar-stock'
 */
verificarStock7a87796bd2849517a48df1ab60ff5975.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verificarStock7a87796bd2849517a48df1ab60ff5975.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\VentaController::verificarStock
 * @see app/Http/Controllers/VentaController.php:612
 * @route '/ventas/stock/verificar'
 */
const verificarStockfd91eea2fd95a6c7de6a2ce0b83e27d1 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verificarStockfd91eea2fd95a6c7de6a2ce0b83e27d1.url(options),
    method: 'post',
})

verificarStockfd91eea2fd95a6c7de6a2ce0b83e27d1.definition = {
    methods: ["post"],
    url: '/ventas/stock/verificar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\VentaController::verificarStock
 * @see app/Http/Controllers/VentaController.php:612
 * @route '/ventas/stock/verificar'
 */
verificarStockfd91eea2fd95a6c7de6a2ce0b83e27d1.url = (options?: RouteQueryOptions) => {
    return verificarStockfd91eea2fd95a6c7de6a2ce0b83e27d1.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::verificarStock
 * @see app/Http/Controllers/VentaController.php:612
 * @route '/ventas/stock/verificar'
 */
verificarStockfd91eea2fd95a6c7de6a2ce0b83e27d1.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verificarStockfd91eea2fd95a6c7de6a2ce0b83e27d1.url(options),
    method: 'post',
})

export const verificarStock = {
    '/api/ventas/verificar-stock': verificarStock7a87796bd2849517a48df1ab60ff5975,
    '/ventas/stock/verificar': verificarStockfd91eea2fd95a6c7de6a2ce0b83e27d1,
}

/**
* @see \App\Http\Controllers\VentaController::obtenerStockProducto
 * @see app/Http/Controllers/VentaController.php:575
 * @route '/api/ventas/{producto}/stock'
 */
const obtenerStockProductof871834c3677537f452fd093d4e5e38d = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerStockProductof871834c3677537f452fd093d4e5e38d.url(args, options),
    method: 'get',
})

obtenerStockProductof871834c3677537f452fd093d4e5e38d.definition = {
    methods: ["get","head"],
    url: '/api/ventas/{producto}/stock',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VentaController::obtenerStockProducto
 * @see app/Http/Controllers/VentaController.php:575
 * @route '/api/ventas/{producto}/stock'
 */
obtenerStockProductof871834c3677537f452fd093d4e5e38d.url = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return obtenerStockProductof871834c3677537f452fd093d4e5e38d.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::obtenerStockProducto
 * @see app/Http/Controllers/VentaController.php:575
 * @route '/api/ventas/{producto}/stock'
 */
obtenerStockProductof871834c3677537f452fd093d4e5e38d.get = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerStockProductof871834c3677537f452fd093d4e5e38d.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VentaController::obtenerStockProducto
 * @see app/Http/Controllers/VentaController.php:575
 * @route '/api/ventas/{producto}/stock'
 */
obtenerStockProductof871834c3677537f452fd093d4e5e38d.head = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerStockProductof871834c3677537f452fd093d4e5e38d.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\VentaController::obtenerStockProducto
 * @see app/Http/Controllers/VentaController.php:575
 * @route '/ventas/stock/producto/{producto}'
 */
const obtenerStockProductoa80d4f4a6788a762379a84a99ab2f35a = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerStockProductoa80d4f4a6788a762379a84a99ab2f35a.url(args, options),
    method: 'get',
})

obtenerStockProductoa80d4f4a6788a762379a84a99ab2f35a.definition = {
    methods: ["get","head"],
    url: '/ventas/stock/producto/{producto}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VentaController::obtenerStockProducto
 * @see app/Http/Controllers/VentaController.php:575
 * @route '/ventas/stock/producto/{producto}'
 */
obtenerStockProductoa80d4f4a6788a762379a84a99ab2f35a.url = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return obtenerStockProductoa80d4f4a6788a762379a84a99ab2f35a.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::obtenerStockProducto
 * @see app/Http/Controllers/VentaController.php:575
 * @route '/ventas/stock/producto/{producto}'
 */
obtenerStockProductoa80d4f4a6788a762379a84a99ab2f35a.get = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerStockProductoa80d4f4a6788a762379a84a99ab2f35a.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VentaController::obtenerStockProducto
 * @see app/Http/Controllers/VentaController.php:575
 * @route '/ventas/stock/producto/{producto}'
 */
obtenerStockProductoa80d4f4a6788a762379a84a99ab2f35a.head = (args: { producto: number | { id: number } } | [producto: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerStockProductoa80d4f4a6788a762379a84a99ab2f35a.url(args, options),
    method: 'head',
})

export const obtenerStockProducto = {
    '/api/ventas/{producto}/stock': obtenerStockProductof871834c3677537f452fd093d4e5e38d,
    '/ventas/stock/producto/{producto}': obtenerStockProductoa80d4f4a6788a762379a84a99ab2f35a,
}

/**
* @see \App\Http\Controllers\VentaController::productosStockBajo
 * @see app/Http/Controllers/VentaController.php:542
 * @route '/api/ventas/productos/stock-bajo'
 */
const productosStockBajo51b656bf5a19adf08db710b26069883b = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosStockBajo51b656bf5a19adf08db710b26069883b.url(options),
    method: 'get',
})

productosStockBajo51b656bf5a19adf08db710b26069883b.definition = {
    methods: ["get","head"],
    url: '/api/ventas/productos/stock-bajo',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VentaController::productosStockBajo
 * @see app/Http/Controllers/VentaController.php:542
 * @route '/api/ventas/productos/stock-bajo'
 */
productosStockBajo51b656bf5a19adf08db710b26069883b.url = (options?: RouteQueryOptions) => {
    return productosStockBajo51b656bf5a19adf08db710b26069883b.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::productosStockBajo
 * @see app/Http/Controllers/VentaController.php:542
 * @route '/api/ventas/productos/stock-bajo'
 */
productosStockBajo51b656bf5a19adf08db710b26069883b.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosStockBajo51b656bf5a19adf08db710b26069883b.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VentaController::productosStockBajo
 * @see app/Http/Controllers/VentaController.php:542
 * @route '/api/ventas/productos/stock-bajo'
 */
productosStockBajo51b656bf5a19adf08db710b26069883b.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: productosStockBajo51b656bf5a19adf08db710b26069883b.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\VentaController::productosStockBajo
 * @see app/Http/Controllers/VentaController.php:542
 * @route '/ventas/stock/bajo'
 */
const productosStockBajoce5d9a17272226541db9102efbe90f0f = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosStockBajoce5d9a17272226541db9102efbe90f0f.url(options),
    method: 'get',
})

productosStockBajoce5d9a17272226541db9102efbe90f0f.definition = {
    methods: ["get","head"],
    url: '/ventas/stock/bajo',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VentaController::productosStockBajo
 * @see app/Http/Controllers/VentaController.php:542
 * @route '/ventas/stock/bajo'
 */
productosStockBajoce5d9a17272226541db9102efbe90f0f.url = (options?: RouteQueryOptions) => {
    return productosStockBajoce5d9a17272226541db9102efbe90f0f.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::productosStockBajo
 * @see app/Http/Controllers/VentaController.php:542
 * @route '/ventas/stock/bajo'
 */
productosStockBajoce5d9a17272226541db9102efbe90f0f.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosStockBajoce5d9a17272226541db9102efbe90f0f.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VentaController::productosStockBajo
 * @see app/Http/Controllers/VentaController.php:542
 * @route '/ventas/stock/bajo'
 */
productosStockBajoce5d9a17272226541db9102efbe90f0f.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: productosStockBajoce5d9a17272226541db9102efbe90f0f.url(options),
    method: 'head',
})

export const productosStockBajo = {
    '/api/ventas/productos/stock-bajo': productosStockBajo51b656bf5a19adf08db710b26069883b,
    '/ventas/stock/bajo': productosStockBajoce5d9a17272226541db9102efbe90f0f,
}

/**
* @see \App\Http\Controllers\VentaController::obtenerResumenStock
 * @see app/Http/Controllers/VentaController.php:0
 * @route '/api/ventas/{venta}/resumen-stock'
 */
const obtenerResumenStock0916b55df9ab499401caedde44c06420 = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerResumenStock0916b55df9ab499401caedde44c06420.url(args, options),
    method: 'get',
})

obtenerResumenStock0916b55df9ab499401caedde44c06420.definition = {
    methods: ["get","head"],
    url: '/api/ventas/{venta}/resumen-stock',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VentaController::obtenerResumenStock
 * @see app/Http/Controllers/VentaController.php:0
 * @route '/api/ventas/{venta}/resumen-stock'
 */
obtenerResumenStock0916b55df9ab499401caedde44c06420.url = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: args.venta,
                }

    return obtenerResumenStock0916b55df9ab499401caedde44c06420.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::obtenerResumenStock
 * @see app/Http/Controllers/VentaController.php:0
 * @route '/api/ventas/{venta}/resumen-stock'
 */
obtenerResumenStock0916b55df9ab499401caedde44c06420.get = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerResumenStock0916b55df9ab499401caedde44c06420.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VentaController::obtenerResumenStock
 * @see app/Http/Controllers/VentaController.php:0
 * @route '/api/ventas/{venta}/resumen-stock'
 */
obtenerResumenStock0916b55df9ab499401caedde44c06420.head = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerResumenStock0916b55df9ab499401caedde44c06420.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\VentaController::obtenerResumenStock
 * @see app/Http/Controllers/VentaController.php:0
 * @route '/ventas/{venta}/stock/resumen'
 */
const obtenerResumenStock14e4faae2d52d40c4c7233a664660927 = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerResumenStock14e4faae2d52d40c4c7233a664660927.url(args, options),
    method: 'get',
})

obtenerResumenStock14e4faae2d52d40c4c7233a664660927.definition = {
    methods: ["get","head"],
    url: '/ventas/{venta}/stock/resumen',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VentaController::obtenerResumenStock
 * @see app/Http/Controllers/VentaController.php:0
 * @route '/ventas/{venta}/stock/resumen'
 */
obtenerResumenStock14e4faae2d52d40c4c7233a664660927.url = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: args.venta,
                }

    return obtenerResumenStock14e4faae2d52d40c4c7233a664660927.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::obtenerResumenStock
 * @see app/Http/Controllers/VentaController.php:0
 * @route '/ventas/{venta}/stock/resumen'
 */
obtenerResumenStock14e4faae2d52d40c4c7233a664660927.get = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: obtenerResumenStock14e4faae2d52d40c4c7233a664660927.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VentaController::obtenerResumenStock
 * @see app/Http/Controllers/VentaController.php:0
 * @route '/ventas/{venta}/stock/resumen'
 */
obtenerResumenStock14e4faae2d52d40c4c7233a664660927.head = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: obtenerResumenStock14e4faae2d52d40c4c7233a664660927.url(args, options),
    method: 'head',
})

export const obtenerResumenStock = {
    '/api/ventas/{venta}/resumen-stock': obtenerResumenStock0916b55df9ab499401caedde44c06420,
    '/ventas/{venta}/stock/resumen': obtenerResumenStock14e4faae2d52d40c4c7233a664660927,
}

/**
* @see \App\Http\Controllers\VentaController::anular
 * @see app/Http/Controllers/VentaController.php:414
 * @route '/api/ventas/{venta}/anular'
 */
export const anular = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: anular.url(args, options),
    method: 'post',
})

anular.definition = {
    methods: ["post"],
    url: '/api/ventas/{venta}/anular',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\VentaController::anular
 * @see app/Http/Controllers/VentaController.php:414
 * @route '/api/ventas/{venta}/anular'
 */
anular.url = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: args.venta,
                }

    return anular.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::anular
 * @see app/Http/Controllers/VentaController.php:414
 * @route '/api/ventas/{venta}/anular'
 */
anular.post = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: anular.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\VentaController::create
 * @see app/Http/Controllers/VentaController.php:192
 * @route '/ventas/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/ventas/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VentaController::create
 * @see app/Http/Controllers/VentaController.php:192
 * @route '/ventas/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::create
 * @see app/Http/Controllers/VentaController.php:192
 * @route '/ventas/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VentaController::create
 * @see app/Http/Controllers/VentaController.php:192
 * @route '/ventas/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\VentaController::edit
 * @see app/Http/Controllers/VentaController.php:333
 * @route '/ventas/{venta}/edit'
 */
export const edit = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/ventas/{venta}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VentaController::edit
 * @see app/Http/Controllers/VentaController.php:333
 * @route '/ventas/{venta}/edit'
 */
edit.url = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: args.venta,
                }

    return edit.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::edit
 * @see app/Http/Controllers/VentaController.php:333
 * @route '/ventas/{venta}/edit'
 */
edit.get = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VentaController::edit
 * @see app/Http/Controllers/VentaController.php:333
 * @route '/ventas/{venta}/edit'
 */
edit.head = (args: { venta: string | number } | [venta: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\VentaController::formatosDisponibles
 * @see app/Http/Controllers/VentaController.php:729
 * @route '/ventas/formatos-disponibles'
 */
export const formatosDisponibles = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: formatosDisponibles.url(options),
    method: 'get',
})

formatosDisponibles.definition = {
    methods: ["get","head"],
    url: '/ventas/formatos-disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VentaController::formatosDisponibles
 * @see app/Http/Controllers/VentaController.php:729
 * @route '/ventas/formatos-disponibles'
 */
formatosDisponibles.url = (options?: RouteQueryOptions) => {
    return formatosDisponibles.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::formatosDisponibles
 * @see app/Http/Controllers/VentaController.php:729
 * @route '/ventas/formatos-disponibles'
 */
formatosDisponibles.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: formatosDisponibles.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VentaController::formatosDisponibles
 * @see app/Http/Controllers/VentaController.php:729
 * @route '/ventas/formatos-disponibles'
 */
formatosDisponibles.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: formatosDisponibles.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\VentaController::imprimir
 * @see app/Http/Controllers/VentaController.php:662
 * @route '/ventas/{venta}/imprimir'
 */
export const imprimir = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir.url(args, options),
    method: 'get',
})

imprimir.definition = {
    methods: ["get","head"],
    url: '/ventas/{venta}/imprimir',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VentaController::imprimir
 * @see app/Http/Controllers/VentaController.php:662
 * @route '/ventas/{venta}/imprimir'
 */
imprimir.url = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { venta: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: typeof args.venta === 'object'
                ? args.venta.id
                : args.venta,
                }

    return imprimir.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::imprimir
 * @see app/Http/Controllers/VentaController.php:662
 * @route '/ventas/{venta}/imprimir'
 */
imprimir.get = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VentaController::imprimir
 * @see app/Http/Controllers/VentaController.php:662
 * @route '/ventas/{venta}/imprimir'
 */
imprimir.head = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imprimir.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\VentaController::preview
 * @see app/Http/Controllers/VentaController.php:687
 * @route '/ventas/{venta}/preview'
 */
export const preview = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: preview.url(args, options),
    method: 'get',
})

preview.definition = {
    methods: ["get","head"],
    url: '/ventas/{venta}/preview',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VentaController::preview
 * @see app/Http/Controllers/VentaController.php:687
 * @route '/ventas/{venta}/preview'
 */
preview.url = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { venta: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: typeof args.venta === 'object'
                ? args.venta.id
                : args.venta,
                }

    return preview.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VentaController::preview
 * @see app/Http/Controllers/VentaController.php:687
 * @route '/ventas/{venta}/preview'
 */
preview.get = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: preview.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VentaController::preview
 * @see app/Http/Controllers/VentaController.php:687
 * @route '/ventas/{venta}/preview'
 */
preview.head = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: preview.url(args, options),
    method: 'head',
})
const VentaController = { ventasCliente, registrarPago, index, store, show, update, destroy, verificarStock, obtenerStockProducto, productosStockBajo, obtenerResumenStock, anular, create, edit, formatosDisponibles, imprimir, preview }

export default VentaController