import style from './style.module.scss';

export const LocalizedDate = ({ date, ...props }) => (
  <time title={(new Date(date)).toString()} {...props} class={`date ${style.date} ${props.class}`}>
    {(new Date(date)).toLocaleDateString([], {year: getYearSettings(date), month: 'short', day: 'numeric'})}
  </time>
);

export const LocalizedTime = ({ date, ...props }) => (
  <time title={(new Date(date)).toString()} {...props} class={`date ${style.date} ${props.class}`}>
    {(new Date(date)).toLocaleTimeString()}
  </time>
);

export const LocalizedDateTime = ({ date, ...props }) => (
  <time title={(new Date(date)).toString()} {...props} class={`date ${style.date} ${props.class}`}>
    {(new Date(date)).toLocaleString([], {year: getYearSettings(date), month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
  </time>
);

function getYearSettings(date, format = 'numeric') {
  if (new Date(date).getYear() !== (new Date).getYear()) {
    return format;
  }
}