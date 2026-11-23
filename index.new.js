// Each feature owns its defaults, route, styles and event handlers.
window.refinedTwitterLiteNew = function () {
  const storageKey = "refined-twitter-lite";
  const features = {
    singleColumn: {
      default: true,
      test({ parsedUrl }) {
        return !parsedUrl.pathname.startsWith("/i/chat");
      },
      styles: [
        "aside { display: none !important }",
        // X can nest the main-column grid inside additional layout wrappers.
        "body > div:has(main) { max-width: 674px !important; --x-sidebar-wide: 0 !important }",
        "body > div div:has(> main) { grid-template-columns: minmax(0, 1fr) !important }",
      ],
    },
    hideNavigationIcons: {
      default: true,
      styles: [
        ["/i/grok", "/i/premium_sign_up", "/i/communities", "/jobs", "/i/jf/creators/studio", "/i/calls"]
          .map((url) => `nav[aria-label="Primary"] a[href="${url}"]`)
          .join(", ") + " { display: none }",
      ],
    },
    enforceLatestTweets: {
      default: true,
      test({ parsedUrl }) {
        return parsedUrl.pathname === "/home";
      },
      init() {
        const selectedTabs = new WeakSet();
        function selectFollowing() {
          const tab = document.querySelector('[data-pinned-timeline="following"]');
          if (tab && tab.getAttribute("aria-selected") === "false" && !selectedTabs.has(tab)) {
            selectedTabs.add(tab);
            tab.click();
          }
        }
        const observer = new MutationObserver(selectFollowing);
        observer.observe(document.documentElement, { childList: true, subtree: true });
        selectFollowing();
        return function () { observer.disconnect(); };
      },
    },
    hideExplore: {
      default: false,
      test({ parsedUrl }) {
        return parsedUrl.pathname === "/explore";
      },
      styles: ["main section[aria-labelledby] { display: none }"],
    },
    hideTimelineSpam: {
      default: true,
      test({ parsedUrl }) {
        return !/\/(following|followers|followers_you_follow|explore|retweets|likes)(?:\/|$)/.test(parsedUrl.pathname) && parsedUrl.searchParams.get("f") !== "user";
      },
      styles: ["main li:has(> div > a[href^='/i/connect_people']) { display: none }"],
    },
    tryToHideAds: {
      default: true,
      styles: ['article:has([class*="data-ad-disclosure"], [data-ad-disclosure]), article[data-refined-twitter-lite-ad] { display: none }'],
      init() {
        const hidden = new Set();

        // Match the ad label in the post header, not text in the post itself.
        function check(article) {
          const avatar = article.querySelector("[data-post-avatar] a");
          const isAd = [...article.querySelectorAll('[class*="@container/post-actions"] > div > a')].some((link) =>
            link.closest("article") === article &&
            link.textContent.trim() === "Ad" &&
            link.parentElement.querySelector('button[data-slot="xds-menu-trigger"]') &&
            avatar && link.getAttribute("href") === avatar.getAttribute("href"),
          );
          if (isAd) {
            article.setAttribute("data-refined-twitter-lite-ad", "");
            hidden.add(article);
          } else if (hidden.has(article)) {
            article.removeAttribute("data-refined-twitter-lite-ad");
            hidden.delete(article);
          }
        }

        document.querySelectorAll("article").forEach(check);
        const observer = new MutationObserver((mutations) => {
          const articles = new Set();
          for (const mutation of mutations) {
            const target = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
            const article = target?.closest("article");
            if (article) {
              articles.add(article);
            }
            for (const node of mutation.addedNodes) {
              if (node.nodeType === 1) {
                if (node.matches("article")) {
                  articles.add(node);
                }
                node.querySelectorAll("article").forEach((item) => articles.add(item));
              }
            }
          }
          for (const article of hidden) {
            if (!article.isConnected) {
              article.removeAttribute("data-refined-twitter-lite-ad");
              hidden.delete(article);
            }
          }
          articles.forEach(check);
        });
        observer.observe(document.documentElement, { childList: true, characterData: true, attributes: true, attributeFilter: ["href", "class"], subtree: true });
        return function () {
          observer.disconnect();
          hidden.forEach((article) => article.removeAttribute("data-refined-twitter-lite-ad"));
        };
      },
    },
    invertedFollowButtonStyle: {
      default: true,
      styles: [
        "button[aria-label^='Follow @']:not(:hover):not(:focus) { background: transparent !important; color: inherit !important; border: 1px solid currentColor }",
        "button[aria-label^='Unfollow @']:not(:hover):not(:focus) { background: currentColor; border-color: transparent }",
        "button[aria-label^='Unfollow @']:not(:hover):not(:focus) > * { filter: invert(1) }",
      ],
    },
    // Check descriptions before the delay handler schedules or submits a post.
    enforceAltTextForImages: {
      default: true,
      init() {
        function onClick(event) {
          const button = event.target.closest("button");
          const form = button?.closest("form");
          if (!form?.querySelector("textarea") || button.disabled || !/^(Post|Reply)$/.test(button.textContent.trim())) {
            return;
          }
          const tiles = [...form.querySelectorAll("[data-media-tile]")];
          const missingDescription = tiles.some((tile) => tile.querySelector("img") && ![...tile.querySelectorAll("div")].some((item) => item.textContent.trim() === "ALT"));
          if (missingDescription && confirm("Some media do not have a description. Do you want to go back and add one before posting?")) {
            event.preventDefault();
            event.stopImmediatePropagation();
          }
        }
        document.addEventListener("click", onClick, true);
        return function () { document.removeEventListener("click", onClick, true); };
      },
    },
    delayTweet: {
      default: 0,
      init() {
        let pendingPost;
        let pointerDownAt = 0;
        let sending = false;
        function cancelPendingPost() {
          if (!pendingPost) {
            return;
          }
          clearTimeout(pendingPost.timer);
          pendingPost.observer.disconnect();
          pendingPost.button.hidden = false;
          pendingPost.cancel.remove();
          pendingPost = undefined;
        }
        function onPointerDown(event) {
          if (event.target.closest("button")) {
            pointerDownAt = Date.now();
          }
        }
        function onClick(event) {
          const button = event.target.closest("button");
          const form = button?.closest("form");
          const editor = form?.querySelector("textarea");
          if (sending || !editor || button.disabled || !/^(Post|Reply)$/.test(button.textContent.trim()) || (event.detail && Date.now() - pointerDownAt > 500)) {
            return;
          }
          event.preventDefault();
          event.stopImmediatePropagation();
          cancelPendingPost();
          const value = editor.value;
          const media = [...form.querySelectorAll("[data-media-tile]")].map((tile) => tile.getAttribute("data-media-tile")).join(",");
          const cancel = document.createElement("button");
          cancel.type = "button";
          cancel.textContent = "Cancel post";
          cancel.addEventListener("click", cancelPendingPost);
          button.hidden = true;
          button.after(cancel);
          const observer = new MutationObserver(cancelPendingPost);
          observer.observe(form, { childList: true, attributes: true, characterData: true, subtree: true });
          pendingPost = { button, cancel, observer, timer: setTimeout(() => {
            cancelPendingPost();
            if (button.isConnected && !button.disabled && editor.isConnected && editor.value === value && [...form.querySelectorAll("[data-media-tile]")].map((tile) => tile.getAttribute("data-media-tile")).join(",") === media) {
              sending = true;
              button.click();
              sending = false;
            }
          }, Math.max(0, Number(settings.delayTweet)) * 1000) };
        }
        function onInput(event) {
          if (pendingPost && pendingPost.button.closest("form")?.contains(event.target)) {
            cancelPendingPost();
          }
        }
        document.addEventListener("pointerdown", onPointerDown, true);
        document.addEventListener("click", onClick, true);
        document.addEventListener("input", onInput, true);
        return function () {
          cancelPendingPost();
          document.removeEventListener("pointerdown", onPointerDown, true);
          document.removeEventListener("click", onClick, true);
          document.removeEventListener("input", onInput, true);
        };
      },
    },
    showAltTextForImagesOnHover: {
      default: true,
      init() {
        const images = new Set();
        function onPointerOver(event) {
          const image = event.target.closest("article img[src*='/media/'][alt]");
          if (image && image.alt && !image.hasAttribute("title")) {
            image.title = image.alt;
            images.add(image);
          }
        }
        function onPointerOut(event) {
          const image = event.target.closest("img");
          if (images.has(image)) {
            image.removeAttribute("title");
            images.delete(image);
          }
        }
        document.addEventListener("pointerover", onPointerOver);
        document.addEventListener("pointerout", onPointerOut);
        return function () {
          document.removeEventListener("pointerover", onPointerOver);
          document.removeEventListener("pointerout", onPointerOut);
          images.forEach((image) => image.removeAttribute("title"));
        };
      },
    },
    videoDownload: {
      default: true,
      init() {
        window.RefinedTwitterLite.getVideos = function () {
          const videos = [...new Set(performance.getEntriesByType("resource")
            .map((entry) => entry.name)
            .filter((url) => /^https:\/\/video\.twimg\.com\/.*\/pl\/[^/]+\.m3u8(?:\?|$)/.test(url)))];
          console.log(videos.join("\n"));
          return videos;
        };
        return function () { delete window.RefinedTwitterLite.getVideos; };
      },
    },
  };

  // Keep old-only settings so switching versions never loses preferences.
  const defaults = Object.fromEntries(Object.entries(features).map(([name, feature]) => [name, feature.default]));
  let settings = { ...defaults, ...JSON.parse(localStorage.getItem(storageKey) || "{}") };
  const style = document.createElement("style");
  document.head.appendChild(style);
  let cleanupFunctions = [];

  // Reapply only enabled features when settings or the page change.
  function refresh(url = location.href) {
    cleanupFunctions.forEach((cleanup) => cleanup());
    cleanupFunctions = [];
    const parsedUrl = new URL(url, location.href);
    const enabled = Object.entries(features).filter(([name, feature]) => settings[name] && (!feature.test || feature.test({ parsedUrl })));
    style.textContent = enabled.flatMap(([, feature]) => feature.styles || []).join("\n");
    for (const [, feature] of enabled) {
      if (feature.init) {
        cleanupFunctions.push(feature.init());
      }
    }
  }

  // Preserve the settings API and the old navigation event protocol.
  function setFeatures(values) {
    settings = { ...settings, ...values };
    localStorage.setItem(storageKey, JSON.stringify(settings));
    refresh();
  }
  window.setRefinedTwitterLiteFeatures = setFeatures;
  window.RefinedTwitterLite = {
    dispatch(type, payload) {
      window.dispatchEvent(new CustomEvent("RefinedTwitterLite", { detail: { type, payload } }));
    },
    setFeatures(values) { setFeatures(values); },
    refresh(url) { refresh(url); },
  };
  window.addEventListener("RefinedTwitterLite", ({ detail }) => {
    if (detail.type === "setFeatures") {
      setFeatures(detail.payload);
    } else if (detail.type === "refresh") {
      refresh(detail.payload);
    }
  });
  for (const method of ["pushState", "replaceState"]) {
    const original = history[method];
    history[method] = function (...args) {
      const result = original.apply(this, args);
      refresh();
      return result;
    };
  }
  window.addEventListener("popstate", () => refresh());
  refresh();
};
