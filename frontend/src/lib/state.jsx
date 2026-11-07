// https://medium.com/simply/state-management-with-react-hooks-and-context-api-at-10-lines-of-code-baf6be8302c
// modified to support asynbc middleware

import {  useRef, useState, useContext, useLayoutEffect, useCallback, useReducer, useMemo, useEffect } from 'preact/hooks'
import { createContext } from 'preact';
import { memo } from 'preact/compat';

function prepareAction (action, data) {
	// allow dispatch('method', options);
	if (typeof action === 'string') {
		if (data === undefined)
			data = null;
		if (action.indexOf('set') === 0) {
			// turn dispatch('setLayout', value) to dispatch({type: 'setLayout', layout: value})
			const argumentName = action[3].toLowerCase() + action.substring(4)
			action = { type: action, [argumentName]: data }
		} else {
			action = { type: action, ...data }
		}
	}
	return action;
}

export const StateContext = createContext();

export const StateProvider = ({reducer, middleware, observers, initialState, children}) => {
	const [state, setCurrentState] = useState(initialState);


  const dispatch = useCallback(async (...args) => {
		delete currentContext.delayed;
		const newAction = await middleware(currentContext.current, prepareAction(...args), dispatch);
		if (!newAction) return;
		const oldState = currentContext.current;
		currentContext.current = reducer(oldState, newAction);
		observers(currentContext.current, oldState, currentContext)
		setCurrentState(currentContext.current);
	}, [])

	const currentContext = useRef()
	currentContext.current = state
	
	useMemo(() => {
		dispatch('initialize')
	}, [])

	// register in global scope for external scripts


	dispatch.silently = useCallback((...args) => {
		currentContext.delayed = Math.random();
		const result = dispatch(...args);
		setTimeout(() => currentContext.delayed = false, 50)
		return result;
	}, [dispatch])


	if (!currentContext.listeners) {
		currentContext.dispatch = dispatch
		currentContext.listeners = new Set
	//	currentContext.updates = 0;
	}
	//currentContext.updates++;
	window.dispatch = dispatch;

	const updates = currentContext.updates;
	useLayoutEffect(() => {
		//if (updates == currentContext.updates) {
			if (!currentContext.delayed)
				currentContext.listeners.forEach((l) => l(currentContext.current))
		//} else {
		//	alert(1)
		//}
	})

	return useMemo(() => <StateContext.Provider value={currentContext}>
	  {children}
	</StateContext.Provider>, [])
}

const identity = (x, a) => x
export const useContextState = (context, selector = identity, ...args) => {
	const storage = useContext(context);
	if (!storage) return;
	const [, forceUpdate] = useReducer((c) => c + 1, 0);
  const value = selector(storage.current, ...args);
	const ref = useRef(null);
	ref.current = { selector, value, args };

	const componentName = window.currentComponent || ''

  useLayoutEffect(() => {
    const callback = (nextState) => {
			const nextValue = ref.current.selector(nextState, ...ref.current.args);
      try {
        if (Object.is(ref.current.value, nextValue)) {
          return;
        }
      } catch (e) {
        // ignored (stale props or some other reason)
			}
      if (ref.current.args.length) {
				console.log(...console.row('rgb(150, 100, 100)', 'update', ref.current.args[0], componentName, console.labelObject(ref.current.value, 'Before'), console.labelObject(nextValue, 'After')))
			} 
			forceUpdate();
		};
    storage.listeners.add(callback);
    return () => {
      storage.listeners.delete(callback);
    };
  }, [storage.listeners]);
  return value;
};

const selectByPath = (state, property) => {
	return property.split(/\./g).reduce((obj, key) => {
		if (obj[key] === undefined) throw new Error("Can not select " + property.join('.'))
		return obj[key];
	}, state)
};
export const useStore = (property) => 
	useContextState(StateContext, property ? selectByPath : undefined, property)
