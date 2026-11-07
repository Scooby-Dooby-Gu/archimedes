import choices from '../data/mutual_funds'
export default function MutualFunds({companies, bonds, mutualFunds = choices}) {
  return mutualFunds.map((mutualFund) => {
    const price = Object.keys(mutualFund.portfolio).reduce((sum, name) => {
      const ticker = [...companies, ...bonds].find((t) => t.name === name || t.industry === name);
      const portion = mutualFund.portfolio[name] * 10000000 / ticker.initialPrice / 100000;
      return sum + portion * ticker.price;
    }, 0)
    const income = Object.keys(mutualFund.portfolio).reduce((sum, name) => {
      const ticker = [...companies, ...bonds].find((t) => t.name === name || t.industry === name);
      const portion = mutualFund.portfolio[name] * 10000000 / ticker.initialPrice / 100000;
      return sum + portion * ticker.income;
    }, 0)
    return {
      ...mutualFund,
      kind: 'mutualFund',
      previousPrice: mutualFund.price || mutualFund.initialPrice || price,
      income:  income,
      interest: income / price,
      price: price
    }
  })
}