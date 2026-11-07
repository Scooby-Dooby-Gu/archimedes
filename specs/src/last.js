const helpers = require('./helpers');

const { it, describe } = helpers;


describe('Last specs', () => {
  it('should be able to reset password', async () => {
    const page = await helpers.signinPage();
    await page.clickText('forgot password');

    await page.type('input[name="passwordResetRequest[email]"]', helpers.userEmailAddress);

    await page.clickText('Reset');

    await page.shouldSeeText('instructions');

    const email = await page.waitForEmail('Your Archimedes Password');
    const link = email.textOnly.match(/<a[^>]*href="([^"]+)"[^>]*>Reset password/i);

    if (!link[1]) {
      throw new Error("Can not find reset password link")
    }

    await page.goto(link[1]);

    //await page.shouldSeeText('Set new password');

    await page.shouldSeeElement('button:disabled');

    await page.type('input[name="user[password]"]', "123");
    await page.shouldSeeElement('button:disabled');
    await page.type('input[name="user[passwordConfirmation]"]', "1234");
    await page.shouldSeeElement('button:disabled');
    await page.type('input[name="user[passwordConfirmation]"]', "123");
    await helpers.timeoutPromise(50);
    await page.clickText('Change password');

    //await page.shouldNotSeeText('Set new password');
    await page.shouldSeeText('Play');

    
    const page2 = await helpers.signinPage();
    await page2.type('input[name="user[email]"]', helpers.userEmailAddress);
    await page2.type('input[name="user[password]"]', helpers.userPassword);
    await page2.clickText('Sign in');
    await page2.shouldSeeText('Password provided does not match');
    await page2.wait(200);

    await page2.type('input[name="user[password]"]', "123");
    await page2.clickText('Sign in');
    await page2.shouldNotSeeText('Password provided does not match');
    await page2.shouldNotSeeText('forgot password');
    await page2.shouldSeeText('Play');
    
  });
  
  it('should be able to sign out', async () => {
    const page = await helpers.homePage();
    await page.click('[alt="Profile"]');
    await page.shouldSeeText('Achievements');
    await page.click('[href*="/settings"]')
    await page.clickText('Sign out');
    await page.shouldSeeText('I have an account');
  })

});
