import { useRef, useEffect, useState } from 'preact/hooks';
import { useAsyncRequest } from './request';
import { fetchFromAPI } from '../request';


// sends request asynchronously
export const useAsyncLink = (onSuccess, onFailure) => {
  const [request, setRequest] = useAsyncRequest(onSuccess, onFailure, undefined, true);
  return [request, (e) => {
    const link = (e.target || e).closest('[href]');
    if (!link) return;
    if (!link.getAttribute('confirm') || confirm(link.getAttribute('confirm'))) {
      const encType = link.getAttribute('enctype') || 'application/x-www-form-urlencoded;charset=UTF-8';
      var url = link.getAttribute('href');
      setRequest(fetchFromAPI(url, {
        method: link.getAttribute('method'),
        headers: {
          'Content-Type': encType
        },
      }))
    }
    e.preventDefault()
    e.stopPropagation()
  }]
}



// Hook
export function useOnScreen(ref, rootMargin = '0px') {
  // State and setter for storing whether element is visible
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Update our state when observer callback fires
        setIntersecting(true);
      },
      {
        rootMargin,
        threshold: 0,
        root: ref.current.closest('[scrollable]')
      }
    );
    if (ref.current) {
      var element = ref.current;
      observer.observe(ref.current);
    }
    return () => {
      if (element)
        observer.unobserve(element);
    };
  }, []); // Empty array ensures that effect is only run on mount and unmount

  return isIntersecting;
}

export function useStickyQueryValue(value, defaultValue, condition) {
  const paramRef = useRef();
  if (!condition) {
    return paramRef.current = value;
  } else {
    return paramRef.current || defaultValue;
  }
}


export function usePagination(givenPage, givenLastPage, onPageChange) {
  const currentPage = useRef();

  const page = parseInt(givenPage);
  const lastPage = Math.ceil(givenLastPage)

  if (page !== page) {
    throw new Error('Page number is incorrect ' + page)
  }

  if (currentPage.current != null && currentPage.current != page && onPageChange) {
    onPageChange();
  }
  currentPage.current = page;

  return [page, lastPage]
}