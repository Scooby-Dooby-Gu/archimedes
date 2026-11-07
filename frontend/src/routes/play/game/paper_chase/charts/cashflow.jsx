import { useMemo, useScript, useEffect } from '/lib/hooks/index.jsx';
import { useChart } from '/lib/hooks/index.jsx';
import * as formatter from '/lib/formatters'
import { mergeDeep } from '/lib/helpers';


export default function CashflowChart({ states, ...options }) {
  return useChart(() => mergeDeep({
    chart: {
      height: '100%',
      type: 'area',
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 1,
      colors: ["transparent"]
    },
    grid: {
      xaxis: {
        lines: {
          show: false
        },
      },
      yaxis: {
        lines: {
          show: false
        },
      },
    },
    yaxis: {
      show: false,
      floating: true,
      labels: {
        formatter: (v) => formatter.currency(v),
        offsetX: 30,
      },
    },
    xaxis: {
      labels: {
        formatter: (val) => val === states[states.length - 1].year ? 'now' : val,
        offsetX: 3.5,
      },
      //type: 'datetime',
      tooltip: {
        enabled: false
      }
    },
    legend: {
      show: false,
      horizontalAlign: 'left',
      offsetX: -35,
      yaxis: {
      }
    },
    tooltip: {
      enabled: false,
      shared: true,
      x: {
        //formatter: function(val) {
        //    return new Date(val).getFullYear()
        //}
      },
      y: {
        formatter: (v) => formatter.currency(v)
      }
    },
    annotations: {
      points: states.reduce((points, year) => {
        const loans = [
          ['Loan', year.credit.loans]
        ].filter((l) => l[1]);
        const loanPoints = loans.map((loan) => ({
          x: new Date(year.year, 0, 1).getTime(),
          y: year.creditTotal,
          marker: {
            size: 3,
            fillColor: 'transparent',
            strokeColor: 'green',
            radius: 5,
          },
          label: {
            text: 'Loan',
            offsetY: 0
          },
        }))

        return points.concat(loanPoints);
      }, [])
    },
    series: [
      {
        name: 'Credit',
        data: states.map((year) => ({
          x: year.year,
          y: year.creditTotal
        }))
      },
      {
        name: 'Debit',
        data: states.map((year) => ({
          x: year.year,
          y: year.debitTotal
        }))
      },
    ]
  }, options), [states]);
}


CashflowChart.Sparkline = (options) => CashflowChart(mergeDeep(options, {
  chart: {
    sparkline: {
      enabled: true
    },
    type: 'line',
    height: 50,
    width: 100
  },
  stroke: {
    width: 1,
    curve: 'smooth',
    colors: ["#22aa99"]
  },
  grid: {
    row: {
      colors: [],
    },
    padding: {
      left: 5,
      right: 5,
      bottom: 5,
      top: 5
    }
  },
  tooltip: {
    enabled: false
  },
  annotations: {
    points: []
  },
  series: [
    {
      name: 'Credit',
      data: options.states.map((year) => ({
        x: year.year,
        y: year.creditTotal - year.debitTotal
      }))
    },
  ]
}))