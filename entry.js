// Wait until the page identifies which Twitter interface it uses.
(function () {
  function start() {
    if (document.querySelector('script[src*="/x-web/x-web/"]')) {
      observer.disconnect();
      window.refinedTwitterLiteNew();
    } else if (document.querySelector('#react-root') || location.hostname === 'tweetdeck.twitter.com') {
      observer.disconnect();
      window.refinedTwitterLiteOld();
    }
  }
  const observer = new MutationObserver(start);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  start();
})();
