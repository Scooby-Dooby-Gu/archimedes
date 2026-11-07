import * as MATH from '/lib/math';
import industries from '../data/industries'
import companies from '../data/companies'
import { EvilCorpNews } from '../data/events';

var foundingYear = 1995;

export const retirementPlans = [
  {
    title: 'Safe Harbor',
    match1: .03,
    match1Portion: 1,
    match2: .05,
    match2Portion: .5,
    max: 0.045,
  },
  {
    title: 'Generous',
    match1: .05,
    match1Portion: null,
    match2: .1,
    match2Portion: 1,
    max: 0.10
  }
]

export default function nextCompanies(state, actions) {
  const companyList = state.companies || companies.map(({...params}) => params);
  return companyList.map((company, index) => nextCompany(company, state, actions, state.seed + 100 * index))
}

export function nextCompany(company, state, actions, companySeed) {
  if (!company.retirementPlan) {
    const settingsRandom = MATH.seed(Math.floor(companySeed / 7));
    const initialPrice = companies.find((c) => c.name == company.name).initialPrice;
    company = {
      ...company,
      kind: 'stock',
      initialPrice,
      price: initialPrice,// || 15 + settingsRandom() * 15,
      salaryPortion: 0.85 + settingsRandom() * .15,
      retirementPlan: retirementPlans[settingsRandom() < 0.5 ? 0 : 1],
    }
    company.previousPrice = company.price;
  }
  const newCompany = {
    ...company,
    random: MATH.seed(state.turnSeed + companySeed),
    previousPrice: company.price,
  }

  newCompany.events = state.stockEvents.filter((event) => {
    return event.effects[newCompany.ticker]
  });

  if (company.ticker === 'EVIL') {
    newCompany.kind = 'researched';
    const challenge = actions.find((c) => c.type == 'challenge' && c.kind == 'news' && c.year <= state.year && c.year + c.years > state.year);
    if (challenge) {
      const news = EvilCorpNews[state.year - challenge.year];
      newCompany.events = [ news ]
    } else {
      newCompany.events = [];
    }
  }

  const marketForceReturn = state.marketForce - (state.previous.marketForce || 1);
  var correlation = industries['Market'][newCompany.industry];
  const priceAfterMarketMovement = newCompany.previousPrice + newCompany.previousPrice * marketForceReturn * correlation;
  
  
  const priceAfterCompanyEvents = newCompany.events.concat(state.events).reduce((price, event) => {
    return price * (1 + (event.effects[newCompany.ticker] || 0))
  }, priceAfterMarketMovement);

  newCompany.price = parseFloat(Math.max(10, priceAfterCompanyEvents).toFixed(2));
  newCompany.income = newCompany.dividends * newCompany.price;
  return newCompany
}