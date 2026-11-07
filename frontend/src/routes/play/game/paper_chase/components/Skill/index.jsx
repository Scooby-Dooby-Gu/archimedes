import style from './style.module.scss';
import Icon from '../Icon';
import Button from '/components/button';
import { getSkills, isLessonComplete } from '/lib/data';
import { useCallback, useState } from '/lib/hooks/index.jsx';

export default function Skill({id, buttonId, title, description, theme, icon, level, value, max, skill, rewards, lesson}) {
  const [open, setOpen] = useState(false);
  const onToggle = useCallback((e) => {
    setOpen((open) => !open);
    e.preventDefault();
    e.stopPropagation();
  }, [])
  
  return <div class={`${style.wrapper} cover theme-${theme}`} id={id}>
    <div class={style.top}>
      {<Icon name={icon} />}
      <aside>
        <a class="plain" href={lesson && `/courses/${lesson.courseId}/lessons/${lesson.id}`}>Lvl. {level} </a>
      </aside>
      <h2>{title}</h2>
      <p>{description}</p>
      <progress max={max} value={value} />
      {/*<div class={style.progress}>
        <span>{value}/{max}</span>
      </div>*/}
    </div>
    {rewards && rewards.length > 0 && 
      <div class={style.details}>
        {!open && <a href="#" onClick={onToggle}>Show rewards <Icon.Down /></a>}
        {open && <a href="#" onClick={onToggle} class={style.collapse}>Hide level rewards <Icon.Up /></a>}
        {lesson && [
          <span>{value}/{max}</span>,
          <Button.Link id={buttonId} class="compact icon-right" icon="ChevronRight" href={`/courses/${lesson.courseId}/lessons/${lesson.id}`}>Next lesson</Button.Link>
        ]}
          {open && <dl>
            {rewards.slice(0, level + 1).map((reward, index) => [
              <dt class={index === level ? style.next : ''}>{index === level ? 'Next:' : `Level ${index + 1}:`}</dt>,
              <dd class={index === level ? style.next : ''}>{reward}</dd>
            ])}
          </dl>}
      </div>}
  </div>
}

Skill.ofUser = ({user, submissions, courses, ...props}) => {
  const skills = getSkills(submissions, courses);
  const skill = skills.find((skill) => skill.name == props.title)
  const name = props.title + ' ' + skill.points;
  const lesson = skill.lessons.find((lesson) => !isLessonComplete(lesson, submissions));
  if (skill) {
    return <Skill {...props} value={skill.passed} max={skill.total} lesson={lesson} level={skill.points} />
  } else {
    return <Skill {...props} />
  }
}