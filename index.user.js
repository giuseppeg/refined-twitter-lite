// ==UserScript==
// @name refined-twitter-lite
// @description Small UserScript that adds some UI improvements to Twitter Lite
// @version 0.2.1
// @match https://*.twitter.com/*
// @grant none
// ==/UserScript==
(function () {
  // Supported features.
  // Can optionally define a test function that must return a boolean.
  const features = {
    singleColumn: {
      default: true,
      test: ({ parsedUrl }) => {
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
      default: false,
      styles: [
        `[href$="/likes"],
         [data-testid="like"] span,
         [data-testid="unlike"] span {
            display: none
         }`
      ]
    },
    hideRetweetCount: {
      default: false,
      styles: [
        `[href$="/retweets"],
         [data-testid="retweet"] span,
         [data-testid="unretweet"] span {
            display: none
         }`
      ]
    },
    hideReplyCount: {
      default: false,
      styles: [
        `[data-testid="reply"] span { display: none }`
      ]
    },
    hideAvatars: {
      default: false,
      styles: [
        `[style*="/profile_images/"] { display: none }`
      ]
    },
    obfuscateHandlesAndUserNames: {
      default: false,
      styles: [
        `[data-testid="tweet"] [href^="/"]:not([aria-hidden]):not([href*="/status/"]),
         [data-testid="UserCell"] [href^="/"]:not([href*="/status/"]) {
            filter: blur(3px)
         }
        `
      ]
    },
    hideHandlesAndUserNames: {
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

  // Generate and append the styles.
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

  // Settings are saved to localStorage and merged with the default on load.
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

  function setFeatures() {
    const parsedUrl = document.createElement('a')
    parsedUrl.href = window.location.href

    const enabledFeatures = Object.keys(features).filter(feature =>
      settings[feature] &&
      (!features[feature].test ||
      features[feature].test({ parsedUrl, title: document.title || '' }))
    )
    document.documentElement.setAttribute('data-refined-twitter-lite', enabledFeatures.join(' '))
  }

  // Watch for changes to the DOM to detect page navigation.
  // TODO: refactor to use the history API as this is a workaround right now.
  let prevUrl = window.location.href
  document.body.addEventListener('DOMNodeInserted', () => {
    if (window.location.href !== prevUrl) {
      setFeatures()
      prevUrl = window.location.href
    }
  })
  setFeatures()

  // Customize/Save settings API
  // setRefinedTwitterLiteFeatures is available to the user and can be called with:
  // - the new settings object (can be partial)
  // - a function that gets the current settings and must return the new ones (can be partial)
  // new settings are merged with the current ones.
  window.setRefinedTwitterLiteFeatures = features => {
    settings = Object.assign(
      settings,
      typeof features === 'function' ? features(settings) || {} : features
    )
    localStorage.setItem(storageKey, JSON.stringify(settings))
    setFeatures()
  }

  window.addEventListener('beforeunload', () => {
    setRefinedTwitterLiteFeatures(settings)
  })
}())
