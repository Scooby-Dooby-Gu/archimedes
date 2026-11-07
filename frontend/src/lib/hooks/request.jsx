import { useMemo, useState, useCallback, useEffect, useRef } from 'preact/hooks'
import { useLoggedState } from './state';
import isEqual from 'fast-deep-equal';
import { fetchFromAPI, fetchFromAPIWithCallbacks, Placeholder, getResponseValues, throwHTTPError, getCachedData, setCachedData } from '../request';


export const useFetchGroup = (callback) => {
  const group = useMemo(() => [

  ], []);
  callback(group);
};

export const usePrecache = (objectGenerator, dependencies) => {
  useEffect(() => {
    if (dependencies && dependencies.some((dep) => dep && dep.isPlaceholder)) {
      return;
    }
    if (!window.precacheStorage) window.precacheStorage = {};
    const result = objectGenerator(window.precacheStorage);
    if (result && !Array.isArray(result)) {
      Object.assign(window.precacheStorage, result);
    }
  }, dependencies);
};

// makes state of a promise observable
export const useAsync = (label, observeRequest) => {
  var [request, setRequestAndRender] = useLoggedState({
    initial: true
  }, 'async', label);

  const requestRef = useRef();
  // do not change state unless requested or error happened
  if (!observeRequest) {
    if (requestRef.current)
      request = requestRef.current
    var setRequest = (r) => {
      requestRef.current = r
      if (r.error) {
        setRequestAndRender(r)
      }
    };
  } else {
    var setRequest = setRequestAndRender;
  }

  // track mounting state to avoid state changes on onmounted component
  const mountState = useRef();
  useEffect(() => {
    mountState.current = true;
    return () => {
      mountState.current = false;
    }
  }, [])

  return [request, (promise) => {
    const newPromise = promise.then((response) => {
      if (!mountState.current) throw new Error('AbortError');
      if (response && response.error) {
        setRequest({ response, error: response.error, finished: true });
      } else {
        setRequest({ response, success: true, finished: true });
      }
    }).catch((error) => {
      if (error.name !== 'AbortError' && mountState.current) {
        setRequest({ response: error.data, error: error, finished: true });
      }
    });

    newPromise.loading = true;
    setRequest(newPromise)
    return newPromise;
  }]
}

// observes fetch() request, normalizes different kinds of failures
export const useAsyncRequest = (onSuccess, onFailure, label, observeRequest) => {
  const [request, setRequest] = useAsync(label, observeRequest);
  return [request, (fetching) => {
    setRequest(fetching.then((response) => {
      if (!response) {
        return//throw new Error('Unknown error');
      } else {
        return getResponseValues(response).then((responseObject) => {
          throwHTTPError(responseObject)
          if (onSuccess) {
            onSuccess(responseObject)
          }
          return responseObject
        })
      }
    }).catch((error) => {
      if (onFailure) onFailure(error)
      throw error;
    }))
  }]
}


// Give it a promise and get stateful results + observable request + reload callback
export const useRemoteData = (request, {onSuccess, onFailure, onRequest, initialState, immediate, label, observeRequest} = {}, [invalidationString]) => {
  // remember which url was requested last time, so we can invalidate it next time
  const [remoteInvalidationString, setRemoteInvalidationString] = useState(invalidationString);
  var [remoteData, setRemoteData] = useLoggedState(initialState, 'data', label);
  const [remoteDataRequest, setRemoteDataRequest] = useAsyncRequest((response) => {
    const oldData = remoteData;
    if (onSuccess) {
      if (onSuccess(response.data, oldData) === false) {
        return;
      }
    }
    setRemoteData(response.data)

  }, onFailure, label, observeRequest);


  const fetchRemoteData = useCallback((data, overrideUrl, overrideOpts) => {
    if (request) {
      onRequest && onRequest(data);
      if (initialState && !initialState.isPlaceholder) {
        onSuccess(initialState);
      }
      const promise = request(data, overrideUrl, overrideOpts);
      setRemoteDataRequest(promise)
      return promise;
    }
  }, [request])
  // request data initially unless immediate flag is set to false
  if (remoteDataRequest.initial && immediate !== false && request) {
    fetchRemoteData()
  // invalidate previous request autoamtically
  // this is useful when navigating from id to another via router 
  // staying on the same component: e.g. /users/1 to /users/2
  } else if (!remoteDataRequest.initial && remoteInvalidationString !== invalidationString) {
    setRemoteData(initialState);
    // hack to reset reference to cached data,
    // so that onSuccess callback will have a chance to unset placeholder
    remoteData = initialState
    setRemoteInvalidationString(invalidationString);
    if (immediate !== false) {
      fetchRemoteData()
    }
  }
  return [remoteData, remoteDataRequest, fetchRemoteData]
}

// Fetch-compatible api, caches data in localStorage but still reloads it
export const useFetchedData = (url, {onSuccess, onFailure, immediate, initialState, placeholderState, invalidate, ...options} = {}, dependencies) => {
  
  if (!dependencies) {
    dependencies = [url + (invalidate == null ? '' : invalidate || -1)]
  }

  if (!initialState && initialState !== false) {
    if (!options.method || options.method.toLowerCase() === 'get') {
      initialState = getCachedData(url) || placeholderState || (url ? Placeholder() : undefined);
    }
  }

  return useRemoteData(url && ((data, overrideUrl, opts) => {
    return fetchFromAPI(overrideUrl || url, {
      ...options,
      ...opts,
      data: data || options.body,
    })
  }), {
    label: url,
    ...options,
    initialState,
    onFailure,
    immediate,
    onSuccess: (data, oldData) => {
      if (!data || typeof data !== 'object') {
        return;
      }

      // avoid re-rendering if fetched data matches cache
      if ( isEqual(data, oldData)) {
        return false;
      }

      if (onSuccess)
        onSuccess(data)


      // cache response
      if (!options.method || options.method.toLowerCase() === 'get') {
        setCachedData(url, data)
      }
    }, 
  }, dependencies);
}

export function useScript(path) {
  const [loader, setLoader] = useAsync(Array.isArray(path) ? path[0] : path, true)
  if (loader.initial) {
    setLoader(loadScript(path));
  }
  return [loader];
}

export function useLazyScript(path) {
  const [loader, setLoader] = useAsync(Array.isArray(path) ? path[0] : path, true);
  return [loader, () => setLoader(loadScript(path))];
}

export function loadScript(path) {
  const paths = Array.isArray(path) ? path : [path];
  const next = () => {
    return paths.length > 1 ? loadScript(paths.slice(1)) : true;
  }
  return new Promise((resolve) => {
    const oldScript = document.querySelector('script[src*="' + paths[0] + '"], link[href*="' + paths[0] + '"]');
    if (oldScript) {
      if (oldScript.classList.contains('loaded')) {
        resolve(next());
      } else {
        oldScript.addEventListener('load', () => {
          resolve(next());
        })
      }
    } else if (paths[0].indexOf('.css') > -1) {
      const link = document.createElement('link');
      link.rel = 'stylesheet'
      link.addEventListener('load', () => {
        link.classList.add('loaded');
        console.log('%c style  %c %c%s', 'background: rgb(57, 73, 171); color: #eaeaea; border-radius: 2px', '', 'text-decoration: underline', paths[0]);
      
        resolve(next());
      })
      link.href = paths[0];
      document.head.appendChild(link);
    } else {
      const script = document.createElement('script');
      script.addEventListener('load', () => {
        script.classList.add('loaded');
        console.log('%c script %c %c%s', 'background: rgb(57, 73, 171); color: #eaeaea; border-radius: 2px', '', 'text-decoration: underline', paths[0]);
      
        resolve(next());
      })
      script.src = paths[0];
      document.head.appendChild(script);
    }
  })
}
