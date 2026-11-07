import { findSubmission, findSubmissionForTask } from "./data"
import { getSlug, matchSlug } from "./slugs"

export function getLocation({courseId, goalId, ambitionId, lessonId, videoId, from}) {
  if (from) {
    if (from.includes('/video')) {
      return { title: 'To video', url: from}
    } else if (from.includes('/paper-chase')) {
      return { title: 'To game', url: from}
    } else if (from.includes('lesson')) {
      if (lessonId) {
        return { title: 'To previous lesson', url: from}
      } else {
        return { title: 'Return', url: from }
      }
    } else {
      return { title: 'Back', url: from}
    }
  } else if (location.href.indexOf('/terms') > -1) {
    return { title: 'To glossary', url: `/courses/terms/` }
  } else if (videoId) {
    return { title: 'To video', url: `/videos/${videoId}` }
  } else if (courseId) {
    return { title: 'To course', url: `/courses/${courseId}` }
  } else if (goalId) {
    return { title: 'To goal', url: `/ambitions/${ambitionId}/goals/${goalId}` }
  } else if (ambitionId) {
    return { title: 'To ambition', url: `/ambitions/${ambitionId}` }
  }
}

export function getNextLocation({courseId, goalId, ambitionId, lessonId, videoId, from}, ambitions, courses, submissions) {
  if (goalId) {
    return getNextGoalLocation({goalId, ambitionId, lessonId, videoId, from}, ambitions, courses, submissions)
  } else {
    return getNextCourseLocation({courseId, lessonId, videoId, from}, ambitions, courses, submissions)
  }
}

export function getNextGoalLocation({goalId, ambitionId, lessonId, videoId, from}, ambitions, courses, submissions) {
  const ambition        = ambitions.find((a) => matchSlug(a, ambitionId));
  if (!ambition) return;
  const assignment      = ambition.assignments.find((a) => matchSlug(a.goal, goalId));
  if (!assignment) return;
  const { goal }        = assignment;
  const taskIndex = goal.tasks.findIndex((a) => lessonId ? a.lessonId == lessonId : videoId ?  a.videoId == videoId : false);
  if (taskIndex >= 0) {
    const nextTask = goal.tasks.find((t, i) => i > taskIndex && (t.type == 'lesson'/* || t.type == 'video'*/) && !findSubmissionForTask(submissions, t, true)) ||
                     goal.tasks.find((t) =>  (t.type == 'lesson'/* || t.type == 'video'*/) && !findSubmissionForTask(submissions, t, true));
    if (nextTask) {
      const slug = nextTask.url.split(/lessons\/|videos\//)[1];
      const url = `/ambitions/${ambitionId}/goals/${goalId}/${nextTask.type == 'video' ? 'videos' : 'lessons'}/${slug}`
      if (nextTask.type == 'lesson') {
        return { title: 'Next lesson', url: url}
      } else if (nextTask.type == 'video') {
        return { title: 'Next video', url: url}
      }
    }
  } 
}

export function getNextCourseLocation({courseId, lessonId}, ambitions, courses, submissions) {
  const course        = courses.find((a) => matchSlug(a, courseId));
  if (!course) return;
  const lessonIndex   = course.lessons.findIndex((l) => matchSlug(l, lessonId));
  if (lessonIndex >= 0) {
    const nextLesson = course.lessons.find((l, i) => i > lessonIndex && !findSubmission(submissions, 'lesson', l.id, true)) ||
                     course.lessons.find((l, i) => !findSubmission(submissions, 'lesson', l.id, true));
    if (!nextLesson) return;
    return { title: 'Next lesson', url: `/courses/${courseId}/lessons/${getSlug(nextLesson)}`}
  }
}