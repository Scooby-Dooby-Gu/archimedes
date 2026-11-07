import { Grid, Button, User, Page, Avatar, Icon } from '/components/index.jsx';

import { getSkills} from '/lib/data';
import style from './style.module.scss';
import { usePrecache, useFetchedData, useAsyncLink, useMemo, useStore } from '/lib/hooks/index.jsx'
import { NotificationPrompt } from '/components/index.jsx';
import { useState } from 'preact/hooks';

const ProfileShow = ({userId, section, friendId, title, success, flash, originId}, props) => {
  // show current user profile from cache
  const user              = useStore('auth.user');
  const company           = useStore('auth.company');
  const canManage         = useStore('auth.canManage');
  const openDiscussions   = useStore('app.openDiscussions');
  const achievements      = useStore('data.achievements');
  const submissions       = useStore('data.submissions');
  const courses           = useStore('data.courses');
  const achievementsError = useStore('requests.achievements.error');
  const unlocks           = useStore('app.unlocks');
  if (!user) return;
  // fetch user data

  const [friendLimit, setFriendLimit] = useState(3);
  const [{user: person }, personRequest, reloadPerson] = useFetchedData(`/users/${userId}`, { invalidate: success });

  // power up friendship buttons
  const [friendshipDeletionRequest, onFriendshipDelete] = useAsyncLink(() => route(location.pathname + '?success=' + Math.random()));
  const [friendshipCreationRequest, onFriendshipCreate] = useAsyncLink(() => route(location.pathname + '?success=' + Math.random()));

  const personAchievements = person.achievements || [];
  const personFriends = person.friends || [];
  const friends = personFriends.filter((friend) => person.friendships.some((friendship) => friendship.targetId === friend.id));
  const friendsOfFriends = personFriends.filter((friend) => !person.friendships.some((friendship) => friendship.targetId === friend.id) && friend.id !== person.id);

  const isMe = user && user.id == userId;
  const friendship = user && person.friendships.filter((friendship) => friendship.targetId == user.id)[0];
  
  const skills = isMe && !unlocks.game ? [] : getSkills(submissions, courses).filter((s) => s.points != 1 || s.passed > 0)

  

  const discussionsURL = openDiscussions ? '/boards/3' : '/boards/3/'
  
  if (achievements) {
    var hidden = ['game_bankrupt', 'game_happy_grandma', 'game_taxes', 'game_top_1', 'game_top_10', 'game_oracle', 'game_evidence', /*'game_bought_business', 'game_defeated_boss',*/ 'game_passive_income', 'game_income', 'game_debt_free'];
    var applicableAchievements = achievements.filter((achievement) =>
      (!achievement.slug.includes('game_') || personAchievements.find((a) => a.definition.slug == achievement.slug || a.definition.slug == 'unlock_game')) && 
      (!achievement.slug.includes('discussion') && !achievement.slug.includes('vote')) && 
      (personAchievements.find((a) => a.definition.slug == achievement.slug) || (
        !hidden.includes(achievement.slug) &&
        !achievement.slug.includes('challenge') && 
        (achievement.slug.indexOf('company') === -1 || person.companyId) && 
        (achievement.slug !== 'game_grad' || personAchievements.find((a) => personAchievements.find((a) => a.definition.slug == 'game_college'))) &&
        (achievement.slug !== 'game_millionaire' || personAchievements.find((a) => personAchievements.find((a) => a.definition.slug == 'game_stocks'))) &&
        (achievement.slug !== 'game_top_1' || personAchievements.find((a) => personAchievements.find((a) => a.definition.slug == 'game_top_10'))) &&
        (achievement.slug !== 'game_top_10' || personAchievements.find((a) => personAchievements.find((a) => a.definition.slug == 'game_stocks'))) &&
        (achievement.slug === 'game_start' || achievement.slug.indexOf('game_') === -1 || personAchievements.find((a) => a.definition.slug == 'game_start')) && 
        (achievement.slug.indexOf('vote_') === -1 || personAchievements.find((a) => a.definition.slug == 'discussion_1')) && 
        (achievement.slug.indexOf('course_') === -1 || personAchievements.find((a) => a.definition.slug == 'lesson_2' || a.definition.slug === 'course_1')) && 
        (achievement.slug.indexOf('_2') === -1 || personAchievements.find((a) => a.definition.slug == achievement.slug.replace('_2', '_1'))) &&
        (achievement.slug.indexOf('_3') === -1 || personAchievements.find((a) => a.definition.slug == achievement.slug.replace('_3', '_2')))
      ))
    ).map((achievement) => ({
      ...achievement,
      ...(() => {
        switch (achievement.slug) {
          case 'profile': return {cta: 'Fill profile', url: `/users/${user.id}/settings`}
          case 'lesson_1': return {cta: 'Complete 1 lesson', url: '/ambitions'}
          case 'lesson_2': return {cta: 'Complete 10 lessons', url: '/ambitions'}
          case 'lesson_3': return {cta: 'Complete 30 lessons', url: '/ambitions'}
          case 'unlock_game': return {cta: 'Complete 3 lessons', url: '/ambitions'}
          case 'unlock_videos': return {cta: 'Complete 2 goals', url: '/ambitions'}
          case 'unlock_courses': return {cta: 'Complete an ambition', url: '/ambitions'}
          case 'friendship_1': return !company && {cta: 'Invite a friend', url: `/users/${user.id}/friends/new`}
          case 'friendship_2': return !company && {cta: 'Make 5 friends', url: `/users/${user.id}/friends/new`}
          case 'friendship_3': return !company && {cta: 'Make 20 friends', url: `/users/${user.id}/friends/new`}
          case 'discussion_1': return {cta: 'Make a discussion post', url: discussionsURL}
          case 'discussion_2': return {cta: 'Make 10 discussion posts', url: discussionsURL}
          case 'discussion_3': return {cta: 'Make 25 discussion posts', url: discussionsURL}
          case 'vote_1': return {cta: 'Receive 5 upvotes', url: discussionsURL}
          case 'vote_2': return {cta: 'Receive 25 upvotes', url: discussionsURL}
          case 'vote_3': return {cta: 'Receive 50 upvotes', url: discussionsURL}
          case 'game_start': return {cta: 'Start playing', url: `/games/paper-chase`}
          case 'game_property': return {cta: 'Pay off a house', url: `/games/paper-chase/property`}
          case 'game_stocks': return {cta: 'Buy stocks', url: `/games/paper-chase/investments`}
          case 'game_college': return {cta: 'Get a degree', url: `/games/paper-chase/career`}
          case 'game_postgrad': return {cta: 'Finish grad school', url: `/games/paper-chase/career`}
          case 'game_happy_grandma': return {cta: 'Take on grandmas challenge', url: `/games/paper-chase`}
          case 'game_defeated_boss': return {cta: 'Defeat Mr. Sinister', url: `/games/paper-chase`}
          case 'game_bought_business': return {cta: 'Reclaim your legacy', url: `/games/paper-chase`}
          default:
            if (achievement.slug.includes('game_'))
              return {cta: 'Play the game', url: `/games/paper-chase`}
        }
      })(),
      important: achievement.slug.includes('unlock'),
      locked: !personAchievements.find((a) => a.definition.id === achievement.id)
    })).sort((a, b) => (Number(b.important) - Number(a.important)) || (Number(a.locked) - Number(b.locked)));
  } else {
    var applicableAchievements = personAchievements.map((achievement) => achievement.definition);
  }

  usePrecache((cache) => friends.forEach((friend) => {
    cache[`/users/${friend.id}`] = {user: friend};
  }), [person]);

  const navigation = useMemo(() => {
    const nav = {
      scrollSelector: false,
      scrollPosition: 'start',
      scrollDelay: 600,
      title: person.name,
      titleNode: [
        <User user={person} />
      ],
      requests: [personRequest, friendshipDeletionRequest, friendshipCreationRequest],
      errors: [achievementsError],
      headerType: 'notch',
      headerTheme: 'white',
      headerClass: 'action-compact collapsible-title',
    };
    if (isMe) {
      if (section !== 'settings') {
        nav.actionTitle = <Icon.Settings />;
        nav.actionLink = `/users/${person.id}/settings`
      }
    } else if (user &&  person.id && friendship) {
      nav.actionTitle = <Icon
        name={friendshipDeletionRequest.loading ? 'spinner' : 'remove'}
        href={`${import.meta.env.API_URL}/friendships/${friendship.id}`}
        disabled={friendshipDeletionRequest.loading}
        method="delete"
        key="friend" />
      nav.actionHandler = onFriendshipDelete
    } else if (user &&  !friendship) {
      nav.actionTitle = <Icon
        name={friendshipDeletionRequest.loading ? 'spinner' : 'add'}
        icon="Add"
        href={`${import.meta.env.API_URL}/friendships/?target_id=${userId}&source_id=${user.id}`}
        disabled={friendshipCreationRequest.loading}
        method="post"
        key="friend" />
      nav.actionHandler = onFriendshipCreate
    }
    return nav;
  }, [person, section, personRequest.error, achievementsError, friendshipDeletionRequest, friendshipCreationRequest])
  
  const prefix = originId ? `/users/${originId}/friends/${userId}` : `/users/${userId}`

  const friendCount = friends.length + friendsOfFriends.length;
  const content = useMemo(() => <>
    <div class={style.header}>
      {canManage && <a href={`/users/${person.id}/settings`}><Avatar user={person} class="huge" /></a>}
      {!canManage && <Avatar user={person} class="huge" />}
      <h1>
        {canManage && <a href={`/users/${person.id}/settings`}>{person.name}</a>}
        {!canManage && person.name}
      </h1>
      {false && person.company && person.role != 'manager' && <aside class="company gray">
        from <span> </span>
        {canManage && <a href={`/companies/${person.company.id}`} class="gray">{person.company.name}</a>}
        {!canManage && person.company.name}
      </aside>}
    </div>

    {isMe && !flash && <div class={style.invitation}>
        <p>
        Help empower others.
        </p>
        <Button.Link class="primary icon-right" icon="ChevronRight" href={`/users/${userId}/friends/new`}> Invite friends</Button.Link>
      </div>}

      {isMe && flash && <div class={style.invitation}>
        <p>
          <strong>{flash}</strong>
        </p>
        <Button.Link class="secondary" href={`/users/${userId}/friends/new`}>Invite more friends</Button.Link>
      </div>}
      
      {isMe && friendId !== 'new' && flash && 
        <NotificationPrompt class={style.prompt}>
          <p>Get notified when invitation is accepted</p>  
        </NotificationPrompt>}


      {friends.length > 0 && <Grid
        type="list"
        class={`${style.friends} ${friendCount > friendLimit && style.cropped}`}

        headers={[
          {name: 'Before', type: 'before'},
          {name: 'Link', type: 'link'},
          {name: 'Icon', type: 'icon'},
          {name: 'Name'},
          {name: 'Action', type: 'action'}
        ]}

        rows={friends.map((friend, index) => [
          (index == 0) && <h2 class={`tagline ${style.more}`}>Friends
            {friendCount > friendLimit && <aside><a href="#" onClick={() => setFriendLimit(friendCount)}>See {friendCount - 3} more </a></aside>}
          </h2>,
          `/users/${person.id}/friends/${friend.id}`,
          <Avatar user={friend} />,
          friend.name,
          <Icon.ChevronRight class="forward icon" />,
          {class: friendId == friend.id && 'selected'}
        ]).concat(friendsOfFriends.map((friend, index) => [
          (index == 0) && <h2 class="tagline">Friends of friends</h2>,
          `/users/${person.id}/friends/${friend.id}`,
          <Avatar user={friend} />,
          friend.name,
          <Icon.ChevronRight class="forward icon" />,
          {class: friendId == friend.id && 'selected'}
        ])).slice(0, friendLimit)}


      />}

    <h2 class="tagline">Achievements</h2>
    <Grid
        type="list"
        class="separate"

        headers={[
          {name: 'Link', type: 'link'},
          {name: 'Icon', type: 'icon'},
          {name: 'Name'},
          {name: 'Description', type: 'text'},
          {name: 'Action', type: 'action'}
        ]}

        rows={skills.map((skill) => !isMe ? null : [
          null,
          skill.icon,
          <h3 class="normal">{skill.name}</h3>, 
          [
            <span class="smaller gray">{skill.summary}</span>,
            <progress class={style.progress} max={skill.total} value={skill.passed} />
          ],
          <span class={style.badge}>Lvl. {skill.level}</span>, 
          {class: style.skill}
        ]).filter(Boolean).concat(applicableAchievements.filter((a) => !a.locked).map((achievement) => [
          achievement.locked && achievement.url,
          achievement.icon,
          <h3 class="normal">{achievement.name}</h3>, 
          achievement.locked ? <a class="blue" href={achievement.url}>{achievement.cta}</a> : <span class="smaller gray">{achievement.summary}</span>,
          achievement.locked && <Icon.ChevronRight />,
          {class: achievement.locked ? 'disabled' : null},
        ]))}
      />
      {isMe && <><br /><h2 class="tagline">What's next?</h2></>}
      {isMe && <Grid
        type="list"
        class="padded"

        headers={[
          {name: 'Link', type: 'link'},
          {name: 'Icon', type: 'icon'},
          {name: 'Name'},
          {name: 'Description', type: 'text'},
          {name: 'Action', type: 'action'}
        ]}

        rows={applicableAchievements.filter((a) => a.locked).map((achievement) => [
          achievement.locked && achievement.url,
          achievement.icon,
          <h3 class="normal">{achievement.name}</h3>, 
          achievement.locked ? <a class="blue" href={achievement.url}>{achievement.cta}</a> : <span class="smaller gray">{achievement.summary}</span>,
          achievement.locked && <Icon.ChevronRight />,
          {class: achievement.locked ? 'disabled' : null},
        ])}
      />}

      {personAchievements.length === 0 && !isMe && <section>
        <h3 class="larger gray">There are no achievements yet.</h3>
      </section>}
  </>, [section, friends, achievements, friendship, navigation])
  
  return useMemo(() => 
    <Page id="profile" navigation={navigation} class={style.page}>{content}</Page>, 
  [navigation, content])
}

export default ProfileShow;
