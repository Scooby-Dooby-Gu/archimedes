import style from './style.module.scss';
export default function ({url, currentPage, lastPage}) {
  const nextUrl = `${url}${url.includes('?') ? '&' : '?'}`;
  return <div class={`paginator ${style.paginator}`} >
    {currentPage > 1 &&  <a href={`${nextUrl}page=${currentPage - 1}`} class={style.link}>Previous page</a>}
    {currentPage < lastPage  && <a href={`${nextUrl}page=${currentPage + 1}`} class={style.link}>Next page</a>}
  </div>
}