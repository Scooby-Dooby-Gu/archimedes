import { useEffect, useRef } from 'preact/hooks';
import { useScript } from '/lib/hooks/index.jsx';
import style from './style.module.scss';

export default function({list, ...props}) {
  const ref = useRef();

  const [ loader ] = useScript([
    'https://cdnjs.cloudflare.com/ajax/libs/awesomplete/1.1.5/awesomplete.min.js',
  ])
  useEffect(() => {
    if (loader.success) {
      loader.awesomplete = new Awesomplete(ref.current, {
        list: list,
        autoFirst: true,

        filter: function(text, input) {
          const v = input.split(/\s*[;,]\s*/).pop();
          if (!v) return [];
          return Awesomplete.FILTER_CONTAINS(text, v);
        },
      
        item: function(text, input) {
          return Awesomplete.ITEM(text, input.match(/[^,]*$/)[0]);
        },
      
        replace: function(text) {
          if (props.singular) {
            this.input.value = text;
          } else {
            var before = this.input.value.match(/^.+,\s*|/)[0];
            this.input.value = before + text + ", ";
          }
          this.input.dispatchEvent(new Event('input', {bubbles: true}))
        },

        container: (input) => input.parentNode
      });
    }
  }, [loader.success]);

  if (loader.awesomplete) loader.awesomplete.list = list;

  return <input {...props} ref={ref} />
}