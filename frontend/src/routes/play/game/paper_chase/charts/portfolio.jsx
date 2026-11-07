import { useLayoutEffect, useEffect, useRef, useState, useChart } from '/lib/hooks/index.jsx';
import * as formatter from '/lib/formatters';
import { mergeDeep } from '/lib/helpers';

export default function MarketChart({level, showMore, states, name, height, ...options}) {
  
  return useChart(() => mergeDeep({
    colors: [
      level > 2 && 'rgba(208, 155, 92, 0.8)', 'rgba(65,65,65, 0.8)', 'rgb(141, 186, 150)',  'rgba(50,30,30, 0.5)', 'rgb(189, 166, 89)',].filter(Boolean),
    chart: {
      height: height || 300,
      shadow: {
          enabled: false,
      },
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      animations: {
        enabled: false,
        animateGradually: {
            enabled: true,
            delay: 25
        }
      }
    },
    fill: {
      type: "solid",
      colors: [level > 2 && 'rgba(208, 155, 92, 0.5)', 'rgba(65,65,65, 0.5)', 'rgba(141, 186, 150, 0.1)', 'rgba(255,255,255, 0.3)', 'rgba(189, 166, 89, 0.4)'].filter(Boolean)
    },
    dataLabels: {
        enabled: false,
    },
    stroke: {
        curve: 'smooth',
        width: [1,1,1,0,1,1,1],
        dashArray: [0, 0, 0, 0, 0,0,0,0]
    },
    series: [
      level > 2 && {
        name: 'Alpha',
        data: states.map((year) => [
          new Date(year.year, 1, 1),
          year[name][0] ? year[name][0].totalAlpha : 0
        ]),
        type: 'bar'
      },
      {
        name: 'Return',
        data: states.map((year) => [
          new Date(year.year, 1, 1),
          year[name][0] ? year[name][0].totalReturn : 0
        ]),
        type: 'bar'
      },
      {
        name: 'Current value',
        data: states.map((year) => {
          return [
            new Date(year.year, 1, 1),
            year[name].reduce((sum, holding) => sum + holding.currentPrice, 0)
          ]
        }),
        type: 'area'
      },
      showMore && {
        name: 'Market fund returns',
        data: states.map((year) => [
          new Date(year.year, 1, 1),
          year.tickers.find((c) => c.name === 'Market').return
        ]),
        type: 'line'
      },
    ].filter(Boolean),
    legend: {
      show: false,
    },
    tooltip: {

      enabled: false,
      y: {
        formatter: (v, options) => options.seriesIndex !== 1 && options.seriesIndex !== 4 ? formatter.rate(v) : formatter.currency(v, 9999)
      },
      x: {
            show: true,
            format: 'yyyy',
        },
    },
    grid: {
      borderColor: 'transparent',
      row: {
          colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
          opacity: 0.6
      },
      padding: {
        top: 0,
        right: 30,
        bottom: 15,
        left: 0
      },
    },
    markers: {
        size: [0,0,0, 3,0,0,0,0,0],
        strokeColor: '#fff',
        strokeWidth: 1,
        fillOpacity: 1,
        //shape: 'square'
    },
    xaxis: {
        type: 'datetime'
    },
    yaxis: [
      {
        seriesName: 'Alpha',
        forceNiceScale: true,
        floating: true,
        opposite: true,
        max: .5,
        labels: {
          align: 'right',
          offsetX: 5,
          formatter: function (val) {
            return (val > 0 ? '+' : '') + Math.round(val * 10) * 10 + '%';
          },
        },
      },
      {
        seriesName: 'Alpha',
        show: false,
      },
      {
        seriesName: 'Invested money',
        labels: {
          formatter: function (val) {
            return formatter.currency(val);
          },
        },
      },
      showMore && {
        seriesName: 'Alpha',
        show: false
      },
    ].filter(Boolean),
  }, options), [states.length, name], 0);

}
