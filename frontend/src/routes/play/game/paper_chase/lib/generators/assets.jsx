export function Assets(state, actions) {
  const retirementPortfolio = state.retirementPortfolio
    .reduce((sum, stock) => sum + stock.currentPrice, 0);
  const brokeragePortfolio = state.brokeragePortfolio
    .reduce((sum, stock) => sum + stock.currentPrice, 0);

  const property = state.houses
    .reduce((sum, house) => sum + house.price, 0);

  const business = state.business ? state.business.valuation : 0;

  const personalDebt = state.loans
    .reduce((sum, loan) => sum - (loan.kind === 'personal' ? loan.unpaidPrincipal : 0), 0);
    
  const schoolDebt = state.loans
    .reduce((sum, loan) => sum - (loan.kind === 'school' ? loan.unpaidPrincipal : 0), 0);
  
  const mortgageDebt = state.loans
    .reduce((sum, loan) => sum - (loan.kind === 'mortgage' ? loan.unpaidPrincipal : 0), 0);
  
  const cash = state.cash;
  return {
    cash: state.cash,
    property,
    business,
    brokeragePortfolio,
    retirementPortfolio,
    personalDebt,
    schoolDebt,
    mortgageDebt,
    retirement: state.retirementSavings
  }
}

export function Networth({assets}) {
  return Object.keys(assets).reduce((sum, type) => {
    return sum + assets[type];
  }, 0)
}