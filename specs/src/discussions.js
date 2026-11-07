const helpers = require('./helpers');

const { it, describe } = helpers;

describe('Discussions', () => {
  it('should be able to browse discussions', async () => {
    var page = await helpers.homePage();
    await page.goto('http://app.getmedes.xxx:8080/?open');
    await page.log('Going deep')
    await page.clickText('Discuss');
    await page.shouldSeeText('Public');
    await page.click('a[href*="/topics/"]')
    await page.shouldSeeElement('a[href*="/discussions/new"]');
    await page.clickLast('a[href*="/discussions/"]')
    await page.shouldSeeText('Send reply');
    
    if (process.env.BREAKPOINT !== 'mobile') return;
    await page.log('Going back')
    await page.click('a[index="parent"][href*="/topics/"]')
    await page.shouldNotSeeText('Send reply');
    await page.shouldSeeElement('a[href*="/discussions/new"]');
    await page.click('a[index="parent"][href*="/boards/"] ')
    await page.shouldNotSeeElement('a[href*="/discussions/new"]');
    await page.shouldSeeText('Public');
  })


  it('should be able to start discussions and reply to them', async () => {
    var page = await helpers.homePage();
    await page.goto('http://app.getmedes.xxx:8080/?open');

    await page.log('Navigate to form')
    await page.clickText('Discuss');
    await page.shouldSeeText('Public');
    await page.click('a[href*="/topics/"]')
    await page.click('a[href*="/discussions/new"]');

    await page.log('Post a new discussion')
    await page.type('input[name="discussion[name]"]', 'This is wonderful day');
    await page.type('textarea[name="discussion[description]"]', 'A great day to wonder');
    await page.clickText('Post');
    await page.shouldSeeText('This is wonderful day');
    await page.shouldSeeText('A great day to wonder');

    await page.log('Post a reply')
    await page.click('[alt="Close"]')
    await page.type('textarea[name="reply[body]"]', 'No way soundbwoi');
    await page.shouldSeeElement('textarea:valid');
    await page.clickText('Send reply');
    await page.shouldSeeElement('textarea:invalid');
    await page.shouldSeeText('No way soundbwoi');

    await page.type('textarea[name="reply[body]"]', 'Yeah way soundbwoi');
    await page.shouldSeeElement('textarea:valid');
    await page.clickText('Send reply');
    await page.shouldSeeElement('textarea:invalid');
    await page.shouldSeeText('No way soundbwoi');
    await page.shouldSeeText('Yeah way soundbwoi');

    await page.click('[href*="?score=1"]')
    await page.shouldSeeElement('[href*="?score=1"][class*="active"]')
    //await page.shouldSeeElement('[href*="?score=-1"]:not([class*="active"])')
    //await page.click('[href*="?score=-1"]')
    //await page.shouldSeeElement('[href*="?score=1"]:not([class*="active"])')
    //await page.shouldSeeElement('[href*="?score=-1"][class*="active"]')


    await page.click('[index="manage"][href*="/discussions"]');
    await page.type('input[name="discussion[name]"]', 'This is bad day');
    await page.type('textarea[name="discussion[description]"]', 'A sad day to wonder');
    await page.clickText('Save')
    await page.shouldNotSeeText('This is wonderful day');
    await page.shouldNotSeeText('A great day to wonder');
    await page.shouldSeeText('This is bad day');
    await page.shouldSeeText('A sad day to wonder');
  })

  it ('should be able to create and edit boards & topics', async () => {
    var page = await helpers.newPage('SUPER-SECRET-ADMIN');
    page.log('Navigate to form')
    await page.goto('http://app.getmedes.xxx:8080/boards/new?open');

    await page.shouldSeeText('New board')

    page.log('Create and edit board')
    await page.type('input[name="board[name]"]', 'Serious business');
    await page.type('textarea[name="board[description]"]', 'Only cash and money');

    await page.clickText('Create');
    await page.shouldNotSeeText('New board')

    await page.shouldSeeText('Public')
    /*
    await page.shouldSeeText('Serious business')

    await page.clickText('Edit');
    await page.type('input[name="board[name]"]', 'Funny business');
    await page.type('textarea[name="board[description]"]', 'Only fun and flowers');
    await page.clickText('Post');
    await page.shouldSeeText('Funny business') */

    page.log('Create and edit topic')
    await page.clickLast('[href*="/topics/new"]');
    await page.wait(200) // fixme? Types "ndonesians"
    await page.type('input[name="topic[name]"]', 'Indonesians');
    await page.type('textarea[name="topic[description]"]', 'Right?');
    await page.clickText('Create');
    await page.shouldSeeText('Indonesians')
    await page.shouldSeeText('Right?')

    await page.click('[index="manage"][href*="/topics"] ');
    await page.type('input[name="topic[name]"]', 'Americans');
    await page.type('textarea[name="topic[description]"]', 'Wrong?');
    await page.clickText('Save');
    await page.shouldNotSeeText('Indonesians')
    await page.shouldNotSeeText('Right?')
    await page.shouldSeeText('Americans')
    await page.shouldSeeText('Wrong?')
  })

  it ('should be able to search discussions', async() => {
    var page = await helpers.homePage();
    await page.goto('http://app.getmedes.xxx:8080/?open');
    await page.log('Going deep')
    await page.clickText('Discuss');
    await page.type('[name="query"]', "wonder puppet")
    await page.keyboard.press('Enter')

    await page.shouldSeeText('A sad day');
  })

})