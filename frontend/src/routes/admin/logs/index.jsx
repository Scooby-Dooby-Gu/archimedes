import { useMemo, useAsyncForm, useState } from "/lib/hooks";
import * as formatters from '/lib/formatters';
import { useEffect } from "preact/hooks";
import style from './style.module.scss'
import { Icon, Grid, Page } from '/components/index.jsx';
import Header from '../header/index.jsx'
import { useFetchedData } from "../../../lib/hooks";

export default function({start, end, interval = 'month'}) {

  const [{logs}, logsRequest, fetchLogs] = useFetchedData('/logs', {
    placeholderState: {},
    immediate: false,
    initialState: {
      logs: []
    }
  })

  function stringifyIds(array) {
    return array.filter((a) => typeof a == 'number').join(',');
  }

  const onSubmit = (e) => {
    e.preventDefault();
    route('/admin/logs?start=' + document.querySelector('[name="start"]').value + '&end=' + document.querySelector('[name="end"]').value + '&interval=' + document.querySelector('[name="interval"]').value)
  }

  const navigation = useMemo(() => ({
    title: 'Logs',
    nav: [
      <Header />,
          
      <form onSubmit={onSubmit} class={style.form} id="form" action="/admin/logs" method="get">
        
        <label>
          <span>Start date</span>
          <input type="date" defaultValue={start} name="start" />
        </label>
        &nbsp;&ndash;&nbsp;
        
        <label>
          <span>End date</span>
          <input type="date" defaultValue={end} name="end" />
        </label>

        <label>
          <span>Breakdown</span>
          <select name="interval">
            <option value="day" selected={interval == 'day'}>Daily</option>
            <option value="week" selected={interval == 'week'}> Weekly</option>
            <option value="month" selected={interval == 'month'}>Monthly</option>
            <option value="year" selected={interval == 'year'}>Yearly</option>
          </select>
        </label>
        {/*
        <label>
          <span>Retention</span>
          <select name="retention">
            <option value={'1 days'}>1 day</option>
            <option value={'3 days'}>3 days</option>
            <option value={'7 days'} selected>7 days</option>
            <option value={'10 days'}>10 days</option>
            <option value={'14 days'}>14 days</option>
            <option value={'21 days'}>21 days</option>
            <option value={'30 days'}>30 days</option>
          </select>
        </label> */}
        <button>Show</button>
      </form>
    ]
      
  }), []);

  const groups = {};
  const dates = [];
  logs.forEach((log) => {
    if (!groups[log.type]) groups[log.type] = {};
    groups[log.type][log.date] = log;
    if (!dates.includes(log.date)) dates.push(log.date);
  })
  dates.sort().reverse()

  const keys = Object.keys(groups).sort()
  if (keys.includes('External sources')) {
    keys.splice(keys.indexOf('External sources'), 1)
    keys.push('External sources')
  }
  if (keys.includes('External targets')) {
    keys.splice(keys.indexOf('External targets'), 1)
    keys.push('External targets')
  }
  

  useEffect(() => {
    document.querySelector('[name="start"]').value = start;
    document.querySelector('[name="end"]').value = end;
    document.querySelector('[name="interval"]').value = interval;
  }, [start, end, interval]) 

  useEffect(() => {
    document.querySelector('#form button').click();;
  }, [])

  useEffect(() => {
    fetchLogs({
      start: document.querySelector('[name="start"]').value, 
      end: document.querySelector('[name="end"]').value,
      interval: document.querySelector('[name="interval"]').value
    })
  }, [start, end, interval])

  const dependencies = {
    'Emails clicked': 'Emails sent',
    'Events': 'Page views',
    'Page views (users)': 'Page views',
    'Page views (guest)': 'Page views',
  }

  keys.forEach((k) => {
    const split = k.split('/', 2);
    if (split.length > 1) {
      dependencies[k] = split[0];
    }
  })

  const grouppings = [[
    'Users signed up',
    'Users verified',
    'Invites'
  ], [
    'Achievements',
    'Game turns',
    'Daily goal',
    'Lessons attempted',
    'Discussions',
    'Questions answered',
    'Things completed',
    'Initial ambitions',
  ], [
    'Session duration',
    'Session page views',
    'Logins',
    'Page views',
    'Emails sent',
    'Public lesson visits',
    'Push subscriptions',
    'External sources',
    'External targets',
  ]]


  const [openGroups, setOpenGroups] = useState({});

  function renderColumns(key, dates) {
    return dates.map((date) => {
      const denominator = 
        key === 'Users verified'  
          ? 'Users signed up' : 
        key === 'Users verified/Active'
        || key === 'Users signed up/In limbo (1wk+)'
        || key === 'Users verified/Never active (1wk+)'
          ? 'Users verified' 
          : 'Users verified/First signin'
      
      const parent = dependencies[key];
      const totalUserCount = groups[denominator] && groups[denominator][null] ? groups[denominator][null].unique.length : 0;
      const totalCount = groups[parent] && groups[parent][null] ? groups[parent][null].count : 0;
      const log = groups[key][date];
      const count = log && (key.includes('Users verified/Active') ? log.unique.length : log.count || 0);
      const unique = log && !key.match(/Users|Emails sent/) && log.unique || [];
      return [
        /*
          <td class={`${New == 0 ? '' : ''} ${style.new}`}><a href={`/admin/users?ids=${New.join(',')}`}>{New.length}</a></td>,
          <td class={`${retained == 0 ? '' : ''} ${style.retained}`}><a href={`/admin/users?ids=${retained.join(',')}`}>{retained.length}</a></td>,
        */
        <td class={`${style.total}`}>
          {key.includes('Session duration') ? [
            log && log.min != 0 && <span class={style.max}>{formatters.interval(log.min)}</span>,
            log && log.max != 0 && <span class={style.min}>{formatters.interval(log.max)}</span>,
            count != 0 && formatters.interval(count),
            
          ] : [
            key !== 'Users signed up' && count != 0 && totalCount != 0 && <span class={style.percentage}>{formatters.rate(count / totalCount, 0)}</span>,
            count != 0 && <a href={`/admin/users?ids=${stringifyIds(unique)}`}>{count}</a>
          ]}
          
        </td>,
        
        <td class={`${style.unique}`}>
          {unique.length > 0 && <a href={`/admin/users?ids=${stringifyIds(unique)}`}>{unique.length}</a>}
          {key !== 'Users signed up' && unique.length > 0 && totalUserCount != 0 && <span class={style.percentage}>{formatters.rate(unique.length / totalUserCount, 0)}</span>}
        </td>,
      ]
    })
  }
  const funnel = [
    //['Users signed up'],
    [['Users verified', 'Verified']],
    [['Users verified/First signin', 'Onboarded']],
    [['Users verified/First active', 'Tried app']],
    [['Users verified/Retained (3d)', 'Retained (3 days)']],
    [['Users verified/Retained (1wk)', 'Retained (7 days)']],
    //[['Users verified/First active', '1 week']],
  ]
  const funnel2 = [
    //['Users signed up'],
    [['Questions answered/Ambitions', '1st ambition started']],
    [['Things completed/Lessons in goal', '1st lesson complete']],
    [['Things completed/Lessons in goal (2+)', '2nd lesson complete']],
    [['Things completed/Goals', '1st goal complete']],
    [['Things completed/Goals (2+)', '2nd goal complete']],
    [['Things completed/Ambitions', '1st ambition complete']],
    [['Questions answered/2nd ambition', '2nd ambition started']],
    [['Things completed/Ambitions (2+)', '2nd ambition complete']],
    //[['Users verified/First active', '1 week']],
  ]

  const renderFunnelStep = function(funnel, groups, date, count, top) {
    const step = funnel[0];
    if (!step) return;
    const [[key, title]] = step;
    const rest = funnel.slice(1);
    if (!groups[key]) return;
    const row = groups[key][date];
    if (!count) count = row.unique.length;
    if (!top) top = count;
    return <div class={style.funnel} style={{width: formatters.rate(Math.min(1, row.unique.length / count))}}>
      <span>{title} <em>{row.unique.length}</em></span>
      <b>{formatters.rate(Math.min(1, row.unique.length / top))}</b>
      {renderFunnelStep(rest, groups, date, row.unique.length, top)}
    </div>
  }

  function renderGroup(key, i, localIndex) {
    const onToggleGroup = () => {
      setOpenGroups((openGroups) => ({
        ...openGroups,
        [key]: !openGroups[key]
      }))
    }
    return [
      <tr class={`${dependencies[key] ? style.dependent : null} ${localIndex == 0 && style.first} ${i % 2 ? style.odd : style.even}`} hidden={dependencies[key] && !openGroups[dependencies[key]]}>
        <th onClick={onToggleGroup}>
          {key} {(openGroups[key] ? <Icon.Down /> : <Icon.ChevronRight />)}
        </th>
        {renderColumns(key, dates)}
      </tr>,
      keys.filter((k) => dependencies[k] == key).map((key) => {
        return <tr class={`${style.dependent}  ${i % 2 ? style.odd : style.even}`} hidden={dependencies[key] && !openGroups[dependencies[key]]}>
          <th>
            {key.split('/').slice(1).join('/') || key}
          </th>
          {renderColumns(key, dates)}
        </tr>
      })
    ]
  }

  function renderRow(key, i, localIndex) {
    return <tr class={`${style.separate}  ${localIndex == 0 && style.first} `} hidden={dependencies[key] && !openGroups[dependencies[key]]}>
      <th>
        {key}
      </th>
      {renderColumns(key, dates)}
    </tr>
  }
  const activeGroups = Object.values(dependencies).filter((d) => keys.some((k) => dependencies[k] == d))
  var i = 0;

  const retentionRows = keys.filter((k) => k.includes('Retention'));
  const retentionFunnel = <th rowspan={6} colspan={3} class={style.funnelHolder}>{renderFunnelStep(funnel, groups, null, null)}</th>;
  const engagementFunnel = <th rowspan={100} colspan={3} class={style.funnelHolder}>{renderFunnelStep(funnel2, groups, null, null)}</th>
  
  return <Page id="logs" class={style.page} navigation={navigation}>
    <table class={style.table} >
      <caption>
        {/*
        <span class={style.new}>New users</span>
        <span class={style.retained}>Retained users</span>*/}
        <span class={style.total}>Number of events</span>
        <span class={style.unique}>Unique users</span>
      </caption>
      <thead class={style.retention}>
        {Array(Math.max(16, retentionRows.length)).fill(0).map((k, index) => {
          const key = retentionRows[index];
          return <tr>
            {index == 0 && retentionFunnel}
            {index == 6 && engagementFunnel}
            {key == null ? <td>&nbsp;</td> :  dates.map((date) => {
              if (date == null) return null;
              const base = key//'Users verified/Active'//First signin';
              const totalUserCount = groups[base] && groups[base][null] ? groups[base][null].unique.length : 0;
              const log = groups[key][date];
              const unique = log && log.unique || [];

              return [
                <td class={`${style.retention}`} colspan="2" style={{background: `rgba(0,155,0, ${unique.length / totalUserCount})`}}>
                  {unique.length > 0 && <span>
                    <a href={`/admin/users?ids=${stringifyIds(unique)}`}>{unique.length}</a>
                    {totalUserCount != 0 && <span class={style.percentage}>{formatters.rate(unique.length / totalUserCount, 0)}</span>}
                  </span>}
                </td>,
              ]
            })}
          </tr>
        })}
        <tr class={style.spacing}><td></td></tr>
      </thead>
      <thead>
        <tr>
          <th></th>
          {dates.map((d) => {
            const s = new Date(d + 'T00:00:00.000Z');
            const e = new Date(d + 'T00:00:00.000Z');
            s.setDate(s.getDate());
            if (interval == 'day') {
              e.setDate(e.getDate() + 1);
            } else if (interval == 'week') {
              e.setDate(e.getDate() + 7);
            } else if (interval == 'month') {
              e.setMonth(e.getMonth() + 1);
            } else if (interval == 'year') {
              e.setYear(e.getYear() + 1);
            }
            return <th colspan="2">
              <a href={`/admin/logs?interval=${interval}&start=${!d ? '' : s.toISOString().split('T')[0]}&end=${!d ? '' : e.toISOString().split('T')[0]}`}>
                {d ? [new Date(d).toLocaleDateString('en-US', {day: '2-digit', month:"short"})] : 'Total'}
              </a></th>
          })}
        </tr>
      </thead>
      <tbody>
        {grouppings.map((groupping) => {
          var rendered = 0;
          return groupping.map((key) => {
            if (!keys.includes(key)) return;
            return [
              activeGroups.includes(key) && renderGroup(key, i++, rendered++),
              !activeGroups.includes(key) && dependencies[key] && renderRow(key, i++, rendered++),
            ]
          })
        })}
      </tbody>
    </table>
  </Page>
}