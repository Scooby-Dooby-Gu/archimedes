import { accountState } from '../lib/states.js';


import {  useStore, useEffect, useMemo } from '/lib/hooks/index.jsx';

import Layout from '/components/layout'

import Welcome from '../routes/app/welcome';
import Start from '../routes/app/start';
import Crash from '../routes/app/crash';
import GetApp from '../routes/app/get_app';
import EnableNotifications from '../routes/app/enable_notifications';
//.import Intro from '../routes/unused/intro';


import Game from '../routes/play/game';
import GameReset from '../routes/play/reset_game';

import Profile from '../routes/profile/show';
import Signin from '../routes/profile/signin';
import Signup from '../routes/profile/signup';
import RequestAccess from '../routes/profile/request_access';
import Signout from '../routes/profile/signout';
import Settings from '../routes/profile/settings';
import AcceptInvite from '../routes/profile/accept_invite';
import Invite from '../routes/profile/new_friend';
import Verification from '../routes/profile/verification';
import Waitlist from '../routes/profile/waitlist';

import Board from '../routes/discuss/board';
import EditBoard from '../routes/discuss/edit_board';
import Topic from '../routes/discuss/topic';
import EditTopic from '../routes/discuss/edit_topic';
import Discussion from '../routes/discuss/discussion';
import EditDiscussion from '../routes/discuss/edit_discussion';
import SearchDiscussion from '../routes/discuss/search_discussions';
//import Rankigs from '../routes/progress/rankings';

import EditLesson from '../routes/learn/edit_lesson';
import Lesson from '../routes/learn/lesson';
import Course from '../routes/learn/course';
import Courses from '../routes/learn/courses';
import EditCourse from '../routes/learn/edit_course';
import Terms from '../routes/learn/terms';  

import EditCompany from '../routes/admin/edit_company';
import Companies from '../routes/admin/companies';
import Company from '../routes/admin/company';
import Users from '../routes/admin/users';
import Invites from '../routes/admin/invites';
import Logs from '../routes/admin/logs';

import ResetPassword from '../routes/profile/reset_password';
import ChangePassword from '../routes/profile/change_password';
import Videos from '../routes/watch/videos';
import Video from '../routes/watch/video';
import EditVideo from '../routes/watch/edit_video';
import Goals from '../routes/progress/goals';
import EditGoal from '../routes/progress/edit_goal';
import Ambitions from '../routes/progress/ambitions';
import Ambition from '../routes/progress/ambition';
import EditAmbition from '../routes/progress/edit_ambition';
import Goal from '../routes/progress/goal';
import EditTask from '../routes/progress/edit_task';
import Trends from '../routes/admin/trends';


const locationSearch = location.search;

export function hideLoader() {
  if (window.loader) {
    loader.classList.add('loaded');
    document.body.style.overflow = '';
  }
}



export default function App() {
  // read out "redux" state

  const auth = useStore('auth');
  const initialized = useStore('app.initialized');
  const company = useStore('auth.company');
  const open = useStore('app.open');
  const submissions = useStore('data.submissions');
  const openDiscussions = useStore('app.openDiscussions') && !company;
  const settings = useStore('data.user.settings');
  
  const user = auth.user;

  const account = accountState(user);
  const isUser = account === 'active' && user;
  const isOnboarding = account === 'unverified';
  const isAdmin = isUser && user.role === 'admin';
  const isManager = isUser && user.role === 'manager' // company && company.managerIds && company.managerIds.includes(user.id);
  const isGuest = !user;

  useEffect(() => {
    dispatch('ingressNotificationValues')

    const checkStatus = () => {
      if (!document.hidden)
        dispatch('requestNotificationStatus')
    }
    checkStatus();
    document.addEventListener("visibilitychange", checkStatus);
    return () => {
      document.removeEventListener("visibilitychange", checkStatus);
    }
  }, [user && user.id, auth.deviceTokenStatus])

  // fetch shared data initially
  useMemo(() => {
    if (isUser) {
      dispatch('fetchEverything')
    }
  }, [user && user.id, isUser, location.pathname.indexOf('paper-chase/reset')])

  
  // listen for window size changes to set breakpoint/maxWidth
  useEffect(() => {
    const setBreakpoint = () => {
      dispatch({ type: 'setBreakpointAutomatically' })
    }
    setBreakpoint();
    window.addEventListener('resize', setBreakpoint)
    window.addEventListener('orientationchange', setBreakpoint)
    return () => {
      window.removeEventListener('resize', setBreakpoint)
      window.removeEventListener('orientationchange', setBreakpoint)
    }
  }, []);



  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const setMotionSettings = () => {
      dispatch({ type: 'setBreakpointAutomatically' })
    }
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', setMotionSettings);
      return () => {
        mediaQuery.removeEventListener('change', setMotionSettings);
      }
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(setMotionSettings);
      return () => {
        mediaQuery.removeListener(setMotionSettings);
      }
    }
  }, []);

  useEffect(() => {
    const campaign = (locationSearch && locationSearch.match(/campaign=([^&]+)/) || [])[1];
    const action = (locationSearch && locationSearch.match(/action=([^&]+)/) || [])[1];
    const label = (locationSearch && locationSearch.match(/label=([^&]+)/) || [])[1];
    const uid = (locationSearch && locationSearch.match(/uid=([^&]+)/) || [])[1];
    if (campaign) {
      track('send', 'event', campaign, action, label, undefined, uid)
    }
  }, []);

  useEffect(() => {
    parent.postMessage('loaded', "*");
    if (!window.loaderRequired) {
      setTimeout(hideLoader, 500)
    }
  }, []);
  
  // This approach with multiple routers enables three-pane ui for desktop
  
  // allow certain routes match by prefix when on desktop
  const startsWith = (path) => {
    return path + '/:a?/:b?/:c?/:d?/:e?/:f?'
  }
  
  return useMemo(() => initialized && <Layout>
   {<AcceptInvite name="accept_invite" column="fullscreen" path={startsWith("/invites/:inviteId")} layout="minimal" />}
    {(isUser || isOnboarding)  && <Signout column="fullscreen" path={startsWith("/signout")} layout="minimal" />}
    {isGuest && <Signup name="signup" column="fullscreen" path={startsWith("/signup")} layout="minimal" />}
    {isGuest && <RequestAccess name="signup" column="fullscreen" path={startsWith("/request_access")} layout="minimal" />}
    {isGuest && <Signin name="signin" column="fullscreen" path={startsWith("/signin")} layout="minimal" />}
    {isGuest && <Welcome name="welcome" column="fullscreen" default layout="minimal" />}
    {isOnboarding && open && <Verification name="verification" column="fullscreen" default layout="minimal" />}
    {isOnboarding && !open && <Waitlist name="waitlist" column="fullscreen" default layout="minimal" />}
    {isOnboarding && <Invite name="invite" column="fullscreen" path={startsWith("/users/:userId/friends/new")} layout="minimal"  />}
    {<Verification name="verify" column="fullscreen" path={startsWith("/verify")} layout="minimal" />}
    <ResetPassword name="reset_password" column="fullscreen" path={startsWith("/reset_password")} layout="minimal" />
    
    {<Lesson name="shared_lesson" visibility="public" column="fullscreen" path={startsWith("/lessons/:lessonId")} />}
    {<Videos depth="1" name="videos" visibility="public" column="first" path={startsWith("/videos/:videoId?")} />}
    {<Video depth="2" name="video" visibility="public" column="second" path={startsWith("/videos/:videoId")} />}
    
    {!company && isUser && <Board depth="2" name="board" column="first" path={startsWith("/boards/:boardId/:topics?/:topicId?")} />}
    {isUser && <SearchDiscussion name="search_discussion" column="first" path={startsWith("/boards/search/:boardId?")} />}


    {isAdmin && <EditVideo depth="2" name="new_video" column="second" path={startsWith("/videos/new")} />}
    {isAdmin && <EditVideo depth="2" name="edit_video" column="second" path={startsWith("/videos/:videoId/edit")} />}
    
    {isUser && <EditBoard name="edit_board" column="second" path={startsWith("/boards/new")} />}
    {isUser && <EditBoard name="edit_board" column="second" path={startsWith("/boards/:boardId/edit")} />}
    {isUser && <EditTopic name="edit_topic" column="second" path={startsWith("/boards/:boardId/topics/new")} />}
    {isUser && <EditTopic name="edit_topic" column="second" path={startsWith("/boards/:boardId/topics/:topicId/edit")} />}
    {isUser && <Topic depth="4" name="topic" column={openDiscussions ? "second" : "first"} path={startsWith("/boards/:boardId/topics/:topicId/:discussions?/:discussionId?")} />}
    {isUser && <Discussion depth="6" name="discussion" column={openDiscussions ? "third" : "second"} path="/boards/:boardId/topics/:topicId/discussions/:discussionId" />}
    {isUser && <Discussion depth="6" name="discussion" column="second" path="/boards/search/:boardId/topics/:topicId/discussions/:discussionId" />}
    {isUser && <EditDiscussion name="edit_discussion" column={openDiscussions ? "third" : "second"} path="/boards/:boardId/topics/:topicId/discussions/new" />}
    {isUser && <EditDiscussion name="edit_discussion" column={openDiscussions ? "third" : "second"} path="/boards/:boardId/topics/:topicId/discussions/:discussionId/edit" />}
    
    {isUser && <Ambitions name="ambitions" column="first" path={startsWith("/ambitions/:ambitionId?")} />}
    {isUser && <Ambition name="ambition" column="first" path={startsWith("/ambitions/:ambitionId/:goals?/:goalId?")} />}
    {isAdmin && <EditAmbition name="new_ambition" column="first" path={startsWith("/ambitions/new")} />}
    {isAdmin && <EditAmbition name="edit_ambition" column="first" path={startsWith("/ambitions/:ambitionId/edit")} />}
    {isAdmin && <EditGoal name="new_goal" column="second" path={startsWith("/ambitions/:ambitionId/assignments/new")} />}
    {isAdmin && <EditGoal name="edit_goal" column="second" path={startsWith("/ambitions/:ambitionId/assignments/:assignmentId/edit")} />}
    {isUser && <Goal name="goal" column="second" path={startsWith("/ambitions/:ambitionId/goals/:goalId/:taskType?/:taskId?")} />}
    {isAdmin && <EditTask name="new_task" column="third" path={startsWith("/ambitions/:ambitionId/goals/:goalId/tasks/new")} />}
    {isAdmin && <EditTask name="edit_task" column="third" path={startsWith("/ambitions/:ambitionId/goals/:goalId/tasks/:taskId/edit")} />}
    {isUser && <Lesson depth="6" name="goal_lesson" column="third" path={startsWith("/ambitions/:ambitionId/goals/:goalId/lessons/:lessonId")} />}
    {isUser && <Video name="goal_video" column="third" path={startsWith("/ambitions/:ambitionId/goals/:goalId/videos/:videoId")} />}
    
    {isUser && <Courses depth="1" name="levels" column="first" path={startsWith("/courses/:courseId?/:lessons?/:lessonId?")} />}
    {isUser && <Course depth="2" name="course" column="second" path={startsWith("/courses/:courseId/:lessons?/:lessonId?")} />}
    {isAdmin && <EditCourse name="edit_course" column="second" path={startsWith("/courses/new")} />}
    {isAdmin && <EditCourse name="edit_course" column="second" path={startsWith("/courses/:courseId/edit")} />}
    {isUser && <Terms depth="2" name="terms" column="second" path={startsWith("/courses/terms")} />}
    {isUser && <Lesson depth="3" name="terms_lesson" column="third" path={startsWith("/courses/terms/lessons/:lessonId")} />}
    {isUser && <Lesson depth="4" name="lesson" column="third" path="/courses/:courseId/lessons/:lessonId/:step?" />}
    {isAdmin && <EditLesson name="edit_lesson" column="third" path="/courses/:courseId/lessons/new" />}
    {isAdmin && <EditLesson name="edit_lesson" column="third" path="/courses/:courseId/lessons/:lessonId/edit" />}
    
    {/*
    {hasCurriculum && isUser && <Lesson depth="3" name="lesson" column="second" path={startsWith("/courses/:courseId/lessons/:lessonId/:step?")} />}
    {(isAdmin || isManager) && <EditCompany name="edit_company" column="second" path={startsWith("/rankings/:type/companies/new")} />}
    {(isAdmin || isManager) && <EditCompany name="edit_company" column="second" path={startsWith("/rankings/:type/companies/:companyId/edit")} />}
     */}
    {isAdmin && <Companies name="companies" column="first" path={startsWith("/companies/:companyId?")} />}
    {isAdmin && <Company name="company" column="second" path={startsWith("/companies/:companyId/:section?/:userId?")} title="Company" />}
    {isAdmin && <Profile name="profile" column="third" path={startsWith("/companies/:companyId/users/:userId")}  />}
    {isAdmin && <EditCompany name="edit_company" column="second" path={startsWith("/companies/new")} />}
    {isAdmin && <EditCompany name="edit_company" column="second" path={startsWith("/companies/:companyId/edit")} />}
    {isAdmin && <Users name="users" column="first" path={startsWith("/admin/users/:userId?")} />}
    {isAdmin && <Invites name="invites" column="third" path={startsWith("/companies/:companyId/invites")} />}
    {isAdmin && <Logs name="logs" column="fullscreen" path={startsWith("/admin/logs")} />}
    {isAdmin && <Trends name="trends" column="fullscreen" path={startsWith("/admin/trends")} />}

    {isUser && <Profile depth="3" name="profile" column="second" path={startsWith("/admin/users/:userId/:section?/:friendId?")}  />}
    {isUser && <Profile depth="4" name="profile" column="first" path={startsWith("/users/:userId/:section?/:friendId?")}  />}
    {isUser && <Profile depth="5" name="friend" column="second" path={startsWith("/users/:originId/friends/:userId/:section?")}  />}
    {isUser && <Invite name="invite" column="second" path={startsWith("/users/:userId/friends/new")}  />}
    {isUser && <Settings name="settings" column="second" path={startsWith("/users/:userId/settings/:section?")} />}
    
    {isUser && <ChangePassword name="change_password" column="third" path="/users/:userId/settings/password/edit" />}
    {!isUser && <ChangePassword name="change_password" column="fullscreen" path="/users/:userId/password/edit" layout="minimal" />}
    
    {isUser && company && <Invites name="invites" column="second" path={startsWith("/rankings/:type/invites")} />}
    {isUser && <GameReset name="reset" column="fullscreen" path="/games/:gameId/reset" />}
    {isUser && <Game name="game" column="fullscreen" path="/games/:gameId/:section?/:itemId?" />}
    {<Crash path="/crash" name="crash" layout="minimal" column="first" />}
    {isUser && <GetApp layout="minimal" path="/get_app" name="get_app" column="fullscreen" />}
    {isUser && <EnableNotifications layout="first" path="/enable_notifications" name="enable_notifications" column="first" />}
    {isUser && <Start default name="start" column="first" />}
    
    

  </Layout>, [initialized, company, isUser, user, user && user.verifiedAt, isAdmin, isGuest])
}
