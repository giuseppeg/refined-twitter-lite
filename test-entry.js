const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

// Run the installable entry with a delayed new-site marker and timeline.
const files = process.argv.includes('--userscript') ? ['index.user.js'] : ['index.old.js', 'index.new.js', 'entry.js'];
const source = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const observers = [];
const listeners = {};
let marker = false;
let tab = null;
let saved = JSON.stringify({ hideAvatars: true, delayTweet: 7, enforceLatestTweets: false, futureFeature: true });
let style;
let timer;
let confirmation = false;
const root = { setAttribute() {}, removeAttribute() {} };
const location = { hostname: 'x.com', pathname: '/home', href: 'https://x.com/home' };
const document = {
  documentElement: root,
  head: { appendChild(element) { style = element; } },
  createElement() { return { addEventListener() {} }; },
  querySelector(selector) {
    if (selector.includes('/x-web/x-web/')) { return marker ? {} : null; }
    if (selector === '#react-root') { return null; }
    if (selector.includes('data-pinned-timeline')) { return tab; }
    return null;
  },
  addEventListener(name, callback) { (listeners[name] ||= []).push(callback); },
  removeEventListener(name, callback) { listeners[name] = (listeners[name] || []).filter((item) => item !== callback); },
};
const window = {
  addEventListener(name, callback) { (listeners[name] ||= []).push(callback); },
  dispatchEvent(event) { for (const callback of listeners[event.type] || []) { callback(event); } },
};
const history = { pushState() {}, replaceState() {} };
const localStorage = { getItem() { return saved; }, setItem(key, value) { saved = value; } };
class MutationObserver {
  constructor(callback) { this.callback = callback; observers.push(this); }
  observe() {}
  disconnect() { this.disconnected = true; }
}
class CustomEvent { constructor(type, options) { this.type = type; this.detail = options.detail; } }
vm.runInNewContext(source, { document, window, location, history, localStorage, MutationObserver, CustomEvent, Date, WeakSet, URL, setInterval() {}, confirm() { return confirmation; }, setTimeout(callback) { timer = callback; return 1; }, clearTimeout() { timer = undefined; } });
assert.equal(window.RefinedTwitterLite, undefined);
marker = true;
observers[0].callback();
assert.ok(window.RefinedTwitterLite);
assert.doesNotMatch(style.textContent, /data-post-avatar/);
assert.match(style.textContent, /--x-sidebar-wide: 0/);
assert.match(style.textContent, /max-width: 674px/);
assert.match(style.textContent, /grid-template-columns: minmax/);
assert.equal(observers[0].disconnected, true);
let clicks = 0;
tab = { getAttribute() { return 'false'; }, click() { clicks++; } };
assert.equal(clicks, 0);
window.RefinedTwitterLite.setFeatures({ enforceLatestTweets: true });
assert.equal(clicks, 1);
const followingObserver = observers.at(-1);
followingObserver.callback();
assert.equal(clicks, 1);
window.RefinedTwitterLite.setFeatures({ enforceLatestTweets: false });
assert.equal(followingObserver.disconnected, true);
window.RefinedTwitterLite.setFeatures({ hideAvatars: false });
assert.equal(JSON.parse(saved).delayTweet, 7);
assert.equal(JSON.parse(saved).futureFeature, true);
assert.match(style.textContent, /data-ad-disclosure/);
assert.match(style.textContent, /connect_people/);
assert.doesNotMatch(style.textContent, /data-post-avatar/);
location.href = 'https://x.com/i/chat';
location.pathname = '/i/chat';
history.pushState();
assert.doesNotMatch(style.textContent, /aside \{/);
assert.doesNotMatch(style.textContent, /--x-sidebar-wide/);
assert.doesNotMatch(style.textContent, /max-width: 674px/);

// Dispatch capture listeners in registration order, as the browser does.
function click(event) {
  let stopped = false;
  const stop = event.stopImmediatePropagation;
  event.stopImmediatePropagation = function () { stopped = true; stop(); };
  for (const listener of [...(listeners.click || [])]) {
    listener(event);
    if (stopped) { break; }
  }
}

// Exercise the delayed-post interception without sending anything.
window.RefinedTwitterLite.setFeatures({ delayTweet: 1 });
const editor = { value: 'draft', isConnected: true };
let submitted = 0;
const form = { querySelector() { return editor; }, querySelectorAll() { return []; } };
const button = { disabled: false, textContent: 'Post', isConnected: true, hidden: false, closest() { return form; }, after(cancel) { cancel.remove = function () {}; }, click() { submitted++; } };
let prevented = false;
click({ target: { closest() { return button; } }, detail: 0, preventDefault() { prevented = true; }, stopImmediatePropagation() {} });
assert.equal(prevented, true);
assert.equal(submitted, 0);
assert.equal(button.hidden, true);
timer();
assert.equal(submitted, 1);
assert.equal(button.hidden, false);

// Any mutation to the composer cancels the pending submission.
click({ target: { closest() { return button; } }, detail: 0, preventDefault() {}, stopImmediatePropagation() {} });
assert.equal(button.hidden, true);
observers.at(-1).callback();
assert.equal(button.hidden, false);
assert.equal(timer, undefined);
assert.equal(submitted, 1);

// A missing description prevents posting when the user chooses to go back.
window.RefinedTwitterLite.setFeatures({ delayTweet: 0 });
confirmation = true;
form.querySelectorAll = function () { return [{ querySelector() { return {}; }, querySelectorAll() { return []; } }]; };
prevented = false;
click({ target: { closest() { return button; } }, detail: 0, preventDefault() { prevented = true; }, stopImmediatePropagation() {} });
assert.equal(prevented, true);
assert.equal(submitted, 1);

// Disabling each feature removes its own event listener.
window.RefinedTwitterLite.setFeatures({ enforceAltTextForImages: false, delayTweet: 0, showAltTextForImagesOnHover: false, videoDownload: false });
assert.equal((listeners.click || []).length, 0);
assert.equal((listeners.pointerover || []).length, 0);
assert.equal(window.RefinedTwitterLite.getVideos, undefined);

// Each feature can be enabled again without duplicating listeners.
window.RefinedTwitterLite.setFeatures({ enforceAltTextForImages: true, delayTweet: 1 });
assert.equal(listeners.click.length, 2);
confirmation = true;
prevented = false;
click({ target: { closest() { return button; } }, detail: 0, preventDefault() { prevented = true; }, stopImmediatePropagation() {} });
assert.equal(prevented, true);
assert.equal(timer, undefined);
window.RefinedTwitterLite.setFeatures({ delayTweet: 0 });
assert.equal(listeners.click.length, 1);
window.RefinedTwitterLite.setFeatures({ enforceAltTextForImages: false });
assert.equal(listeners.click.length, 0);

// Feature styles and pending work disappear when their settings are disabled.
window.RefinedTwitterLite.setFeatures({ tryToHideAds: false, singleColumn: false, delayTweet: 1 });
assert.doesNotMatch(style.textContent, /data-ad-disclosure/);
assert.doesNotMatch(style.textContent, /max-width: 674px/);
form.querySelectorAll = function () { return []; };
click({ target: { closest() { return button; } }, detail: 0, preventDefault() {}, stopImmediatePropagation() {} });
assert.equal(button.hidden, true);
window.RefinedTwitterLite.setFeatures({ delayTweet: 0 });
assert.equal(button.hidden, false);
assert.equal(timer, undefined);
