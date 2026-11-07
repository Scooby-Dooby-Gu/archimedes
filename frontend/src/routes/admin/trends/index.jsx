import { useChart, useMemo, useAsyncForm, useState } from "/lib/hooks";
import * as formatters from '/lib/formatters';
import { useEffect } from "preact/hooks";
import { Icon, Grid, Page } from '/components/index.jsx';
import Header from "../header";
import style from './style.module.scss';
import { useFetchedData } from "../../../lib/hooks";


export default  function Trends({start, end, interval}) {
  const [logs, setLogs] = useState([]);

  const [request, onSubmit] = useAsyncForm((response) => {
    setLogs(response.data.logs)
  })

  const [{trends}, trendRequest] = useFetchedData('/trends');

  function stringifyIds(array) {
    return array.filter((a) => typeof a == 'number').join(',');
  }

  const navigation = useMemo(() => ({
    title: 'Logs',
    nav: [
        <Header />,
          
        /*<form class={style.form} id="form" action="/logs" onSubmit={onSubmit} method="get">
        
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
            <option value="day">Daily</option>
            <option value="week" selected>Weekly</option>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
        </label>
        <button>Show</button>
      </form>*/
    ],
    requests: [trendRequest]
      
  }), []); 
  const questions = trends.reduce((qs, a) => {
    (qs[a.question] || (qs[a.question] = [])).push(a);
    return qs;
  }, {})
  return <Page name="Trends" navigation={navigation}>
    <h1>Trends</h1>
    <div class={style.questions}>
      {Object.entries(questions).map(([q, answers]) => 
        <Question question={q} answers={answers} />
      )}
    </div>
  </Page>
}

function Question ({question, answers}) {
  answers.sort((a, b) => {
    return b.count - a.count;
  });
  const chart = useChart({
    series: answers.map((a) => a.count),
    labels: answers.map((a) => a.answer),
    chart: {
      height: 370,
      width: 370,
      type: 'donut',
      events: {
        dataPointSelection: function(event, chartContext, config) {
          const answer = answers[config.dataPointIndex];
          route('/admin/users?ids=' + (answer.users || []).join(','))
        }
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '80%',

        }
      },
    },
    dataLabels: {
      show: false,
      style: {
        fontSize: '18px'
      },
      formatter: (val, opts) => {
        return answers[opts.seriesIndex].count + '\n (' + formatters.rate(val / 100, 0)  + ')'
      }
    },
    grid: {
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
      }
    },
    tooltip: {
      enabled: false
    },
    legend: {
      position: 'top',
      floating: true
    },
  }, [answers])
  return <div class={style.question}>
    <header>
      <h2>{question}</h2>
      <p>({answers[0].context})</p>
    </header>
    {chart}
  </div>
}