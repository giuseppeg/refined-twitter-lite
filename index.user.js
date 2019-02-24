// ==UserScript==
// @name refined-twitter-lite
// @description Small UserScript that adds some UI improvements to Twitter Lite
// @version 0.2.3
// @match https://*.twitter.com/*
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
        '.rn-1ye8kvj { min-width: 675px }'
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
         [data-testid="UserCell"] [href^="/"]:not([aria-hidden]):not([href*="/status/"]) {
            filter: blur(3px)
         }
        `
      ]
    },
    hideHandlesAndUserNames: {
      default: false,
      styles: [
        `[data-testid="tweet"] [href^="/"]:not([aria-hidden]):not([href*="/status/"]),
         [data-testid="UserCell"] [href^="/"]:not([aria-hidden]):not([href*="/status/"]) {
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

  let initCleanupFunctions = []

  function setFeatures(url = window.location.href) {
    initCleanupFunctions.forEach(cleanupFunction => cleanupFunction())
    initCleanupFunctions = []

    const parsedUrl = document.createElement('a')
    parsedUrl.href = url

    const enabledFeatures = Object.keys(features).filter(feature =>
      settings[feature] &&
      (!features[feature].test ||
      features[feature].test({ parsedUrl, title: document.title || '' }))
    )
    document.documentElement.setAttribute('data-refined-twitter-lite', enabledFeatures.join(' '))

    // Features can define an init function that is called every time setFeatures is invoked.
    enabledFeatures.forEach(featureName => {
      const feature = features[featureName]
      if (typeof feature.init === 'function') {
        const cleanupFunction = feature.init()
        if (typeof cleanupFunction !== 'function') {
          throw new Error(
            'Refined Twitter Lite: the feature.init function must return a cleanup function.'
          )
        }
        initCleanupFunctions.push(cleanupFunction)
      }
    })
  }

  // Customize/Save settings API
  // setRefinedTwitterLiteFeatures is available to the user
  // and can be called with the new settings object (can be partial).
  // New settings are merged with the current ones.
  window.setRefinedTwitterLiteFeatures = features => {
    settings = Object.assign(settings, features)
    localStorage.setItem(storageKey, JSON.stringify(settings))
    setFeatures()
  }

  const events = {
    setFeatures: setRefinedTwitterLiteFeatures,
    refresh: setFeatures
  }

  window.addEventListener('RefinedTwitterLite', ({ detail }) => {
    const { type, payload } = detail
    events[type] && events[type](payload)
  })

  window.addEventListener('beforeunload', () => {
    setRefinedTwitterLiteFeatures(settings)
  })

  window.addEventListener('popstate', () => {
    setFeatures()
  })

  injectScript(`
    window.RefinedTwitterLite = {
      dispatch: (type, payload) => {
        window.dispatchEvent(new CustomEvent('RefinedTwitterLite', {
          detail: {
            type,
            payload
          }
        }))
      }
    }

    RefinedTwitterLite.setFeatures = features => {
      RefinedTwitterLite.dispatch('setFeatures', features)
    }

    RefinedTwitterLite.refresh = url => {
      RefinedTwitterLite.dispatch('refresh', url)
    }

    {
      const pushState = history.pushState
      history.pushState = function () {
        RefinedTwitterLite.refresh(arguments[2])
        pushState.apply(history, arguments)
      }
      const replaceState = history.replaceState
      history.replaceState = function () {
        RefinedTwitterLite.refresh(arguments[2])
        replaceState.apply(history, arguments)
      }
    }
  `)

  setFeatures()

  function injectScript(source) {
    const { nonce } = document.querySelector('script[nonce]')
    const script = document.createElement('script')
    script.nonce = nonce
    script.textContent = source
    document.documentElement.appendChild(script)
  }
}())
