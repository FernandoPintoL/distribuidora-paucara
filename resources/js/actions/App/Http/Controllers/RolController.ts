import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\RolController::crearFuncionalidad
 * @see app/Http/Controllers/RolController.php:189
 * @route '/roles/{role}/crear-funcionalidad'
 */
export const crearFuncionalidad = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearFuncionalidad.url(args, options),
    method: 'post',
})

crearFuncionalidad.definition = {
    methods: ["post"],
    url: '/roles/{role}/crear-funcionalidad',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RolController::crearFuncionalidad
 * @see app/Http/Controllers/RolController.php:189
 * @route '/roles/{role}/crear-funcionalidad'
 */
crearFuncionalidad.url = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { role: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { role: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    role: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        role: typeof args.role === 'object'
                ? args.role.id
                : args.role,
                }

    return crearFuncionalidad.definition.url
            .replace('{role}', parsedArgs.role.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RolController::crearFuncionalidad
 * @see app/Http/Controllers/RolController.php:189
 * @route '/roles/{role}/crear-funcionalidad'
 */
crearFuncionalidad.post = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearFuncionalidad.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\RolController::crearFuncionalidad
 * @see app/Http/Controllers/RolController.php:189
 * @route '/roles/{role}/crear-funcionalidad'
 */
    const crearFuncionalidadForm = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: crearFuncionalidad.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\RolController::crearFuncionalidad
 * @see app/Http/Controllers/RolController.php:189
 * @route '/roles/{role}/crear-funcionalidad'
 */
        crearFuncionalidadForm.post = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: crearFuncionalidad.url(args, options),
            method: 'post',
        })
    
    crearFuncionalidad.form = crearFuncionalidadForm
const RolController = { crearFuncionalidad }

export default RolController