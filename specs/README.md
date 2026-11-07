# Automated spec suite for mason builder

This is a set of end to end specs that test basics of Mason in a real browser.

## Installation

### Test recorder
We used fork of `puppeteer-recorder` chrome extension to capture actions in the browser. You need to install our custom extension:

* Go to https://github.com/trymason/puppeteer-recorder/releases
* Download latest release crx file (e.g. 1.0 crx)
* Open chrome://extensions in Chrome (paste this into address bar)
* Drag CRX file over there

## Running it yourself

### Run with browser window open (for debugging)
`HEADLESS=false yarn specs:debug`

### Run against specific environment
`ENV=playground yarn specs:debug`

### Run without seeing the browser (cli)
`yarn specs`


## Addings specs

### Record action sequence

Actions can be written manually, but it's much more fun to do it yourself. Especially when it comes to generating selectors.

It does not matter where to record test: QA, production or local environment.

1. Open up Puppeteer recorder chrome extension
2. Hit "Record" button (if you had previous recording, hit "Restart" before that)
3. Go to url of a page where you want test to start at. 
  * `/login` for tests that need to log user in, 
  * `/sign-up` for tests that test sign up
  * `/` mainpage for test that require user to sign in
  * Any other page will work too, if it works for signed in user and does not have ids in URL
4. Click on things you want to be clicked
5. Select text to add assertion that suite sees the text (keep it within a single element)
6. * When filling inputs press `tab` after you filled the value for it to be recorded ()
7. When sequence is done, open up recorder and hit "Stop"
8. Determine which kind of spec it is, and open up right file in `specs` directory
9. When adding new file, copy top lines of some other file like `auth.js` and add `require()` call into `index.js`, add describe() call matching your filename
10. Paste the recorded spec

* If you want to run a single spec, temporarily rename `it()` call to `fit()` or use `--filter "name or group"` option on `jasmine` *. This will still run signup spec to create user, but everything else will be skipped. This is so you can test work quicker. 

### Assertions
1. When you want to check if page has some text on it, use `await page.shouldSeeText('text')` call. This can be done via recorder by selecting the text (not inside inputs though)
2. When you want to check that page does not have text, use `await page.shouldNotSeeText('text'`) call
3. When you want to receieve email, use `await.pageWaitForHTML('subject')`. Check auth.js for example


### Considerations
1. Elements on the page are identified by selectors. Recorder makes the best effort to generate unique stable selector, but it may be affected by HTML changes. At least it will tell which selector has failed to be found on the page after spec suite runs.
2. Clicking links may result in selector containing unique id in them, which will not work when ran in suite. Simplify selector to avoid those ids. For example, clicking "Datasources" link on project page captures `a[href="/projects/5c95270af5aed5c19ce5c449/datasources"]` selector which can be simplified to `a[href$="/datasources"]`. Check out guide https://www.w3schools.com/css/css_attribute_selectors.asp for attribute selectors
3. Do not forget to press "tab" after typing in the input field
4. Avoid clicking stuff that appears on hover if it's possible. For example when selecting a feature template, "Start building" button appears over template thumbnail on hover. Recorder will naively record click on that button, which does not exist without before hover action which recorder does not capture. Instead click the stable part of the template - name of a template, like "Canvas" below the thumbnail.

* Try not to write specs that depend on other specs to work. If you need to work with a feature, create one within the test. It may be a good idea to clean them up at the end of the spec as well, so other specs have a chance to test clean empty for the user. At the very least move your spec further to the end of execution, after before `last.js` file, so that they do not affect any specs before. *

### Shortcomings
1. WYSIWYG editor recording is not supported
2. Drag & drop is not supported