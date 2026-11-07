export default function Achievements(state, actions) {
  if (state.turn < 0) return [];
  return (state.achievements || []).concat([
    state.difficulty && 'game_start',
    state.houses.find((house) => !house.loan) && 'game_property',
    state.education && 'game_college',
    state.education && state.education.tier === 'grad' && 'game_postgrad',
    state.personalPortfolio.length && 'game_stocks',
    state.taxAdvisor && 'game_taxes',
    state.stats.totalInvestmentProfit >= 1000000 && 'game_millionaire',
    state.credit.rentCollected &&
      (state.credit.salary || state.credit.stipend) &&
      state.credit.bondsInterest &&
      state.credit.stockDividends && 
      state.credit.mutualFundsDividends && 
      'game_income',
    state.age >= 49 && !actions.some((a) => a.type == 'borrow' && a.rate != 0) && 'game_debt_free',
    state.stats.passiveIncome >= state.stats.passiveExpenses && state.stats.passiveExpenses>= 24000 && 'game_passive_income',
    state.choices.boughtBackBusiness && 'game_bought_business',
    state.choices.defeatedBoss && 'game_defeated_boss',
    state.evidence.length == 11 && 'game_evidence'
    
  ]).concat(
    Object.values(state.activeChallenges)
      .filter((challenge) => challenge.passed)
      .map((challenge) => challenge.achievement)
      .filter(Boolean)
  ).filter(
    (value, index, self) => self.indexOf(value) === index
  ).filter(Boolean)
}