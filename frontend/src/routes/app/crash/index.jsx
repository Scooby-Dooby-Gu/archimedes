import { Page, Button } from '/components/index.jsx';
import { useMemo, useStore } from "/lib/hooks";
import { randomValue } from "/lib/math";

export default function Crash({origin = ''}) {
  const { auth: { user } } = useStore();
  const navigation = useMemo(() => ({
    headerHidden: true
  }))

  var jokes = [
    <p>How does Jaws wind down after a long day? <br />With a glass of Sharkdonnay... it's a great white wine.</p>,
    <p>Did you know that vampires don't exist? <br />Unless you Count Dracula.</p>,
    <p>What does a grape say when you step on it? <br />Nothing... it just lets out a little wine.</p>,
    <p>What do you call a bulletproof Irishman? <br />Rick O'Shea</p>,
    <p>What has two butts and kills people? <br />An Assassin</p>
  ]
  var joke = randomValue(jokes)
  return <Page class={`centered`} id="dashboard" navigation={navigation}>
    <h1>Oops! Something wrong happened here</h1>
    <br />
    <p>We ran into an issue and have logged it away for our developers to look at. Thanks for helping us iron out the kinks! Please use the following navigations below and accept a joke as a token of our appreciation:</p>
    <br />
    <p style={{textAlign: 'center', fontStyle: 'italic', marginBottom: '20px'}}>
      {joke}</p>
    <Button class="primary" onClick={() => { location.href = origin } }>Reload the page</Button>
    {user && <Button.Link href={`/users/${user.id}`}>Return to profile</Button.Link>}
    {origin.indexOf('paper-chase') > -1 &&  <Button onClick={() => (confirm('Are you sure to restart the game? The progress will be lost. Use this as a last resort if you can not progress through the game anymore because of the error. ')) && (location.pathname = '/games/paper-chase/reset')}>Restart the game</Button>}
    <Button>Sign out</Button>
  </Page>
}