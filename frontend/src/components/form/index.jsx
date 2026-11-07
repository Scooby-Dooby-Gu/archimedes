import style from './style.module.scss';

export default function Form({children, formRef, ...props}) {
  return <form novalidate {...props} ref={formRef} class={`${style.form} ${props.class}`}>{children}</form>
}