import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see [serialized-closure]:2
* @route '/test-csrf'
*/
export const csrf = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: csrf.url(options),
    method: 'post',
})

csrf.definition = {
    methods: ["post"],
    url: '/test-csrf',
} satisfies RouteDefinition<["post"]>

/**
* @see [serialized-closure]:2
* @route '/test-csrf'
*/
csrf.url = (options?: RouteQueryOptions) => {
    return csrf.definition.url + queryParams(options)
}

/**
* @see [serialized-closure]:2
* @route '/test-csrf'
*/
csrf.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: csrf.url(options),
    method: 'post',
})

/**
* @see [serialized-closure]:2
* @route '/test-csrf'
*/
const csrfForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: csrf.url(options),
    method: 'post',
})

/**
* @see [serialized-closure]:2
* @route '/test-csrf'
*/
csrfForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: csrf.url(options),
    method: 'post',
})

csrf.form = csrfForm

const test = {
    csrf,
}

export default test