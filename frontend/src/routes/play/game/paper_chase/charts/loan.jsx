import { useMemo, useScript, useEffect, useChart } from '/lib/hooks/index.jsx';
import * as formatter from '/lib/formatters';

export default function LoanChart({breakdown, year}) {
  return useChart(() => ({
    tooltip: {
      enabled: false,
    },
    chart: {
      height: 200,
      type: 'bar',
      stacked: true,
      zoom: {
        enabled: false
      },
      toolbar: {
          show: false,
      },
      animations: {
        enabled: false,
      },
      selection: {
        enabled: false,
      }
    },
    states: {
      hover: {
          filter: {
              type: 'none',
          }
      },
  },
    series: [{
      name: 'Principal',
      data: breakdown.map((state, i) => [
        state.startingYear + i,
        state.yearlyPrincipal
      ])
    },{
      name: 'Interest',
      data: breakdown.map((state, i) => [
        state.startingYear + i,
        state.yearlyInterest
      ])
    }],
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: 'top',
      offsetY: 20,
      formatter: (label) => {
        if (label === 'Interest') {
          return `Interest (${formatter.currency(breakdown[breakdown.length - 1].paidInterest)})`
        }
        if (label === 'Principal') {
          return `Principal (${formatter.currency(breakdown[breakdown.length - 1].paidPrincipal)})`
        }
        return label;
      }
    },
    xaxis: {
      tickPosition: 'between',
      tickAmount: breakdown.length - 1,
      labels: {
        formatter: (v) => "'" + v.toString().substring(2),
        style: {
          fontSize: '10px',
          lineHeight: '10px',
          colors: '#8e8e93',
        },
        offsetY: -5
      }
    },
    yaxis: {
      labels: {
        formatter: (v) => formatter.currency(v),
        style: {
          fontSize: '10px',
          lineHeight: '10px',
          colors: '#8e8e93',
        },
        offsetX: 15
      }
    },
  }), [breakdown])
}