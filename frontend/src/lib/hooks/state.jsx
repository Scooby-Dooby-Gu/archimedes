import { isEqual } from '/lib/helpers';
import { useState, useCallback, useRef, useMemo } from 'preact/hooks'

export const useLoggedState = (initialValue, label1, label2, ) => {
  const [value, setter] = useState(initialValue);
  const valueRef = useRef();
  if (!valueRef.subsequent) {
    valueRef.subsequent = true;
    valueRef.current = initialValue;
  }

  const component = window.currentComponent;
  return [value, (newValue, comparator) => {
    if (comparator ? !comparator(valueRef.current, newValue) : valueRef.current !== newValue) {
      console.log(...console.row('rgb(3, 155, 229)', 'state ', label1, label2, newValue, valueRef.current)); 
      valueRef.current = newValue;
      setter(newValue);
    }
  }]
}

export const useDebouncedState = (initialValue, ...labels) => {
  const [value, setter] = useLoggedState(initialValue, ...labels);
  return [value, (newValue) => setter(newValue, isEqual)]
}

export const useDebouncedMemo = (callback, dependencies) => {
  const valueRef = useRef();
  const newValue = useMemo(callback, dependencies);
  if (!isEqual(valueRef.current, newValue)) {
    valueRef.current = newValue;
  }
  return valueRef.current;
}

