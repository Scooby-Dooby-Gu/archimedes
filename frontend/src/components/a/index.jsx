import { useCallback } from 'preact/hooks';

export default function A({children, cache, ...props}) {
  if (cache) {
    var onClick = useCallback(() => {
      if (!localStorage['cache:' + props.href]) {
        localStorage['cache:' + props.href] = JSON.stringify(cache);
      }
    })
  }
  return <a {...props} onClick={onClick || props.onClick}>{children}</a>
}