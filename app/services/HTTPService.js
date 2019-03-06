import axios from 'axios'

const HTTPService = {

    /**
     * @param method
     * @param ApiName
     * @param config
     * @returns {Promise}
     */

    action: (method, APIaddress, config) => {
        return new Promise((resolve, reject) => {
            fetchApi(method, APIaddress, config)
                .then(response => resolve(response))
                .catch(error => reject(error))
        })
    }
}

/**
 *
 * @param method
 * @param APIaddress
 * @param config
 * @returns {Promise}
 */
const fetchApi = (method, APIaddress, config = {}) => {

    console.log("fetchApi config ", config)

    return new Promise((resolve, reject) => {
        const queryString = toQuery(config.query)
        const path = config.path ? `/${config.path}` : ''
        const configFinal = {
            method: method.toLowerCase(),
            url: APIaddress + path + queryString,
            data: config.data,
            headers: config.headers,
            withCredentials: true
        }

        console.log('Final Config: ', configFinal)

        axios(configFinal).then(response => {
            console.log('~~~~~~~~~API RESPONSE: ')
            resolve(response)
        }).catch(error => {

            console.log('~~~~~~~~~~~API ERROR: ', error)
            if (error.response) {
                reject(error.response.data)
            } else {
                reject(error)
            }
        })
    })

}

/**
 * Turns a query string object into a string
 * @param queryStringObj
 * @returns {string}
 */
let toQuery = (queryStrObj) => {
    let queryStr = ''
    const AMP = '&'
    const Q = '?'
    const EMPTY = ''

    if (!queryStrObj) return EMPTY
    const isMultiple = Object.keys(queryStrObj).length > 1

    for (const key in queryStrObj) {
        if (!isMultiple)
            return `${Q}${key}=${queryStrObj[key]}`
        queryStr += `${key}=${queryStrObj[key]}${AMP}`
    }

    return `${Q}${queryStr.replace(/&$/, EMPTY)}`
}

export default HTTPService
