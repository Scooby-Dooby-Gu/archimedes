
import update from '/lib/immutability';
import * as formatters from '/lib/formatters';
import { prepayLoan, breakDownLoan } from '../generators/loans';

// patch or prevent actions 
export const middleware = {
  borrow: (action, {loans}) => {
    return update(action, {
      id: (id) =>  id || formatters.uuid(),
      delay: (d) => d || 0,
      startingYear: () => action.year + (action.delay || 0)
    })
  },

  refinance: (action, {loans, riskFreeRate}) => {
    const loan = loans.find((loan) => loan.id === action.id)
    const decrease = breakDownLoan({...loan}).pop().totalInterest - breakDownLoan({...loan, riskFreeRate: riskFreeRate}).pop().totalInterest;
    if (decrease === 0) return;
    return update(action, {
      $merge: {
        name: loan.name,
        riskFreeRate: riskFreeRate,
        riskFreeRateDecrease: loan.riskFreeRate - riskFreeRate,
        decrease,
      }
    })
  },
  
  prepay: (action, {loans, cash}) => {
    const loan = loans.find((loan) => loan.id === action.id)
    const loanBeforePayment = prepayLoan(loan, - loan.yearlyPayment);
    const payableAmount = Math.min(Math.max(0, cash), action.amount, loanBeforePayment.unpaidPrincipal);
    if (payableAmount === 0) return;
    return update(action, {
      $merge: {
        name: loan.name,
        amount: payableAmount,
        decrease: loan.unpaidInterest - prepayLoan(loanBeforePayment, payableAmount).unpaidInterest
      }
    })
  }
}

export const appenders = {
  prepay: (left, right, {loans}) => {
    if (left.type === 'borrow' && left.id === right.id) {
      if (left.sum - right.amount > 0 || left.kind !== 'personal') {
        return [update(left, {
          sum: (sum) => sum - right.amount,
          prepayment: (prepayment) => (prepayment || 0) + right.amount
        })]
      } else {
        return []
      }
    }
    if (left.type === 'prepay' && left.id === right.id) {
      const loan = loans.find((loan) => loan.id === right.id)
      return [update(left, {
        $merge: {
          amount: left.amount + right.amount,
          decrease: loan.unpaidInterest - prepayLoan(loan, left.amount + right.amount).unpaidInterest
        }
      })]
    }
    return [left, right];
  }
}

export const actions = {
}
