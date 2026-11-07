const helpers = require('./helpers');

const { it, describe } = helpers;

var pages = {
   user: [
    "/courses",
    "/courses/terms",
    "/courses/",
    "/courses/1",
    "/courses/1/lessons/1",
    "/boards/",
    "/boards/1/edit",
    "/boards/1/topics/1/",
    "/boards/1/topics/1/discussions/1",
    "/boards/search",
    "/videos",
    //"/games",
    "/games/paper-chase",
    "/rankings",
    "/users/3",
    "/users/3/settings",
    "/users/3/settings/password/edit",
    "/users/3/friends",
    "/users/3/friends/new",
  ],

  admin: [
    "/courses",
    "/courses/terms",
    "/courses/",
    "/courses/1",
    "/courses/1/lessons/1",
    "/boards/",
    "/boards/1/edit",
    "/boards/1/topics/1/",
    "/boards/1/topics/1/discussions/1",
    "/boards/search",
    "/videos",
    //"/games",
    "/games/paper-chase",
    "/rankings",
    "/users/3",
    "/users/3/settings",
    "/users/3/settings/password/edit",
    "/users/3/friends",
    "/users/3/friends/new",

    "/boards/new",
    "/boards/1/topics/1/edit",
    "/boards/1/topics/new?open",
    "/boards/1/topics/1/discussions/1/edit",
    "/courses/new",
    "/courses/1/edit",
    "/courses/1/lessons/1/edit",
    "/courses/1/lessons/new",
    "/companies",
    "/companies/1/invites",
    "/companies/1/invites/new",
    "/companies/1/edit",
    "/companies/new",
  ],

  guest: [
    "/signout",
    "/signin",
    "/signup",
    "/request_access",
    "/reset_password"
  ]
 }

Object.keys(pages).forEach((group) => {
  describe(`When ${group}`, () => {

    var sessions = {}
    pages[group].forEach((url, index) => {
      it (`goes to ${url.replace(/\//g, ':')}`, async () => {

        if (!sessions[group]) {
          if (group === 'admin') {
            var page = await helpers.getPage('SUPER-SECRET-ADMIN')
          } else if (group === 'user') {
            var page = await helpers.getPage('USER')
          } else {
            var page = await helpers.getPage(null)
          }
          sessions[group] = page;
        } else {
          var page = sessions[group]
        }
        page.dontClose = index < pages[group].length - 1;
        page.onlyScreenshotOnFailure = true;
        // fresh page
        await page.log('Clear localstorage');
        await page.goto(`http://app.getmedes.com/assets/empty.htm`);
        await page.evaluate(() => {
          localStorage.clear();
        })

        await page.log('Cold visit');
        await page.goto(`http://app.getmedes.com${url}`);
        await page.shouldNotSeeElement('.placeholder, .placeholders, .error, .loader, .loading');

        await page.log('Visit with warm cache');
        await page.goto(`http://app.getmedes.com${url}`);
        await page.shouldNotSeeElement('.placeholder, .placeholders, .error, .loader, .loading');
      })
    })
  })
})