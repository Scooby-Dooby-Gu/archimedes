const helpers = require('./helpers');

const { it, describe } = helpers;


xdescribe('Paper Chase', () => {
  xit ('should play game', async () => {
    const page = await helpers.newGamePage();
    page.log('Game onboarding');
    await page.clickText('Privileged upbringing')
    await page.clickText('Change choice');
    await page.clickText('Middle class family')
    await page.click('.next-step');
    await page.clickText('In-state university')
    await page.click('.next-step');
    await page.clickText('To previous decision');
    await page.clickText('To previous decision');
    await page.clickText('Privileged upbringing')
    await page.click('.next-step');
    await page.clickText('Ivy League')
    await page.click('.next-step');
    await page.clickText('Apply for a private loan')
    await page.clickText('Close');
    await page.shouldSeeText('$150K')
    await page.shouldSeeText('+$150K in cash')
    await page.shouldSeeText('Enrolled at an Ivy League');
    await page.shouldSeeText('Graduating in 1994');
    await page.shouldSeeText('$200K at');
    await page.click('[alt="Dismiss"]');
    await page.clickText('Change decision');
    await page.clickText('Middle class family')
    await page.click('.next-step');
    await page.clickText('In-state university')
    await page.click('.next-step');
    await page.clickText('Apply for a government loan')
    await page.clickText('Close');
    await page.shouldSeeText('Enrolled at an in-state university');
    await page.shouldSeeText('Graduating in 1994');
    await page.shouldSeeText('$80K at');
    await page.shouldSeeText('for 10 yrs');
    await page.shouldSeeText('$50K')
    await page.shouldSeeText('+$50K in cash')
    page.log('Check around');
    await page.clickText('Career');
    await page.shouldSeeText('Undergraduate at an in-state university')
    await page.shouldSeeText('Graduating in 1994');
    await page.shouldSeeText('Pursue higher education');
    await page.shouldSeeText('Change decision');
    await page.clickText('Cash');
    await page.shouldSeeText('$50K');
    await page.shouldSeeText('10 year government school loan');
    await page.shouldSeeText('Starts in 1994');
   // await page.shouldSeeText('-$9.7K/yr');
    await page.shouldSeeText('$80K at');
    await page.clickText('Cash flow');
    await page.shouldSeeText('Inheritance +$50K');
    await page.shouldSeeText('Income +$50K');
    await page.shouldSeeText('Total +$50K');
    await page.click('svg[src*="Close"]');
    await page.clickText('Net worth');
    await page.shouldSeeText('Cash $50K');
    await page.shouldSeeText('Total -$30K');
    await page.click('svg[src*="Close"]');
    await page.clickText('Story');
    await page.clickText('Results');
    await page.shouldSeeText('Chasing paper');
    await page.shouldSeeText('Play one more year');
  })


  xit ('should invest', async () => {
    const page = await helpers.newGamePage();
    page.log('Game onboarding');
    await page.clickText('Privileged upbringing')
    await page.click('.next-step');
    await page.clickText('In-state university')
    await page.click('.next-step');
    await page.clickText('Apply for a government loan')
    await page.clickText('Close');
    await page.shouldSeeText('You are ready');
    await page.clickText('Play one more year');
    await page.shouldSeeText('You\'ve turned 19');
    await page.shouldSeeText('Net worth $70K');
    await page.shouldSeeText('Cash flow $150K');
    await page.shouldSeeText('Rank (easy)');
    await page.shouldSeeText('Chasing paper');
    await page.clickText('Leaderboard');
    await page.shouldSeeText('18 years old');
    //await page.clickText('All ages');
    await page.shouldSeeText('Easy difficulty');
    await page.click('svg[src*="Close"]');
    await page.clickText('Make your money');
    await page.shouldNotSeeText('manage your investments');
    await page.clickText('You have an outstanding decision');
    await page.clickText('Take her up on the challenge');
    await page.shouldSeeText('Accepted grandma\'s challenge');
    await page.shouldSeeText('Passive investments');
    await page.clickText('Close');
    await page.shouldSeeText('manage your investments');
    await page.shouldSeeText('Accepted grandma\'s challenge');
    await page.shouldSeeText('Passive investments');
    await page.clickText('Results');
    await page.shouldNotSeeText('Active challenge');
    await page.clickText('Investments');
    await page.shouldSeeText('Brokerage portfolio $0');
    await page.shouldSeeText('Stock trader');
    await page.shouldSeeText('Lvl. 1');
    await page.clickText('Show level rewards');
    await page.clickText('Hide level rewards');
    //await page.shouldNotSeeText('Stocks');
    await page.clickText('High Yield Corporate Bonds');
    await page.shouldSeeText('Brokerage 0 bonds');
    await page.clickText('Buy');
    await page.shouldSeeText('Brokerage 100 bonds');
    await page.clickText('Sell');
    await page.shouldSeeText('Brokerage 0 bonds');
    await page.type('input[type="number"]', '53');
    await page.clickText('Investments')
    //await page.click('svg[src*="Close"]');
    await page.shouldSeeText('You own 53 taxable bonds');
    await page.clickText('High Yield Corporate Bonds');
    await page.shouldSeeText('Brokerage 53 bonds');
    await page.shouldSeeText('+53');
    await page.type('input[type="number"]', '51');
    await page.click('svg[src*="Close"]');
    await page.shouldSeeText('You own 51 taxable bonds');
    await page.clickText('High Yield Corporate Bonds');
    await page.shouldNotSeeText('Brokerage 53 bonds');
    await page.shouldNotSeeText('+53');
    await page.shouldSeeText('Brokerage 51 bonds');
    await page.shouldSeeText('+51');
    await page.type('input[type="number"]', '52');
    await page.clickText('Buy');
    await page.shouldNotSeeText('+51');
    await page.shouldSeeText('+52');
    await page.click('svg[src*="Close"]');
    await page.shouldSeeText('Dividends $0');
    await page.clickText('Cash $');
    await page.shouldNotSeeText('Assets $0');
    await page.shouldSeeText('Income $0');
    await page.shouldNotSeeText('Expenses $0');
    await page.shouldSeeText('Taxes $0');

    await page.clickText('Progress to the next year');
    await page.shouldSeeText('You\'ve turned 20');
    await page.shouldSeeText('Active challenge');
    await page.shouldSeeText('Grandma\'s challenge');
    await page.shouldSeeText('4 years left');
    await page.shouldSeeText('First-time investor');
    await page.clickText('Make your money');
    await page.shouldSeeText('You have an outstanding decision');
    await page.clickText('Make decision');
    await page.clickText('Economic indicators');
    await page.clickText('Close');
    await page.shouldSeeText('New member of an investment club');
    await page.shouldSeeText('News');
    await page.shouldSeeText('Change decision');
    await page.clickText('News');
    await page.shouldSeeText('World news');
    await page.shouldSeeText('Economist');
    await page.clickText('Cash');
    await page.shouldNotSeeText('Assets $0');
    await page.shouldNotSeeText('Income $0');
    await page.shouldSeeText('Expenses $0');
    await page.shouldNotSeeText('Taxes $0');
    await page.clickText('Cash flow');
    await page.shouldSeeText('Bonds interest');
    await page.shouldSeeText('Federal tax');
    await page.shouldSeeText('State tax');
    await page.shouldSeeText('Social security');
    await page.click('svg[src*="Close"]');

    await page.clickText('Progress to the next year');
    await page.shouldSeeText('You\'ve turned 21');
    await page.shouldSeeText('Grandma\'s challenge');
    await page.clickText('Read the news');
    await page.clickText('Decisions');
    await page.shouldSeeText('New member of an investment club');
    await page.clickText('Make decision');
    await page.clickText('Technology, Consumer, Utilities');
    await page.clickLastText('Close');
    await page.clickText('You have an outstanding decision');
    await page.clickText('I am game!');
    await page.clickText('Close');
    await page.shouldSeeText('Signed up for dividend challenge');
    await page.shouldSeeText('your first dividend income');
    await page.clickText('Cash');
    await page.shouldSeeText('taxes for the year');
    await page.clickText('Cash flow');
    await page.click('svg[src*="Close"]');
    await page.clickText('Investments');
    await page.shouldSeeText('Edison Electric Co');
    await page.shouldSeeText('Fair foods');
    await page.clickText('Pear');
    await page.shouldSeeText('Brokerage 0 stocks');
    await page.clickText('Buy');
    await page.shouldNotSeeText('Brokerage 0 stocks');
    await page.click('svg[src*="Close"]');
    await page.shouldSeeText('Dividends $0');
    await page.clickText('Cash');
    await page.clickText('Cash flow');
    await page.shouldNotSeeText('Income $0');
    await page.shouldSeeText('Challenge +$20K');
    await page.click('svg[src*="Close"]');


    await page.clickText('Progress to the next year');
    //await page.clickText('Progress to the next year');
    await page.shouldSeeText('You\'ve turned 22');
    await page.shouldSeeText('Grandma\'s challenge');
    await page.shouldSeeText('Dividend challenge');
    await page.shouldSeeText('A quick checkin');
    await page.clickText('Read the news');
    await page.clickText('Make your money');
    await page.clickText('You have an outstanding decision');
    await page.clickText('Defer decision');
    await page.click('.next-step');
    await page.clickText('Job offer');
    await page.click('.next-step');
    await page.clickText('$15K');
    await page.click('.next-step');
    await page.clickText('Growth stocks');
    await page.shouldSeeText('Investing into GRTH');
    await page.shouldSeeText('+$15K/yr towards retirement');
    await page.clickText('Close');
    await page.clickText('Career');
    await page.shouldSeeText('Currently working');
    await page.shouldSeeText('401(k) contribution');
    await page.shouldSeeText('Year job started 1994');
    await page.shouldSeeText('Undergraduate');
    await page.clickText('Progress to the next year');
    await page.wait(300);
    await page.shouldSeeText('Collegiate scholar');
    await page.wait(300);
    await page.clickText('Read the news');
    await page.wait(300);
    await page.clickText('Decisions');
    
    await page.clickText('Investment syndicates');
    await page.clickText('Free economics outlook');
    await page.clickText('Close');

    await page.clickText('Cash');
    await page.shouldNotSeeText('Assets $0');
    await page.shouldNotSeeText('Retirement $0');
    await page.shouldNotSeeText('Dividends $0');
    await page.clickText('Cash flow');
    await page.shouldSeeText('Retirement contribution');
    await page.shouldSeeText('Cost of living');
    await page.shouldSeeText('School loan payment');
    await page.shouldSeeText('Bonds interest');
    await page.shouldSeeText('Stock dividends');
    await page.click('svg[src*="Close"]');
    await page.shouldSeeElement('progress')
  })



  xit ('should have property', async () => {
    const page = await helpers.newGamePage();
    page.log('Game onboarding');
    await page.clickText('Privileged upbringing')
    await page.click('.next-step');
    await page.clickText('In-state university')
    await page.click('.next-step');
    await page.clickText('Apply for a government loan')
    await page.clickText('Close');
    await page.clickText('Play one more year');

    await page.clickText('Make your money');
    await page.clickText('Make decision');
    await page.clickText('Convince her of an alternative');
    await page.clickText('Close');
    await page.click('[alt="Dismiss"]');
    await page.shouldSeeText('Cash $165K');
    await page.clickText('Progress to the next year');

    await page.clickText('Make your money');
    await page.clickText('Make decision');
    await page.clickText('Protective investments');
    await page.clickText('Close');
    await page.shouldSeeText('Cash $165K');
    await page.clickText('Progress to the next year');

    await page.clickText('Read the news');
    await page.clickText('Make your money');
    await page.clickText('Make decision');
    await page.clickText('Healthcare');
    await page.wait(200);
    await page.clickText('Close');
    await page.clickText('Investments');
    await page.shouldSeeText('Shale');
    await page.shouldSeeText('Railroad');
    await page.shouldSeeText('White Cross');
    await page.shouldSeeText('Cash $165K');
    await page.clickText('Progress to the next year');

    await page.clickText('Read the news');
    await page.clickText('Make your money');
    await page.shouldNotSeeText('Cash $165K');
    await page.clickText('Make decision');
    await page.clickText('in-state');
    await page.clickText('Close');
    await page.clickText('In grad school');
    await page.clickText('Career');
    await page.shouldSeeText('Graduating in 1999');
    await page.shouldSeeText('Graduated in 1994');
    await page.shouldNotSeeText('Cash $165K');
    await page.clickText('Progress to the next year');

    await page.clickText('Read the news');
    await page.clickText('Make your money');
    await page.clickText('Make decision');
    await page.clickText('Free politics report');
    await page.clickText('Close');
    await page.clickText('Progress to the next year');

    await page.clickText('Read the news');
    await page.clickText('Free');
    await page.clickText('Make your money');
    await page.clickText('Make decision');
    await page.clickText('I won\'t');
    await page.clickText('Close');
    await page.clickText('Progress to the next year');

    await page.clickText('Read the news');
    await page.clickText('Make your money');
    await page.clickText('Make decision');
    await page.clickText('Great');
    await page.clickText('Close');
    await page.shouldSeeText('new features');
    await page.clickText('Investments');
    await page.shouldSeeText('specific news');
    await page.click('.news-indicator');
    await page.click('svg[src*="Close"]');
    await page.clickText('Progress to the next year');

    await page.clickText('Read the news');
    await page.clickText('Make your money');
    await page.clickText('on the market');
    await page.clickText('Condominium');
    await page.click('.next-step');
    await page.clickText('Finance with a 15 year mortgage');
    await page.clickText('Close');
    await page.shouldSeeText('Purchased a Condominium');
    await page.shouldSeeText('Moved in to Condominium');
    await page.shouldSeeText('15 year mortgage');
    await page.shouldSeeText('manage your real estate')
    await page.clickText('Property'); 
    await page.clickText('Cash');
    await page.clickText('Cash flow');
    await page.shouldSeeText('Mortgage payment');
    await page.shouldSeeText('School loan payment');
    await page.shouldSeeText('Property purchased');
    await page.shouldSeeText('Stipend');
    await page.click('svg[src*="Close"]');
    await page.shouldSeeText('15 year mortgage');
    await page.shouldSeeText('10 year government school loan');
    await page.shouldNotSeeText('Assets $0');
    await page.clickText('15 year mortgage');
    await page.clickText('Prepay');
    await page.clickText('10 year government school loan');
    await page.wait(300);
    await page.clickText('Prepay');
    await page.clickText('Property');
    await page.clickText('Condominium');
    await page.clickText('Renovate');
    await page.clickText('Rent out');
    await page.shouldSeeText('Apartment');
    await page.clickText('Move in');
    await page.shouldNotSeeText('Apartment');
    await page.clickText('Rent out');
    await page.shouldSeeText('Apartment');
    await page.clickText('Cash');
    await page.clickText('Cash flow');
    await page.shouldSeeText('Renovations');
    await page.shouldSeeText('Property purchased');
    await page.shouldSeeText('Loan prepayment');
    await page.shouldSeeText('Property tax');
    await page.shouldSeeText('Rent collected');
    await page.shouldSeeText('Rent -$24K');
    await page.click('svg[src*="Close"]');
    await page.clickText('Assets');
    await page.shouldSeeText('Condominium');
    await page.click('svg[src*="Close"]');
    await page.clickText('Property')
    await page.clickText('Condominium')
    await page.clickText('Move in');
    await page.shouldNotSeeText('Apartment');
    await page.clickText('Cash');
    await page.clickText('Cash flow');
    await page.shouldNotSeeText('Rent -$24K');
    await page.shouldNotSeeText('Rent collected');
    await page.click('svg[src*="Close"]');
    await page.clickText('Progress to the next year');

    await page.clickText('Read the news');
    await page.clickText('Make your money');
    await page.clickText('Property');
    await page.clickText('Condominium');
    await page.clickText('Rent out');
    await page.clickText('Move in');
    await page.clickText('Rent out');
    await page.clickText('Cash');
    await page.clickText('Cash flow');
    await page.shouldSeeText('Rent -$24K');
    await page.shouldSeeText('Rent collected');
    await page.click('svg[src*="Close"]');
    await page.clickText('Property');
    await page.clickText('Condominium');
    await page.clickText('Move in');
    await page.clickText('Cash');
    await page.clickText('Cash flow');
    await page.shouldNotSeeText('Rent -$24K');
    await page.shouldNotSeeText('Rent collected');
  })
})