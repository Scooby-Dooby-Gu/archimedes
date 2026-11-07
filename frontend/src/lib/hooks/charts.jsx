import { useEffect, useMemo, useRef } from '/lib/hooks/preact';
import { useScript } from '/lib/hooks/request';

const colors = `#b4ccc6 #e39d9d #dc3912 #dd4477 #ff9900 #109618 #990099 #0099c6 #66aa00 #316395 #994499 #22aa99 #aaaa11 #6633cc #e67300 #8b0707 #651067 #329262 #5574a6 #3b3eac #b77322 #16d620 #b91383 #f4359e #9c5935 #a9c413 #2a778d #668d1c #bea413 #0c5922 #743411`.split(/\s/g);
const globalOptions = {
  colors,
  chart: {
    redrawOnParentResize: false,
    selection: {
      enabled: false,
    },
    animations: {
      enabled: false,
    }
  },
  title: {
    show: false,
    text: '',
    margin: 0,
    floating: true,
    align: 'left'
  },
}
export const useChart = (options, dependencies, delay) => {

  const [loader] = useScript([
    "https://cdn.jsdelivr.net/npm/apexcharts",
  ]);

  var chartElementRef = useRef();

  // compute options and memoize it
  const chartOptions = useMemo(() => {
    const givenOptions = typeof options === 'function' ? options() : options;
    const opts = {
      ...globalOptions,
      ...givenOptions,
      chart: {
        ...globalOptions.chart,
        ...givenOptions.chart
      }
    };
    console.log('%c chart  %c %s %c%O', 'background: rgb(156, 39, 176); color: #eaeaea; border-radius: 2px;', 'font-weight: bold', 'compute', '', opts)
    return opts
  }, dependencies);

  // create chart initially (once)
  const chart = useMemo(() => {
    if (window.ApexCharts && chartElementRef.current) {
      console.log('%c chart  %c %s %c%O', 'background: rgb(156, 39, 176); color: #eaeaea; border-radius: 2px;', 'font-weight: bold', 'create', '', chartOptions, chartElementRef.current)
      return new window.ApexCharts(chartElementRef.current, chartOptions)
    }
  }, [window.ApexCharts, chartElementRef.current])


  // apply new options (every time they change)
  useEffect(() => {
    if (chart && chart.willRender) {
      console.log('%c chart  %c %s %c%O', 'background: rgb(156, 39, 176); color: #eaeaea; border-radius: 2px;', 'font-weight: bold', 'update', '', chartOptions)
      chart.updateOptions(chartOptions);
    }
  }, [chart, chartOptions])
  
  // render chart (once) and destroy (once)
  useEffect(() => {
    if (chart) {
      console.log('%c chart  %c %s %c%O', 'background: rgb(156, 39, 176); color: #eaeaea; border-radius: 2px;', 'font-weight: bold', 'render', '', chartOptions, chartElementRef.current)
      chart.willRender =  setTimeout(() => {
        chart.rendered = true;
        chart.render();
      }, delay)
      // re-render initially to fix a tooltip bug
      //chart.updateOptions(chartOptions);
      return () => {
        clearTimeout(chart.willRender)
        if (chart.rendered) {
          chart.willRender = null;
          console.log('%c chart  %c %s %c%O', 'background: rgb(156, 39, 176); color: #eaeaea; border-radius: 2px;', 'font-weight: bold', 'destroy', '', chartOptions, chartElementRef.current)
          //chart.destroy();
        }
      }
    }
  }, [chart])
  

  return <div class="chart" style={{
    transform: 'translateZ(1px)',
    perspective: 1000,
    backfaceVisibility: 'hidden',
    userSelect: 'none',
    webkitUserSelect: 'none',
    fontFamily: 'Arial'
  }} ref={chartElementRef}></div>

}