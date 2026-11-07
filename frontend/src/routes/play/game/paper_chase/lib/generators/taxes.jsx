export const SHORT_TERM_YEARS = 1;
export const Federal = [
  {
    percentage: 10,
    single: 0,
    married: 0,
    heads: 0
  },
  {
    percentage: 12,
    single: 9700,
    married: 19400,
    heads: 13850
  },
  {
    percentage: 22,
    single: 39475,
    married: 78950,
    heads: 52850
  },
  {
    percentage: 24,
    single: 84200,
    married: 168400,
    heads: 84200
  },
  {
    percentage: 32,
    single: 160725,
    married: 321450,
    heads: 160700
  },
  {
    percentage: 35,
    single: 204100,
    married: 408200,
    heads: 204100
  },
  {
    percentage: 37,
    single: 510300,
    married: 612350,
    heads: 510300
  }
]

export const State = [
  {
    percentage: 1,
    single: 0,
    married: 0,
    heads: 0
  },
  {
    percentage: 2,
    single: 8544,
    married: 8544 * 2,
    heads: 8544 * 2
  },
  {
    percentage: 4,
    single: 20255,
    married: 20255 * 2,
    heads: 20255 * 2
  },
  {
    percentage: 6,
    single: 31969,
    married: 31969 * 2,
    heads: 31969 * 2
  },
  {
    percentage: 8,
    single: 44377,
    married: 44377 * 2,
    heads: 44377 * 2
  },
  {
    percentage: 9.3,
    single: 56086,
    married: 56086 * 2,
    heads: 56086 * 2
  },
  {
    percentage: 10.3,
    single: 286493,
    married: 286493 * 2,
    heads: 286493 * 2
  },
  {
    percentage: 11.3,
    single: 343789,
    married: 343789 * 2,
    heads: 343789 * 2
  },
  {
    percentage: 12.3,
    single: 572981,
    married: 572981 * 2,
    heads: 572981 * 2
  }
]

export function computeTax(income, brackets, type = 'single') {
  return brackets.reduce((result, bracket, index) => {
    if (income >= bracket[type]) {
      const range = Math.min(
        income - bracket[type], 
        brackets[index + 1] ? brackets[index + 1][type] - bracket[type] : Infinity
      );
      const tax = range * bracket.percentage / 100;
      return result.concat({
        range,
        tax,
        ...bracket
      })
    } else {
      return result;
    }
  }, [])
}

export function LongTermCapitalGains({ year, corporatePortfolio, personalPortfolio, housesHistory, events, consequences }, actions) {
  const longTermStocks = Math.max(0, corporatePortfolio.concat(personalPortfolio).reduce((tax, stock) => {
    return stock.debit.reduce((tax, op) => {
      return tax + (op.year === year && op.year - op.bucket.year > 1 ? op.amount * (op.price - op.bucket.price) : 0)
    }, tax)
  }, 0));
  
  const longTermProperty = actions.reduce((profit, action) => {
    if (action.type === 'sellHouse' && action.year === year) {
      const house = housesHistory.find((house) => house.id === action.id);
      if (house && action.year - house.year > 1 ) {
        return profit + (house.price - house.initialPrice);
      }
    }
    return profit;
  }, 0);

  const longTermBonuses = events.concat(consequences).reduce((accumulatedBonuses, event) => {
    if (event.effects.longTermCapitalGain) {
      return accumulatedBonuses + event.effects.longTermCapitalGain
    }
    return accumulatedBonuses;
  }, 0);

  return Math.max(0, longTermStocks + longTermProperty + longTermBonuses)
}

export function ShortTermCapitalGains({ corporatePortfolio, personalPortfolio, year, housesHistory }, actions = []) {
  return corporatePortfolio.concat(personalPortfolio).reduce((tax, stock) => {
    return stock.debit.reduce((tax, op) => {
      return tax + (op.year === year && op.year - op.bucket.year <= 1 ? op.amount * (op.price - op.bucket.price) : 0)
    }, tax)
  }, 0) + actions.reduce((profit, action) => {
    if (action.type === 'sellHouse' && action.year === year) {
      const house = housesHistory.find((house) => house.id === action.id);
      if (house && action.year - house.year <= 1) {
        return profit + (house.price - house.initialPrice);
      }
    }
    return profit;
  }, 0);
}

export function LoanInterestDeductables({loans, year }) {
  return loans.reduce((deduction, loan) => {
    if (loan.kind === 'school' && loan.startingYear <= year) {
      return deduction + Math.min(loan.monthlyInterest, 2500);
    } else if (loan.kind === 'mortgage' && loan.startingYear <= year && loan.paidPrincipal < 750000) {
      return deduction + loan.monthlyInterest;
    }
    return deduction;
  }, 0)
}

export function Income({earnings, rentIncome, dividends}) {
  return dividends + earnings + rentIncome
}

export function Deductables({retirementContribution, loanInterestDeductables, taxAdvisor }) {
  return retirementContribution + (taxAdvisor ? loanInterestDeductables : 0)
}

export function Taxable({ shortTermCapitalGains, income, deductables}) {
  return Math.max(0, income + shortTermCapitalGains - deductables)
}

export function Taxes({ taxable, longTermCapitalGains }) {
  return {
    longTermCapitalGains: longTermCapitalGains * 0.15,
    federalBreakdown: computeTax(taxable, Federal),
    federal: computeTax(taxable, Federal).reduce((s, t) => s + t.tax, 0),
    stateBreakdown: computeTax(taxable, State),
    state: computeTax(taxable, State).reduce((s, t) => s + t.tax, 0),
    socialSecurity: taxable * 0.062,
  };
}

export function getIncomeTax(income) {
  const taxes = Taxes({taxable: income, deductables: 0, longTermCapitalGains: 0});
  return taxes.federal + taxes.state;
}