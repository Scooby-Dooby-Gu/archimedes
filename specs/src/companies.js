const helpers = require('./helpers');

const { it, describe } = helpers;

describe('Companies', () => {
  var companyPageURL;
  var companyPagePath;
  var companyName;
  var managerKey;
  var userKey;
  var userEmail;

  it('can create company', async () => {
    const id = Math.random().toString(36).substring(2, 6);
    companyName = `Cheeseworks, inc #${id}`;

    var admin = await helpers.newPage('SUPER-SECRET-ADMIN');
    admin.log('Navigate to form')
    await admin.goto('http://app.getmedes.xxx:8080/companies');
    await admin.clickLast('[href*="/companies/new"]');

    admin.log('Fill the form')
    await admin.type('input[name="company[name]"]', companyName);
    await admin.type('input[name="company[subdomain]"]', `cheeseworks-${id}`);
    await admin.type('textarea[name="company[description]"]', 'Makes cheese');
    
    await admin.type('input[name="company[url]"]', 'http://cheese.works');
    await admin.clickLastText('Add another domain')
    await admin.type('input[name="company[wildcards][]"]', 'cheese.works');
    await admin.clickLastText('Add another domain')
    await admin.type('input[name="company[wildcards][]"]', 'milk.works');
    

    admin.log('Fill the 401k stuff')
    await admin.type('input[name="company[plan401k][benefitsProvider]"]', 'Goat');
    await admin.type('input[name="company[plan401k][benefitsProviderUrl]"]', 'goatse.com');
    await admin.type('input[name="company[plan401k][contactName]"]', 'Mr. Bawww');
    await admin.type('input[name="company[plan401k][contactEmail]"]', 'baw@cheese.works');

    await admin.click('input[name="company[plan401k][companyMatch][0][enabled]"]');
    await admin.type('input[name="company[plan401k][companyMatch][0][basis]"]', '3');
    await admin.type('input[name="company[plan401k][companyMatch][0][limit]"]', '5');
    
    await admin.click('input[name="company[plan401k][companyMatch][1][enabled]"]');
    await admin.type('input[name="company[plan401k][companyMatch][1][basis]"]', '1.5');
    await admin.type('input[name="company[plan401k][companyMatch][1][limit]"]', '10');

    await admin.clickLastText('Create')

    await admin.shouldSeeText('Cheeseworks, inc');
    await admin.shouldSeeText('cheese.works');

    companyPageURL = (await admin.url()).split('?')[0]
    companyPagePath = '/companies' + (await admin.url()).split('/companies')[1].split('?')[0];
  })

  it ('can assign lessons to curriculums', async () => {
    var admin = await helpers.newPage('SUPER-SECRET-ADMIN');
    await admin.goto('http://app.getmedes.xxx:8080/');
    await admin.clickText('Learn');
    await admin.clickText('Investment');
    await admin.clickText('Learning to be the', {context: '[route="course"]'});
    await admin.clickText('Start lesson');
    await admin.click('[href*="lessons"][href*="edit"]')
    await admin.wait(200);
    await admin.shouldSeeText('Liquidity events');
    await admin.type('[name="lesson[tags]"]', 'In class, test, At work');
    await admin.clickText('Save');
    await admin.shouldNotSeeText('Lesson name');

    await admin.clickText('Learn');
    await admin.clickText('Mortgage');
    await admin.clickText('Learning to be the', {context: '[route="course"]'});
    await admin.clickText('Start lesson');
    await admin.click('[href*="lessons"][href*="edit"]')
    await admin.wait(200);
    await admin.shouldSeeText('Liquidity events');
    await admin.type('[name="lesson[tags]"]', 'In class');
    await admin.shouldSeeText('Liquidity events');
    await admin.clickText('Save');
    await admin.shouldNotSeeText('Lesson name');

    await admin.clickText('Learn');
    await admin.clickText('401k');
    await admin.clickText('Learning to be the', {context: '[route="course"]'});
    await admin.clickText('Start lesson');
    await admin.click('[href*="lessons"][href*="edit"]')
    await admin.wait(200);
    await admin.shouldSeeText('Liquidity events');
    await admin.type('[name="lesson[tags]"]', 'At work');
    await admin.clickText('Save');
    await admin.shouldNotSeeText('Lesson name');

    await admin.clickText('Learn');
  })

  it('can invite users to a company as managers', async () => {
    var admin = await helpers.newPage('SUPER-SECRET-ADMIN');
    admin.log('Navigate to invitattions')
    await admin.goto(companyPageURL);
    //await admin.clickLastText('Users');
    await admin.clickLastText('Invite');

    admin.log('Invite a new user')
    const managerMailbox = await helpers.getNewMailbox()
    await admin.type('textarea[name="emails"]', managerMailbox.address);
    await admin.click('[name="role"]');
    await admin.clickLastText('Send');
    await admin.shouldSeeText(managerMailbox.address);


    const managerName = helpers.userName.replace('Puppet', 'Manager');
    const manager = await helpers.newUserFromInvite(managerMailbox, managerName, '123', `invited you`, 'Sign up now');
  
    manager.log('Onboard manager')
    await manager.click('button[alt="Next"]')
    await manager.click('button[alt="Next"]')
    await manager.click('button[alt="Next"]')
    await manager.click('button[alt="Later"]')
    await manager.click(`a[alt="Profile"]`);
    await manager.shouldSeeText(companyName);
    await manager.saveApiKey();
    
    managerKey = manager.apiKey;
    
    await manager.clickText('Learn');
    await manager.clickText('Start at the surface');
    await manager.clickText('Take the plunge');
    await manager.clickText('Dive deeper');
    await manager.shouldSeeText('Mortgage');
    await manager.shouldNotSeeText('In class');

    await manager.clickText('Discuss');
    await manager.shouldNotSeeElement('[route="board"]')
    await manager.shouldSeeElement('[route="topic"]');

    await manager.click('[href*="/discussions/new"]')
    await manager.type('input[name="discussion[name]"]', 'Discussion name');
    await manager.type('textarea[name="discussion[description]"]', 'Discussion description');
    await manager.shouldSeeText('Closed?');
    await manager.shouldSeeText('Pinned?');
    await manager.clickText('Post');

    await manager.clickText('Cheeseworks')
    await manager.shouldSeeText('Invite people');

    await manager.click('[index="action"]');
    await manager.shouldSeeElement('[name="company[tagId]"]')
    await manager.evaluate(() => {
      // In class
        document.querySelectorAll("[name=\"company[tagId]\"] option")[2].selected = true
    })
    await manager.clickText('Save')
    await manager.shouldSeeText('Nobody has joined this group yet');

    await manager.clickText('Discuss');
    await manager.shouldSeeText('Discussion name');

    await manager.clickText('Learn');
    await manager.shouldNotSeeText('Mortgage');
    await manager.shouldSeeText('In class');
    await manager.waitForElementsBySelector('li.checked', 0);
    await manager.waitForElementsBySelector('li[id*="lesson"]:not(.checked)');

  })

  it ("can create multiple companies as manager", async () => {
    const manager = await helpers.newPage(managerKey);
    await manager.goto('http://app.getmedes.xxx:8080/');
    const id = Math.random().toString(36).substring(2, 6);
    var companyName2 = "New comp-" + id

    await manager.clickText('Discuss')
    await manager.shouldSeeText('Discussion name');

    await manager.clickText('Learn')
    await manager.shouldNotSeeText('Beginner stuff');
    await manager.clickText('Learn')
    await manager.shouldNotSeeText('Beginner stuff');
    await manager.clickText(companyName);

    await manager.click('[href*="/companies/new"]')
    await manager.type('input[name="company[name]"]', companyName2);
    //await manager.type('input[name="company[subdomain]"]', `new-comp-${id}`);
    await manager.type('textarea[name="company[description]"]', 'News compan ies');
    
    await manager.type('input[name="company[url]"]', 'http://cheese.works');
    await manager.clickText("Create")
    await manager.shouldSeeText("New comp-" + id)
    
    await manager.clickText('Discuss')
    await manager.shouldNotSeeText('Discussion name');

    await manager.clickText('Learn')
    await manager.shouldSeeText('Beginner stuff');
    await manager.clickText(companyName2);

    await manager.shouldSeeElement('select')
    await manager.evaluate((companyName) => {
      Array.prototype.find.call(document.querySelectorAll("select option"), o => o.textContent == companyName).selected = true;
      document.querySelector("select").dispatchEvent(new Event('change'))
    }, companyName)

    await manager.clickText('Discuss')
    await manager.shouldSeeText('Discussion name');
    
    await manager.clickText('Learn')
    await manager.shouldNotSeeText('Beginner stuff');
    await manager.clickText(companyName);
    
    await manager.shouldSeeElement('select')
    await manager.evaluate((companyName2) => {
      Array.prototype.find.call(document.querySelectorAll("select option"), o => o.textContent == companyName2).selected = true;
      document.querySelector("select").dispatchEvent(new Event('change'))
    }, companyName2)

    await manager.clickText('Discuss')
    await manager.shouldNotSeeText('Discussion name');

    await manager.clickText('Learn')
    await manager.shouldSeeText('Beginner stuff');
    await manager.clickText(companyName2);
  })

  it ("can invite non-managers", async () => {
    const manager = await helpers.newPage(managerKey);
    await manager.goto('http://app.getmedes.xxx:8080/');

    await manager.clickText('Cheeseworks');
    await manager.clickText('Invite people')
    await manager.shouldSeeText('Invite as a manager')

    const mailbox = await helpers.getNewMailbox()

    await manager.type('textarea[name="emails"]', mailbox.address);
    await manager.shouldSeeElement('[name="role"]');
    await manager.clickLastText('Send');
    await manager.shouldSeeText(mailbox.address);

    await manager.clickText('Cheeseworks');
    await manager.shouldSeeText(mailbox.address);
    

    const userName = helpers.userName.replace('Puppet', 'User');
    const user = await helpers.newUserFromInvite(mailbox, userName, '123', `invited you`, 'Sign up now');
  
    await user.click('button[alt="Next"]')
    await user.click('button[alt="Next"]')
    await user.click('button[alt="Next"]')
    await user.click('button[alt="Later"]')
    await user.click(`a[alt="Profile"]`);
    await user.saveApiKey()
    userKey = user.apiKey;
    userEmail = mailbox.address;


    await user.clickText(`Progress`);
    await user.shouldNotSeeElement('[index="action"]');

    await user.shouldNotSeeText('Social');
    await user.clickText('Learn');
    await user.clickText('Start at the surface');
    await user.clickText('Take the plunge');
    await user.clickText('Dive deeper');
    await user.shouldNotSeeText('Beginner stuff');
    await user.shouldSeeText('In class');
    await user.shouldSeeElement('[href*="/lessons/"]')
    await user.waitForElementsBySelector('li.checked', 0);
    await user.waitForElementsBySelector('li[id*="lesson"]:not(.checked)');
    
    await user.clickText('Discuss');
    await user.clickText('Discussion name');
    await user.type('textarea[name="reply[body]"]', 'Hey users');
    await user.shouldSeeElement('textarea:valid');
    await user.clickText('Send reply');


    await manager.clickText('Discuss');
    await manager.clickText('Discussion name');
    await manager.shouldSeeText('Hey users');
  });


  it ("can pass lessons belonging to curriculum", async () => {
    const user =  await helpers.newPage(userKey);
    await user.goto('http://app.getmedes.xxx:8080/');

    await user.clickText('Learn');
    await user.click('[href*="/lessons"]');

    await user.shouldSeeText('To course');
    await user.shouldNotSeeText('To curriculum');

    await user.clickText('Learn');
    await user.click('[class*="everything"] svg[src*="Up"]');
    await user.wait(200);
    await user.click('[href*="/lessons"]');
    await user.shouldSeeText('To curriculum');
    await user.shouldNotSeeText('To course');

    await user.clickText('Start lesson')
    await user.clickText('Start quiz')

    await user.click('input[type="radio"][value="0"]')
    await user.clickText('Submit answer', { context: '#lesson-quiz-0'});

    await user.wait(100);
    if (await user.getElementsBySelector('#lesson-quiz-1 [order="1"] ~ [order="0"]')) {
      await user.drag('#lesson-quiz-1 [order="1"]')
      await user.drop('#lesson-quiz-1 [order="0"]')
    }

    if (await user.getElementsBySelector('#lesson-quiz-1 [order="2"] ~ [order="1"]')) {
      await user.drag('#lesson-quiz-1 [order="2"]')
      await user.drop('#lesson-quiz-1 [order="1"]')
    }
    await user.clickText('Submit answer', { context: '#lesson-quiz-1'});
    await user.shouldSeeElement('progress[value="1"][max="2"]')
    await user.shouldNotSeeText('To course');
    await user.shouldSeeText('To curriculum');


    await user.clickText('Browse discussions');
    await user.shouldSeeText('Discussion name');

    await user.clickText('Learn');
    await user.clickText('Show completed lessons')
    await user.waitForElementsBySelector('li.checked', 1);
    await user.waitForElementsBySelector('li[id*="lesson"]:not(.checked)');

    await user.clickText('Progress')
    //await user.clickText('Return home')
    await user.shouldSeeText('Daily learning: 1/3')

    await user.clickText('Peers')
    await user.shouldSeeText('Lessons taken: 1')

    await user.clickText('Learn');
    await user.click('li[id*="lesson"]:not(.checked)');
    
    await user.clickText('Start lesson')
    await user.clickText('Start quiz')

    await user.click('input[type="radio"][value="0"]')
    await user.clickText('Submit answer', { context: '#lesson-quiz-0'});

    await user.wait(100);
    if (await user.getElementsBySelector('#lesson-quiz-1 [order="1"] ~ [order="0"]')) {
      await user.drag('#lesson-quiz-1 [order="0"]')
      await user.drop('#lesson-quiz-1 [order="1"]')
    }

    await user.wait(100);
    if (await user.getElementsBySelector('#lesson-quiz-1 [order="2"] ~ [order="1"]')) {
      await user.drag('#lesson-quiz-1 [order="2"]')
      await user.drop('#lesson-quiz-1 [order="1"]')
    }

    await user.wait(100);
    
    await user.clickText('Submit answer', { context: '#lesson-quiz-1'});
    await user.shouldSeeText('Congratulations')
    await user.shouldNotSeeElement('[route="lesson"] progress')

    await user.clickText('Progress')
    //await user.clickText('Return home')
    await user.shouldSeeText('Daily learning: 2/3')

    await user.clickText('Peers')
    await user.shouldSeeText('Lessons taken: 2')
  });



  it('can invite users to a company (when signup is closed)', async () => {
    var admin = await helpers.newPage('SUPER-SECRET-ADMIN');
    admin.log('Navigate to invitattions')
    await admin.goto(companyPageURL);
    //await admin.clickLastText('Users');
    await admin.clickLastText('Invite');
    
    admin.log('Invite a new user')
    const mailbox = await helpers.getNewMailbox()
    await admin.type('textarea[name="emails"]', mailbox.address);
    await admin.clickLastText('Send');
    await admin.shouldSeeText(mailbox.address);

    const userName = helpers.userName.replace('Puppet', 'Friend');
    const user = await helpers.newUserFromInvite(mailbox, userName, '123', `invited you`, 'Sign up now');
  
    await user.click('button[alt="Next"]')
    await user.click('button[alt="Next"]')
    await user.click('button[alt="Next"]')
    await user.click('button[alt="Later"]')
    await user.click(`a[alt="Profile"]`);
    await user.shouldSeeText(companyName);
    await user.saveApiKey();

    admin.log('Check if user appeared in company user list')
    await admin.goto(companyPageURL);
    await admin.clickLastText('Users');
    await admin.shouldSeeText('Friend')
    await admin.clickLastText('Invite');
  })

  it('can invite existing users to a company', async () => {
    const mailbox = await helpers.getNewMailbox()
    const user = await helpers.newUser(mailbox, 'Newguy', '123')

    var admin = await helpers.newPage('SUPER-SECRET-ADMIN');
    admin.log('Navigate to invitattions')
    await admin.goto(companyPageURL);
    //await admin.clickLastText('Users');
    await admin.clickLastText('Invite');
    
    admin.log('Invite some folks')
    await admin.type('textarea[name="emails"]', mailbox.address);
    await admin.clickLastText('Send');
    await admin.shouldSeeText('Newguy');

    admin.log('Accept invitation')

    await helpers.pageFromEmailLink(mailbox, `invited you to join ${companyName}`, 'Accept invite', user);
    await user.clickLastText('Join')

    await user.wait(550)
    await user.click(`a[alt="Profile"]`);
    await user.shouldSeeText(companyName);
    await user.wait(150)
    await user.click(`a[alt="Profile"]`);
    await user.shouldSeeElement('[href*="/settings"]');
    await user.saveApiKey();


    admin.log('Check if user appeared in company user list')
    await admin.goto(companyPageURL);
    await admin.clickLastText('Users');
    await admin.shouldSeeText('Newguy')
    await admin.clickLastText('Invite');
    //await admin.shouldNotSeeText('Newguy')
  })

  it('can invite users to a company (when signup is open)', async () => {
    var admin = await helpers.newPage('SUPER-SECRET-ADMIN');
    admin.log('Navigate to invitattions')
    await admin.goto(companyPageURL);
    //await admin.clickLastText('Users');
    await admin.clickLastText('Invite');
    
    admin.log('Invite a new user')
    const mailbox = await helpers.getNewMailbox()
    await admin.type('textarea[name="emails"]', mailbox.address);
    await admin.clickLastText('Send');
    await admin.shouldSeeText(mailbox.address);

    const userName = helpers.userName.replace('Puppet', 'Friend');
    const user = await helpers.newUserFromInvite(mailbox, userName, '123', `invited you to the ${companyName}`, 'Sign up now', 'open');
    

    admin.log('Check if user appeared in company user list')
    await admin.goto(companyPageURL);
    await admin.clickLastText('Users');
    await admin.shouldSeeText('Friend')
    await admin.clickLastText('Invite');
    //await admin.shouldNotSeeText('Friend')
  })


  it ("can promote non-managers", async () => {
    const manager = await helpers.newPage(managerKey);
    await manager.goto('http://app.getmedes.xxx:8080/');

    await manager.clickText('Cheeseworks');
    await manager.clickText('Invite people')
    await manager.click('[name="role"]');

    await manager.type('textarea[name="emails"]', userEmail);
    await manager.clickLastText('Send');

    const user = await helpers.newPage(userKey);
    await user.goto('http://app.getmedes.xxx:8080/');

    await user.shouldNotSeeText(`Progress`);
    await user.clickText('Cheeseworks');
    await user.shouldSeeText('Invite people')
    await user.shouldSeeElement('[index="manage"]')
    await user.shouldSeeElement('[index="action"]')

  });


  it ("can add admins as managers", async () => {
    const manager = await helpers.newPage(managerKey);
    await manager.goto('http://app.getmedes.xxx:8080/');

    await manager.clickText('Cheeseworks');
    await manager.clickText('Invite people')
    await manager.click('[name="role"]');

    await manager.type('textarea[name="emails"]', 'yarikx+admin@getmedes.com');
    await manager.clickLastText('Send');
    await manager.shouldNotSeeElement('button[disabled]');

    const admin = await helpers.newPage('SUPER-SECRET-ADMIN');
    await admin.goto('http://app.getmedes.xxx:8080/');

    await admin.shouldSeeElement('select');
    await admin.wait(200)
    await admin.evaluate((companyName) => {
      Array.prototype.find.call(document.querySelectorAll("select option"), o => o.textContent == companyName).selected = true;
      document.querySelector("select").dispatchEvent(new Event('change'))
    }, companyName)
    

    await admin.clickText('Learn');
    await admin.shouldNotSeeText('Beginner stuff');
    await admin.shouldSeeText('In class');

    await admin.clickText('Discuss');
    await admin.shouldNotSeeElement('[route="board"]')
    await admin.shouldSeeElement('[route="topic"]');


  });


  it ("admins can self-add as managers", async () => {
    const admin = await helpers.newPage('TOMAS-ADMIN');
    await admin.goto('http://app.getmedes.xxx:8080/companies');

    await admin.clickText('Cheeseworks');
    await admin.clickText('Invite people')
    await admin.click('[name="role"]');

    await admin.type('textarea[name="emails"]', 'tomasx+admin@getmedes.com');
    await admin.clickLastText('Send');
    await admin.shouldNotSeeElement('button[disabled]');

    await admin.goto('http://app.getmedes.xxx:8080/');
    await admin.clickText('Progress');

    await admin.shouldSeeElement('select');
    await admin.wait(200)
    await admin.evaluate((companyName) => {
      Array.prototype.find.call(document.querySelectorAll("select option"), o => o.textContent == companyName).selected = true;
      document.querySelector("select").dispatchEvent(new Event('change'))
    }, companyName)

    await admin.clickText('Learn');
    await admin.shouldNotSeeText('Beginner stuff');
    await admin.shouldSeeText('In class');

    await admin.clickText('Discuss');
    await admin.shouldNotSeeElement('[route="board"]')
    await admin.shouldSeeElement('[route="topic"]');
  });


  it ("can get secret link to invite people", async () => {
    const manager = await helpers.newPage(managerKey);
    await manager.goto('http://app.getmedes.xxx:8080/');
    
    await manager.clickText('Copy secret signup link');
    const link = await manager.evaluate(() => {
      return document.querySelector('#secret-link').href;
      //return navigator.clipboard.readText() // Obtain the content of the clipboard as a string
    })


    const user1 = await helpers.newPage(null);
    user1.goto(link);
    const mailbox1 = await helpers.getNewMailbox()
    
    await user1.type('[name="user[name]"]', 'SelfChecking1');
    await user1.type('[name="user[email]"]', mailbox1.address);
    await user1.type('[name="user[password]"]', '123');
    await user1.click('button')

    await user1.shouldSeeText('Please answer');
    await user1.click('#area-1');
    await user1.shouldSeeElement('button[disabled]');
    await user1.click('#investing-no-1');
    await user1.shouldNotSeeElement('button[disabled]');
    await user1.click('button');

    await user1.shouldSeeText('Have more fun')
    await user1.click('button[alt="Next"]')
    await user1.click('button[alt="Next"]')
    await user1.click('button[alt="Next"]')
    await user1.click('button[alt="Later"]')

    await user1.clickText('Discuss');
    await user1.shouldSeeText('Discussion name');
//    await user1.shouldSeeText(companyName);


    
    const user2 = await helpers.newPage(null);
    user2.goto(link);
    const mailbox2 = await helpers.getNewMailbox()
    
    await user2.type('[name="user[name]"]', 'SelfChecking2');
    await user2.type('[name="user[email]"]', mailbox2.address);
    await user2.type('[name="user[password]"]', '123');
    await user2.click('button')

    await user2.shouldSeeText('Please answer');
    await user2.click('#area-1');
    await user2.shouldSeeElement('button[disabled]');
    await user2.click('#investing-no-1');
    await user2.shouldNotSeeElement('button[disabled]');
    await user2.click('button');

    await user2.shouldSeeText('Have more fun')
    await user2.click('button[alt="Next"]')
    await user2.click('button[alt="Next"]')
    await user2.click('button[alt="Next"]')
    await user2.click('button[alt="Later"]')

    await user2.clickText('Discuss');
    await user2.shouldSeeText('Discussion name');
    //await user2.shouldSeeText(companyName);


    await manager.goto('http://app.getmedes.xxx:8080/');

    await manager.clickText('Copy secret signup link');
    const link2 = await manager.evaluate(() => {
      return document.querySelector('#secret-link').href;
      //return navigator.clipboard.readText() // Obtain the content of the clipboard as a string
    })

    if (link != link2) {
      throw new Error('Links dont match')
    }

    await manager.shouldSeeText('SelfChecking1');
    await manager.shouldSeeText('SelfChecking2');

  });

})