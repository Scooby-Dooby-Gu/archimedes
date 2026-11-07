import { useMemo, useScript, useEffect } from '/lib/hooks/index.jsx';
import { useChart } from '/lib/hooks/index.jsx';
import * as formatter from '/lib/formatters'


export default function BreakdownChart({ states }) {
  return useChart(() => ({
    chart: {
      height: 340,//states.length * 50 + 100,
      type: 'bar',
      stacked: true,
      animations: {
        animateGradually: {
          enabled: true,
          delay: 1
        }
      },
      zoom: {
        enabled: false
      },
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        columnrWidth: '100%'
        //    horizontal: true,
      }
    },
    legend: {
      show: false,
      showForNullSeries: false,
      showForZeroSeries: false,
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 1,
      colors: ["#fff"]
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
      padding: {
        left: 2.5,
        right: -15
      }
    },
    yaxis: {
      show: false,
      labels: {
        formatter: (v) => formatter.currency(v)
      },
    },
    xaxis: {
      crosshairs: {
      //  show: false
      },
      labels: {
        //formatter: (val) => val === states[states.length - 1].year ? 'now' : String(val),
        offsetX: 4,
      },
      tickAmount: states.length,
      type: 'string',
      //type: 'datetime',
      tooltip: {
        enabled: false
      },
    },
    responsive: [{
      breakpoint: 600,
      options: {
        tooltip: {
          fixed: {
            position: 'topLeft',
            offsetY: 300,
            offsetX: 0
          }
        }
      }
    }],
    tooltip: {
      fixed: {
        enabled: true,
        position: 'topLeft',
        offsetY: 50,
        offsetX: 318
      },
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
    series: [
      {
        name: 'Salary',
        data: states.map((year) => ({
          x: year.year,
          y: year.salary
        }))
      },
      {
        name: 'Cost of living',
        data: states.map((year) => ({
          x: year.year,
          y: -year.costOfLiving
        }))
      },
      {
        name: 'Federal tax',
        data: states.map((year) => ({
          x: year.year,
          y: -year.taxes.federal
        }))
      },
      {
        name: 'Bought stocks',
        data: states.reduce((data, year) => {
          return data.concat({
            x: year.year,
            y: -year.debit.stocksPurchased
          })
        }, [])
      },
      {
        name: 'Mortgage payment',
        data: states.reduce((loans, year) => {
          const yearLoans = year.loans.reduce((yearLoans, loan) => {
            return yearLoans + (loan.name === 'Mortgage' ? loan.yearlyPayment : 0);
          }, 0)
          return loans.concat({
            x: year.year,
            y: -yearLoans
          })
        }, [])
      },
      {
        name: 'Loans',
        data: states.reduce((loans, year) => {
          const yearLoans = year.loans.reduce((yearLoans, loan) => {
            return yearLoans + (loan.year === year.year && loan.name === 'Personal loan' ? loan.total : 0);
          }, 0)
          return loans.concat({
            x: year.year,
            y: yearLoans
          })
        }, [])
      },
      {
        name: 'State tax',
        data: states.map((year) => ({
          x: year.year,
          y: -year.taxes.state
        }))
      },
      {
        name: 'Loan payment',
        data: states.reduce((loans, year) => {
          const yearLoans = year.loans.reduce((yearLoans, loan) => {
            return yearLoans + (loan.name === 'Personal loan' ? loan.yearlyPayment : 0);
          }, 0)
          return loans.concat({
            x: year.year,
            y: -yearLoans
          })
        }, [])
      },
      {
        name: 'Sold stocks',
        data: states.reduce((loans, year) => {
          return loans.concat({
            x: year.year,
            y: year.credit.soldStocks
          })
        }, [])
      },
      {
        name: 'School loan payment',
        data: states.reduce((loans, year) => {
          const yearLoans = year.loans.reduce((yearLoans, loan) => {
            return yearLoans + (loan.name === 'School loan' ? loan.yearlyPayment : 0);
          }, 0)
          return loans.concat({
            x: year.year,
            y: -yearLoans
          })
        }, [])
      }
    ]
  }), [states]);
}