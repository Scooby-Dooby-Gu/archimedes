import style from './style.module.scss';
export default function Tabs ({items, headers, rows, hidden, forwardRef, ...props}) {
  return <ul class={`${style.tabs} ${props.class}`} ref={forwardRef} hidden={hidden}>
    {items.map((item) => <li {...item.props}>
      {item.link && <a href={item.link[0].content} class="background" />}
      {item.default && !item.link && item.default.map((def) => def.content)}
      {item.default && item.link && <a href={item.link[0].content}>{item.default.map((def) => def.content)}</a>}
      {item.counter && item.counter[0].content && <span class={style.counter}>{item.counter.map((def) => def.content)}</span>}
      {item.right && <span class={style.right}>{item.right.map((def) => def.content)}</span>}
    </li>)}

  </ul>
}