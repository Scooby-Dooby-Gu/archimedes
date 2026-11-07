/* eslint-disable import/no-extraneous-dependencies */
const helpers = module.exports;
const fs = require('fs');
const GIFEncoder = require('gifencoder');
const pngFileStream = require('png-file-stream');

const jasmineReporters = require('jasmine-reporters');
const fetch = require('node-fetch');

const crypto = require('crypto')

const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


global.jasmine.getEnv().addReporter(new jasmineReporters.JUnitXmlReporter({
  consolidateAll: false,
  savePath: '/tmp/circleci-test-results',
  filePrefix: 'test-results',
}));

helpers.puppeteer = require('puppeteer');
const screenSize = process.env.BREAKPOINT === 'mobile' ? { width: 380, height: 620 } : { width: 1280, height: 1024 }
  
helpers.describe = global.describe;
helpers.it = global.it;

helpers.getBrowser = async () => {
  if (helpers.browser)
    return helpers.browser

  deleteFolderRecursive('screenshots');
  try {
    fs.mkdirSync('screenshots');
  } catch(e) {}
  fs.openSync('screenshots/.gitignore', 'w');

  const id = Math.floor(Math.random() * 10000000);

  try {
    console.log('Launching', process.env.BROWSER || 'chrome')
    helpers.browser = await helpers.puppeteer.launch({
      product: process.env.BROWSER || 'chrome',
      args: ['--incognito', '--no-sandbox', '--disable-setuid-sandbox',
    ],
    //ignoreHTTPSErrors: true,
      defaultViewport: { ...screenSize, deviceScaleFactor: process.env.HEADLESS !== 'false' ? 1 : 2 },
      headless: process.env.HEADLESS !== 'false',
    });
    if (!helpers.browser || !helpers.browser.newPage) {
      throw new Error('Browser not started')
    }
  } catch(e) {
    console.log('Could not start the browser. Abort');
    console.error(e)
    process.exit(1);
  }


  helpers.userID = id;
  helpers.userName = `Puppet #${id}`;
  helpers.userPassword = 'M0NKEYseeandM0NKEYdo';

  try {
    helpers.userMailbox = await helpers.getNewMailbox();
  } catch (e) {
    console.log('Could not get a mailbox. Abort')
    console.error(e)
    process.exit(1);
  }

  helpers.userEmailAddress = helpers.userMailbox.address;
  helpers.specStarted('Signing up user');
  console.log('EMAIL', helpers.userEmailAddress);

  try {
    if (process.env.AUTH_TOKEN && process.env.FILTER) {
      helpers.apiKey = process.env.AUTH_TOKEN;
    } else {
      /* Sign up test necessary for all others */
      const page = await helpers.newUser(helpers.userMailbox, helpers.userName, helpers.userPassword)
      helpers.apiKey = page.apiKey;
      await page.shouldSeeText('Play');
    }
    console.log(`Auth token: ${helpers.apiKey}`);
  } catch (e) {
    helpers.specError = e;
    await helpers.specFinished();
    console.error(e);
    process.exit(1);
  }

  return helpers.browser;
}

const deleteFolderRecursive = (path) => {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file) => {
      const curPath = `${path}/${file}`;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    try {
      fs.rmdirSync(path);
    } catch(e) {}
  }
};

helpers.host = ((env) => {
  if (env === 'staging') {
    return 'https://app.staging.getmedes.comnpm';
  } else if (env === 'production') {
    return 'https://app.getmedes.com';
  }
  const port = process.env.PORT || 8080;
  return 'http://app.getmedes.xxx:' + port;
})(process.env.ENV);

helpers.getNewMailbox = async () => {
  helpers.emailHost = '@harakirimail.com'
  if (!helpers.emailHost) {
    const response = await fetch("https://privatix-temp-mail-v1.p.rapidapi.com/request/domains/", {
      "method": "GET",
      "headers": {
        "x-rapidapi-host": "privatix-temp-mail-v1.p.rapidapi.com",
        "x-rapidapi-key": "cef6d01cc1msha63728782cc721cp17c059jsn47e53ab7cb37"
      }
    })
    const json = await response.json()
    helpers.emailHost = json[0]
  }
  const address = 'medes-' + Math.random().toString(36).substring(2, 12);
  return { address: address + helpers.emailHost };
};


global.beforeAll(async () => {
  
});

helpers.newUser = async (mailbox, name, password) => {
  const page = await helpers.signupPage();
  page.log('Signing up as ', mailbox.address);
  await page.type('input[name="user[name]"]', name);
  await page.type('input[name="user[email]"]', mailbox.address);
  await page.type('input[name="user[password]"]', password);
  await page.clickText('Get started');
  await page.shouldSeeText('Please answer');
  await page.click('#area-1');
  await page.shouldSeeElement('button[disabled]');
  await page.click('#investing-no-1');
  await page.shouldNotSeeElement('button[disabled]');
  await page.click('button');
  await helpers.pageFromEmailLink(mailbox, 'Complete your signup', 'Verify email address', page);
  await page.shouldNotSeeText('Verify your account')
  //await page.shouldSeeText('achieve your investment learning  investment ideas')
  await page.click('button[alt="Next"]')
  await page.click('button[alt="Next"]')
  await page.click('button[alt="Next"]')
  await page.click('button[alt="Later"]')
  await page.saveApiKey();
  return page;
}

helpers.newUserFromInvite = async (mailbox, name, password, pattern = 'invited you', linkText, open) => {
  const page = await helpers.pageFromEmailLink(mailbox, pattern, linkText, undefined, open ? 'open' : null);

  await page.type('[name="user[name]"]', name);
  await page.type('[name="user[password]"]', password);
  await page.click('button')

  await page.shouldSeeText('Please answer');
  await page.click('#area-1');
  await page.shouldSeeElement('button[disabled]');
  await page.click('#investing-no-1');
  await page.shouldNotSeeElement('button[disabled]');
  await page.click('button');

  if (open) {
    //await page.shouldSeeText('achieve your investment learning  investment ideas')
    await page.click('button[alt="Next"]')
    await page.click('button[alt="Next"]')
    await page.click('button[alt="Next"]')
    await page.click('button[alt="Later"]')
  }

  await page.saveApiKey();
  
  return page;
}

helpers.pageFromEmailLink = async (mailbox, subject, linkText, page, params = '') => {
  if (!page)
    page = await helpers.cleanPage();
  page.log('Waiting for email to arrive')
  const letter = await page.waitForEmail(subject, mailbox);
  const link = letter.textOnly.match(new RegExp(`<a[^>]*href="([^"]+)"[^>]*>${linkText}`, 'i'));

  if (!link || !link[1]) {
    throw new Error(`Can not find link with text ${linkText}`)
  }

  await page.goto(link[1] + (params ? ((link[1].indexOf('?') > -1 ? '&' : '?') + params) : ''));
  return page;
} 

helpers.screenshotAnimation = async () => {
  if (process.env.ANIMATION === 'false') {
    return null;
  }
  const encoder = new GIFEncoder(screenSize.width, screenSize.height);
  const stream = pngFileStream(`${helpers.currentDir}/**/**.png`)
    .pipe(encoder.createWriteStream({ repeat: -1, delay: 1000, quality: 10 }))
    .pipe(fs.createWriteStream(`${helpers.currentDir}.gif`));

  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
};

helpers.getPopup = async(url) => {
  const browser = await helpers.getBrowser();
  return new Promise(x => (browser).once('targetcreated', target => {
    console.log('Target created');
    target.page().then((p) => x(helpers.getPage(undefined, p)))
  })); ;
}

helpers.getPage = async (apiKey = helpers.apiKey, page) => {
  if (!page) {
    const browser = await helpers.getBrowser();
    const context = await browser.createIncognitoBrowserContext();
    page = await context.newPage()
    helpers.currentPages.push(page);
  }
  if (!page._goto) {
    page._goto = page.goto;
    page._click = page.click;
    page._type = page.type;
    page._select = page.select;
  }

  
  page.apiKey = apiKey

  page.saveApiKey = async () => {
    try{
      page.apiKey = JSON.parse(await page.getLocalStorage('user')).apiKey;
      console.log( "  > Api key: " + page.apiKey)
    } catch(e) {
      throw new Error('localStorage.user is not set');
    }
  }

  page.log = (...args) => {
    console.log(...args);
    helpers.currentLog = args;
  };
  
  page.on("pageerror", function(err) {  
    for (var p in err) {
      console.log(p + err[p])
    }
    console.log("    ! Page error: " + err.toString(), err && err.error); 
  })

  page.on("error", function(err) {  
    if (err.toString().indexOf('crashed') > -1) {
      page.close()
    }
    console.log("    ! error: " + err.toString()); 
  })
  
  page.on('requestfailed', req => console.log('    ! Request failed:\n' + req.errorCode + ' ' + req.url()))

  page.getHTML = async () => {
    const element2 = await page.$('body');
    return (await element2.getProperty('innerHTML')).jsonValue();
  };


  page.url = () => page.evaluate(() => location.href);

  page.highlightElements = async (selector, outline = '3px solid blue', moveCursor) => page.evaluate((s, o, c) => {
    if (window.highlightedElements) {
      Array.prototype.forEach.call(window.highlightedElements, (el) => {
        Object.assign(el.style, {
          outline: '',
          outlineOffset: '',
        });
      });
    }
    if (typeof s === 'string') {
      window.highlightedElements = document.querySelectorAll(s);
    } else {
      window.highlightedElements = [].concat(s);
    }
    const el = window.highlightedElements[0];
    if (el) {
      el.scrollIntoView({
        block: 'center',
      });
      var cursor = document.body.querySelector('#fakecursor')
      if (c) {
        if (!cursor) {
          var cursor = document.createElement('img');
          cursor.id = 'fakecursor';
          cursor.style.animation =
          cursor.style.webkitAnimation =
          cursor.style.mozAnimation =
          cursor.style.pointerEvents = 'none'
          cursor.style.mozPointerEvents = 'none'
          cursor.style.webkitPointerEvents = 'none'
          cursor.src = `data:image/png;base64,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`
          cursor.style.width = '25px';
          cursor.style.height = 'auto';
          cursor.style.position = 'fixed';
          cursor.style.zIndex = '999999';
          document.body.appendChild(cursor);
        }
        const box = el.getBoundingClientRect();
        cursor.style.top = box.top + box.height / 2 + 'px';
        cursor.style.left = box.left + box.width / 2 + 'px';
      } else if (!c && cursor) {
        cursor.parentNode.removeChild(cursor);
      }
      Object.assign(el.style, {
        outline: o,
        outlineOffset: '-2px',
      });
    }
  }, selector, outline, moveCursor);

  page.renderHeader = async (time, log, command, annotation, error) => {
    return page.evaluate((t, l, c, a, e) => {
      if (!document.querySelector('#puppeteer-message')) {
        const message = document.createElement('div');
        message.id = 'puppeteer-message';
        message.style.position = 'fixed';
        message.style.zIndex = '999999';
        message.style.left = '0';
        message.style.padding = '20px 20px 60px';
        message.style.right = '0';
        message.style.top = '0';
        message.style.color = 'white';
        message.style.fontSize = '20px';
        message.style.pointerEvents = 'none';
        message.style.MozPointerEvents = 'none';
        message.style.WebkitPointerEvents = 'none';
        message.style.background = 'linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.5), rgba(0,0,0,0))';
        document.body.appendChild(message);
      }
      document.querySelector('#puppeteer-message').innerHTML = `<span style="float: right">${t}</span><div style="overflow:hidden;white-space: nowrap;text-overflow:ellipsis;"></div><strong>${l || ''}</strong><div style="overflow:hidden;white-space: nowrap;text-overflow:ellipsis;"><strong>${c}</strong>: ${a || ''}</div>`;
      if (e) {
        document.querySelector('#puppeteer-message').innerHTML += `<div style="color: red">${e}</div>`;
      }
    }, time, log, command, annotation, error);
  }

  page.screenshotFrame = async (command, annotation, error) => {
    
    if (helpers.dontScreenshot || page.dontScreenshot || ((process.env.ANIMATION === 'false' || page.onlyScreenshotOnFailure) && !error)) {
      helpers.currentPage = page;
      return;
    }
    await page.renderHeader(`${new Date() - helpers.currentTime}ms`, (helpers.currentLog || []).join(' '), command, annotation, error && error.message);
    if (!fs.existsSync(helpers.currentDir)) {
      fs.mkdirSync(helpers.currentDir);
    }
    if (process.env.SCREENSHOTS !== 'false') {
      await page.screenshot({ path: `${helpers.currentDir}/${helpers.currentStep}.png` });
    }
    helpers.currentStep += 1;
    helpers.currentTime = new Date();
    helpers.currentScreenshotFrameCount++;
    helpers.currentPage = page;
    // await page.renderHeader('', '', '', '', '');
  };

  page.acceptNextConfirmation = async () => page.on('dialog', (dialog) => {
    dialog.accept();
  });

  page.getLocalStorage = async prop => page.evaluate(propName => localStorage.getItem(propName), prop);

  page.getNewMailbox = helpers.getNewMailbox;
  
  page.waitForEmail = async (filter = '', mailbox = helpers.userMailbox) => {
    try {
      let hash = crypto.createHash('md5').update(mailbox.address).digest("hex")
      const email = await helpers.pollPromise(async () => {
        console.log("Checking", mailbox.address)
        return fetch(`https://privatix-temp-mail-v1.p.rapidapi.com/request/mail/id/${hash}/`, {
          "method": "GET",
          "headers": {
            "x-rapidapi-host": "privatix-temp-mail-v1.p.rapidapi.com",
            "x-rapidapi-key": "cef6d01cc1msha63728782cc721cp17c059jsn47e53ab7cb37"
          }
        })
        .then(response => {
          return response.json().then((body) => {
            const found = body && body.find && body.find((email) => {
              return email.mail_subject.indexOf(filter) > -1
            })
            if (found) {
              return {
                from: found.mail_from,
                to: found.mail_to,
                subject: found.mail_subject,
                textOnly: found.mail_text_only,
              }
            } else {
              console.log('No email yet')
            }
          })
        })
      }, 50);
      //await mailbox.deleteAllMessages();
      await page.screenshotFrame('Email', filter);
      return email;
    } catch (e) {
      await page.screenshotFrame('Email', filter, e);
      throw e;  
    }
  };
 
  
  page.waitForEmail = async (filter = '', mailbox = helpers.userMailbox) => {
    try {
      const email = await helpers.pollPromise(async () => fetch(`https://harakirimail.com/api/v1/inbox/${mailbox.address.split('@')[0]}`).then((r) => {
        return r.json().then((body) => {
          const found = body.emails.find((email) => {
            return email.subject.indexOf(filter) > -1
          })
          if (found) {
            //console.log('Found', found.subject, found._id);
            return fetch(`https://harakirimail.com/api/v1/email/${found._id}`).then((r) => {
              return r.json().then(({from, to, subject, bodyhtmltext}) => {
                return {
                  from, to, subject,
                  textOnly: bodyhtmltext
                }
              })
            })
          }
          return;
        })
      }), 50);
      //await mailbox.deleteAllMessages();
      await page.screenshotFrame('Email', filter);
      return email;
    } catch (e) {
      await page.screenshotFrame('Email', filter, e);
      throw e;
    }
  };


  page.isElementVisible = (element) => {
    return page.evaluate((e) => {
      // special case file input
      if (e.type == 'file') return true;

      for (var p = e; p; p = p.parentElement) {
        const style = window.getComputedStyle(p);
        if (!(style && style.display !== 'none' && 
          style.visibility !== 'hidden' && 
          p.getAttribute('hidden') == null && 
          style.opacity !== '0'/* && 
          p.getBoundingClientRect().width && 
          p.getBoundingClientRect().height */)) return false;
      }
      e.scrollIntoView({block: 'center', inline: 'center'});
      const rect = e.getBoundingClientRect();
      const target = document.elementFromPoint(rect.left + rect.width / 2,rect.top + rect.height / 2);
      if (!target  || !(target.contains(e) || e.contains(target) || e === target || target.matches('a.background[href]'))) return;
      return true;
    }, element);
  }
  var filterAsync = (array, filter) =>
  Promise.all(array.map(entry => filter(entry)))
  .then(bits => array.filter(entry => bits.shift()));

  page.getElementsWithText = async (text, tags, expectedCount, selector = '#app') => {
    var query = (tags || ['*']).map((tag) => selector + ' ' + tag).join(', ')
    const results = await filterAsync(await page.$$(query), async (element) => {
      return (await page.evaluate((el, text) => {
        if (el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
          const t = el.textContent || (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ? el.value : null) || '';
          return t.toLowerCase().replace(/\s+/g, '').includes(text.toLowerCase().replace(/\s+/g, ''))
        }
      }, element, text)) 
      && (await page.isElementVisible(element));
    });
    if (results.length && expectedCount === 0) {
      console.log('  ! Still seeing', await (await results[results.length - 1].getProperty('outerHTML')).jsonValue());
    }
    if (expectedCount === undefined ? results.length : results.length === expectedCount) {
      return results;
    }

    return null;
  };

  page.getElementsBySelector = async (selector, expectedCount) => {
    const results = await filterAsync(await page.$$(selector), page.isElementVisible);;
    
    if (results.length && expectedCount === 0) {
      console.log('  ! Still seeing', await (await results[0].getProperty('outerHTML')).jsonValue());
    }
    if (expectedCount === undefined ? results.length : results.length === expectedCount) {
      return results;
    }

    return null;
  };

  page.elementShouldHaveStyle = async (selector, property, value) => {
    await page.waitForSelector(selector);
    const actual = await page.evaluate((s, p) => {
      const el = document.querySelector(s);
      const d = el.style.display;
      // getComputedStyle returns uncalculated values when display is none
      el.style.display = 'none';
      const v = window.getComputedStyle(el)[p];
      el.style.display = d;
      return v;
    }, selector, property);
    await page.highlightElements(selector, '3px dotted purple');
    await page.screenshotFrame('Style', `${selector} ${property}:${value}`);
    if (actual !== value) {
      throw new Error(`Expected \`${selector}\` ${property} to be ${value} got ${actual}`);
    }
  };

  page.waitForElementsWithText = async (text, tags, expectedCount, attempts, selector) => helpers.pollPromise(async () => page.getElementsWithText(text, tags, expectedCount, selector), attempts);

  page.waitForElementsBySelector = async (selector, expectedCount, attempts) => helpers.pollPromise(async () => page.getElementsBySelector(selector, expectedCount), attempts);

  page.shouldSeeText = async (text, selector) => {
    console.log('  - Seeing     ', text, selector ? ' inside ' + selector : '');
    try {
      const elements = await (page.waitForElementsWithText(text, undefined, undefined, undefined, selector).catch((e) => {
        throw e.message === 'Timeout' ? new Error(`Timed out waiting for text: ${text}`) : e;
      }));
      await page.highlightElements(elements[elements.length - 1], '3px solid grey');
      await page.screenshotFrame('Seeing', text);
    } catch (e) {
      await page.screenshotFrame('Seeing ', text, e);
      throw e;
    }
  };


  page.shouldNotSeeText = async (text, selector) => {
    console.log('  - Not seeing ', text, selector ? ' inside ' + selector : '');
    try {
      await page.waitForElementsWithText(text, undefined, 0, undefined, undefined, selector).catch((e) => {
        throw e.message === 'Timeout' ? new Error(`Timed out waiting for text to disappear: ${text}`) : e;
      });
      await page.screenshotFrame('Not seeing', text);
    } catch (e) {
      const elements = await page.getElementsWithText(text, undefined, undefined, selector);
      await page.highlightElements(elements[elements.length - 1], '3px solid grey');
      await page.screenshotFrame('Not seeing', text, e);
      throw e;
    }
  };

  page.shouldSeeElement = async (selector, options) => {
    console.log('  - Seeing     ', selector);
    try {
      const elements = await (page.waitForElementsBySelector(selector).catch((e) => {
        throw e.message === 'Timeout' ? new Error(`Timed out waiting for selector: ${selector}`) : e;
      }));
      await page.highlightElements(elements[elements.length - 1], '3px solid grey');
      await page.screenshotFrame('Seeing', selector);
    } catch (e) {
      await page.screenshotFrame('Seeing ', selector, e);
      throw e;
    }
  };

  page.shouldNotSeeElement = async (selector, attempts) => {
    console.log('  - Not seeing ', selector);
    try {
      await page.waitForElementsBySelector(selector, 0, attempts).catch((e) => {
        throw e.message === 'Timeout' ? new Error(`Timed out waiting for selector to disappear: ${selector}`) : e;
      });
      await page.screenshotFrame('Not seeing', selector);
    } catch (e) {
      const elements = await page.getElementsBySelector(selector);
      await page.highlightElements(elements[elements.length - 1], '3px solid grey');
      await page.screenshotFrame('Not seeing', selector, e);
      throw e;
    }
  };

  page.attachFile = async function(selector, filepath) {
    console.log('  - Attach     ', selector, filepath)
    try {
      const input = (await page.waitForElementsBySelector(selector))[0]
      await input.uploadFile(path.relative(process.cwd(), __dirname + '/../' + filepath));
      await page.evaluate((i) => {
        i.dispatchEvent(new Event('change', {bubbles: true}));
        i.dispatchEvent(new Event('input', {bubbles: true}));
      }, input)
      await page.screenshotFrame('Attaching', selector + ' ' + filepath);
    } catch (e) {
      await page.screenshotFrame('Attaching', selector + ' ' + filepath, e);
      throw e;
    }
  }


  page.clickText = async (text, options) => {
    console.log('  - Click      ', `"${text}"`, options && JSON.stringify(options) || '');
    try {
      await page.waitForElementsWithText(text, options && options.tags || ['a', 'button'], undefined, undefined, options && options.context).catch((e) => {
        throw e.message === 'Timeout' ? new Error(`Can not find element with text: ${text}`) : e;
      });
      const handlers = await page.waitForElementsWithText(text, options && options.tags || ['a', 'button'], undefined, undefined, options && options.context).catch((e) => {
        throw e.message === 'Timeout' ? new Error(`Can not find element with text: ${text}`) : e;
      });
      
      if (handlers.length > 0) {
        await page.evaluate(() => {
          if (document.activeElement.type === 'password')
            document.activeElement.blur();
        })
        const el = options && options.last ? handlers[handlers.length - 1] : handlers[0];
        await page.highlightElements(el, undefined, true);
        await page.screenshotFrame('Click text', text);
        /*let pos = await page.evaluate((el) => {
            const {top, width, height, left} = el.getBoundingClientRect();
            return {top: top + height / 2, left: left + width / 2};
        }, el);
        console.log(pos.left, pos.top, 'lol')
        await page.mouse.move(pos.left, pos.top); // I move the mouse over the element. +5 just to not go beyond element's limits.
        await page.mouse.down({clickCount: 1});*/
        //await page.wait(32);
        
        try {
          await el.click(options);
        } catch(e) {
          if ((!options || !options.retry) && String(e.message).match(/detached|not visible/)) {
            return page.clickText(text, { ...options, retry: true})
          } else {
            throw e;
          }
        }
        await page.waitForElementsBySelector('.placeholder, .loading', 0, 10).catch((e) => {
          throw e.message === 'Timeout' ? new Error(`Timed out waiting for selector to disappear: .placeholder, .loading'`) : e;
        });
        //await helpers.timeoutPromise(50);
      } else {
        throw new Error(`Link or button with text ${text} is not found`);
      }
    } catch (e) {
      await page.screenshotFrame('Click text', text, e);
      throw e;
    }
  };

  page.clickLastText = async (text) => {
    return page.clickText(text, {last: true});
  }

  page.clickLast = async (selector) => {
    return page.click(selector, {last: true});
  }

  page.matchURL = async(regexp) => {
    return helpers.pollPromise(async () => {
      return (await page.url()).match(regexp)
    }, 35);
  }

  page.drag = async(selector, options) => {
    console.log('  - Drag       ', `${selector}`, options && JSON.stringify(options) || '');
    
    try {
      await page.waitForSelector(selector);
      const handlers = await page.$$(selector)
      const el = options && options.last ? handlers[handlers.length - 1] : handlers[0];
      
      await page.highlightElements(el, undefined, true);

      //await page.mouse.move(bounding_box.x + bounding_box.width / 2, bounding_box.y + bounding_box.height / 2);
      
      //await page.mouse.down();

      await page.wait(50);
      await page.evaluate((el) => {
        window.dataTransfer = new DataTransfer();
        window.dataTransfer.effectAllowed = 'all';
        window.dataTransfer.dropEffect = 'none';
        window.dataTransfer.files = [];
        el.dispatchEvent(new DragEvent('dragstart', {bubbles: true, dataTransfer: window.dataTransfer}));
      }, el)
      await page.wait(150);
      await page.screenshotFrame('Drag', selector);
      //await page.wait(50);
      //await page.mouse.move(bounding_box.x + bounding_box.width / 2, bounding_box.y + bounding_box.height / 2 - 100,  { steps: 3});
    } catch (e) {
      await page.screenshotFrame('Click', selector, e);
      throw e;
    }
  }

  page.drop = async(selector, options) => {
    console.log('  - Drop       ', `${selector}`, options && JSON.stringify(options) || '');
    
    try {
      await page.waitForSelector(selector);
      const handlers = await page.$$(selector)
      const el = options && options.last ? handlers[handlers.length - 1] : handlers[0];
      
      const bounding_box = await el.boundingBox();

      //await page.mouse.move(bounding_box.x + bounding_box.width / 2, bounding_box.y + bounding_box.height / 2,  { steps: 3});
      //await page.mouse.up();
      await page.wait(50);
      await page.evaluate((el) => {
        el.dispatchEvent(new DragEvent('dragover', {bubbles: true, dataTransfer: window.dataTransfer}));
        setTimeout(() => {
          el.dispatchEvent(new DragEvent('drop', {bubbles: true, dataTransfer: window.dataTransfer}));
          setTimeout(() => {
            el.dispatchEvent(new DragEvent('dragend', {bubbles: true, dataTransfer: window.dataTransfer}));
          }, 50)
        }, 50)
      }, el)
      await page.wait(150);
      await page.highlightElements(el, undefined, true);
      await page.screenshotFrame('Drop', selector);
      //await page.wait(200);
    } catch (e) {
      await page.screenshotFrame('Click', selector, e);
      throw e;
    }
  }

  page.click = async (selector, options) => {
    if (selector.match(/[A-Z]|\s/) && !selector.match(/\[|_|#|\-/)) {
      throw new Error('Did you mean page.clickText(\'' + selector + '\')?')
    }
    console.log('  - Click      ', selector, options && JSON.stringify(options) || '');
    try {
      //await page.wait(32);
      const handlers = await page.waitForElementsBySelector(selector)
      const el = options && options.last ? handlers[handlers.length - 1] : handlers[0];
      
      await page.evaluate(() => {
        if (document.activeElement.type === 'password')
          document.activeElement.blur();
      })
      await page.highlightElements(el, undefined, true);
      await page.screenshotFrame('Click', selector);
      // retry once
      try {
        await el.click(options);
      } catch(e) {
        if ((!options || !options.retry) && String(e.message).match(/detached|not visible/)) {
          return page.click(selector, { ...options, retry: true})
        } else {
          throw e;
        }
      }
      await page.waitForElementsBySelector('.placeholder, .loading', 0, 10).catch((e) => {
        throw e.message === 'Timeout' ? new Error(`Timed out waiting for selector to disappear: .placeholder, .loading'`) : e;
      });
      //await helpers.timeoutPromise(32);
    } catch (e) {
      await page.screenshotFrame('Click', selector, e);
      throw e;
    }
  };


  page.doubleclick = async (selector, options) => page.click(selector, {
    ...options,
    clickCount: 2,
  });

  // clear input when typing new value
  // by default it appends text
  page.type = async (...args) => {
    console.log('  - Type       ', ...args);
    try {
      await page.waitForSelector(args[0]);
      await page._click(args[0], {clickCount: 3});
      await page.keyboard.press('Backspace');
      await page._type(args[0], args[1], {...args[2]});
      await page.highlightElements(args[0], '3px solid purple');
      //await helpers.timeoutPromise(50);
      await page.screenshotFrame('Type', args.join(', '));
    } catch (e) {
      await page.screenshotFrame('Type', args.join(', '), e);
      throw e;
    }
  };

  page.select = async (...args) => {
    console.log('  - Select     ', ...args);
    try {
      await page.wait(32);
      await page.waitForSelector(args[0] + ' [value="' + args[1] + '"]');
      await page.wait(32);
      //await helpers.timeoutPromise(50);
      await page._select(...args);
      await page.highlightElements(args[0], '3px solid purple');
      //await helpers.timeoutPromise(50);
      await page.screenshotFrame('Select', args.join(', '));
    } catch (e) {
      await page.screenshotFrame('Select', args.join(', '), e);
      throw e;
    }
  };

  // when navigating to page
  // wait for loader to disappear
  page.goto = async (url, ...args) => {
    try {
      const bits = url.split('/');
      if (url.match(/getmedes.com|getmedes.xxx|herokuapp|localhost|127.0.0.1|0.0.0.0/)) {
        if (bits[0].indexOf('http') > -1 || !bits[0]) {
          bits.shift();
          bits.shift();
        }
        bits.shift();
        bits.unshift(helpers.host);
      }

      let newURL = bits.join('/');
      if (newURL.indexOf(helpers.host) > -1 && page.apiKey) {
        if (newURL.indexOf('signout') === -1) {
          newURL += `${newURL.indexOf('?') == -1 ? '?' : '&'}api_key=${page.apiKey}`;
        }
      }

      const navigationPromise = page.waitForNavigation();

      console.log('  - Goto       ', newURL, ...args);
      await page._goto(newURL, ...args);

      await navigationPromise;
      await page.waitForSelector('body:not([style*="overflow"])');
      await page.waitForElementsWithText('Application error', undefined, 0, 1).catch((e) => {
        throw new Error('Backend has errored out');
      });
      await page.screenshotFrame('Goto', url);
      return page;
    } catch (e) {
      await page.screenshotFrame('Goto', url, e);
      throw e;
    }
  };

  page.wait = helpers.wait;

  ['click', 'type', 'select', 'clickText', 'shouldNotSeeText', 'shouldSeeSeeText', 'shouldNotSeeElement', 'shouldSeeSeeElement'].map((method) => {
    var fn = page[method];
    page[method] = async (...args) => {
      var phase = (page.phase || 0) + 1;
      page.phase = phase;
      try {
        var result = await fn(...args);
        
        if (page.phase !== phase && !(args[1] && args[1].retry)) {
          throw new Error('Method called concurrently without awaiting: ' + method);
        }
      } catch(e) {
        throw e;
      }
      return result;
    }
  })

  return page;
};
helpers.newPage = helpers.getPage;

helpers.cleanPage = async(params = '') => {
  const page = await helpers.getPage(null);
  await page.goto('http://app.getmedes.xxx:8080/' + params);
  return page;
}

helpers.newGamePage = async(key) => {
  const page = await helpers.getPage(key);
  await page.log('Reset the game');
  await page.goto(`http://app.getmedes.xxx/games/paper-chase/reset`);
  return page;
}

// Home page of a signed in user
helpers.homePage = async (key) => {
  const page = await helpers.getPage(key);
  page.log('Going to mainpage of a signed in user');
  await page.goto('http://app.getmedes.xxx:8080/');
  return page;
};
helpers.mainPage = helpers.homePage;

// Show signup page (logged out)
helpers.signinPage = async () => {
  const page = await helpers.cleanPage();
  await page.clickText('I have an account');
  return page;
};
helpers.loginPage = helpers.signinPage;

// Sign up page (when sign up is open)
helpers.signupPage = async () => {
  const page = await helpers.cleanPage('?open');
  page.log('Going to sign up page');
  await page.clickText('Sign up');
  await page.shouldSeeText('Full name');
  return page;
};

// Sign up page (when sign up is closed)
helpers.requestAccessPage = async () => {
  const page = await helpers.cleanPage();
  page.log('Going to sign up page');
  await page.clickText('Request access');
  await page.shouldSeeText('Full name');
  return page;
};


// Delay promise
helpers.wait = helpers.timeoutPromise = (delay => new Promise((resolve) => {
  setTimeout(resolve, delay);
}));

// Retry promise 20 times with 1000 ms interval
helpers.pollPromise = (callback, attempts = 20) => callback().then(async (result) => {
  if (!result) {
    if (attempts > -1) {
      await helpers.timeoutPromise(1000);
      return helpers.pollPromise(callback, attempts - 1);
    }
    throw new Error('Timeout');
  }
  return result;
});

helpers.currentSpec = 100;
global.jasmine.getEnv().addReporter({
  specStarted(result) {
    helpers.nextSpec = result.fullName;
  },
  specDone(result) {
    if (!helpers.specError && result.status !== 'excluded') {
      helpers.specError = result.failedExpectations[0];
    }
  },
});

helpers.specStarted = (name) => {
  console.log('');
  console.log('');
  console.log(`# ${name}`);
  helpers.currentPage = null;
  helpers.currentTest = name;
  helpers.currentStep = 100;
  helpers.currentTime = new Date();
  helpers.currentStartTime = new Date();
  helpers.currentDir = `screenshots/${helpers.currentTest}`;
  helpers.currentLog = [];
  helpers.currentPages = [];
  helpers.currentScreenshotFrameCount = 0;
  deleteFolderRecursive(helpers.currentDir);
};
helpers.animations = [];

helpers.specFinished = async () => {
  if (helpers.currentTest) {
    helpers.currentLog = [`${helpers.currentStep - 100}steps in ${new Date() - helpers.currentStartTime}ms total`];
    const page = helpers.currentPage || helpers.currentPages[helpers.currentPages.length - 1];
    if (helpers.specError) {
      console.log('\n' + helpers.specError.stack + '\n\n\n')
    }
    if (page) {
      if (!helpers.specError) {
        await page.screenshotFrame('Success');
      } else {
        await page.screenshotFrame('Failure', undefined, helpers.specError);
      }
    }
    helpers.specError = null;
    if (helpers.currentScreenshotFrameCount && process.env.ANIMATION !== 'false') {
      const dir = helpers.currentDir;
      helpers.animations.push(helpers.screenshotAnimation().catch(console.error).then(() => deleteFolderRecursive(dir)));
    }
    helpers.currentSpec += 1;
    // helpers.currentPage._goto('about:blank');
    Promise.all(helpers.currentPages.map(async (p) => {
      if (!p.dontClose) {
        try {
          await p._goto('about:blank');
          await p.close()
        } catch(e) {

        }
      }
    }))
    helpers.currentTest = null;
    helpers.specError = null;
  }
  if (helpers.nextSpec) {
    await helpers.specStarted(helpers.nextSpec)
  }
  helpers.nextSpec = null;
};

global.beforeEach(async () => {
  return await helpers.specFinished()
});
global.afterAll(async () => {
  await helpers.specFinished();
  helpers.browser.close();
  return Promise.all(helpers.animations);
});
if (process.env.CLOSE === 'false') {
  global.jasmine.exit = () => {};
}

global.jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;

Object.assign(global, helpers);
