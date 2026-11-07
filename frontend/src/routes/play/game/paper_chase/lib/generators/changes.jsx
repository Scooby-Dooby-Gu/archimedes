import { SHORT_TERM_YEARS } from "./taxes";

export function Debit(state, actions, previous) {
  return {
    propertyTax: state.houses.reduce((acc, house) => {
      return acc + house.tax;
    }, 0),
    rent: state.rent ? state.rent.expenses : 0,
    propertyPurchased: actions.reduce((sum, action) => {
      // FIXME: currently prepaying the same year will reduce downpayment
      if (action.type === 'borrow' && action.year === state.year && action.id && action.kind === 'mortgage') {
        return sum + action.downpayment * (action.sum / (1 - action.downpayment));
      }
      if (action.type === 'pay' && action.year === state.year && action.kind === 'property') {
        return sum + action.sum;
      }
      return sum;
    }, 0),
    stocksPurchased: actions.reduce((sum, action) => {
      if (action.type === 'buy' && action.year === state.year && action.kind === 'personal') {
        return sum + action.amount * action.price;
      }
      return sum;
    }, 0),
    optionsExercised: actions.reduce((sum, action) => {
      if (action.type === 'pay' && action.year === state.year && action.kind === 'options') {
        return sum + action.sum;
      }
      return sum;
    }, 0),
    renovations: actions.reduce((sum, action) => {
      if (action.type === 'renovate' && action.year === state.year) {
        return sum + action.amount;
      }
      return sum;
    }, 0),
    consultations: actions.reduce((sum, action) => {
      if (action.type === 'buyReport' && action.price && action.year === state.year) {
        return sum + action.price;
      }
      return sum;
    }, 0),
    taxAdvisor: state.taxAdvisor ? state.taxAdvisor.price : 0,
    individualLoanPayment: state.loans.reduce((accumulatedLoans, loan) => {
      return accumulatedLoans + (loan.kind === 'personal' && loan.startingYear <= state.year  ? loan.yearlyPayment : 0);
    }, 0),
    schoolLoanPayment: state.loans.reduce((accumulatedLoans, loan) => {
      return accumulatedLoans + (loan.kind === 'school' && loan.startingYear <= state.year  ? loan.yearlyPayment : 0);
    }, 0),
    mortgagePayment: state.loans.reduce((accumulatedLoans, loan) => {
      return accumulatedLoans + (loan.kind === 'mortgage' && loan.startingYear <= state.year ? loan.yearlyPayment : 0);
    }, 0),
    loanPrepayment: actions.reduce((sum, action) => {
      if (action.type === 'prepay' && action.year === state.year) {
        return sum + action.amount
      }
      if (action.type === 'borrow' && action.kind !== 'personal' && action.prepayment && action.year === state.year) {
        return sum + action.prepayment
      }
      return sum;
    }, 0),
    repayment: state.events.concat(state.consequences).reduce((accumulatedBonuses, event) => {
      if (event.effects.cash < 0) {
        return accumulatedBonuses - event.effects.cash
      }
      return accumulatedBonuses;
    }, 0),
    fines: state.events.concat(state.consequences).reduce((accumulatedBonuses, event) => {
      if (event.effects.fine) {
        return accumulatedBonuses + event.effects.fine
      }
      return accumulatedBonuses;
    }, 0),
    longTermCapitalGainTax: state.taxes.longTermCapitalGains,
    retirementContribution: state.retirementContribution,
    federalTax: state.taxes.federal,
    stateTax:  state.taxes.state,
    socialSecurity:  state.taxes.socialSecurity,
    costOfLiving:  state.costOfLiving,
    tomasOffer: actions.reduce((sum, action) => {
      if (action.type === 'pay' && action.year === state.year && action.kind === 'tomasScam') {
        return sum + action.sum;
      }
      return sum;
    }, 0),
    buyback: actions.reduce((sum, action) => {
      if (action.type === 'pay' && action.year === state.year && action.kind === 'buyback') {
        return sum + action.sum;
      }
      return sum;
    }, 0),
    grandmaSupport: actions.reduce((sum, action) => {
      if (action.type === 'pay' && action.kind === 'grandmaLiving' && action.year + action.years > state.year) {
        return sum + action.sum
      } else if (action.type === 'pay' && action.kind === 'grandma' && action.year == state.year) {
        return sum + action.sum
      } else if (action.type === 'challenge' && action.kind === 'dividend' && action.year + action.years > state.year) {
        var stateYear = state;
        while (stateYear.year != action.year)
          stateYear = stateYear.previous;
        var leftover = 8000;
        var years = state.history.slice(state.history.indexOf(stateYear));
        for (var i = 0; i < years.length; i++) {
          leftover -= years[i].debit.grandmaSupport;
        }
        const dividends = (previous.brokeragePortfolio || []).reduce((sum, holding) => {
          return sum + holding.amount * holding.income;
        }, 0);
        return sum + Math.min(dividends, leftover)
      } else {
        return sum;
      }
    }, 0)
  }
}

const props = ['rent', 'costOfLiving', 'individualLoanPayment', 'schoolLoanPayment', 'mortgagePayment', 'retirementContribution', 'propertyPurchased', 'stocksPurchased', 'renovations', 'loanPrepayment', 'consultations', 'grandmaSupport', 'taxAdvisor', 'tomasOffer', 'fines', 'buyback']
export function Expenses({debit}) {
  return props.reduce((sum, prop) => sum - debit[prop], 0);
}

export function Credit(state, actions, previous) {
  return {
    allowance: state.salary ? 0 : state.allowance || 0,
    stipend: state.stipend || 0,
    salary: state.salary,
    businessProfits: state.business ? state.business.salary : 0,
    inheritance: actions.reduce((accumulatedInheritance, action) => {
      if (action.type === 'difficulty' && action.year === state.year) {
        return accumulatedInheritance + action.amount;
      }
      return accumulatedInheritance;
    }, 0),
    challenge: actions.reduce((accumulatedInheritance, action) => {
      if ((action.type === 'challenge' || action.type === 'story') && action.year === state.year && action.amount) {
        return accumulatedInheritance + action.amount;
      }
      return accumulatedInheritance;
    }, 0),
    bonuses: state.events.concat(state.consequences).reduce((accumulatedBonuses, event) => {
      if (event.effects.cash > 0) {
        return accumulatedBonuses + event.effects.cash
      }
      if (event.effects.longTermCapitalGain) {
        return accumulatedBonuses + event.effects.longTermCapitalGain
      }
      return accumulatedBonuses;
    }, actions.reduce((accumulatedBonuses, action) => {
      if (action.type === 'bonus' && action.year === state.year) {
        return accumulatedBonuses + action.amount;
      }
      return accumulatedBonuses;
    }, 0)),
    soldStocksShortTerm: state.brokeragePortfolio.reduce((tax, stock) => {
      return stock.debit.reduce((tax, op) => {
        return tax + (op.year === state.year && op.year - op.bucket.year <= SHORT_TERM_YEARS ? op.amount * op.price : 0)
      }, tax)
    }, 0),
    soldStocksLongTerm: state.brokeragePortfolio.reduce((tax, stock) => {
      return stock.debit.reduce((tax, op) => {
        return tax + (op.type === 'sell' && op.year === state.year && op.year - op.bucket.year > SHORT_TERM_YEARS ? op.amount * op.price : 0)
      }, tax)
    }, 0),
    redeemedBonds: state.brokeragePortfolio.reduce((tax, stock) => {
      return stock.debit.reduce((tax, op) => {
        return tax + (op.type === 'redeem' && op.year === state.year ? op.amount * op.price : 0)
      }, tax)
    }, 0),
    bondsInterest: (previous.brokeragePortfolio || []).reduce((sum, holding) => {
      return sum + (holding.kind === 'bond' ? holding.amount * holding.income : 0);
    }, 0),
    mutualFundsDividends: (previous.brokeragePortfolio || []).reduce((sum, holding) => {
      return sum + (holding.kind === 'mutualFund' ? holding.amount * holding.income : 0);
    }, 0),
    stockDividends: (previous.brokeragePortfolio || []).reduce((sum, holding) => {
      return sum + (holding.kind === 'stock' ? holding.amount * holding.income : 0);
    }, 0),
    loans: state.loans.reduce((accumulatedLoans, loan) => {
      return accumulatedLoans + (loan.year === state.year && loan.kind === 'personal' ? loan.total : 0);
    }, 0),
    rentCollected: state.rentIncome,
    soldPropertyShortTerm: actions.reduce((profit, action) => {
      if (action.type === 'sellHouse' && action.year === state.year) {
        const house = state.housesHistory.find((house) => house.id === action.id);
        if (house && action.year - house.year <= SHORT_TERM_YEARS) {
          return profit + house.price - (house.loan ? house.loan.unpaidPrincipal : 0);
        }
      }
      return profit;
    }, 0),
    soldPropertyLongTerm: actions.reduce((profit, action) => {
      if (action.type === 'sellHouse' && action.year === state.year) {
        const house = state.housesHistory.find((house) => house.id === action.id);
        if (house && action.year - house.year > SHORT_TERM_YEARS ) {
          return profit + house.price - (house.loan ? house.loan.unpaidPrincipal : 0);
        }
      }
      return profit;
    }, 0),
  }
}

export function CreditTotal(state, actions) {
  return Object.values(state.credit).reduce((sum, value) => value + sum, 0)
}

export function DebitTotal(state, actions) {
  return Object.values(state.debit).reduce((sum, value) => value + sum, 0)
}

export function Cash(state, actions) {
  if (isNaN(state.cash - state.debitTotal + state.creditTotal)) {
    for (var property in state.debit) {
      if (isNaN(state.debit[property])) {
        throw new Error(property + ' is NaN');
      }
    }
    for (var property in state.credit) {
      if (isNaN(state.credit[property])) {
        throw new Error(property + ' is NaN');
      }
    }
    throw new Error('Cash is NaN')
  }
  return state.cash - state.debitTotal + state.creditTotal
}