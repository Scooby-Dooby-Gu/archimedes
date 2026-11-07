

import style from './style.module.scss';
export default function({ url, children, placeholder, query, ...props }) {
  const onSearch = (e) => {
    e.preventDefault()
    route('/boards/search/?query=' + encodeURIComponent(new FormData(e.target).get('query')))
  }

  return <form action="/boards/search/" onSubmit={onSearch} {...props} class={`${style.form} ${props.class}`}>
    
    <input type="search" name="query" value={query} placeholder={placeholder} required />

    {children}
  </form>
}