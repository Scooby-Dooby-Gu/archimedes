const helpers = require('./helpers');
const path = require('path');

const { it, describe } = helpers;

describe('Profile', () => {
  it ('should be able to invite people (when signup is open)', async () => {
    var page = await helpers.homePage();
    page.log('Invite friends')
    const friendMailbox = await helpers.getNewMailbox();
    await page.click('[alt="Profile"]');
    await page.clickText('Social')
    await page.clickText('Add friend')
    await page.type('[name="emails"]', `evan@getmedes.com, ${friendMailbox.address}`)
    await page.clickText('Send')
    await page.shouldSeeText('Evan');
    await page.shouldSeeText('Sent');
    await page.shouldSeeText(friendMailbox.address);


    const friendName = helpers.userName.replace('Puppet', 'FriendB');
    const friend = await helpers.newUserFromInvite(friendMailbox, friendName, '123', `invited you`, 'Sign up now', 'open');

    await friend.click('[alt="Profile"]');
    await friend.shouldSeeElement('[href*="/settings"]')

    await friend.clickText('Social')
    await friend.shouldSeeText(helpers.userName)

    page.log('Unfriend inviter')
    await friend.clickText(helpers.userName)
    await page.wait(150);
    await friend.clickLast('a[href$="/friends"]')
    await friend.shouldSeeText(friendName)
    await friend.wait(200);
    await friend.clickLast('svg[name="remove"]');
    if (process.env.BREAKPOINT === 'mobile') 
      await friend.shouldNotSeeText(friendName)
    await friend.clickLast('svg[name="add"]');
    if (process.env.BREAKPOINT === 'mobile') 
      await friend.shouldSeeText(friendName)
  })


  it ('should be able to invite people (when signup is closed)', async () => {
    var page = await helpers.homePage();
    page.log('Invite friends')
    const friendMailbox = await helpers.getNewMailbox();
    await page.click('[alt="Profile"]');
    await page.clickText('Social')
    await page.clickText('Add friend')
    await page.type('[name="emails"]', `evan@getmedes.com, ${friendMailbox.address}`)
    await page.clickText('Send')
    await page.shouldSeeText('Evan');
    await page.shouldSeeText('Sent');
    await page.shouldSeeText(friendMailbox.address);


    const friendName = helpers.userName.replace('Puppet', 'FriendA');
    const friend = await helpers.newUserFromInvite(friendMailbox, friendName, '123', `invited you`, 'Sign up now');

    await friend.click('button[alt="Next"]')
    await friend.click('button[alt="Next"]')
    await friend.click('button[alt="Next"]')
    await friend.click('button[alt="Later"]')
    await friend.click('[alt="Profile"]');
    await friend.shouldSeeElement('[href*="/settings"]')

    await friend.clickText('Social')
    await friend.shouldSeeText(helpers.userName)

    page.log('Unfriend inviter')
    await friend.clickText(helpers.userName)
    await page.wait(150);
    await friend.clickLast('a[href$="/friends"]')
    await friend.shouldSeeText(friendName)
    await friend.wait(200);
    await friend.clickLast('svg[name="remove"]');
    if (process.env.BREAKPOINT === 'mobile') 
      await friend.shouldNotSeeText(friendName)
    await friend.clickLast('svg[name="add"]');
    if (process.env.BREAKPOINT === 'mobile') 
      await friend.shouldSeeText(friendName)
  })
})