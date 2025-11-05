import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
 * @see routes/web.php:79
 * @route '/admin/image-backup'
 */
export const imageBackup = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imageBackup.url(options),
    method: 'get',
})

imageBackup.definition = {
    methods: ["get","head"],
    url: '/admin/image-backup',
} satisfies RouteDefinition<["get","head"]>

/**
 * @see routes/web.php:79
 * @route '/admin/image-backup'
 */
imageBackup.url = (options?: RouteQueryOptions) => {
    return imageBackup.definition.url + queryParams(options)
}

/**
 * @see routes/web.php:79
 * @route '/admin/image-backup'
 */
imageBackup.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imageBackup.url(options),
    method: 'get',
})
/**
 * @see routes/web.php:79
 * @route '/admin/image-backup'
 */
imageBackup.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imageBackup.url(options),
    method: 'head',
})

    /**
 * @see routes/web.php:79
 * @route '/admin/image-backup'
 */
    const imageBackupForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: imageBackup.url(options),
        method: 'get',
    })

            /**
 * @see routes/web.php:79
 * @route '/admin/image-backup'
 */
        imageBackupForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imageBackup.url(options),
            method: 'get',
        })
            /**
 * @see routes/web.php:79
 * @route '/admin/image-backup'
 */
        imageBackupForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imageBackup.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    imageBackup.form = imageBackupForm
const admin = {
    imageBackup,
}

export default admin