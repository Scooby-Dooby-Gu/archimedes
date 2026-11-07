export default function Tickers({turn, year, companies, mutualFunds, bonds, history, riskFreeRate}) {
  const tickers = companies.concat(bonds).concat(mutualFunds);
  if (!history) {
    return tickers;
  }
  return tickers.map((ticker) => {
    ticker.history = history.slice(2).map((entry) => entry.tickers.find((t) => t.name == ticker.name)).concat(ticker)
    ticker.return = ((ticker.price - ticker.previousPrice) + ((ticker.income || 0))) / ticker.previousPrice;
    ticker.averageReturn = ticker.history.reduce((totalReturn, t) => 
      totalReturn + t.return
    , 0) / ticker.history.length;
    ticker.variance = ticker.history.reduce((totalVariance, t) =>
      totalVariance + Math.pow(t.return - ticker.averageReturn, 2)
    , 0) / Math.max(1, ticker.history.length - 1);
    return ticker;
  }).map((ticker) => {
    const market = mutualFunds.find((fund) => fund.name === 'Market');
    ticker.covariance = ticker.history.reduce((totalCovariance, t, i) =>
      totalCovariance + (t.return - ticker.averageReturn) * (market.history[i].return - market.averageReturn)
    , 0) / Math.max(1, ticker.history.length - 1);
    ticker.beta = ticker.variance === 0 ? 0 : ticker.covariance / market.variance;
    ticker.alpha = ticker.return - (riskFreeRate + (market.return - riskFreeRate) * ticker.beta);
    return ticker;
  });
}