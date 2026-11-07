import { useLayoutEffect, useEffect, useRef, useState, useChart } from '/lib/hooks/index.jsx';
import * as formatter from '/lib/formatters';
import { mergeDeep } from '/lib/helpers';
import sparkline from '/lib/sparkline';

export default function MarketChart({states, tickers = states[0].tickers, ...options}) {
  return useChart(() => mergeDeep({
    colors: ['rgb(208, 155, 92)', 'rgb(41, 44, 71)', '#ccc', 'red', 'rgb(141, 186, 150)'],
    chart: {
        height: 200,
        type: 'area',
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        },
        animations: {
          enabled: false,
        },
        selection: {
          enabled: false,
        },
        shadow: {
            enabled: false,
            color: '#000',
            top: 18,
            left: 7,
            blur: 10,
            opacity: 1
        },
    },
    dataLabels: {
        enabled: false,
    },
    stroke: {
        //curve: 'smooth',
        width: 1,
    },
    series: [{
      name: 'Market fund return',
      data: states.map((year) => [
        new Date(year.year, 1, 0),
        year.tickers.find((c) => c.name === 'Market').return
      ]),
      type: 'bar'
    },{
      name: 'Market force change',
      data: states.map((year) => [
        new Date(year.year, 1, 0),
        (year.marketForce - (year.previous.marketForce || 1))
      ]),
      type: 'bar'
    },{
      name: 'Market composite force',
      data: states.map((year) => [
        new Date(year.year, 1, 0),
        (year.marketCompositeForce)
      ]),
      type: 'area'
    },{
      name: 'Market composite force target',
      data: states.map((year) => [
        new Date(year.year, 1, 0),
        (year.marketCompositeForceTarget)
      ]),
      type: 'line'
    },{
      name: 'Market fund price',
      data: states.map((year) => [
        new Date(year.year, 1, 0),
        year.tickers.find((c) => c.name === 'Market').price
      ]),
      type: 'area'
    }/*, {
      name: 'Events',
      data: (() => {
        const annotations = [];
        states.forEach((year) => {
          var events = year.events.filter((event) => event.effects);
          var titles = events.map((event) => event.title)
  
          events.forEach((event) => {
            annotations.push({
              y: [
                new Date(year.year, 1, 0),
                new Date(year.year + 1, 1, 0)
              ],
              x: event.title,
              fillColor: 'red'
            })
          })
        })
        return annotations;
      })(),
      type: 'timeline'
    } */],
    annotations: (() => {
      const annotations = [];
      states.forEach((year) => {
        var events = year.events.filter((event) => event.effects);
        var titles = events.map((event) => event.title)

        events.forEach((event) => {
            annotations.push({
              x: new Date(year.year, 0, 1).getTime(),
              y: (year.marketForce - (year.previous.marketForce || 1)),
              marker: {
                offsetX: 1,
                size: 2,
                fillColor: '#fff',
                strokeColor: event.effects.stocks > 0  ? '#15A271' : 'rgb(232, 98, 98)',
                radius: 2,
              },
              label: {
                show: false,
                text: '',
              }
            })
        })
      })
      return {points: annotations};
    })(),
    legend: {
      show: false
    },
    tooltip: {
      enabled: true,
      shared: true,
      y: {
        formatter: function (val, opts) {
          if (opts.seriesIndex < 3) {
            return parseFloat(Math.floor((val * 10) * 10)) + '%';
          } else {
            return parseFloat(val.toFixed(2)) + '$';
          }
        },
      },
      x: {
            show: true,
            format: 'yyyy',
        },
    },
    grid: {
        borderColor: '#e7e7e7',
        row: {
            colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
            opacity: 0.5
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 15,
          left: 0
        },
    },
    markers: {
        size: 0
    },
    xaxis: {
        type: 'datetime'
    },
    yaxis: [
      {
        seriesName: 'Market force change',
        labels: {
          formatter: function (val) {
            return  (val > 0 ? '+' : '') + Math.floor((val * 10) * 10) + '%';
          },
        },
        show: false,
      },
      {
        seriesName: 'Market fund return',
        labels: {
          formatter: function (val) {
            return (val > 0 ? '+' : '') + Math.floor((val * 10) * 10) + '%';
          },
        },
      },
      {
        opposite: true,
        seriesName: 'Market composite force',
        show: false,
        labels: {
          formatter: function (val) {
            return val.toFixed(2)//Math.floor((val * 10) * 10) + '%';
          },
        },
      },
      {
        opposite: true,
        seriesName: 'Market composite force',
        labels: {
          formatter: function (val) {
            return val.toFixed(2)//Math.floor((val * 10) * 10) + '%';
          },
        },
      },
      {
        opposite: true,
        seriesName: 'Market fund price',
        labels: {
          formatter: function (val) {
            return Math.floor((val * 10) * 10) + '$';
          },
        },
        show: false,
      },/*
      {
        opposite: true,
        seriesName: 'Events',
        labels: {
          formatter: function (val) {
            return (val * 100).toFixed(2) + '%';
          },
        },
        show: false,
      } */
    ],
  }, options), [states.length], 500);

}