import * as MATH from '/lib/math';

export function Character(state, actions) {
  return actions.find((action) => action.type === 'character');
}

export function Choices({choices = {}, challenges = {}, turn, evidence, year}, actions) {
  return {
    difficulty: actions.find((action) => action.type === 'difficulty'),
    character: actions.find((action) => action.type === 'character'),
    joinedInvestmentClub: actions.find((action) => action.type === 'challenge' && action.kind === 'homework'),
    investmentSectors: actions.filter((action) => action.type === 'sectorChoice'),
    newsPredictions: actions.filter((action) => action.type === 'newsPrediction'),
    hiredTaxAdvisor: actions.find((action) => action.type === 'hireTaxAdvisor'),
    paidGrandmaOff: actions.find((a) => a.type == 'pay' && a.kind == 'grandma'),
    researchingEVIL: challenges.news && challenges.news.year + challenges.news.years >= year,
    acceptedTomasLoan: actions.find((action) => action.kind == 'tomasLoan'),
    acceptedTomasScam: actions.find((action) => action.kind == 'tomasScam'),
    visitedTomas: actions.find((a) => a.title == `Contact visitation`),
    tomasAnswers: actions.filter((action) => action.type == 'tomasAnswer'),
    defeatedBoss: turn == 27 && evidence.length > 8 ? true : choices.defeatedBoss || false,
    boughtBackBusiness: turn == 28 && actions.find((a) => a.kind == 'buyback') || choices.boughtBackBusiness || false
  }; 
}

export function Npcs({character, seed}) {
  return {
    taxAdvisor: {model: 'BusinessMan_Shirt', skin: 1, palette: 1},
    mary: {model: 'BusinessWoman', skin: 0, palette: 1},
    tomas: {model: 'Male_Hoodie', skin: 2, palette: 3},
    sinister: {model: 'BusinessMan_Shirt', skin: 0, palette: 2},
    grandma: {model: 'Grandma', skin: character ? character.skin : 0, palette: 3},
    cop: {model: 'Male_Police', skin: 0, palette: 2},
    roomie: randomCharacterSettings(MATH.seed(seed * 19997 + 1), ["PunkGuy", "PunkGirl", "Hobo"]),
  }
}

export const models = ["Roadworker", "ShopKeeper", "PunkGuy", "PunkGirl", "Paramedic", "Male_Police", "Male_Jacket", "Male_Hoodie", "Jock", "Hotdog", "Hobo", "HipsterGirl", "HipsterGuy", "Grandpa", /* "Grandma", */"Gangster", "GamerGirl", "FireFighter", "Female_Police", "Female_Jacket", "Female_Coat", "BusinessMan_Suit", "BusinessWoman", "FastFoodGuy", "BusinessMan_Shirt", "SummerGirl", "Tourist"]
export const skins = [0,1,2];
export const palettes = [0,1,2,3];

export function randomCharacterSettings(random = Math.random, availableModels = models) {
  return {
    model: availableModels[Math.floor(random() * availableModels.length)],
    skin: Math.floor(random() * skins.length),
    palette: Math.floor(random() * palettes.length)
  }
}


const passiveIncomeItems = ['bondsInterest', 'mutualFundsDividends', 'stockDividends', 'rentCollected'];
const passiveExpenseItems = ['rent', 'costOfLiving', 'individualLoanPayment', 'schoolLoanPayment', 'mortgagePayment', 'retirementContribution', 'loanPrepayment', 'grandmaSupport', 'taxAdvisor'];


export function Stats(state) {

  var passiveInvestmentProfit = 0;

  for (var yearState = state; yearState.turn >= 0; yearState = yearState.previous) {
    passiveInvestmentProfit += yearState.credit.bondsInterest
                             + yearState.credit.mutualFundsDividends
                             + yearState.credit.stockDividends;
                       
  }

  const potentialInvestmentProfit = state.brokeragePortfolio.reduce((potentialInvestmentProfit, stock) => {
    return stock.potentialProfit + potentialInvestmentProfit
  }, 0);


  const passiveIncome = passiveIncomeItems.reduce((sum, prop) => sum + state.credit[prop], 0);
  const passiveExpenses = passiveExpenseItems.reduce((sum, prop) => sum + state.debit[prop], 0);
  return {
    passiveIncome,
    passiveExpenses,
    passiveInvestmentProfit,
    potentialInvestmentProfit,
    totalInvestmentProfit: potentialInvestmentProfit + potentialInvestmentProfit
  }
}