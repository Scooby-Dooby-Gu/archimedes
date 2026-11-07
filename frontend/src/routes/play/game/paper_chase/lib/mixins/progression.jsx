import { useEffect, useMemo } from '/lib/hooks/index.jsx';
import lessonGroups from '../data/lessons';

export default function PaperChaseGating({ world, data, decisions, params, input }) {
  
  const active = params.next != null

  const started = (!localStorage['year'] &&  world.state.turn == -1) || localStorage['year'] == world.state.year// || data.session.actions.length;

  const phase = (() => {
    if (world.state.finished && params.section !== 'results') {
      return 'last';
    } else if (world.state.finished) {
      return 'over';
    } else if (world.state.choices.joinedInvestmentClub && world.state.consultationsAvailable > 0 && params.section === 'economy' && active) {
      return 'consultations'
    } else if (world.state.choices.joinedInvestmentClub && params.section == 'economy' && active) {
      return 'economy'
    } else if (!active && started && decisions.outstanding.length > 0) {
      return 'decisions'
    } else if (!started ) {
      return 'continue'
    } else if (world.state.choices.joinedInvestmentClub && params.section !== 'economy' && active) {
      return 'news'
    } else if (params.section === 'review') {
      return 'ready';
    } else {
      return null;
    }
  })();
  return {
    started,
    phase,
    active
  }
}

export function getSuggestedGameLessons(courses, state) {
  const allLessons = courses.reduce((allLessons, course) => {
    return allLessons.concat(course.lessons)
  }, [])
  //const requiredLessonAction = actions.find((action) => action.lessonId);
  var candidateLessons = lessonGroups.reduce((candidateLessons, group) => {
    if (group.condition(state)) {
      return candidateLessons.concat(group.lessons.filter((id) => 
        allLessons.find((lesson) => lesson.id == id))
        .map((id) => ({id, group})))
    }
    return candidateLessons;
  }, [])//requiredLessonAction ? [{id: requiredLessonAction.lessonId}] : [])
  if (!candidateLessons.length) {
    candidateLessons = allLessons.filter((lesson) => ({id: lesson.id}))
  }
  return candidateLessons.map((candidateLesson) => {
    const lesson = allLessons.find((lesson) => lesson.id == candidateLesson.id);
    if (lesson) {
      return {
        //...passedLessons.find((lesson) => lesson.id == candidateLesson.id),
        ...lesson,
        group: candidateLesson.group,
        reason: candidateLesson.group && candidateLesson.group.description,
        course: courses.find((course) => course.id == lesson.courseId)
      }
    }
  })
}