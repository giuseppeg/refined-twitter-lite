// ==UserScript==
// @name refined-twitter-lite
// @description Small UserScript that adds some UI improvements to Twitter Lite
// @version 0.3.2
// @match https://twitter.com/*
// @match https://mobile.twitter.com/*
// ==/UserScript==
(function () {
  const isEnglish = (document.documentElement.getAttribute('lang') || '').startsWith('en')
  const state = {
    enforceLatestTweetsDisabledManually: false
  }

  // Supported features.
  // Can optionally define a test function that must return a boolean.
  const features = {
    singleColumn: {
      default: true,
      init: () => {
        if (state.singleColumn) {
          return noop
        }
        injectScript(`
          {
            // Don't try this at home.
            const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'innerWidth')
            Object.defineProperty(window, 'innerWidth', {
              ...originalDescriptor,
              get() {
                const val = originalDescriptor.get.call(window)
                if (val < 981) {
                  return val
                }
                return 981
              }
            })
            window.dispatchEvent(new Event('resize'))
          }
        `)
        state.singleColumn = true
        return noop
      },
       styles: [
         `[data-reactroot] > * > [aria-hidden] {
            width: 100%;
            max-width: 691px;
            margin: 0 auto;
          }`,
         `header[role="banner"] { flex: 0 auto }`,
         `main .r-33ulu8 { width: 691px; max-width: 100%; }`,
         `main .r-1ye8kvj { max-width: 100% }`
       ]
    },
    hideLikeCount: {
      default: false,
      styles: [
        `[href$="/likes"][href*="/status/"],
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
        `[style*="/profile_images/"] {
          background-image: none !important;
          background-color: #f8f8f8;
        }`
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
    },
    enforceLatestTweets: {
      default: true,
      test: ({ parsedUrl }) => {
        const { pathname } = parsedUrl
        return pathname === '/home' && !state.enforceLatestTweetsDisabledManually
      },
      init: () => {
        let abort = false
        let timeElements = []
        function isShowingLatest() {
          let lastTime = null
          return (
            isEnglish
              ? document.title.startsWith('Latest')
              : timeElements.every(
                  time => {
                    const currentTime = new Date(time.getAttribute('datetime'))
                    const isChronological = !lastTime || lastTime > currentTime
                    lastTime = currentTime
                    return isChronological
                  }
                )
          )
        }
        waitUntil(() => {
          if (abort) {
            throw new Error('aborted')
          }
          const link = document.querySelector('link[href$="twitter.com/home"]')
          const elements = document.querySelectorAll('[data-testid="primaryColumn"] time')
          if (link && elements.length) {
            timeElements = [].slice.call(elements)
            return timeElements
          }
          return false
        }, 500)
          .then(timeElements => {
            if (abort) {
              return
            }

            if (!isShowingLatest()) {
              waitUntil(() => {
                if (abort) {
                  throw new Error('aborted')
                }
                return document.querySelector('[data-testid="primaryColumn"] [role="button"]')
              }, 500)
                .then(button => {
                  button.click()
                  return waitUntil(() => {
                    if (abort) {
                      throw new Error('aborted')
                    }
                    return document.querySelector('[role="menu"] [role="button"]')
                  }, 500)
                })
                .then(switchButton => {
                  switchButton.click()
                })
            }
          })
          .catch(noop)

        return () => {
          abort = true
          state.enforceLatestTweetsDisabledManually = timeElements.length > 0 && !isShowingLatest()
        }
      }
    },
    oldTwitterFontsStack: {
      default: false,
      styles: [
        `.r-1qd0xha {
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased
        }`
      ]
    },
    hideTimelineSpam: {
      default: true,
      test: ({ parsedUrl }) => {
        return /^((?!\/following|\/followers|\/followers_you_follow|\/explore).)*$/.test(parsedUrl.pathname)
      },
      styles: [
        `[data-testid="primaryColumn"] [role="region"] [role="heading"]:not([aria-level="1"]),
         [data-testid="primaryColumn"] [role="button"][data-testid="UserCell"],
         [href^="/search?q="][href*="&f=user"],
         [href^="/i/related_users"],
         [href="/who_to_follow"] {
            display: none
        }`
      ]
    },
    delayTweet: {
      default: 0,
      init: () => {
        const selector = '[data-testid="tweetButton"]'
        let lastPointerDownEventTime = Date.now()
        let timeout = null
        let btn = null
        let delayBtn = null
        let tweeting = false

        function findBtn(target) {
          if (target.matches(selector)) {
            return target
          }
          return target.closest(selector)
        }
        function abort() {
          if (timeout) {
            timeout = clearTimeout(timeout)
          }
          if (!btn) { return }
          btn.style.display = null
          if (!delayBtn) { return }
          btn.parentNode.removeChild(delayBtn)
          delayBtn = null
        }
        function handleEvent(event) {
          // When programmatically tweeting.
          if (tweeting || timeout) { return }
          btn = findBtn(event.target)
          if (!btn || btn.getAttribute('aria-disabled') === 'true') { return }
          lastPointerDownEventTime = Date.now()
          btn.addEventListener('click', event => {
            // Long press: preserve the default behavior -> tweet
            if (Date.now() - lastPointerDownEventTime > 500) {
              return
            }
            event.preventDefault()
            event.stopPropagation()
            delayBtn = btn.cloneNode(true)
            delayBtn.style.backgroundColor = '#ca2055'
            delayBtn.addEventListener('click', abort)
            const delayBtnTextContainer = [].find.call(
              delayBtn.querySelectorAll('*'),
              node => node.childNodes[0].nodeType === 3
            )
            btn.style.display = 'none'
            btn.parentNode.appendChild(delayBtn)

            let countDown = typeof settings.delayTweet !== 'number'
              ? 10
              : settings.delayTweet
            function timer() {
              if (countDown === -1) {
                abort()
                tweeting = true
                btn.click()
                tweeting = false
                btn = null
                return
              }
              if (countDown === 0) {
                delayBtnTextContainer.textContent = '💥'
                countDown--
              } else {
                delayBtnTextContainer.textContent = isEnglish
                  ? `Abort ${countDown--}`
                  : `🕐 ${countDown--}`
              }
              timeout = setTimeout(timer, 1000)
            }
            timeout = setTimeout(timer)
          }, { capture: true, once: true })
        }

        document.addEventListener('pointerdown', handleEvent)
        return () => {
          document.removeEventListener('pointerdown', handleEvent)
          abort()
          tweeting = false
          btn = null
        }
      }
    },
    revealHiddenContentOnVKey: {
      default: true,
      init: () => {
        function onKeyDown(event) {
          if (event.key === 'v' && !isInputField(event.target)) {
            document.documentElement.setAttribute('data-refined-twitter-lite-shift', '')
          }
        }
        function onKeyUp() {
          if (document.documentElement.hasAttribute('data-refined-twitter-lite-shift')) {
            document.documentElement.removeAttribute('data-refined-twitter-lite-shift')
          }
        }
        document.documentElement.addEventListener('keydown', onKeyDown)
        document.documentElement.addEventListener('keyup', onKeyUp)
        return () => {
          document.documentElement.removeAttribute('data-refined-twitter-lite-shift')
          document.documentElement.removeEventListener('keydown', onKeyDown)
          document.documentElement.removeEventListener('keyup', onKeyUp)
        }
      },
      affects: new Set([
        'hideAvatars',
        'hideReplyCount',
        'hideRetweetCount',
        'hideLikeCount',
        'hideHandlesAndUserNames',
      ])
    }
  }

  // Generate and append the styles.
  document.head.insertAdjacentHTML('beforeend', `
    <style>
      ${Object.entries(features).map(([feature, data]) =>
        (data.styles || []).map(rule =>
          rule.split(',').map(rule =>
            (
              (
                features.revealHiddenContentOnVKey.affects.has(feature)
                  ? 'html:not([data-refined-twitter-lite-shift])'
                  : ''
              ) +
              `[data-refined-twitter-lite~="${feature}"] ${rule.trim()}`
            )
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
    if (storedSettings.hasOwnProperty(feature)) {
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

    const parsedUrl = parseUrl(url)

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
      let prevUrl = window.location.pathname
      const pushState = history.pushState
      history.pushState = function () {
        const url = arguments[2]
        prevUrl !== url && RefinedTwitterLite.refresh(url)
        prevUrl = url
        pushState.apply(history, arguments)
      }
      const replaceState = history.replaceState
      history.replaceState = function () {
        const url = arguments[2]
        prevUrl !== url && RefinedTwitterLite.refresh(url)
        prevUrl = url
        replaceState.apply(history, arguments)
      }
      window.addEventListener('popstate', () => {
        prevUrl = window.location.pathname + window.location.search + window.location.hash
      })
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

  function noop() {}
  async function waitUntil(fn, retryTimeout, times = 6) {
    if (times === 0) {
      throw new Error("waitUntil: max retry limit reached")
    }
    const result = fn()
    if (result) {
      if (result instanceof Promise) {
        return await result
      }
      return result
    }
    await new Promise(resolve => setTimeout(resolve, retryTimeout))
    return await waitUntil(fn, retryTimeout, times - 1)
  }
  function isInputField(element) {
    const tagName = element.ownerDocument.activeElement.tagName
    return element.isContentEditable || (
      tagName == 'INPUT' || tagName == 'TEXTAREA' || tagName == 'SELECT' ||
      tagName == 'BUTTON'
    )
  }
  function parseUrl(url) {
    const parsedUrl = document.createElement('a')
    parsedUrl.href = url
    return parsedUrl
  }
}())
