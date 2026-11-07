import { useState, useChart, useRef, useMemo } from '/lib/hooks/index.jsx';
import * as formatters from '/lib/formatters';
import style from './style.module.scss';
import { mergeDeep } from '/lib/helpers';

export default function TaxesChart({states, ...options}) {
  const breakdownRef = () => useRef;

  const [serie, setSerie] = useState();

  const state = states[states.length - 1];
  const taxes = state.taxes;
  
  const chart = useChart(() => mergeDeep({
    chart: {
      type: 'donut',
      width: 300,
      height: 300,
      events: {
        dataPointMouseEnter: (event, chartContext, config) => {
          setSerie(config.dataPointIndex);
        },
        dataPointMouseLeave: () => {
          setSerie(undefined);
        }
      },
      legend: {
        position: 'middle'
      }
    },
    labels: ['After-tax income', 'Federal tax', 'State tax', 'Social security'],
    series: (() => {
      return [
        state.income - taxes.federal - taxes.state - taxes.socialSecurity, 
        taxes.federal, 
        taxes.state, 
        taxes.socialSecurity];
    })(),
    legend: {
      show: false
    },
    tooltip: {
      enabled: false,
      x: {
        formatter: formatters.currency
      }
    }
  }, options), [taxes])

  return chart;

}


TaxesChart.Sparkline = (options) => TaxesChart(mergeDeep(options, {
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
      name: 'Taxes',
      data: options.states.map((year) => ({
        x: year.year,
        y: year.taxes.state + year.taxes.federal + year.taxes.socialSecurity
      }))
    },
  ]
}))