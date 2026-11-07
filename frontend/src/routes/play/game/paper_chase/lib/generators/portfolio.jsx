function changePortfolio(portfolio, name, callback) {
  var stock = portfolio.find((stock) => stock.name == name) || {
    name: name,
    amount: 0,
    sold: 0,
    credit: [],
    debit: [],
    buckets: []
  };

  const newStock = callback(stock);
  const index = portfolio.indexOf(stock);
  if (index > -1) {
    return portfolio.slice(0, Math.max(0, index)).concat(newStock).concat(portfolio.slice(index + 1)); 
  } else {
    return portfolio.concat(newStock);
  }
}

function processActions(portfolio, actions, kind, { year, tickers } ) {
  return actions.reduce((portfolio, operation) => {
    if (operation.kind !== kind) return portfolio;

    if (operation.type === 'buy' || operation.type === 'acquire') {
      // auto sell expired bonds

      const ticker = tickers.find((ticker) => ticker.name === operation.name);
      if (year - operation.year === operation.years && ticker.kind === 'bond' && ticker.years) {
        return changePortfolio(portfolio, operation.name, (stock) => {
          const debit = stock.debit.slice();
          var bucket;
          const buckets = stock.buckets.map((op) => {
            if (year - op.year === operation.years) {
              bucket = op;
              return {
                ...op,
                amount: 0
              }
            }
            return op;
          })
          if (bucket && bucket.amount != 0) {
            return {
              ...stock,
              buckets: buckets,
              debit: stock.debit.concat({
                type: 'redeem',
                name: ticker.name,
                bucket: bucket,
                price: ticker.faceValue,
                amount: bucket.amount,
                year: year
              }),
              amount: stock.amount - bucket.amount
            }
          } else {
            return stock;
          }
        })
      }
      if (operation.year === year) {
        return changePortfolio(portfolio, operation.name, (stock) => ({
          ...stock,
          credit: stock.credit.concat(operation).sort((a, b) => a.year - b.year),
          buckets: stock.buckets.concat(operation),
          amount: stock.amount + operation.amount
        }))
      }
    // sell the oldest first
    } else if (operation.type === 'sell' && operation.year === year) {
      return changePortfolio(portfolio, operation.name, (stock) => {
        const debit = stock.debit.slice();
        const buckets = [];
        stock.credit.reduce((status, op) => {
          const leftovers = Math.max(0, op.amount - status.soldPreviously);
          status.soldPreviously -= (op.amount - leftovers);
          if (leftovers && status.selling) {
            const selling = Math.min(status.selling, leftovers);
            status.selling -= selling;
            buckets.push({
              ...op,
              amount: leftovers - selling
            })
            debit.push({
              type: 'sell',
              kind: op.kind,
              name: op.name,
              bucket: op,
              price: operation.price,
              amount: selling,
              year: year
            })
          } else if (leftovers) {
            buckets.push(op)
          }
          return status;
        }, {
          soldPreviously: stock.debit.reduce((sold, op) => sold + op.amount, 0),
          selling: operation.amount,
        })

        return ({
          ...stock,
          debit,
          buckets,
          amount: stock.amount + - operation.amount
        })
      })
    }
    return portfolio;
  }, portfolio);
}

function analyzePortfolio(portfolio, { tickers, riskFreeRate }) {
  const market = tickers.find((ticker) => ticker.name === 'Market');
  const currentPrice = portfolio.reduce((currentPrice, stock) => currentPrice + stock.currentPrice, 0)
  const previousPrice = portfolio.reduce((previousPrice, stock) => previousPrice + stock.previousPrice, 0)
  const totalReturn = (currentPrice - previousPrice) / previousPrice;
  const totalBeta = portfolio.reduce((totalBeta, stock) => totalBeta + (stock.currentPrice / currentPrice) * stock.beta, 0)
  const totalAlpha = totalReturn - (riskFreeRate + (market.return - riskFreeRate) * totalBeta)
  return portfolio.map((stock) => ({
    ...stock,
    totalBeta,
    totalAlpha,
    totalReturn
  }))
}

function summarizePortfolio(portfolio, { year, tickers }) {
  return portfolio
    //.filter((stock) => stock.amount > 0)
    .map((stock) => {
      const ticker = tickers.find(ticker => ticker.name == stock.name);
      const paidPrice = stock.buckets.reduce((sum, bucket) => {
        return sum + bucket.price * bucket.amount
      }, 0) 
      const currentPrice = stock.amount * ticker.price;
      const previousPrice = stock.amount * ticker.previousPrice;
      const sellProfit = stock.debit.reduce((sum, op) => {
        return sum + (op.price - op.bucket.price) * op.amount;
      }, 0)
      if (ticker.kind === 'bond') {
        var interest = stock.buckets.reduce((sum, bucket) => {
          return sum + bucket.interest / bucket.amount
        }, 0) * stock.amount
      }
      const startingAmount = stock.debit.reduce((sum, op) => {
        return sum + (op.year === year ? op.amount : 0)
      }, stock.amount);
      return {
        ...stock,
        ...ticker,
        ticker,
        startingAmount: startingAmount,
        interest: interest || stock.interest,
        averagePrice: paidPrice / stock.amount,
        paidPrice: paidPrice,
        currentPrice: currentPrice,
        previousPrice: previousPrice,
        deltaPrice: currentPrice - paidPrice,
        sellProfit: sellProfit,
        potentialProfit: (currentPrice - paidPrice) + sellProfit,
      }
    });
}

function combinePortfolios(portfolio, partialPortfolio, type) {
  return partialPortfolio.reduce((newPortfolio, holding) => {
    return changePortfolio(newPortfolio, holding.name, (stock) => ({
      ...stock,
      [type]: holding,
      debit: stock.debit.concat(holding.debit),
      credit: stock.credit.concat(holding.credit),
      buckets: stock.buckets.concat(holding.buckets),
      amount: stock.amount + holding.amount
    }))
  }, portfolio)
}

export function PersonalPortfolioAcquisitions({ personalPortfolioAcquisitions = [], year, consequences, tickers }) {
  return consequences.reduce((assignments, consequence) => {
    if (consequence.assignments) {
      return assignments.concat(consequence.assignments.map((a) => {
        const stock = tickers.find((ticker) => ticker.name == a.name);
        const assignment = {
          ...a,
          year: year,
          price: stock.price
        };
        if (stock.kind === 'bond') {
          assignment.interest = stock.interest;
          assignment.years = stock.years;
        }
        return assignment;
      }))
    }
    return assignments;
  }, personalPortfolioAcquisitions)
}
// assign corporate stocks next year
export function CorporatePortfolioAssignments({ corporatePortfolioAssignments = [], year, company, salaryExpectation }) {
  if (company) {
    const price = company.price;
    return corporatePortfolioAssignments.concat({
      type: 'acquire',
      name: company.name,
      price: price,
      amount: Math.floor(salaryExpectation * (1 - company.salaryPortion) / price),
      kind: 'corporate',
      year: year + 1
    })
  }
  return corporatePortfolioAssignments;
}
export function RetirementPortfolioAcquisitions({ retirementPortfolioAcquisitions = [], age, year, retirementAllocation, retirementContributionTotal, tickers, baseline }) {
  if (retirementAllocation && retirementContributionTotal) {
    const ticker = tickers.find((ticker) => ticker.ticker === retirementAllocation)
    const price = ticker.price;
    return retirementPortfolioAcquisitions.concat({
      type: 'acquire',
      name: ticker.name,
      price: price,
      amount: Math.floor(retirementContributionTotal / price),
      kind: 'retirement',
      year: year
    })
  }
  return retirementPortfolioAcquisitions;
}



export function CorporatePortfolio({corporatePortfolio = [], year, tickers, riskFreeRate, corporatePortfolioAssignments}, actions) {
  const currentPortfolio = processActions(corporatePortfolio, corporatePortfolioAssignments.concat(actions), 'corporate', { year, tickers});
  return analyzePortfolio(summarizePortfolio(currentPortfolio, { year, tickers }), { tickers, riskFreeRate });
}

export function PersonalPortfolio({personalPortfolio = [], year, tickers, riskFreeRate, personalPortfolioAcquisitions}, actions) {
  const currentPortfolio = processActions(personalPortfolio, personalPortfolioAcquisitions.concat(actions), 'personal', { year, tickers });
  return analyzePortfolio(summarizePortfolio(currentPortfolio, { year, tickers }), { tickers, riskFreeRate });
}

export function RetirementPortfolio({retirementPortfolio = [], year, tickers, riskFreeRate, retirementPortfolioAcquisitions}, actions) {
  const currentPortfolio = processActions(retirementPortfolio, retirementPortfolioAcquisitions.concat(actions), 'retirement', { year, tickers });
  return analyzePortfolio(summarizePortfolio(currentPortfolio, { year, tickers }), { tickers, riskFreeRate });
}

export function BrokeragePortfolio({ personalPortfolio, corporatePortfolio, retirementPortfolio, riskFreeRate, year, age, tickers }) {
  var portfolio = [];
  portfolio = combinePortfolios(portfolio, personalPortfolio, 'personal');
  portfolio = combinePortfolios(portfolio, corporatePortfolio, 'corporate');

  return analyzePortfolio(summarizePortfolio(portfolio, { year, tickers }), { tickers, riskFreeRate })
}

export function Portfolio({ personalPortfolio, corporatePortfolio, retirementPortfolio, riskFreeRate, year, age, tickers }) {
  var portfolio = [];
  portfolio = combinePortfolios(portfolio, personalPortfolio, 'personal');
  portfolio = combinePortfolios(portfolio, corporatePortfolio, 'corporate');
  portfolio = combinePortfolios(portfolio, retirementPortfolio, 'retirement');

  return analyzePortfolio(summarizePortfolio(portfolio, { year, tickers }), { tickers, riskFreeRate })
}

export function Dividends({ previous: { brokeragePortfolio } }) {
  return (brokeragePortfolio || []).reduce((sum, holding) => sum + holding.amount * holding.income, 0)
}