import update from '/lib/immutability';
import URLSearchParams from 'url-search-params';
import { useDebouncedState } from './state';
import { useAsyncRequest } from './request'
import { fetchFromAPI } from '../request'
import { useCallback, useRef, useEffect, useLayoutEffect, useMemo } from 'preact/hooks';

import qs from 'qs';
const { parse: parseQueryString }  = qs;

export const showMessages = (form) => {
  var invalidFields = form.querySelectorAll( ":invalid" ),
      errorMessages = form.querySelectorAll( ".error-message" ),
      parent;

  // Remove any existing messages
  for ( var i = 0; i < errorMessages.length; i++ ) {
      errorMessages[ i ].parentNode.removeChild( errorMessages[ i ] );
  }

  for ( var i = 0; i < invalidFields.length; i++ ) {
      parent = invalidFields[ i ].parentNode;
      var message = invalidFields[ i ].validity.customError;
      if (!message &&( invalidFields[ i ].validity.patternMismatch ||  invalidFields[ i ].validity.badInput ||  invalidFields[ i ].validity.typeMismatch)) {
        message = 'incorrect'
      }
      if (!message && invalidFields[ i ].validity.valueMissing) {
        message = 'missing'
      }
      if (message) {
        invalidFields[ i ].insertAdjacentHTML( "beforebegin", "<div class='error-message'>" + 
        message +
        "</div>" );
      }
  }

  // If there are errors, give focus to the first invalid field
  if ( invalidFields.length > 0 ) {
      invalidFields[ 0 ].focus();
  }
}

// submits form asynchronously
export const useAsyncForm = (onSuccess, onFailure, processData = identity) => {
  var form
  const [request, setRequest] = useAsyncRequest((response) => {
    if (onSuccess) {
      return onSuccess(response, form)
    }
  }, onFailure, undefined, true);

  const onSubmit = useCallback((e) => {
    form = e.target && e.target.form || e.target || e;
    if (form.checkValidity()) {
      if (document.activeElement &&  document.activeElement.blur)
        document.activeElement.blur();

      
        
      const encType = form.getAttribute('enctype');
      const method = (form.getAttribute('method') || 'get').toLowerCase();
      const data = serializeFormData(form, processData)
      const url = form.getAttribute('action');
      const headers = {
        'Content-Type': encType
      };

      if (location.pathname.indexOf('/edit') > -1) {
        var name = location.pathname.split('/').slice(-3).join('/')
      } else {
        var name = location.pathname.split('/').slice(-2).join('/')
      }
      track('send', 'event', 'Form', 'submit', name);

      setRequest(fetchFromAPI(url, { method, headers, data }))
    }
    if (e.preventDefault) {
      e.preventDefault()
    }
    showMessages(form)
  }, [setRequest]);

  return [request, onSubmit]
}

const flattenData = (data, prefix = '', result = {}) => {
  for (const property in data) {
    const value = data[property];
    const left = prefix ? `${prefix}[${property}]` : property;
    if (value != null && typeof value == 'object') {
      flattenData(value, left, result)
    } else {
      result[left] = value;
    }
  }
  return result;
}

const serializeFormData = (form, processData) => {
  const pairs = flattenData(processData(readFormData(form)))
  const data = new FormData
  for (var name in pairs) {
    if (pairs[name] != null)
      data.set(name, pairs[name]);
  }
  for (const fileInput of form.querySelectorAll('input[type="file"]')) {
    data.delete(fileInput.name)
    for (const file of fileInput.files) {
      data.append(fileInput.name, file);
    }
  }
  return data;
}

const readFormData = (form) => {
  const rawFormData = new FormData(form);
  const serializedFormData = new URLSearchParams(rawFormData);
  const parsedFormData = parseQueryString(serializedFormData.toString());
  return parsedFormData;
}

const writeFieldData = (field, value)  =>{
  if (field && field.type !== 'file') {
    const oldValue = field.value;
    if (field.type == 'checkbox' || field.type === 'radio') {
      const checkedness = value !== '' && value !== undefined && value !== false && value !== null && value !== 'false' && value !== 'null'
      if (field.checked == checkedness) return false;
      field.checked = checkedness
    } else {
      if (field.value === value) return false;
      field.value = value;
    }
    console.log(...console.row('rgb(121, 85, 72)', 'form', 'fill', field.name, console.labelObject(oldValue, 'Before'), console.labelObject(value, 'After')));
    // invoke custom event that other code can intercept and use the value set externally
    field.dispatchEvent(new Event('Fill', {bubbles: true}));
  }
  return true;
}

// Set form fields values to match data from object
// Handles with array-like fields `user[comments][0][tags][]`
const writeFormData = (form, data, label) => {
  console.log(...console.row('rgb(121, 85, 72)', 'form', 'write', label, console.labelObject(data || {}, 'Data')));
  const pairs = data.isPlaceholder ? {} : flattenData(data);
  for (var field of form.querySelectorAll('input, select, textarea')) {
    const value = pairs[field.name] || pairs[field.name.replace(/\[\d+\]$/, '[]')]
    if (value != undefined) {
      writeFieldData(field, value);
    } else {
      const opt = field.options && (Array.from(field.options).find((o) => o.defaultSelected) || field.options[0])
      writeFieldData(field, 
        opt ? opt.value : 
        field.type == 'checkbox' || field.type == 'radio' ? field.defaultChecked : 
        field.defaultValue);
    }
  }
}

// serialize/sync form data as nested objects in runtime
// e.g. lesson[questions][0][answers][0][title]=Test
//  => {lesson: questions: [{answers: [{title: "Test"}]}]}

// This hook allows developer not to deal with form values or handling input updates directly.
// Just provide object with values to set fields, and the hook will live-update values if they change.

// When external data given from outside is updated, it is returned as is from the hook
// as is, so the component can render dependend fields (like repeatable elements).
// Immediately after, within effect it serializes data and re-sets it as value.

// Each time external data is updated by reference, the form is set to that data and component is
// re-rendered. In addition, the component can use updateFormData callback to change data.

// Hook accepts dependencies array like other hooks, to re-apply form data. It is useful
// in cases like asynchronously loading select options

// Each time input values change, or if inputs are mutated (added or removed) the object is updated

const emptyFormData = {};
const identity = (data) => data
export const useFormData = (externalFormData = emptyFormData, transformData = identity, dependencies = []) => {
  const [formData, setFormData] = useDebouncedState(externalFormData || {}, 'formData', window.currentComponent);
  const ref = useRef();
  const formRef = useRef();
  
  // When identity of first argument changes (or passed initially), 
  // form is reset to that value
  ref.previous = ref.raw
  if (externalFormData && ref.external !== externalFormData) {
    ref.external = externalFormData;
    ref.raw = externalFormData
    ref.externalChanged = true;
  } else {
    ref.raw = formData;
  }

  // Allow data to be transformed with a callback on each change
  ref.current = transformData(ref.raw, ref.previous || ref.raw);


  // If data was transformed and changed, or dependencies were
  // write data back to form fields
  const component = window.currentComponent;
  const dependenciesChanged = useMemo(() => dependencies, dependencies) === dependencies && ref.current;
  useEffect(() => {
    if (formRef.current && (ref.current != ref.raw || ref.externalChanged || dependenciesChanged)) {
      ref.externalChanged = false;
      writeFormData(formRef.current, ref.current, component);
      setFormData(readFormData(formRef.current));
    }
  }, [ref.current, ref.previous, ...dependencies])

  // Apply DOM listeners and Mutation Observer to the form
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
  
    const onFormInput = (e) => {
      if (e.target.name) {
        console.log(...console.row('rgb(121, 85, 72)', 'form', 'input', e.target.name, console.labelObject(e.target.value, 'After')));
        setFormData(readFormData(form))
      }
    };

    // react to added/removed fields
    // they immediately export their values coming from attributes
    const onFormMutate = (mutationList) => {
      var changedFields = false;
      for (var i = 0; i < mutationList.length; i++) {
        var added = Array.prototype.slice.call(mutationList[i].addedNodes);
        if (added.length) {
          for (var j = 0; j < added.length; j++) {
            const addedEl = added[j].tagName && added[j].querySelector('select, option, input, textarea');
            if (addedEl && addedEl.name) {
              console.log(...console.row('background: rgb(121, 85, 72)', 'form', 'added', addedEl.name));
              changedFields = true;
            }
          }
        }
        var removed = Array.prototype.slice.call(mutationList[i].removedNodes);
        if (removed.length) {
          for (var j = 0; j < removed.length; j++) {
            const removedEl = removed[j].tagName && removed[j].querySelector('select, option, input, textarea');
            if (removedEl && removedEl.name) {
              console.log(...console.row('background: rgb(121, 85, 72)', 'form', 'removed', removedEl.name));
              changedFields = true;
            }
          }
        }
      }
      if (changedFields) {
        setFormData(readFormData(form));
      }
    }

    const observer = new MutationObserver(onFormMutate);
    observer.observe(form, { attributes: true, childList: true, subtree: true });
    form.addEventListener('input', onFormInput)
    return () => {
      observer.disconnect();
      form.removeEventListener('input', onFormInput)
    };
  }, dependencies);

  const updateFormData = useCallback((data) => {
    ref.externalChanged = true;
    setFormData(data)
  }, [])

  return [ref.current, updateFormData, formRef];
}