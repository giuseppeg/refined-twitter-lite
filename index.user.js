// ==UserScript==
// @name refined-twitter-lite
// @description Small UserScript that adds some UI improvements to Twitter Lite
// @version 0.2.1
// @match https://*.twitter.com/*
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

  function onNavigate(url) {
    const parsedUrl = document.createElement('a')
    parsedUrl.href = url
    setFeatures(
      Object.keys(features).filter(feature => features[feature](parsedUrl, document.title || ''))
    )
  }

  let currentUrl = window.location.href
  document.documentElement.addEventListener('DOMNodeInserted', () => {
    if (window.location.href === currentUrl) {
      return
    }
    currentUrl = window.location.href
    onNavigate(currentUrl)
  })
  onNavigate(currentUrl)

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
}())
