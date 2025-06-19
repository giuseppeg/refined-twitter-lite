// ==UserScript==
// @name refined-twitter-lite
// @description Small UserScript that adds some UI improvements to Twitter Lite
// @version 0.4.0
// @match https://twitter.com/*
// @match https://mobile.twitter.com/*
// ==/UserScript==
(function () {
  let settings;
  const isEnglish = (
    document.documentElement.getAttribute("lang") || ""
  ).startsWith("en");
  const state = {};

  // Supported features.
  // Can optionally define a test function that must return a boolean.
  //
  // name: {
  //   // must be truthy for the plugin to be enabled
  //   default: true | false | DefaultValue;
  //   // optional test to decide if the plugin should be loadede
  //   test?: (URL) => boolean,
  //   // optional function to do custom things
  //   init?: () => CleanUpFunction,
  //   // styles applied when the plugin is enabled
  //   styles?: Array<CssRule>
  // }
  //
  const features = {
    singleColumn: {
      default: true,
      init: () => {
        if (state.singleColumn) {
          return noop;
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

            Object.defineProperty(window.document.documentElement, 'clientWidth', {
              get() {
                const val = window.innerWidth

                if (val < 981) {
                  return val
                }
                return 981
              }
            })

            window.dispatchEvent(new Event('resize'))
          }
        `);
        state.singleColumn = true;
        return noop;
      },
      styles: [
        `[aria-hidden][data-at-shortcutkeys][style*="min-height"] {
            width: 100%;
            max-width: 691px;
            margin: 0 auto;
          }`,
        // `header[role="banner"] { flex: 0 auto }`,
        `main .r-33ulu8 { width: 691px; max-width: 100%; }`,
        `main .r-1ye8kvj { max-width: 100% }`,
      ],
    },
    hideLikeCount: {
      default: false,
      styles: [
        `article [href$="/likes"][href*="/status/"],
         article [data-testid="like"] span,
         article [data-testid="unlike"] span {
            display: none
         }`,
      ],
    },
    hideRetweetCount: {
      default: false,
      styles: [
        `article [href$="/retweets"],
         article [href$="/retweets/with_comments"],
         article [data-testid="retweet"] span,
         article [data-testid="unretweet"] span {
            display: none
         }`,
      ],
    },
    hideReplyCount: {
      default: false,
      styles: [`article [data-testid="reply"] span { display: none }`],
    },
    hideAvatars: {
      default: false,
      styles: [
        `[style*="/profile_images/"] {
          background-image: none !important;
          background-color: #f8f8f8;
        }`,
      ],
    },
    hideExplore: {
      default: false,
      test: ({ parsedUrl }) => {
        const { pathname } = parsedUrl;
        return pathname === "/explore";
      },
      styles: [
        `[data-testid="primaryColumn"] [role="region"] { display: none }`,
      ],
    },
    obfuscateHandlesAndUserNames: {
      default: false,
      styles: [
        `[data-testid="tweet"] [href^="/"]:not([aria-hidden]):not([href*="/status/"]),
         [data-testid="UserCell"] [href^="/"]:not([aria-hidden]):not([href*="/status/"]) {
            filter: blur(3px)
         }
        `,
      ],
    },
    hideHandlesAndUserNames: {
      default: false,
      styles: [
        `[data-testid="tweet"] [href^="/"]:not([aria-hidden]):not([href*="/status/"]),
         [data-testid="UserCell"] [href^="/"]:not([aria-hidden]):not([href*="/status/"]) {
            display: none
         }
        `,
      ],
    },
    hideNavigationIcons: {
      default: true,
      styles: [
        `header[role="banner"] > div > div > div { justify-content:center }`,
        ...[/*"Home","Search and explore","Notifications","Direct Messages",*/"Grok",/*"Bookmarks",*/"Communities","Premium","Verified Orgs",/*"Profile"*/].map(buttonName => `header[role="banner"] [aria-label="${buttonName}"] { display:none }`)
      ]
    },
    enforceLatestTweets: {
      default: true,
      test: ({ parsedUrl }) => {
        const { pathname } = parsedUrl;
        return pathname === "/home";
      },
      init: () => {
        let abort = false;

        waitUntil(() => {
          if (abort) {
            throw new Error("aborted");
          }
          const links = document.querySelectorAll(
            '[data-testid="primaryColumn"] nav[role="navigation"] a[href="/home"]'
          );

          if (links.length == 0) {
            return false;
          }

          if (links[1].getAttribute("aria-selected") === "false") {
            links[1].click();
            return links[1];
          }
          throw new Error("aborted");
        }, 500).catch(noop);

        return () => {
          abort = true;
        };
      },
    },
    oldTwitterFontsStack: {
      default: false,
      styles: [
        `.r-37j5jr {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        }`,
      ],
    },
    hideTimelineSpam: {
      default: true,
      test: ({ parsedUrl }) => {
        return (
          /^((?!\/following|\/followers|\/followers_you_follow|\/explore|\/retweets\/without_comments).)*$/.test(
            parsedUrl.pathname
          ) &&
          (!parsedUrl.search || !parsedUrl.search.includes("f=user"))
        );
      },
      styles: [
        `[data-testid="primaryColumn"] a[href^="/i/connect_people"],
         [data-testid="primaryColumn"] [role="region"] [role="heading"]:not([aria-level="1"]),
         [data-testid="primaryColumn"] [role="button"][data-testid="UserCell"],
         [data-testid="primaryColumn"] [role="region"] [href^="/search?q="][href*="&f=user"],
         [href^="/i/related_users"],
         [href="/who_to_follow"] {
            display: none
        }`,
      ],
    },
    enforceAltTextForImages: {
      default: true,
      init: () => {
        const selector = '[data-testid^="tweetButton"]';

        function changeHandler(event) {
          if (!event.target.matches('[data-testid="fileInput"]')) {
            return;
          }
          waitUntil(() => {
            const attachments = Array.from(
              document.querySelectorAll(
                '[data-testid="attachments"] [aria-label]'
              )
            ).filter((e) => e.querySelector("img"));
            if (!attachments.length) {
              return false;
            }
            state.altTextElementPlaceholder =
              attachments[0].getAttribute("aria-label");
            document.removeEventListener("change", changeHandler);
          }, 500).catch(noop);
        }

        document.addEventListener("change", changeHandler, true);

        function handleEvent(event) {
          btn = parent(event.target, selector);
          if (!btn || btn.getAttribute("aria-disabled") === "true") {
            return;
          }

          btn.addEventListener(
            "click",
            (event) => {
              const attachments = Array.from(
                document.querySelectorAll(
                  '[data-testid="attachments"] [aria-label]'
                )
              ).filter((e) => e.querySelector("img"));

              if (
                state.altTextElementPlaceholder &&
                attachments.some(
                  (a) =>
                    a.getAttribute("aria-label") ===
                    state.altTextElementPlaceholder
                ) &&
                confirm(
                  "Some media do not have a description. Do you want to go back and add one before tweeting?"
                )
              ) {
                event.preventDefault();
                event.stopPropagation();
              }
            },
            { capture: true, once: true }
          );
        }

        document.addEventListener("pointerdown", handleEvent);
        return () => {
          document.removeEventListener("pointerdown", handleEvent);
          document.removeEventListener("change", changeHandler);
        };
      },
    },
    showAltTextForImagesOnHover: {
      default: true,
      styles: [
        `
        [data-testid="tweetPhoto"][aria-label]:hover {
          margin: 0 !important;
          transition: margin 0.2s ease-in-out;
        }
        [data-testid="tweetPhoto"][aria-label]:hover:after {
          content: attr(aria-label);
          position: absolute;
          top: 0;
          background-color: rgba(0, 0, 0, 0.77);
          color: #fff;
          margin: 0.7em;
          padding: 0.2em;
          border-radius: 0.2em;
          font-family: sans-serif;
        }
      `,
      ],
    },
    delayTweet: {
      default: 0,
      init: () => {
        const selector = '[data-testid^="tweetButton"]';
        let lastPointerDownEventTime = Date.now();
        let timeout = null;
        let btn = null;
        let delayBtn = null;
        let tweeting = false;

        function abort() {
          if (timeout) {
            timeout = clearTimeout(timeout);
          }
          if (!btn) {
            return;
          }
          btn.style.display = null;
          if (!delayBtn) {
            return;
          }
          btn.parentNode.removeChild(delayBtn);
          delayBtn = null;
        }
        function handleEvent(event) {
          // When programmatically tweeting.
          if (tweeting || timeout) {
            return;
          }
          btn = parent(event.target, selector);
          if (!btn || btn.getAttribute("aria-disabled") === "true") {
            return;
          }
          lastPointerDownEventTime = Date.now();
          btn.addEventListener(
            "click",
            (event) => {
              // Long press: preserve the default behavior -> tweet
              if (Date.now() - lastPointerDownEventTime > 500) {
                return;
              }
              event.preventDefault();
              event.stopPropagation();
              delayBtn = btn.cloneNode(true);
              delayBtn.style.backgroundColor = "#ca2055";
              delayBtn.addEventListener("click", abort);
              const delayBtnTextContainer = [].find.call(
                delayBtn.querySelectorAll("*"),
                (node) => node.childNodes[0].nodeType === 3
              );
              btn.style.display = "none";
              btn.parentNode.appendChild(delayBtn);

              let countDown =
                typeof settings.delayTweet !== "number"
                  ? 10
                  : settings.delayTweet;
              function timer() {
                if (countDown === -1) {
                  abort();
                  tweeting = true;
                  btn.click();
                  tweeting = false;
                  btn = null;
                  return;
                }
                if (countDown === 0) {
                  delayBtnTextContainer.textContent = "💥";
                  countDown--;
                } else {
                  delayBtnTextContainer.textContent = isEnglish
                    ? `Abort ${countDown--}`
                    : `🕐 ${countDown--}`;
                }
                timeout = setTimeout(timer, 1000);
              }
              timeout = setTimeout(timer);
            },
            { capture: true, once: true }
          );
        }

        document.addEventListener("pointerdown", handleEvent);
        return () => {
          document.removeEventListener("pointerdown", handleEvent);
          abort();
          tweeting = false;
          btn = null;
        };
      },
    },
    revealHiddenContentOnVKey: {
      default: true,
      init: () => {
        function onKeyDown(event) {
          if (event.key === "v" && !isInputField(event.target)) {
            document.documentElement.setAttribute(
              "data-refined-twitter-lite-shift",
              ""
            );
          }
        }
        function onKeyUp() {
          if (
            document.documentElement.hasAttribute(
              "data-refined-twitter-lite-shift"
            )
          ) {
            document.documentElement.removeAttribute(
              "data-refined-twitter-lite-shift"
            );
          }
        }
        document.documentElement.addEventListener("keydown", onKeyDown);
        document.documentElement.addEventListener("keyup", onKeyUp);
        return () => {
          document.documentElement.removeAttribute(
            "data-refined-twitter-lite-shift"
          );
          document.documentElement.removeEventListener("keydown", onKeyDown);
          document.documentElement.removeEventListener("keyup", onKeyUp);
        };
      },
      affects: new Set([
        "hideAvatars",
        "hideReplyCount",
        "hideRetweetCount",
        "hideLikeCount",
        "hideHandlesAndUserNames",
        "blackAndWhite",
      ]),
    },
    dnd: {
      default: false,
      test: () => {
        if (!Array.isArray(settings.dnd)) {
          return;
        }
        const nowTimestamp = Date.now();
        const [start, end] = settings.dnd.map((time) => {
          const [h, m] = time.split(":").map(Number);
          const t = new Date(nowTimestamp);
          t.setHours(h);
          t.setMinutes(m);
          return t;
        });
        const now = new Date(nowTimestamp);
        return (
          (now >= start || (start >= end && now <= start && now <= end)) &&
          (now <= end || end <= start)
        );
      },
      styles: [
        `[href="/notifications"] [aria-live="polite"], [href="/messages"] [aria-live="polite"] { display: none }`,
        `[href="/notifications"] svg, [href="/messages"] svg { opacity: 0.5 }`,
      ],
    },
    likesSearch: {
      default: true,
      test: ({ parsedUrl }) => {
        return (
          (parsedUrl.hostname === "tweetdeck.twitter.com" &&
            parsedUrl.hash === "#ref=rtlLikesSearch") ||
          parsedUrl.pathname.endsWith("/likes")
        );
      },
      init: () => {
        if (window.location.hash !== "#ref=rtlLikesSearch") {
          let link;
          function clickHandler(event) {
            event.preventDefault();
            const width = 400;
            const height = screen.height;
            window.open(
              link.href,
              "Likes Search",
              `width=${width},height=${height * 0.6},top=${height * 0.2},left=${
                (screen.width - width) / 2
              }`
            );
          }
          waitUntil(
            () =>
              document.querySelector('[href="/settings/profile"]') &&
              document.querySelector('section[role="region"]'),
            500
          )
            .then((container) => {
              link = document.createElement("a");
              link.href = "https://tweetdeck.twitter.com/#ref=rtlLikesSearch";
              link.title = "Search Likes";
              link.classList.add("RefinedTwitterLite-likesSearch");
              link.innerHTML = `<svg viewBox="0 0 24 24" class="r-hkyrab r-4qtqp9 r-yyyyoo r-lwhw9o r-dnmrzs r-bnwqim r-1plcrui r-lrvibr"><g><path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"></path></g></svg>`;
              link.addEventListener("click", clickHandler);
              container.prepend(link);
            })
            .catch(noop);

          return () => {
            link && link.removeEventListener("click", clickHandler);
          };
        }

        waitUntil(() => {
          return Array.from(document.querySelectorAll(".column")).find(
            (c) =>
              c.querySelector(".column-heading").textContent.trim() === "Likes"
          );
        }, 1000).then((column) => {
          column.scrollIntoViewIfNeeded();
          column.querySelector('[data-testid="optionsToggle"]').click();
          const searchBox = Array.from(
            column.querySelectorAll(".js-accordion-toggle-view")
          ).find((i) => i.querySelector(".icon-content"));
          if (searchBox) {
            searchBox.click();
            const searchInput =
              searchBox.nextElementSibling.querySelector(".js-matching");
            searchInput && searchInput.focus();
          }
        });

        return noop;
      },
      styles: [
        ".app-header { display: none }",
        ".app-content { left: 0 }",
        `.RefinedTwitterLite-likesSearch {
          display: flex;
          padding: 0.5em;
          justify-content: flex-end;
        }`,
      ],
    },
    tryToHideAds: {
      default: true,
      styles: [
        '[data-testid="primaryColumn"] [data-testid="placementTracking"] article { display: none }',
      ],
    },
    invertedFollowButtonStyle: {
      default: true,
      styles: [
        `[role="button"][data-testid$="-follow"]:not(:hover):not(:focus) {
            border: 1px solid;
            background-color: transparent !important;
        }`,
        `.r-14lw9ot[role="button"][data-testid$="-follow"]:not(:hover):not(:focus) {
           border-color: white;
        }`,
        `[role="button"][data-testid$="-follow"]:not(:hover):not(:focus) > * {
          filter: invert(1);
        }`,
        `[role="button"][data-testid$="-unfollow"]:not(:hover):not(:focus) {
            backdrop-filter: invert(1);
            border-color: transparent !important;
        }`,
        `[role="button"][data-testid$="-unfollow"]:not(:hover):not(:focus) > * {
          filter: invert(1);
        }`,
      ],
    },
    blackAndWhite: {
      default: false,
      styles: [`body { filter: grayscale(1) }`],
    },
  };

  // Generate and append the styles.
  document.head.insertAdjacentHTML(
    "beforeend",
    `
    <style>
      ${Object.entries(features)
        .map(([feature, data]) =>
          (data.styles || [])
            .map((rule) => {
              const index = rule.indexOf("{");
              const selectors = rule
                .slice(0, index)
                .trim()
                .split(",")
                .map(
                  (rule) =>
                    (features.revealHiddenContentOnVKey.affects.has(feature)
                      ? "html:not([data-refined-twitter-lite-shift])"
                      : "") +
                    `[data-refined-twitter-lite~="${feature}"] ${rule.trim()}`
                )
                .join(",");

              return selectors + rule.slice(index);
            })
            .join("")
        )
        .join("\n")}
    </style>
  `
  );

  // Settings are saved to localStorage and merged with the default on load.
  const storageKey = "refined-twitter-lite";
  const storedSettings = JSON.parse(localStorage.getItem(storageKey)) || {};
  settings = Object.keys(features).reduce((settings, feature) => {
    if (storedSettings.hasOwnProperty(feature)) {
      settings[feature] = storedSettings[feature];
    } else {
      settings[feature] = features[feature].default;
    }
    return settings;
  }, {});

  let initCleanupFunctions = [];

  function setFeatures(url = window.location.href) {
    initCleanupFunctions.forEach((cleanupFunction) => cleanupFunction());
    initCleanupFunctions = [];

    const parsedUrl = parseUrl(url);

    const enabledFeatures = Object.keys(features).filter(
      (feature) =>
        settings[feature] &&
        (!features[feature].test ||
          features[feature].test({ parsedUrl, title: document.title || "" }))
    );
    document.documentElement.setAttribute(
      "data-refined-twitter-lite",
      enabledFeatures.join(" ")
    );

    // Features can define an init function that is called every time setFeatures is invoked.
    enabledFeatures.forEach((featureName) => {
      const feature = features[featureName];
      if (typeof feature.init === "function") {
        const cleanupFunction = feature.init();
        if (typeof cleanupFunction !== "function") {
          throw new Error(
            "Refined Twitter Lite: the feature.init function must return a cleanup function."
          );
        }
        initCleanupFunctions.push(cleanupFunction);
      }
    });
  }

  // Customize/Save settings API
  // setRefinedTwitterLiteFeatures is available to the user
  // and can be called with the new settings object (can be partial).
  // New settings are merged with the current ones.
  window.setRefinedTwitterLiteFeatures = (features) => {
    settings = Object.assign(settings, features);
    localStorage.setItem(storageKey, JSON.stringify(settings));
    setFeatures();
  };

  const events = {
    setFeatures: setRefinedTwitterLiteFeatures,
    refresh: setFeatures,
  };

  window.addEventListener("RefinedTwitterLite", ({ detail }) => {
    const { type, payload } = detail;
    events[type] && events[type](payload);
  });

  window.addEventListener("beforeunload", () => {
    setRefinedTwitterLiteFeatures(settings);
  });

  window.addEventListener("popstate", () => {
    setFeatures();
  });

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
  `);

  setFeatures();

  function injectScript(source) {
    const { nonce } = document.querySelector("script[nonce]") || {};
    const script = document.createElement("script");
    script.nonce = nonce;
    script.textContent = source;
    document.documentElement.appendChild(script);
  }

  function noop() {}
  async function waitUntil(fn, retryTimeout, times = 6) {
    if (times === 0) {
      throw new Error("waitUntil: max retry limit reached");
    }
    const result = fn();
    if (result) {
      if (result instanceof Promise) {
        return await result;
      }
      return result;
    }
    await new Promise((resolve) => setTimeout(resolve, retryTimeout));
    return await waitUntil(fn, retryTimeout, times - 1);
  }
  function isInputField(element) {
    const tagName = element.ownerDocument.activeElement.tagName;
    return (
      element.isContentEditable ||
      tagName == "INPUT" ||
      tagName == "TEXTAREA" ||
      tagName == "SELECT" ||
      tagName == "BUTTON"
    );
  }
  function parseUrl(url) {
    const parsedUrl = document.createElement("a");
    parsedUrl.href = url;
    return parsedUrl;
  }
  function parent(target, selector) {
    if (target.matches(selector)) {
      return target;
    }
    return target.closest(selector);
  }
})();
