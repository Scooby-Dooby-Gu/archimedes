import style from './style.module.scss';
import Icon from '/components/icon'

export default function Button({buttonRef, children, loading, childKey, icon, ...props}) {
  const IconDefinition = icon && Icon.find(icon);
  return <button type="button" ref={buttonRef} {...props} key={childKey} class={`button ${style.button} ${props.class}`} >
    {loading ? <Icon.Spinner /> : (icon && <IconDefinition />)}
    {children}
  </button>
}

Button.Submit = ({children, loading, icon = "ChevronRight", ...props}) => {
  return <Button type="submit" disabled={loading} loading={loading} icon={icon} {...props} class={`button ${props.class} icon-right submit`}>{children}</Button>
}

Button.Link = function ButtonLink({children, loading, icon, childKey, ...props}) {
  const IconDefinition = icon && Icon.find(icon);
  return <a {...props} key={childKey} class={`button ${style.button} ${props.class}`}>
    {loading ? <Icon.Spinner /> : (icon && <IconDefinition />)}
    {children}
  </a>
}

Button.Span = function ButtonSpan({children, loading, icon, childKey, ...props}) {
  const IconDefinition = icon && Icon.find(icon);
  return <span {...props} key={childKey} class={`button ${style.button} ${props.class}`}>
    {loading ? <Icon.Spinner /> : (icon && <IconDefinition />)}
    {children}
  </span>
}