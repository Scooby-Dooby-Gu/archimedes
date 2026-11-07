import style from './style.module.scss';
import Pikaday from '../pikaday';
import Combobox from '../combobox';
import { useRef, useCallback } from '/lib/hooks/index.jsx';

export default function FormField({label, id, children, type, optional, ...props}) {
  const isDate = props.type === 'date'
  var element = children;
  if (props.name && !id) {
    id = props.name;
  }
  

  if (!element) {
    if (import.meta.env.NODE_ENV === 'qa' && type === 'date') {
      element = <Pikaday {...props} className={style.input} id={id} />
    } else if (type === 'textarea') {
      const onInput = useCallback((e) => {
        e.target.style.minHeight = ""; /* Reset the height*/
        e.target.style.minHeight = Math.min(e.target.scrollHeight, 600) + "px";
      }, [])
      const findTextarea = useCallback((el) => {
        if (el && !el.classList.contains('expandable')) {
          el.classList.add('expandable');
          onInput({target: el});
          el.addEventListener('input', onInput)
          el.addEventListener('Fill', onInput)
        }
      }, []);
      element = <textarea {...props}
        ref={findTextarea}
        className={style.input}
        placeholder={props.placeholder || label}
        id={id}>{props.value}</textarea>
    } else if (props.list) {
      type = 'combobox'
      
      element = <Combobox 
        autocomplete="off"
        {...props}
        className={style.input}
        id={id}
        type={type || 'text'} />
    } else {
      element = <input 
        autocomplete="off"
        {...props}
        className={style.input}
        id={id}
        type={type || 'text'} />
    }
  }
  return (
    <div class={`${style.formField} ${props.class} ${style[type]} ${type}`}>
      
      { element }
      { label && type !== 'textarea' ? <label for={id} class={style.label}>{label}{optional && <aside>optional</aside>}</label> : null }
    </div>
  )

}