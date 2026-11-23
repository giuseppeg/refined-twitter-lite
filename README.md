# Refined Twitter Lite

A browser extension and userscript that adds small UI improvements to X (formerly Twitter). Inspired by [Refined Twitter](https://github.com/sindresorhus/refined-twitter).

It supports the new X interface. See the [features page](./FEATURES.md) for available features and their limits.

## Install

### Browser extension

Install [Refined Twitter Lite from the Chrome Web Store](https://chrome.google.com/webstore/detail/refined-twitter-lite/adhbafkkfbonbogdlaebnoegpoogngcc). The store version may not yet include the latest changes in this repository.

To try the local version in Chrome or Brave:

1. Open `chrome://extensions` or `brave://extensions`.
2. Enable developer mode and choose **Load unpacked**.
3. Select this repository's folder, then refresh X.

After changing the extension files, reload the extension on that page and refresh X again.

### Userscript

Install `index.user.js` using a userscript manager. Run `node build.mjs` first if you changed the source files; the standalone userscript does not update itself from them.

## Development

The extension loads `index.old.js`, `index.new.js` and `entry.js` directly. Run these checks after making changes:

```sh
node test-entry.js
node test.js
```

Run `node build.mjs` to regenerate `index.user.js`, then run `node test-entry.js --userscript` to check the standalone build.

## Old X interface

The extension also supports the previous X interface, with some additional
features listed in the [old interface section](./FEATURES.md#old-x-interface).
It selects the matching implementation automatically.
