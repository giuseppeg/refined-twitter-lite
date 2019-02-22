// ==UserScript==
// @name refined-twitter-lite
// @description Small UserScript that adds some UI improvements to Twitter Lite
// @version 0.2.1
// @match https://*.twitter.com/*
// @grant none
// ==/UserScript==
(function () {
  let prevUrl = window.location.href
  const features = {
    singleColumn: {
      default: true,
      test: (parsedUrl, title) => {
        return /^((?!messages|settings).)*$/.test(parsedUrl.pathname)
      },
      styles: [
        '[data-testid="sidebarColumn"] { display: none }',
        '.rn-1ye8kvj { min-width: 678px }'
      ]
    },
    composeButtonTextCursor: {
      default: true,
      styles: [
        `[href="/compose/tweet"] [dir] { cursor: text }`
      ]
    },
    hideLikeCount: {
      default: true,
      styles: [
        `[href$="/likes"],
         [data-testid="like"] span,
         [data-testid="unlike"] span {
            display: none
         }`
      ]
    },
    hideRetweetCount: {
      default: true,
      styles: [
        `[href$="/retweets"],
         [data-testid="retweet"] span,
         [data-testid="unretweet"] span {
            display: none
         }`
      ]
    },
    hideReplyCount: {
      default: true,
      styles: [
        `[data-testid="reply"] span { display: none }`
      ]
    },
    hideAvatars: {
      default: true,
      styles: [
        `[style*="/profile_images/"] { display: none }`
      ]
    },
    obfuscateName: {
      default: true,
      styles: [
        `[data-testid="tweet"] [href^="/"]:not([aria-hidden]):not([href*="/status/"]),
         [data-testid="UserCell"] [href^="/"]:not([href*="/status/"]) {
            filter: blur(3px)
         }
        `
      ]
    },
    hideName: {
      default: false,
      styles: [
        `[data-testid="tweet"] [href^="/"]:not([aria-hidden]):not([href*="/status/"]),
         [data-testid="UserCell"] [href^="/"]:not([href*="/status/"]) {
            display: none
         }
        `
      ]
    }
  }

  const storageKey = 'refined-twitter-lite'
  let settings = {}
  const storedSettings = JSON.parse(localStorage.getItem(storageKey)) || {}
  settings = Object.keys(features).reduce((settings, feature) => {
    if (typeof storedSettings[feature] === 'boolean') {
      settings[feature] = storedSettings[feature]
    } else {
      settings[feature] = features[feature].default
    }
    return settings
  }, {})
  console.log(storedSettings)

  function setFeatures() {
    const parsedUrl = document.createElement('a')
    parsedUrl.href = window.location.href

    const enabledFeatures = Object.keys(features).filter(feature =>
      settings[feature] &&
      (!features[feature].test ||
      features[feature].test(parsedUrl, document.title || ''))
    )
    document.documentElement.setAttribute('data-refined-twitter-lite', enabledFeatures.join(' '))
  }

  document.head.insertAdjacentHTML('beforeend', `
    <style>
      ${Object.entries(features).map(([feature, data]) =>
        data.styles.map(rule =>
          rule.split(',').map(rule =>
            `[data-refined-twitter-lite~="${feature}"] ${rule.trim()}`
          ).join(',')
        ).join('')
      ).join("\n")}
    </style>
  `)

  document.body.addEventListener('DOMNodeInserted', () => {
    if (window.location.href !== prevUrl) {
      setFeatures()
      prevUrl = window.location.href
    }
  })
  setFeatures()

  // Customize/Save settings API

  window.setRefinedTwitterLiteFeatures = features => {
    settings = Object.assign(settings, features)
    localStorage.setItem(storageKey, JSON.stringify(settings))
    setFeatures()
  }

  window.addEventListener('beforeunload', () => {
    setRefinedTwitterLiteFeatures(settings)
  })
}())
