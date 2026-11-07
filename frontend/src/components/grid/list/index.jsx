import style from './style.module.scss';

export default function Cards({onSort, items, rows, headers, forwardRef, ...props}) {
  const imgOrNode = (src, props) => {
    if (src && typeof src === 'string') {
      return <img crossorigin={src.match(/archimedes.*s3/) && 'anonymous'} src={src} {...props} />
    } else {
      return src;
    }
  }
  return <ul {...props} ref={forwardRef} class={`${props.class} ${style.list}`}>
    {items.map((item, rowIndex) => [
      item.before && item.before[0] && item.before[0].content && <li class="splitter">{item.before[0].content}</li>,
      <li draggable={!!onSort} key={item.id || rowIndex} {...item.props} class={`${style.card} ${item.props.class} clickable-foreground`} href={null} onClick={null}>
        {item.link && item.link[0].content && <a href={item.link[0].content} onClick={item.props.onClick} method={item.props.method} confirm={item.props.confirm} class="background" />}
        {item.drag && item.drag[0].content}
        {item.cover && imgOrNode(item.cover[0].content, {class: style.cover})}
        {item.icon && imgOrNode(item.icon[0].content, {class: style.icon})}
        <div class={style.lines}>
          {item.meta && <ul class={`${style.meta} meta gray`}>
            {item.meta.map((meta) => <li class={meta.header.name === 'Spacer' ? 'spacer' : null}>
              {meta.content}
            </li>)}
          </ul>}
          <div class={style.content}>
            {item.default && !(item.link && item.link[0].content) && item.default.map((def) => def.content)}
            {item.default && (item.link && item.link[0].content) && <a href={item.link[0].content} onClick={item.props.onClick} method={item.props.method} confirm={item.props.confirm}>{item.default.map((def) => def.content)}</a>}
            <div class={style.after}>
              {item.after && item.after.map((def) => def.content)}
            </div>
          </div>
          {item.text && item.text.map((def) => def.content)}
        </div>
        {item.right && <span class={style.right}>{item.right && item.right.map((def) => def.content)}</span>}
        {item.action && <span class={style.action}>{imgOrNode(item.action[0].content)}</span>}
        <div class={style.details}>
          {item.details && item.details.map((def) => def.content)}
        </div>
      </li>
    ])}
  </ul>
}