
import choices from '../data/bonds'
import MutualFunds from './mutual_funds';
export default function Bonds({companies, marketMovement, previous, bonds = choices, mutualFunds, riskFreeRate, events, year}) {
  return bonds.map((bond) => {
    // rfr-based formula
    const modifier = events.reduce((modifier, event) => {
      return modifier * ((event.effects[bond.ticker] || 0) + 1);
    }, 1)
    const newPrice = (bond.price || bond.initialPrice) * (1 + (marketMovement - 1) * bond.correlation) * modifier
    const newYield = (bond.interest * bond.faceValue) / newPrice;
   
    return {
      ...bond,
      kind: 'bond',
      yield: newYield,
      previousPrice: bond.price || bond.initialPrice,
      income: bond.yield * bond.faceValue,
      price: newPrice
    };
  })
}