// ==UserScript==
// @name refined-twitter-lite
// @description Small UserScript that adds some UI improvements to Twitter Lite
// @version 0.2.0
// @match https://mobile.twitter.com/*
// ==/UserScript==
document.head.insertAdjacentHTML('beforeend', `
  <style>
    [data-testid="sidebarColumn"] {
      display: none;
    }
  </style>
`)
