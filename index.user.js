// ==UserScript==
// @name refined-twitter-lite
// @description Small UserScript that adds some UI improvements to Twitter Lite
// @version 0.2.1
// @match https://*.twitter.com/*
// @run-at document-start
// @grant none
// ==/UserScript==
(function () {
  const features = {
    singleColumn: (parsedUrl, title) => {
      return /^((?!messages|settings).)*$/.test(parsedUrl.pathname)
    }
  }

  function setFeatures(features) {
    document.documentElement.setAttribute('data-refined-twitter-lite', features.join(' '))
  }

  function onNavigate(state, title, url) {
    const parsedUrl = document.createElement('a')
    parsedUrl.href = url || window.location.href
    setFeatures(
      Object.keys(features).filter(feature => features[feature](parsedUrl, title || ''))
    )
  }

  const pushState = history.pushState
  history.pushState = function pushState() {
    if (typeof history.onpushstate == "function") {
      history.onpushstate.apply(history, arguments)
    }

    return pushState.apply(history, arguments)
  }

  history.onpushstate = function () {
    console.log('onNavigate')
    onNavigate.apply(null, arguments)
  }

  window.addEventListener('load', () => {
    window.addEventListener('popstate', onNavigate)
    onNavigate(null, document.title, window.location.href)

    document.head.insertAdjacentHTML('beforeend', `
      <style>
        [data-refined-twitter-lite~="singleColumn"] [data-testid="sidebarColumn"] {
          display: none;
        }
        [data-refined-twitter-lite~="singleColumn"] .rn-1ye8kvj {
          min-width: 678px;
        }
      </style>
    `)
  })
}())
