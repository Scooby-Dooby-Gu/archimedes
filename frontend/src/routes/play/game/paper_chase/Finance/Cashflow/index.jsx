import Icon from "../../components/Icon"
import style from './style.module.scss';
import CashflowChart from '../../charts/cashflow';
import * as formatters from '/lib/formatters'



export default function({ state, input }) {
  const credit = {
    Income: ['allowance', 'stipend', 'salary', 'challenge', 'bonuses', 'inheritance', 'loans', 'businessProfits'],
    Liquidations: ['soldStocksShortTerm', 'redeemedBonds', 'soldStocksLongTerm', 'soldPropertyShortTerm', 'soldPropertyLongTerm'],
    PassiveIncome: ['bondsInterest', 'mutualFundsDividends', 'stockDividends', 'rentCollected'],
  }


  const debit = {
    Expenses: ['rent', 'costOfLiving', 'individualLoanPayment', 'schoolLoanPayment', 'mortgagePayment', 'loanPrepayment', 'retirementContribution', 'repayment', 'grandmaSupport', 'tomasOffer', 'taxAdvisor', 'fines'],
    Purchases: ['propertyPurchased', 'stocksPurchased', 'optionsExercised', 'renovations', 'consultations'],
    Taxes: ['federalTax', 'stateTax', 'longTermCapitalGainTax', 'socialSecurity', 'propertyTax']
  }

  return <div class={style.wrapper}>
    <a onClick={() => input.onDialog()} class={style.close}><Icon.Close /></a>
    <h1>Cash flow</h1>
    <div class={style.chart}>
      <CashflowChart states={state.history.slice(-5)} />
    </div>
    
    <table class={style.table}>
      <thead class={style.legend}>
        <tr>
          <th>
            Balance type
          </th>
          <th>
            Amount
          </th>
        </tr>
      </thead>

      {Object.keys(credit).map((group) => {
        const sum = credit[group].reduce((sum, entry) => sum + state.credit[entry], 0);
        return sum !== 0 && [
          <thead class={style.heading}>
            <tr>
              <th>
                {formatters.titlize(group)}
              </th>
              <th>
                +{formatters.currency(sum)}
              </th>
            </tr>
          </thead>,
          <tbody class={style.breakdown}>
            {credit[group].map((entry) => state.credit[entry] > 0 && <tr>
              <td>
                {formatters.titlize(entry)}
              </td>
              <td>
                +{formatters.currency(state.credit[entry])}
              </td>
            </tr>)}
          </tbody>
        ]
      })}

      {Object.keys(debit).map((group) => {
        const sum = debit[group].reduce((sum, entry) => sum + state.debit[entry], 0);
        return sum !== 0 && [
          <thead class={style.heading}>
            <tr>
              <th>
                {formatters.titlize(group)}
                {group === 'Taxes' && <span class='gray'> ({formatters.currency(state.taxable)} taxable)</span>}
              </th>
              <th>
                -{formatters.currency(sum)}
              </th>
            </tr>
          </thead>,
          <tbody class={style.breakdown}>
            {debit[group].map((entry) => state.debit[entry] > 0 && <tr>
              <td>
                {formatters.titlize(entry)}
              </td>
              <td>
                -{formatters.currency(state.debit[entry])}
                {entry === 'expenses' && ' (20%)'}  
                {entry === 'socialSecurity' && ' (6.2%)'}  
                {entry === 'longTermCapitalGainTax' && ' (15%)'}  
                {entry === 'stateTax' && state.taxable > 0 && ' (' + formatters.rate(state.taxes.state / state.taxable) + ')'}
                {entry === 'federalTax' && state.taxable > 0 && ' (' + formatters.rate(state.taxes.federal / state.taxable) + ')'}  
              </td>
            </tr>)}
          </tbody>
        ]
      })}

      <tfoot class={style.total}>
        <tr>
          <th>
            Total
          </th>
          <th>
            {state.creditTotal - state.debitTotal > 0 ? '+' : ''}{formatters.currency(state.creditTotal - state.debitTotal)}
          </th>
        </tr>
      </tfoot>
    </table>
  </div>
}