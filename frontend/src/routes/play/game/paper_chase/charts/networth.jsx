import { useMemo, useScript, useEffect } from '/lib/hooks/index.jsx';
import { useChart } from '/lib/hooks/index.jsx';
import * as formatter from '/lib/formatters'
import { mergeDeep } from '/lib/helpers';


export default function NetworthChart({ states, ...options }) {
  const colors = `#ff9900 #22aa99 #109618 #990099 #0099c6 #66aa00 #316395 #994499 #22aa99 #aaaa11 #6633cc #e67300 #8b0707 #651067 #329262 #5574a6 #3b3eac #b77322 #16d620 #b91383 #f4359e #9c5935 #a9c413 #2a778d #668d1c #bea413 #0c5922 #743411`.split(/\s/g);
  return useChart(() => mergeDeep({
    colors,
    chart: {
      height: '100%',
      type: 'area',
      stacked: true,
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
        name: 'Investments',
        data: states.map((state) => ({
          x: state.year,
          y: state.assets.brokeragePortfolio + state.assets.retirementPortfolio
        }))
      },
      {
        name: 'Cash minus debt',
        data: states.map((state) => ({
          x: state.year,
          y: Math.max(0, state.assets.cash) + state.assets.personalDebt + state.assets.schoolDebt
        }))
      },
      {
        name: 'Asset value',
        data: states.map((state) => ({
          x: state.year,
          y: state.assets.property + state.assets.mortgageDebt + (state.business ? state.business.valuation : 0)
        }))
      },
      {
        name: 'Retirement',
        data: states.map((state) => ({
          x: state.year,
          y: state.retirementSavings
        }))
      },
    ]
  }, options), [states]);
}


NetworthChart.Sparkline = (options) => NetworthChart(mergeDeep(options, {
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
      name: 'Networth',
      data: options.states.map((year) => ({
        x: year.year,
        y: year.networth
      }))
    },
  ]
}))