import Icon from "../../components/Icon"
import style from '../Cashflow/style.module.scss';
import NetworthChart from '../../charts/networth';
import * as formatters from '/lib/formatters'



export default function({ state, input }) {
  const portfolios = {
    'Brokerage': state.personalPortfolio,
    'Stock grants': state.corporatePortfolio,
    '401(k)': state.retirementPortfolio,
  }
  var stocks = state.assets.retirementPortfolio + state.assets.brokeragePortfolio
  return <div class={style.wrapper}>
    <h1>Net worth</h1>
    <a onClick={() => input.onDialog()} class={style.close}><Icon.Close /></a>
    <div class={style.chart}>
      <NetworthChart states={state.history.slice(-5)} />
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

      <thead class={`${style.heading} ${style.standalone}`}>
        <tr>
          <th>
            Cash
          </th>
          <th>
            {formatters.currency(state.cash)}
          </th>
        </tr>
      </thead>
      {state.business && <thead class={`${style.heading} ${style.standalone}`}>
        <tr>
          <th>
            {state.business.name}
          </th>
          <th>
            {formatters.currency(state.business.valuation)}
          </th>
        </tr>
      </thead>}
      {state.retirementSavings > 0 && <thead class={`${style.heading} ${style.standalone}`}>
        <tr>
          <th>
            Retirement savings
          </th>
          <th>
            {formatters.currency(state.retirementSavings)}
          </th>
        </tr>
      </thead>}
      {state.houses.length > 0 && [<thead class={style.heading}>
          <tr>
            <th>
              Real estate value
            </th>
            <th>
              {formatters.currency(state.assets.property)}
            </th>
          </tr>
        </thead>,
        <tbody class={style.breakdown}>
          {state.houses.map((house) => <tr>
            <td>
              {house.name}
            </td>
            <td>
              {formatters.currency(house.price)}
            </td>
          </tr>)}
        </tbody>
      ]}
      {state.loans.length > 0 && [
        <thead class={style.heading}>
          <tr>
            <th>
              Debt
            </th>
            <th>
              {formatters.currency(state.assets.personalDebt + state.assets.schoolDebt + state.assets.mortgageDebt)}
            </th>
          </tr>
        </thead>,
        <tbody class={style.breakdown}>
          {state.assets.personalDebt != 0 && <tr>
            <td>
              Personal loan
            </td>
            <td>
              {formatters.currency(state.assets.personalDebt)}
            </td>
          </tr>}
          {state.assets.schoolDebt != 0 && <tr>
            <td>
              School loan
            </td>
            <td>
              {formatters.currency(state.assets.schoolDebt)}
            </td>
          </tr>}
          {state.assets.mortgageDebt != 0 && <tr>
            <td>
              Morgage
            </td>
            <td>
              {formatters.currency(state.assets.mortgageDebt)}
            </td>
          </tr>}
        </tbody>
      ]}
      {stocks > 0 && [
        <thead class={style.heading}>
          <tr>
            <th>
              Investments
            </th>
            <th>
              {formatters.currency(stocks)}
            </th>
          </tr>
        </thead>,
        <tbody class={style.breakdown}>
          {Object.keys(portfolios).map((portfolioName) => {
            const portfolio = portfolios[portfolioName];
            const sum = portfolio.reduce((sum, holding) => sum + holding.currentPrice, 0);
            if (sum > 0) {
              return <tr>
                <td>
                  {portfolioName}
                </td>
                <td>
                  {formatters.currency(sum)}
                </td>
              </tr>
            }
          })}
        </tbody>
      ]}

      <tfoot class={style.total}>
        <tr>
          <th>
            Total
          </th>
          <th>
            {formatters.currency(state.networth)}
          </th>
        </tr>
      </tfoot>
    </table>
  </div>
}