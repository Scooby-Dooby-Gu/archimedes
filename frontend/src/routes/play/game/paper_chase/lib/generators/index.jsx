import Companies from './companies';
import Bonds from './bonds';
import MutualFunds from './mutual_funds';
import Tickers from './tickers';
import { LoanHistory, Loans } from './loans';
import { Study, Stipend, 
  Earnings, Education, Educations,
  Baseline, Job, 
  Company, Salary, SalaryExpectation, Experience, Options, ExercisedOptions, Business} from './career';
import CostOfLiving from './expenses';
import { Taxable, Taxes, Income, ShortTermCapitalGains, LongTermCapitalGains, LoanInterestDeductables, Deductables } from './taxes';
import {
  RetirementPlan,
  RetirementContribution, RetirementContributionTarget, RetirementContributionTotal,
  RetirementAllocation, RetirementPortfolioChanges, RetirementPortfolioInterest,
  RetirementContributionMatch1, RetirementContributionMatch2, 
  RetirementSavings, RetirementContributionAllocated} from './retirement';
import { HousesHistory, Houses, Residence, Rent, RentIncome } from './property';
import { Credit, CreditTotal, Debit, DebitTotal, Cash, Expenses } from './changes';
import { ActiveChallenges, Challenges, Scores } from './scores';
import { 
  CorporatePortfolioAssignments, CorporatePortfolio, 
  RetirementPortfolioAcquisitions, RetirementPortfolio,
  PersonalPortfolioAcquisitions, PersonalPortfolio, 
  BrokeragePortfolio,
  Portfolio,
  Dividends} from './portfolio';
import News from './news';
import Achievements from './achievements';
import { Character, Npcs, Choices, Stats } from './choices'
import { MarketCurve, MarketMovement, MarketCompositeForceTarget, MarketCompositeMovement, MarketCompositeForceTargetAhead, MarketCompositeForce, MarketForce, RiskFreeRate } from './market_force';
import { Assets, Networth } from './assets';
import { Events, StockEvents, Consequences, Warnings } from './events';
import { ExpertiseBaseline, Expertise, ConsultationsAvailable, ConsultationsYearly } from './expertise';
import { Relationships, Evidence } from './relationships';

const Aspects = {
  npcs: Npcs,
  character: Character,
  expertiseBaseline: ExpertiseBaseline,
  expertise: Expertise,
  consultationsAvailable: ConsultationsAvailable,
  consultationsYearly: ConsultationsYearly,
  marketCurve: MarketCurve,
  marketCompositeForceTarget: MarketCompositeForceTarget,
  marketCompositeForceTargetAhead: MarketCompositeForceTargetAhead,
  news: News,
  events: Events,
  stockEvents: StockEvents,
  marketCompositeMovement: MarketCompositeMovement,
  marketCompositeForce: MarketCompositeForce,
  challenges: Challenges,
  choices: Choices,
  consequences: Consequences,
  achievements: Achievements,
  relationships: Relationships,
  evidence: Evidence,
  marketMovement: MarketMovement,
  marketForce: MarketForce,
  riskFreeRate: RiskFreeRate,
  companies: Companies, 
  bonds: Bonds, 
  mutualFunds: MutualFunds, 
  tickers: Tickers, 
  costOfLiving: CostOfLiving, 
  study: Study,
  education: Education,
  educations: Educations,
  baseline: Baseline,
  job: Job,
  company: Company,
  experience: Experience,
  business: Business,
  salaryExpectation: SalaryExpectation,
  salary: Salary,
  stipend: Stipend,
  earnings: Earnings,
  options: Options,
  exercisedOptions: ExercisedOptions,
  retirementPlan: RetirementPlan,
  retirementContributionTarget: RetirementContributionTarget, 
  retirementContributionMatch1: RetirementContributionMatch1, 
  retirementContributionMatch2: RetirementContributionMatch2,
  retirementContribution: RetirementContribution, 
  retirementContributionTotal: RetirementContributionTotal, 
  retirementAllocation: RetirementAllocation, 
  loanHistory: LoanHistory, 
  loanInterestDeductables: LoanInterestDeductables,
  deductables: Deductables,
  housesHistory: HousesHistory,
  houses: Houses,
  residence: Residence,
  loans: Loans,
  personalPortfolioAcquisitions: PersonalPortfolioAcquisitions,
  corporatePortfolioAssignments: CorporatePortfolioAssignments,
  retirementPortfolioAcquisitions: RetirementPortfolioAcquisitions,
  personalPortfolio: PersonalPortfolio,
  corporatePortfolio: CorporatePortfolio,
  retirementPortfolio: RetirementPortfolio,
  retirementContributionAllocated: RetirementContributionAllocated, 
  retirementPortfolioChanges: RetirementPortfolioChanges, 
  retirementPortfolioInterest: RetirementPortfolioInterest, 
  retirementSavings: RetirementSavings, 
  portfolio: Portfolio,
  brokeragePortfolio: BrokeragePortfolio,
  dividends: Dividends,
  rent: Rent,
  rentIncome: RentIncome,
  income: Income,
  longTermCapitalGains: LongTermCapitalGains,
  shortTermCapitalGains: ShortTermCapitalGains,
  taxable: Taxable,
  taxes: Taxes,
  credit: Credit,
  creditTotal: CreditTotal,
  debit: Debit,
  debitTotal: DebitTotal,
  expenses: Expenses,
  cash: Cash,
  assets: Assets,
  networth: Networth,
  scores: Scores,
  activeChallenges: ActiveChallenges,
  warnings: Warnings,
  stats: Stats,
};

export default function nextState(state, actions, data) {
  const nextState = {}
  for (var property in state) {
    nextState[property] = state[property];
  }
  if (state.companies) {
    nextState.turn++
  }
  nextState.previous = state;
  nextState.turnSeed = 777777 * nextState.turn + nextState.seed;
  nextState.year = nextState.startingYear + nextState.turn;
  nextState.age = (nextState.year - nextState.birthYear);
  nextState.finished = nextState.age == 50;
  const timestamps = data.session && data.session.timestamps || [];
  const timestamp = data.session && data.session.timestamps && data.session.timestamps[nextState.turn + 2];
  nextState.yearFinishedAt = timestamp ? new Date(timestamp) : null;
  const previousActions = actions.filter((action) => action.year <= nextState.year);


  Object.entries(Aspects).forEach(([key, Aspect]) => {
    nextState[key] = Aspect(nextState, previousActions, state, data)
  });

  nextState.history = nextState.turn > -5 ? (state && state.history || []).concat(nextState) : []

  return nextState
}