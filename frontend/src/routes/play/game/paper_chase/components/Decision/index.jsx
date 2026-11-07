import style from './style.module.scss';
import * as formatters from '/lib/formatters';
import Icon from '../Icon';
import Event from '../Event';
import Button from '/components/button';

export default function Decisions({choice: {icon, title, description, chains, cta, name}, actions, children, onDialog, optional,  ...props}) {
  if (name === 'customize')
    return
  return <a class={style.decision} name={name} onClick={(e) => !e.target.closest(`a:not(.${style.decision})`) && onDialog(chains[0], null, e)}>
    <div class={style.header}>
      {actions.length == 0 && optional && <Icon.ChevronRight class="at-right" />}
      <Icon name={icon} />
      <div class={style.content}>
        <h2>
          {title}
        </h2>
        <div class={`fiction ${optional || actions.length ? 'three-lines' : ''}`}>{formatters.markdown(description)}</div>
      </div>
    </div>
    {actions.map((action) =>  <Event.Action.auto {...props} {...action}  />)}
    {children}
    {actions.length == 0 && !optional && <Button onClick={(e) => onDialog(chains[0], null, e)} class="primary compact">{cta || 'Make decision'}</Button>}
    {actions.length > 0 && <Button onClick={(e) => onDialog(chains[0], null, e)} class="gray">Change decision</Button>}
  </a>
}