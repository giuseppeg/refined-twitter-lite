# Refined Twitter Lite

Small UserScript that adds some UI improvements to Twitter Lite. Totally inspired by [Refined Twitter](https://github.com/sindresorhus/refined-twitter).

<img height="400" alt="" src="https://user-images.githubusercontent.com/711311/63284988-0c22ff00-c2b5-11e9-8f5b-fd248fa1d1ba.png" role="presentation">

For a comprehensive list of tweaks check the [features page](./FEATURES.md).

### install

As a Chrome Extension:

* Install the extension from the [Chrome Web Store](https://chrome.google.com/webstore/detail/refined-twitter-lite/adhbafkkfbonbogdlaebnoegpoogngcc)

As a UserScript:

* download `index.user.js`
* open Chrome
* go to [`chrome://extensions/`](chrome://extensions/)
* drag and drop `index.user.js` (make sure chrome extensions is in developer mode)
* enjoy 🍸

Note that when installing Refined Twitter Lite as a UserScript you will need to update it manually every once a while.

### Development

The extension loads `index.old.js` and `index.new.js` directly. After changing
either file, reload the extension and refresh the page. Run `node test-entry.js`
and `node test.js` to check the entry and existing tests.

Run `node build.mjs` to regenerate the standalone `index.user.js` after changing
the source files. Run `node test-entry.js --userscript` to check that build.

The new X interface is only partially supported; see [features](./FEATURES.md)
for the current limitations.
