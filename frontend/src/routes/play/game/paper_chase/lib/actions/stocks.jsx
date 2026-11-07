
import update from '/lib/immutability';

// patch or prevent actions 
export const middleware = {
  // limit bought amount to avoid over-spending
  buy: (action, { tickers, cash, portfolio, retirementSavings, year }) => {
    const stock = tickers.find((stock) => stock.name == action.name);
    const money = action.kind === 'retirement' ? retirementSavings : cash;
    const holding = portfolio.find((stock) => stock.name == action.name);
    if (action.kind === 'corporate') {
      const corporateHolding = holding && holding.corporate;
      if (!corporateHolding) return;
      var buyableAmount = Math.max(corporateHolding.startingAmount - corporateHolding.amount);
    } else {
      var buyableAmount = money > 0 ? Math.min(action.amount, Math.floor(money / stock.price)) : 0;
    }
    if (buyableAmount === 0) return;

    const newAction = update(action, {
      $merge: {
        amount: buyableAmount,
        year: year,
        price: stock.price
      }
    });
    
    if (stock.kind === 'bond') {
      return update(newAction, {
        $merge: {
          interest: stock.interest,
          years: stock.years 
        }
      })
    }
    return newAction;
  },

  sell: (action, { tickers, portfolio, year }) => {
    const stock = tickers.find((stock) => stock.name == action.name);
    const holding = portfolio.find((stock) => stock.name == action.name);
    if (!holding) return;
    const sellableAmount = holding[action.kind] ? Math.min(action.amount, holding[action.kind].amount) : 0;
    if (sellableAmount === 0) return;
    return update(action, {
      $merge: {
        amount: sellableAmount,
        year: year,
        price: stock.price
      }
    })
  }
}

// combine multiple actions into one
export const appenders = {
  buy: (left, right) => {
    if (left.name === right.name && left.type === 'buy' && left.kind === right.kind) {
      return [update(left, {
        amount: {
          $set: left.amount + right.amount
        },
      })]
    }
    if (left.name === right.name && left.type === 'sell' && left.kind === right.kind) {
      if (right.amount - left.amount === 0) {
        return [];
      }
      if (right.amount - left.amount > 0) {
        return [
          null,
          update(right, {
            amount: {
              $set: right.amount - left.amount
            },
          })
        ]
      } else {
        return [
          update(left, {
            amount: {
              $set: left.amount - right.amount
            },
          })
        ]
      }
    }
  },

  sell: (left, right) => {
    if (left.name === right.name && left.type === 'sell' && left.kind === right.kind) {
      return [update(left, {
        amount: {
          $set: left.amount + right.amount
        },
      })]
    }
    if (left.name === right.name && left.type === 'buy' && left.kind === right.kind) {
      if (left.amount - right.amount === 0) {
        return [];
      }
      if (right.amount - left.amount > 0) {
        return [
          null,
          update(right, {
            amount: {
              $set: right.amount - left.amount
            },
          })
        ]
      } else {
        return [
          update(left, {
            amount: {
              $set: left.amount - right.amount
            },
          })
        ]
      }
    }
  }
}

export const actions = {
}
