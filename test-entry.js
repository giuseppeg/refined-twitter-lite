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
const articles = [];
const root = { nodeType: 1, closest() { return null; }, setAttribute() {}, removeAttribute() {} };
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
  querySelectorAll(selector) { return selector === "article" ? articles : []; },
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
const observerCount = observers.length;
window.RefinedTwitterLite.setFeatures({ enforceLatestTweets: true });
assert.equal(clicks, 1);
const followingObserver = observers[observerCount];
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

// Detect only the ad disclosure in its own post header, including new posts.
function post(label, disclosureHref, avatarHref, hasMenu = true) {
  const attributes = new Set();
  const article = {
    nodeType: 1,
    isConnected: true,
    matches(selector) { return selector === 'article'; },
    closest(selector) { return selector === 'article' ? article : null; },
    querySelector() { return { getAttribute() { return avatarHref; } }; },
    querySelectorAll(selector) { return selector === 'article' ? [] : [link]; },
    setAttribute(name) { attributes.add(name); },
    removeAttribute(name) { attributes.delete(name); },
    hasAttribute(name) { return attributes.has(name); },
  };
  const link = {
    textContent: label,
    closest() { return article; },
    getAttribute() { return disclosureHref; },
    parentElement: { querySelector() { return hasMenu ? {} : null; } },
  };
  article.link = link;
  return article;
}
const ad = post('Ad', '/sponsor', '/sponsor');
const ordinary = post('Ad', '/different', '/author');
const bodyMention = post('Ad', '/author', '/author', false);
articles.push(ad, ordinary, bodyMention);
window.RefinedTwitterLite.setFeatures({ tryToHideAds: true, delayTweet: 0 });
assert.equal(ad.hasAttribute('data-refined-twitter-lite-ad'), true);
assert.equal(ordinary.hasAttribute('data-refined-twitter-lite-ad'), false);
assert.equal(bodyMention.hasAttribute('data-refined-twitter-lite-ad'), false);
const addedAd = post('Ad', '/second', '/second');
articles.push(addedAd);
const adObserver = observers.at(-1);
adObserver.callback([{ target: root, addedNodes: [addedAd] }]);
assert.equal(addedAd.hasAttribute('data-refined-twitter-lite-ad'), true);
addedAd.link.textContent = 'Regular post';
adObserver.callback([{ target: addedAd, addedNodes: [] }]);
assert.equal(addedAd.hasAttribute('data-refined-twitter-lite-ad'), false);
window.RefinedTwitterLite.setFeatures({ tryToHideAds: false });
assert.equal(adObserver.disconnected, true);
assert.equal(ad.hasAttribute('data-refined-twitter-lite-ad'), false);
assert.equal(addedAd.hasAttribute('data-refined-twitter-lite-ad'), false);
