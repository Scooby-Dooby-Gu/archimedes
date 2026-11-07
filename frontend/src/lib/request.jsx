import URLSearchParams from 'url-search-params';

import qs from 'qs';
const { stringify  }  = qs;

// produce object that is used instead real data while it's being loaded
// it is supposed to answer to all possible properties

Placeholder.emptyImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAEsCAQAAAC1NAUdAAAC70lEQVR42u3UQREAAAzCsOHf9HTAJRL6aA6gRCQADAvAsADDAjAsAMMCDAvAsAAMCzAsAMMCMCzAsAAMC8CwAMMCMCwAwwIMC8CwAAwLMCwAwwIwLMCwAAwLwLAAwwIwLMCwAAwLwLAAwwIwLADDAgwLwLAADAswLADDAjAswLAADAvAsADDAjAsAMMCDAvAsAAMCzAsAMMCMCzAsAAMC8CwAMMCMCzAsAAMC8CwAMMCMCwAwwIMC8CwAAwLMCwAwwIwLMCwAAwLwLAAwwIwLADDAgwLwLAADAswLADDAjAswLAADAvAsADDAjAswLAADAvAsADDAjAsAMMCDAvAsAAMCzAsAMMCMCzAsAAMC8CwAMMCMCwAwwIMC8CwAAwLMCwAwwIwLMCwAAwLwLAAwwIwLMCwAAwLwLAAwwIwLADDAgwLwLAADAswLADDAjAswLAADAvAsADDAjAsAMMCDAvAsAAMCzAsAMMCMCzAsAAMC8CwAMMCMCzAsAAMC8CwAMMCMCwAwwIMC8CwAAwLMCwAwwIwLMCwAAwLwLAAwwIwLADDAgwLwLAADAswLADDAjAswLAADAvAsADDAjAswLAADAvAsADDAjAsAMMCDAvAsAAMCzAsAMMCMCzAsAAMC8CwAMMCMCwAwwIMC8CwAAwLMCwAwwIwLMCwAAwLwLAAwwIwLMCwAAwLwLAAwwIwLADDAgwLwLAADAswLADDAjAswLAADAvAsADDAjAsAMMCDAvAsAAMCzAsAMMCMCzAsAAMC8CwAMMCMCzAsAAMC8CwAMMCMCwAwwIMC8CwAAwLMCwAwwIwLMCwAAwLwLAAwwIwLADDAgwLwLAADAswLADDAjAswLAADAswLAkAwwIwLMCwAAwLwLAAwwIwLADDAgwLwLAADAswLADDAjAswLAADAvAsADDAjAsAMMCDAvAsAAMCzAsAMMCMCzAsAAMCzAsAMMCMCzAsAAMC8CwAMMCMCwAwwIMC8CwAAwLWPYZOQEtHpE9vwAAAABJRU5ErkJggg==';
export function Placeholder (origin = {}) {

  return new Proxy(origin, {
    get: (target, property, reciever) => {
      var result;
      if (origin[property] !== undefined) {
        result = origin[property];

        if ((origin.hasOwnProperty(property) || origin instanceof String || origin instanceof Number) && (result == null || result.isPlaceholder || typeof result !== 'object' || Array.isArray(result) || result instanceof Date)) {
          return result;
        }
      }

      if (property === Symbol.toStringTag || property === 'toString') {
        return () => '[placeholder]'
      }

      if (property === Symbol.toPrimitive) {
        return () => target instanceof String || target instanceof Number ? target.valueOf() : ''
      }
      if (property.indexOf('Sizes') > -1) {
        return null;
      } else if (property === 'map') {
        result = (fn) => [fn(Placeholder.nested(property), 0), fn(Placeholder.nested(property), 1), fn(Placeholder.nested(property), 2)]
      } else if (property === 'find') {
        var found = Placeholder.nested(property);
        result = () => found;
      } else if (property === 'reduce') {
        result = (fn, acc) => acc;
      } else if (property === 'slice') {
        result = () => Placeholder.nested(property);
      } else if (property === 'sort') {
        result = () => target;
      } else if (property === 'filter') {
        var filtered = [Placeholder.nested(property)];
        result = () => filtered
      } else if (property === 'some') {
        result = () => false
      } else if (property === 'includes') {
        result = () => false
      } else if (property === 'id') {
        result = new String('█████████')
      } else if (property === 'length') {
        if (property == 'experts')
          result = 1;
        else
          result = 3;
      } else if (typeof property == 'string' && property.charAt(property.length - 1) === 's' && !property.match(/us$/i)) {
        result = Object.assign([Placeholder.nested(property), Placeholder.nested(property), Placeholder.nested(property)], {isPlaceholder: true})
      } else if (property === 'color') {
        result = 'blue';
      } else if (property.indexOf('Count') > -1 || property === 'score' || property === 'duration') {
        result = Placeholder.nested(property, new Number(Math.floor(Math.random() * 3)))
      } else if (property === 'score') {
        result = 10000;
      } else if (property === 'age' || property === 'turn') {
        result = 18;
      } else if (property.indexOf('At') > -1) {
        result = new Date;
      } else if (property === 'icon') {
        result = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
      } else if (property === 'cover') {
        return null;
      } else if (/**/property === 'image') {
        result = Placeholder.emptyImage;
        //return null;
      } else if (property === 'isPlaceholder') {
        return true;
      } else if (property === 'avatar') {
        result = "/assets/sample/avatar.png"
      } else  {
        result = Placeholder.nested(property, undefined, origin[property]);
      }
      return result;
    }
  });
}
Placeholder.nested = (property, result = new String('█████████'), base) => 
  Placeholder(Object.assign(result, { __property: property}, base))

export function processOptions(url, options = {}) {
  var {method = 'get', data, headers, ...rest} = options;
  if (['post', 'put', 'patch'].includes(method)) {
    if (headers && headers['Content-Type'] && headers['Content-Type'].includes('multipart')) {
      // let browser do the work to produce Boundary
      headers = {...headers};
      delete headers['Content-Type'];
      var body = data;
    } else if (headers && headers['Content-Type'] && headers['Content-Type'].includes('/json')) {
      var body = JSON.stringify(data)
    } else {
      if (data && data.isPlaceholder) {
        throw new Error('Trying to serialize placeholder data')
      }
      var body = data && data instanceof FormData ? new URLSearchParams(data) : stringify(data);
      headers = {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      }
    }
  } else if (data) {
    url = url.split('?')[0] + '?' + new URLSearchParams(data);
  }
  if ((url.includes(import.meta.env.API_URL) || url.indexOf('//') == -1) && method !== 'get') {
    url += (url.includes('?') ? '&' : '?') + '_method=' + method;
    method = 'post'
  }

  const newOptions = {
    ...rest,
    method,
    headers: {
      'Accept': 'application/json',
      ...headers
    }
  };
  if (body != null) {
    newOptions.body = body;
  }

  return [ url, newOptions ] 
}

window.Placeholder = Placeholder;

const concurrent = {};
export function fetchFromAPI (url, options, label) {
  const oldUrl = url;
  var [url, options] = processOptions(url, options);

  // absolutize url if necessary (relative links are considered API urls)
  if (!url.includes('//')) {
    url = import.meta.env.API_URL + url;
  }

  // add api_key as get param to avoid OPTIONS request
  const user = localStorage.user && JSON.parse(localStorage.user);
  if (user && !url.includes('api_key=')) {
    url += (url.includes('?') ? '&' : '?') + 'api_key=' + user.apiKey
  }

  //notify that request is made via wrapper app
  if (localStorage.wrapper) {
    url += (url.includes('?') ? '&' : '?') + 'wrapper=' + localStorage.wrapper
  }

  // append transaction_id generated for sentry tracking
  //if (window.transactionId) {
  //  url += (url.includes('?') ? '&' : '?') + 'transaction_id=' + window.transactionId
  //}
  const method = options && options.method && options.method.toLowerCase() || 'get';;
  // append transaction_id generated for sentry tracking
  if (url.includes(import.meta.env.API_URL) && method !== 'post' && method !== 'get') {
     url += (url.includes('?') ? '&' : '?') + '_method=' + method
     options.method = 'post';
  }

  if (url.includes('█')) {
    throw new Error('fetching url with placeholder ' + url)
  }

  if (method === 'get' && concurrent[url]) {
    concurrent[url].shared = true;
    console.log(...console.row('rgb(171, 171, 171)', method, oldUrl, window.currentComponent, console.labelObject(options, 'Options')))
    return concurrent[url]
  } else {
    console.log(...console.row('rgb(57, 73, 171)', method, oldUrl, window.currentComponent, console.labelObject(options, 'Options')))
    
    const promise = fetch(url, options) 
    if (method === 'get') {
      concurrent[url] = promise
      
      promise.then((result) => {
        concurrent[url] = null;
      }).catch((err) => {
        concurrent[url] = null;
      });
    }

    return promise
  }
}

window.fetchFromAPI = fetchFromAPI;


export async function fetchFromAPIWithResponse(url, options, cacheCallback) {
  if (cacheCallback && (!options || options.method == 'get')) {
    const cached = getCachedData(url);
    if (cached) cacheCallback({data: cached});
  }
  var response = await fetchFromAPI(url, options);
  var responseObject = await getResponseValues(response)
  throwHTTPError(responseObject)
  if (!options || options.method == 'get')
    setCachedData(url, responseObject.data);
  
  return responseObject;
}

window.fetchFromAPIWithResponse = fetchFromAPIWithResponse;

export function getCleanURL(url) {
  return  url && url.replace('?page=1', '');
}

export function setCachedData(url, data) {
  localStorage['cache:' + url] = JSON.stringify(data);
}

export function getCachedData(url) {
  const cleanUrl = getCleanURL(url);
  
  const precached = window.precacheStorage && (window.precacheStorage[url] || window.precacheStorage[cleanUrl]);

  return cleanUrl && 

    // pick up loaded cache
    ((localStorage['cache:' + url] && JSON.parse(localStorage['cache:' + url])) 
    || ((localStorage['cache:' + cleanUrl] && JSON.parse(localStorage['cache:' + cleanUrl]))) 

    // pick up precache provided by previous page
    || precached && Placeholder(precached))

}


export const REQUEST_LOADING = { phase: 'loading', loading: true,  success: false, error: false,  finished: false }
export const REQUEST_SUCCESS = { phase: 'success', loading: false, success: true,  error: false,  finished: true }
export const REQUEST_FAILURE = { phase: 'failure', loading: false, success: false, error: true,   finished: true }
export const REQUEST_INITIAL = { phase: 'initial', loading: false, success: false, error: false , finished: false }

// This version of a function allow invocation of onSuccess twice:
// 1) with cached data during the request
// 2) with new after request is finished.
// Besides, it fires up onStateChange callback useful to observe request state
export async function fetchFromAPIWithCallbacks(url, options, onStateChange, onSuccess, useCached = true) {
  try {
    onStateChange(REQUEST_LOADING);
    var request = await fetchFromAPIWithResponse(url, options, useCached ? onSuccess : undefined);
    onStateChange(REQUEST_SUCCESS);
    onSuccess(request);
  } catch(error) {
    console.log(error)
    onStateChange({...REQUEST_FAILURE, error});
  }
  return request;
} 


export function getResponseData(response) {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.jsoning || (response.jsoning = response.json());
  } else {
    return response.texting || (response.texting = response.text());
  }
}

export async function getResponseValues (response) {
  return {
    status: response.status,
    headers: response.headers,
    url: response.url,
    data: await getResponseData(response)
  }
}

export function throwHTTPError(responseObject) {
  if (responseObject.status >= 400) { 
    const error = new Error(responseObject.data.error || 'HTTP ' + (response.statusText || response.status));
    error.data = responseObject
    throw error;
  }
  return responseObject;
}