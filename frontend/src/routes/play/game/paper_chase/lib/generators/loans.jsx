// advance loan calculation by 1 year
export function nextLoan(state) {
  const loan = {
    ...state
  };
  loan.yearsLeft--;
  if (loan.unpaidPrincipal) {
    loan.yearlyInterest = 0;
    loan.yearlyPrincipal = 0;
    for (var i = 0; i < 12; i++) {
      loan.monthlyInterest = (loan.sum - loan.paidPrincipal) * loan.monthlyRate;
      loan.yearlyInterest += loan.monthlyInterest;
      loan.paidInterest += loan.monthlyInterest
      loan.monthlyPrincipal = loan.monthlyPayment - loan.monthlyInterest
      loan.yearlyPrincipal += loan.monthlyPrincipal
      loan.paidPrincipal += loan.monthlyPrincipal
      loan.paidTotal += loan.monthlyPrincipal + loan.monthlyInterest
    }
    loan.unpaidPrincipal = loan.totalPrincipal - loan.paidPrincipal;
    loan.unpaidInterest = loan.totalInterest - loan.paidInterest;
    loan.unpaidTotal = loan.total - loan.paidTotal;
  }

  if (loan.unpaidPrincipal < 0.01) {
    loan.unpaidPrincipal = 0;
    loan.paidPrincipal = loan.totalPrincipal;
    loan.unpaidInterest = 0;
    loan.paidInterest = loan.totalInterest;
    loan.unpaidTotal = 0;
    loan.paidTotal = loan.total;
  }
  return loan;
}

export function createLoan(state) {
  const loan = {
    ...state,
    total: 0,
    paidInterest: 0,
    paidPrincipal: 0,
    paidTotal: 0,
    unpaidPrincipal: state.sum,
    monthlyRate: (state.rate + (state.riskFreeRate || 0)) / 12,
    monthlyPayment: 0,
    monthlyInterest: 0,
    monthlyPrincipal: 0,
    yearlyInterest: 0,
    yearlyPrincipal: 0,
    yearsLeft: state.years,
  }
  const months = loan.years * 12;
  loan.monthlyPayment = (loan.monthlyRate ? loan.monthlyRate * loan.sum / (1 - Math.pow(1 + loan.monthlyRate, -months)) : loan.sum / months)
  loan.yearlyPayment = loan.monthlyPayment * 12;
  loan.total = loan.monthlyPayment * months;
  loan.totalInterest = loan.total - loan.sum;
  loan.totalPrincipal = loan.sum;
  loan.unpaidInterest = loan.totalInterest;
  loan.unpaidTotal = loan.total;
  return loan;
}


export function breakDownLoan(settings) {
  var loan = createLoan({
    ...settings,
    years: parseFloat(settings.years),
    rate: settings.rate != null ? parseFloat(settings.rate) : parseFloat(settings.percent) / 100,
    sum: parseFloat(settings.sum),
  });
  const payments = [];
  while (loan.unpaidTotal) {
    loan = nextLoan(loan);
    payments.push(loan)
  }
  return payments
}

export function LoanHistory(state, actions) {
  const oldLoans = state.loans.filter((loan) => loan.unpaidTotal);
  const newLoans = actions
    .filter((action) => action.type === 'borrow' && action.year === state.year)
    .map((loan) => createLoan(loan))

  return oldLoans.concat(newLoans)
    .map((loan) => {
      return actions.reduce((newLoan, action) => {
        if (!newLoan) return newLoan;
          
        if (action.type === 'prepay' && action.id === newLoan.id && action.year === state.year) {
          const prepaidLoan = prepayLoan(newLoan, action.amount);
          if (!prepaidLoan.unpaidPrincipal) return null;
          return prepaidLoan;
        }
        if (action.type === 'refinance' && action.id === newLoan.id && action.year === state.year) {
          return refinanceLoan(newLoan, action.riskFreeRate);
        }
        return newLoan;
      }, loan)
    })
    .filter(Boolean)
    .map((loan) => {
      if (isLoanActive(loan, actions) && loan.startingYear <= state.year) {
        return nextLoan(loan);
      } else {
        return loan;
      }
    })
}

function isLoanActive(loan, actions) {
  return !actions.find((action) => {
    return action.type === 'sellHouse' && action.id === loan.id// && action.year === state.year;
  })
}


export function Loans({ loanHistory }, actions) {
  return loanHistory.filter((loan) => isLoanActive(loan, actions));
}

export function prepayLoan(loan, amount) {
  return createLoan({
    ...loan,
    sum: loan.unpaidPrincipal - amount,
    rate: loan.rate,
    years: loan.yearsLeft
  });
}

export function refinanceLoan(loan, riskFreeRate) {
  return createLoan({
    ...loan,
    name: loan.name.replace(loan.years, loan.yearsLeft),
    sum: loan.unpaidPrincipal,
    riskFreeRate,
    years: loan.yearsLeft
  });
}