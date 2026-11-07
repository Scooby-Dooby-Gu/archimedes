
export { useEffect, useReducer, useContext, useState, useRef, useErrorBoundary, useLayoutEffect } from 'preact/hooks';

import { useMemo as useMemoOriginal, useCallback as useCallbackOriginal } from 'preact/hooks';
export function useMemo(c, d) {
  if (!d) debugger;
  return useMemoOriginal(c, d)
}
export function useCallback(c, d) {
  if (!d) debugger;
  return useCallbackOriginal(c, d)
}