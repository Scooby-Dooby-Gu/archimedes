import { RetirementPortfolioAcquisitions } from "./portfolio";

export function RetirementContributionTarget (state, actions){
  const plan = actions.slice().reverse().find((a) => a.type === 'retirementContribution');
  return plan ? plan.value || 0 : 0
}

export function RetirementPlan({job}) {
  return job && job.retirementPlan;
}


export function RetirementAllocation (state, actions){
  const plan = actions.slice().reverse().find((a) => a.type === 'retirementAllocation');
  return plan ? plan.ticker : null;
}


export function RetirementContributionMatch1 ({retirementPlan, retirementContributionTarget = 0, job, salary}){
  if (retirementPlan) {
    if (!retirementPlan.match1Portion) {
      return retirementPlan.match1 * salary;
    }
    const match1Range = Math.min(retirementPlan.match1 * salary, retirementContributionTarget)
    return retirementPlan.match1Portion  * match1Range;
  }
  return 0;
}

export function RetirementContributionMatch2 ({retirementPlan, retirementContributionTarget, job, salary, age}){
  if (retirementPlan) {
    const match1Range = Math.min(retirementPlan.match1 * salary, retirementContributionTarget);
    const retirementContributionLeftover = retirementContributionTarget - match1Range * (1 + retirementPlan.match1Portion);
    if (retirementContributionLeftover) {
      return retirementPlan.match2Portion / (1 + retirementPlan.match2Portion)  * retirementContributionLeftover;
    }
  }
  return 0;
}

export function RetirementPortfolioChanges ({year}, actions) {
  return actions.reduce((accumulatedStocks, action) => {
    if (action.type === 'buy' && action.year === year && action.kind === 'retirement') {
      return accumulatedStocks - action.amount * action.price;
    }
    if (action.type === 'sell' && action.year === year && action.kind === 'retirement') {
      return accumulatedStocks + action.amount * action.price;
    }
    return accumulatedStocks;
  }, 0);
}

export function RetirementPortfolioInterest ({retirementPortfolio, tickers}, actions) {
  return retirementPortfolio.reduce((sum, holding) => {
    return sum + holding.income * holding.amount
  }, 0)
}


export function RetirementContribution ({retirementContributionTarget, retirementContributionMatch1, retirementContributionMatch2}){
  return Math.max(0, retirementContributionTarget - retirementContributionMatch1 - retirementContributionMatch2)
}

export function RetirementContributionTotal ({retirementContribution, retirementContributionMatch1, retirementContributionMatch2}){
  return retirementContribution + retirementContributionMatch1 + retirementContributionMatch2;
}

export function RetirementContributionAllocated ({retirementPortfolioAcquisitions, year}){
  return retirementPortfolioAcquisitions.reduce((sum, acquisition) => {
    return sum + (acquisition.year === year ? acquisition.price * acquisition.amount : 0)
  }, 0)
}

export function RetirementSavings({ retirementSavings = 0, retirementContributionTotal, retirementContributionAllocated, retirementPortfolioChanges, retirementPortfolioInterest}) {
  return retirementSavings + retirementContributionTotal - retirementContributionAllocated + retirementPortfolioChanges + retirementPortfolioInterest;
}