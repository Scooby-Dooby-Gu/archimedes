import { useLayoutEffect, useEffect, useRef, useState, useChart } from '/lib/hooks/index.jsx';
import * as formatter from '/lib/formatters';
import { mergeDeep } from '/lib/helpers';
import sparkline from '/lib/sparkline';

export default function MarketChart({level, showMore, states, tickers = states[0].tickers, height, ...options}) {
  return useChart(() => mergeDeep({
    colors: [level > 2 && 'rgba(208, 155, 92, 0.8)', 'rgb(141, 186, 150)',  'rgba(65,65,65, 0.8)', 'rgba(50,30,30, 0.5)', 'rgb(189, 166, 89)',].filter(Boolean),
    chart: {
      height: height,
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
      colors: [level > 2 && 'rgba(208, 155, 92, 0.5)', 'rgba(141, 186, 150, 0.1)', 'rgba(65,65,65, 0.5)', 'rgba(255,255,255, 0.3)', 'rgba(189, 166, 89, 0.4)'].filter(Boolean)
    },
    dataLabels: {
        enabled: false,
    },
    stroke: {
        curve: 'smooth',
        width: [1,1,1,0,1,1,1],
        dashArray: [0, 0, 0, 0, 0,0,0,0]
    },
    series: tickers.map((company) => [
      level > 2 && {
        name: 'Alpha',
        data: states.map((year) => [
          new Date(year.year, 1, 1),
          year.tickers.find((c) => c.name === company.name).alpha
        ]),
        type: 'bar'
      },
      {
        name: 'Price',
        data: states.map((year) => [
          new Date(year.year, 1, 1),
          year == states[states.length - 1] && company.ticker == 'EVIL' ? null : year.tickers.find((c) => c.name === company.name).price
        ]),
        type: 'area'
      },
      showMore && {
        name: 'Return',
        data: states.map((year) => [
          new Date(year.year, 1, 1),
          year.tickers.find((c) => c.name === company.name).return
        ]),
        type: 'bar'
      },
      showMore && {
        name: 'Market fund returns',
        data: states.map((year) => [
          new Date(year.year, 1, 1),
          year.tickers.find((c) => c.name === 'Market').return
        ]),
        type: 'line'
      },
      showMore && {
        name: 'Price without company effect',
        data: states.map((year) => [
          new Date(year.year, 1, 1),
          year.tickers.find((c) => c.name === company.name).price - year.tickers.find((c) => c.name === company.name).extraPrice
        ]),
        type: 'line'
      },
    ].filter(Boolean))[0],
    annotations: (() => {
      const annotations = [];
      states.forEach((year) => {
        /*annotations.push(
          {
            x: new Date(year.year - 1, 0, 1).getTime(),
            y: company.previousPrice,

            name: 'Price without company effect',
            data: states.map((year) => [
              new Date(year.year, 1, 1),
              year.tickers.find((c) => c.name === company.name).extraPrice / year.tickers.find((c) => c.name === company.name).previousPrice
            ]),
            type: 'line'
          }
        )*/
        year.tickers.forEach((ticker) => {
          if (ticker.name === tickers[0].name)
          (ticker.events || []).forEach((event) => {
            annotations.push({
              x: new Date(year.year, 1, 1).getTime(),
              y: ticker.price,
              seriesIndex: 0,
              marker: {
                size: 4,
                fillColor: '#fff',
                strokeColor: ticker.ticker === 'EVIL' && year == states[states.length - 1] ? 'grey' : event.effects[ticker.ticker] > 0 ? 'green' : 'red',
                radius: 2,
              },
              label: {
                show: false,
                text: ''//ticker.ticker === 'EVIL' && year == states[states.length - 1] ? '?' : '',
              }
            })
          })
        })
      })
      return {points: annotations};
    })(),
    legend: {
      show: false,
    },
    tooltip: {
      enabled: false,
      y: {
        formatter: (v, options) => options.seriesIndex !== 1 && options.seriesIndex !== 4 ? formatter.rate(v) : formatter.currency(v)
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
        right: 25,
        bottom: 15,
        left: 15
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
      level > 2 && {
        seriesName: 'Alpha',
        forceNiceScale: true,
        floating: true,
        opposite: true,
        max: .5,
        labels: {
          //show: !!showMore,
          align: 'right',
          offsetX: 3,
          formatter: function (val) {
            return (val > 0 ? '+' : '') + Math.round(val * 10) * 10 + '%';
          },
        },
      },
      {
        seriesName: 'Price',
        labels: {
          offsetX: 10,
          formatter: function (val) {
            return formatter.currency(val);
          },
        },
      },
      showMore && {
        max: .5,
        seriesName: 'Alpha',
        show: false
      },
      showMore && {
        max: .5,
        seriesName: 'Alpha',
        show: false
      },
      showMore && {
        seriesName: 'Price',
        show: false,
      },
    ].filter(Boolean),
  }, options), [states.length, ...tickers.map((t) => t.name)], 0/*, {
    'Market fund returns': false,
    'Price without company effect': false
  } */);

}

MarketChart.Sparkline = ({states, ticker, ratio, ...props}) => {
  const svgRef = useRef();
  const prices = states.slice(-10).map((year) => {
    return year.tickers.find((c) => c.name === ticker.name).price
  });
  const minPrice = Math.min.apply(Math, prices);
  const normalizedPrices = prices.map((price) => price - minPrice)
  const [width, setWidth] = useState(props.width);
  useLayoutEffect(() => {
    if (props.width == null) {
      setWidth(svgRef.current.getBoundingClientRect().width);
    }
  }, [window.innerWidth])
  useEffect(() => {
    width && sparkline(svgRef.current, normalizedPrices)
  }, prices.concat(width));
  return <svg {...props} ref={svgRef} class={`${props.class} ${normalizedPrices[normalizedPrices.length - 1] > prices[prices.length - 2] ? 'growing' : 'falling'}`} width={width} height={ratio ? width * ratio : props.height}/>
}