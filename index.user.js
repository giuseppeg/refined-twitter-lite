// ==UserScript==
// @name refined-twitter-lite
// @description Small UserScript that adds some UI improvements to Twitter Lite
// @version 0.1.0
// @match https://mobile.twitter.com/*
// ==/UserScript==
document.head.insertAdjacentHTML('beforeend', `
  <style>
    main > div > div > div {
      flex-direction: row-reverse !important
    }
    [data-testid="sidebarColumn"] {
      margin: 0 !important;
    }
    [data-testid="fab-tweet"] {
      right: -299px !important;
      width: 80px !important;
      height: 40px !important;
    }
    [data-testid="tweet"] [lang] {
      opacity: 0.9 !important;
      line-height: 23px !important;
      font-size: 16px !important;
      font-family: "Helvetica Neue",Helvetica,Arial,sans-serif !important;
    }
  </style>
`)
