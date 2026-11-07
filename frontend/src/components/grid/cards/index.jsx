import style from './style.module.scss';

export default function Cards({items, rows, headers, forwardRef, ...props}) {

  return <ul {...props} class={`${props.class} ${style.list} cards grid`} ref={forwardRef}>
    {items.map((item) => [
      item.before && item.before[0].content,
      <li {...item.props} class={`${style.card} ${item.props.class} clickable-foreground`} href={null} onClick={null}>
        
        {item.link && <a href={item.link[0].content} class="background" />}
        {item.cover && <div class={`cover ${item.cover[0].content} cover-${style.cover}`} />}
        {item.icon && <img src={item.icon[0].content} class={`image ${style.icon}`} />}
        {item.drag && item.drag[0].content}
        {item.meta && <ul class={`${style.meta} meta`}>
          {item.meta.map((meta) => <li>
            {meta.content}
          </li>)}
        </ul>}
        <div class={style.content}>
          <div class={style.columns}>
            {item.default && !item.link && item.default.map((def) => def.content)}
            {item.default && item.link && <a href={item.link[0].content}>{item.default.map((def) => def.content)}</a>}
            {item.right && item.right.map((def) => def.content)}
          </div>
          <div class={style.after}>
            {item.after && item.after.map((def) => def.content)}
          </div>
        </div>
      </li>
    ])}
  </ul>
}