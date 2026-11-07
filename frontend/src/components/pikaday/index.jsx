import { useEffect, useRef } from 'preact/hooks';
import { useScript } from '/lib/hooks/index.jsx';

export default function(props) {
  const ref = useRef();

  const [ loader ] = useScript([
    'https://cdnjs.cloudflare.com/ajax/libs/pikaday/1.8.0/pikaday.min.jsx',
    'https://cdnjs.cloudflare.com/ajax/libs/pikaday/1.8.0/css/pikaday.min.css'
  ])

  useEffect(() => {
    if (loader.success) {
      const picker = new Pikaday({
        field: ref.current,
        defaultDate: new Date('2002-01-01'),
        toString: (date) => {
          return new Date(date).toLocaleString("en-GB").split(',')[0].split('/').reverse().join('-');
        },
        maxDate: new Date('2010-01-01'),
        minDate: new Date('1950-01-01'),
        yearRange: 80
      });
      ref.current.classList.add('loaded')
      return () => {
        picker.destroy();
      }
    }
  }, [loader.success])

  return <input {...props} ref={ref} />
}