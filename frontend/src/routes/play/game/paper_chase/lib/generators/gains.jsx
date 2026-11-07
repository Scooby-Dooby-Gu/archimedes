export function LongTermGains(state, actions) {
  return {
    property: actions.reduce((profit, action) => {
      if (action.type === 'sellHouse' && action.year < state.year - 1) {
        return profit + (house.price - action.price)
      }
      return profit;
    }, 0),
  }
}

export function ShortTermGains() {
  return {
    property: actions.reduce((profit, action) => {
      if (action.type === 'sellHouse' && action.year >= state.year - 1) {
        return profit + (house.price - action.price)
      }
      return profit;
    }, 0),
    stocks: actions.reduce((accumulatedStocks, action) => {
      if (action.type === 'sell' && action.year === state.year) {
        return accumulatedStocks + action.amount * action.price;
      }
      return accumulatedStocks;
    }, 0),
  }
}