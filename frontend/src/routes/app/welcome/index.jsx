import style from './style.module.scss';
import { Button, Page, Icon } from '/components/index.jsx';
import { useStore, useSignin, useMemo } from '/lib/hooks/index.jsx';
import { useTransition, animated, config } from 'react-spring'

export default function Welcome() {
  const [setUser, onGoogleSignin, googleSigninRequest, onAppleSignin, appleSigninRequest] = useSignin();
  const {app: { animations, open }} = useStore();
  const navigation = useMemo(() => ({
    headerHidden: true,
    pageTheme: 'gray',
    requests: [googleSigninRequest, appleSigninRequest]
  }), [googleSigninRequest, appleSigninRequest]);

  const items = [
    <Icon.LogosArchimedes  index="0" class={style.header} />,
    <span index="1" class={style.tagline}>Your investment coach</span>,
    open ? <Button.Link index="2" class="primary" href="/signup">Sign up</Button.Link>
         : <Button.Link index="2" class="primary" href="/request_access">Request access</Button.Link>,
    <Button.Link index="3" class="secondary" href="/signin">I have an account</Button.Link>,
    <div index="4" class={style.login}>
      <span class={style.or}>or</span>
      <Button.Link class="secondary" href="/signin/google" disabled={!googleSigninRequest.ready || googleSigninRequest.loading} onClick={onGoogleSignin}>
        {googleSigninRequest.loading ? <Icon.Spinner /> : <Icon.LogosGoogle />}
        Sign in with Google
      </Button.Link>
      <Button.Link class="secondary" href="/signin/apple" disabled={!appleSigninRequest.ready || appleSigninRequest.loading} onClick={onAppleSignin}>
        {appleSigninRequest.loading ? <Icon.Spinner /> : <Icon.LogosApple style="width: 24px; height: 24px; margin-top: -10px;" />}
        Sign in with Apple
      </Button.Link>
    </div>
  ];

  const transition = useTransition(items, {
    trail: 250,
    enter: (item) => async (next) => {
      if (item.props.index == '1') {
        await new Promise((a) => setTimeout(a, 600))
      }
      if (item.props.index > '1') {
        await new Promise((a) => setTimeout(a, 700))
      }
      return next({
        opacity: '1',
        scale: 1,
        translateY: 0,
        config: item.props.index > '1' ? config.slow : config.molasses
      })
    },
    from: (item) => ({
      opacity: '0',
      scale: item.props.index == '1' ? 1 : 0.8,
      translateY: item.props.index > '1' ? 100 : item.props.index === '1' ? 0 : -100,
    }),
    key: (item) => item.props.index
  })

  const content = useMemo(() => <>
    {animations === false
        ? items.map((item) => 
          <animated.div class={style.item} index={item.props.index}>{item}</animated.div>)
        : transition((values, item) => 
          <animated.div class={style.item} index={item.props.index} style={values}>{item}</animated.div>)}
  </>, [googleSigninRequest.loading, googleSigninRequest.ready, appleSigninRequest.loading, appleSigninRequest.ready])
  
  return useMemo(() => <Page class={`centered ${style.page}`} id="dashboard" navigation={navigation}>
    {content}
  </Page>, [content, navigation])
}