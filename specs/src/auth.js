const helpers = require('./helpers');
const path = require('path');

const { it, describe } = helpers;

describe('Sign in', () => {
  xit ('should be able to sign up with google account', async () => {
    const page = await helpers.signinPage();

    page.log('Cancel google sign in attempt');
    const popupPromise0 = helpers.getPopup()
    page.clickText('Google account');
    const popup0 = await popupPromise0;
    await popup0.shouldSeeElement('[type="email"]');
    await popup0.close();
    await page.shouldSeeText('Google signin was canceled');
    
    page.log('Sign up with google account');
    const popupPromise = helpers.getPopup()
    page.clickText('Google account');
    const popup = await popupPromise;
    await page.shouldNotSeeText('Google signin was canceled');
    await popup.type('[type="email"]', "simon@getmedes.com");
    await popup.click('#identifierNext, #next, [type="submit"]');
    await popup.type('[type="password"]', "Medes123!");
    await popup.click('#identifierNext, #next, [type="submit"]');
    await popup.shouldNotSeeElement('[type="password"]');
    await page.shouldSeeText('Learn');
    await page.clickText('Archimedes');
    await page.shouldSeeText('Archimedes Finance')
    await page.click('[href*="/settings"]');
    await page.clickText('Sign out');

    page.log('Quick sign in with google account');
    page.clickText('Sign up');
    const popupPromise2 = helpers.getPopup()
    page.clickText('Google account');
    const popup2 = await popupPromise2;
    //await popup2.type('[type="email"]', "simon@getmedes.com");
    //await popup2.click('#identifierNext, #next, [type="submit"]');
    //await popup2.type('[type="password"]', "Medes123!");
    //await popup2.click('#identifierNext, #next, [type="submit"]');
    await page.shouldSeeText('Learn');
    await page.clickText('Archimedes');
    await page.shouldSeeText('Archimedes Finance')
  })

  it('can request access and be approved', async () => { 
    const user = await helpers.requestAccessPage();
    user.log('Fill in credentials');
    const mailbox = await user.getNewMailbox()
    await user.type('input[name="user[email]"]', mailbox.address);
    await user.clickText('Send request');
    await user.shouldSeeText('missing');
    await user.type('input[name="user[password]"]', 'PASSWORD');
    await user.clickText('Send request');
    await user.shouldSeeText('missing');
    await user.type('input[name="user[name]"]', 'Yarik Newcomer');
    await user.clickText('Send request');
    await user.shouldNotSeeText('missing');

    user.log('Questionaire is visible at all times');
    await user.shouldSeeText('Please answer');

    await user.goto('http://app.getmedes.xxx:8080/')
    await user.shouldSeeText('Please answer');
    await user.shouldSeeElement('button[disabled]');

    user.log('Answer the questions');
    await user.click('#area-1');
    await user.shouldSeeElement('button[disabled]');

    await user.click('#investing-no-1');
    await user.shouldNotSeeElement('button[disabled]');

    await user.click('#investing-yes');
    await user.shouldSeeElement('button[disabled]');

    await user.click('#platform-1');
    await user.shouldNotSeeElement('button[disabled]');

    await user.click('#investing-no-because');
    await user.shouldSeeElement('button[disabled]');

    await user.type('[name="answers[investingExcuse]"]', "I am lazy");;
    await user.shouldNotSeeElement('button[disabled]');

    await user.click('button');

    user.log('Seeing waiting list wall');
    await user.shouldSeeText('all set');
    await user.goto('http://app.getmedes.xxx:8080/')

    await user.shouldSeeText('all set');
    await user.shouldNotSeeText('Request access');
    await user.click('[href*="/signout"]')
    
    await user.shouldSeeText('Request access');
    await user.clickText('I have an account');

    await user.type('[name="user[email]"]', mailbox.address)
    await user.type('[name="user[password]"]', 'PASSWORD')


    await user.click('button');
    await user.shouldSeeText('all set');


    user.log('Admin approves the person');
    var admin = await helpers.homePage('SUPER-SECRET-ADMIN');
    await admin.click('[alt="Profile"]')
    await admin.click('[href*="/settings"]')
    await admin.wait(300)
    await admin.clickText('Admin')
    await admin.shouldSeeText('Yarik Newcomer')

    await admin.acceptNextConfirmation()
    await admin.click('[href*="/approve"]');
    
    user.log('Users can now use the app without veirfying email');
    const email = await user.waitForEmail('Welcome', mailbox);
    
    await user.goto('http://app.getmedes.xxx:8080/')
    await user.shouldNotSeeText('all set');
    await user.shouldSeeText('achieve your investment learning ')

  })

  async function answerQuestions(user) {

  }


  it('can request access, invite friends and get in automatically', async () => { 
    const user = await helpers.requestAccessPage();
    user.log('Fill in credentials');
    const mailbox = await user.getNewMailbox()
    await user.type('input[name="user[email]"]', mailbox.address);
    await user.type('input[name="user[password]"]', 'PASSWORD');
    await user.type('input[name="user[name]"]', 'Yarik Newcomer');
    await user.clickText('Send request');

    user.log('Answer the questions');
    await user.shouldSeeText('Please answer');
    await user.click('#area-1');
    await user.shouldSeeElement('button[disabled]');
    await user.click('#investing-no-1');
    await user.shouldNotSeeElement('button[disabled]');
    await user.click('button');

    user.log('Seeing waiting list wall');
    await user.shouldSeeText('all set');

    user.log('Invite friends')
    const f1mailbox = await user.getNewMailbox()
    const f2mailbox = await user.getNewMailbox()
    const f3mailbox = await user.getNewMailbox()
    await user.clickText('Invite friends');

    await user.type('[name="emails"]', f1mailbox.address + '\n' + f2mailbox.address);
    await user.clickText('Send');

    await user.shouldSeeText(f1mailbox.address)
    await user.shouldSeeText(f2mailbox.address)

    await user.clickText('Invite more friends');
    await user.type('[name="emails"]', f3mailbox.address + ', ' + f2mailbox.address)
    await user.clickText('Send');

    await user.shouldSeeText(f1mailbox.address)
    await user.shouldSeeText(f2mailbox.address)
    await user.shouldSeeText(f3mailbox.address)
    await user.shouldNotSeeElement('[class*="invites"] li[class*="active"]')
    await user.saveApiKey()


    user.log('Friend 1 joins')
    const friend1Name = helpers.userName.replace('Puppet', 'Friend1');
    const friend1 = await helpers.newUserFromInvite(f1mailbox, friend1Name, '123', `invited you`, 'Sign up now')

    await friend1.shouldSeeText('all set');
    await friend1.shouldNotSeeText('achieve your investment learning ')

    await user.goto('http://app.getmedes.xxx:8080/')
    await user.shouldSeeElement('[class*="invites"] li[class*="active"]')
    await user.shouldSeeText('all set');

    user.log('Friend 2 joins')
    const friend2Name = helpers.userName.replace('Puppet', 'Friend2');
    const friend2 = await helpers.newUserFromInvite(f2mailbox, friend2Name, '123', `invited you`, 'Sign up now');

    await friend2.shouldNotSeeText('all set');
    await friend2.shouldSeeText('achieve your investment learning ')

    await friend1.goto('http://app.getmedes.xxx:8080/')
    await friend1.shouldNotSeeText('all set');
    await friend1.shouldSeeText('achieve your investment learning ')

    await user.goto('http://app.getmedes.xxx:8080/')
    await user.shouldNotSeeText('all set');
    await user.shouldSeeText('achieve your investment learning ')
    

    user.log('Friend 3 joins')
    const friend3Name = helpers.userName.replace('Puppet', 'Friend3');
    const friend3 = await helpers.newUserFromInvite(f3mailbox, friend3Name, '123', `invited you`, 'Sign up now');

    await friend3.shouldNotSeeText('all set');
    await friend3.shouldSeeText('achieve your investment learning ')

    user.log('All of friends can now use the app without veirfying email');
    await user.goto('http://app.getmedes.xxx:8080/')
    await user.shouldNotSeeText('all set');
    await user.shouldSeeText('achieve your investment learning ')
    await friend1.goto('http://app.getmedes.xxx:8080/')
    await friend1.shouldNotSeeText('all set');
    await friend1.shouldSeeText('achieve your investment learning ')
    await friend2.goto('http://app.getmedes.xxx:8080/')
    await friend2.shouldNotSeeText('all set');
    await friend2.shouldSeeText('achieve your investment learning ')
    await friend3.goto('http://app.getmedes.xxx:8080/')
    await friend3.shouldNotSeeText('all set');
    await friend3.shouldSeeText('achieve your investment learning ')

    user.log('Should recieve emails');
    const email0 = await user.waitForEmail('Welcome', mailbox);
    const email1 = await friend1.waitForEmail('Welcome', f1mailbox);
  })

  it('should not sign in with incorrect credentials, but can then enter correct ones', async () => {
    const page = await helpers.signinPage();

    page.log('Should see initial state of the page');
    await page.shouldNotSeeText('The password provided does not match with the email address');

    page.log('Fill in credentials');
    await page.type('input[name="user[email]"]', 'yarik+z@trymason.com');
    await page.type('input[name="user[password]"]', '123');

    await page.clickText('Sign in');

    page.log('Should not navigate away');
    await page.shouldSeeText('The password provided does not match with the email address');
    await page.shouldSeeText('forgot password');

    page.log('Fill in correct credentials');
    await page.type('input[name="user[email]"]', helpers.userEmailAddress);
    await page.type('input[name="user[password]"]', helpers.userPassword);

    await page.clickText('Sign in');
    await page.shouldNotSeeText('forgot password');
    await page.shouldSeeText('Play');
  });

  it('should be able to change settings', async () => {
    const page = await helpers.homePage();
    await page.click('[alt="Profile"]');
    await page.shouldSeeText('Achievements');
    await page.click('[href*="/settings"]')
    await page.type('[name="user[name]"]', 'Pablo Gonzales');
    await page.type('[name="user[email]"]', helpers.userEmailAddress.replace('@', '+zogg@'));
    await page.type('[name="user[phoneNumber]"]', '+88282828')
    await page.click('[name="user[bornAt]"].loaded');
    await page.select('.pika-select-month', '0');
    await page.select('.pika-select-year', '1990');
    await page.click('[data-day="3"]');
    
    //await page.click('[name="user[settings][sendEmails]"]');

    await page.attachFile('input[name="user[avatar]"]', 'assets/avatar.jpg')

    await page.shouldSeeElement('form:valid')
    await page.clickText('Save')

    await page.shouldSeeText('Pablo Gonzales');
    await page.shouldSeeElement('img[src*="s3"]');

    await page.shouldSeeText('Achievements');
    await page.click('[href*="/settings"]')
    await page.type('[name="user[name]"]', helpers.userName);
    //await page.shouldSeeElement('[name="user[settings][sendEmails]"]:checked');
    await page.type('[name="user[email]"]', helpers.userEmailAddress);
    await page.shouldSeeElement('form:valid')
    const element = await page.$('input[name="user[bornAt]"]');
    const text = await page.evaluate(element => element.value, element);
    if (text !== '1990-01-03') throw new Error('Expected 1990-01-03, got ' + text);
    await page.clickText('Save')


    await page.shouldNotSeeText('Pablo Gonzales');
  })
});
