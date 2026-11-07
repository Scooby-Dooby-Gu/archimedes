import { useEffect, useStore, useState, useMemo, useRef } from "/lib/hooks";
import style from './style.module.scss';
import Button from '/components/button';
import { Icon } from '/components/index.jsx';
import { isNotificationSupported } from "../../reducers/notifications";

export default function NotificationPrompt({  children, closable, ...props }) {
  const status = useStore('notifications.status');
  const [ closed, setClosed ] = useState(status === 'authorized');
  const wasEverUnauthorized =  useRef()

  useEffect(() => {
    if (status === 'authorized') {
      setClosed(true);
    } else {
      setClosed(false)
    }
  }, [status]);

  const onEnableNotifications = (e) => {
    dispatch('requestNotificationPermissionIfPossible')
  }
  if (status !== 'authorized')
    wasEverUnauthorized.current = true;
  return useMemo(() => {
    return wasEverUnauthorized.current && isNotificationSupported() && <section {...props} class={`${style.wrapper} ${props.class}`} hidden={closed}>
      {closable && <Icon.Close alt="Close" onClick={() => setClosed(true)} />}
      {children}
      <Button onClick={onEnableNotifications} class="yellow wide">Allow notifications</Button>
    </section>
  }, [closed]);
}