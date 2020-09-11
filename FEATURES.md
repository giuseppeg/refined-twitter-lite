# Refined Twitter Lite

Refined Twitter Lite comes with a set of features that can be enabled or disabled using the global `RefinedTwitterLite.setFeatures` function from the browser dev tools' console.

```js
RefinedTwitterLite.setFeatures({
  hideAvatars: true,
  singleColumn: false,
});
```

## Features

### singleColumn

default: `true`

Hides the sidebar for every page that has a timeline.

### revealHiddenContentOnVKey

default: `true`

When pressing the `v` key reveals the content that has been hidden by the following features:

- hideAvatars
- hideReplyCount
- hideRetweetCount
- hideLikeCount
- hideHandlesAndUserNames

### hideLikeCount

default: `false`

Removes the likes count from every tweet.

### hideRetweetCount

default: `false`

Removes the retweets count from every tweet.

### hideReplyCount

default: `false`

Removes the replies count from every tweet.

### hideAvatars

default: `false`

Hides the users avatars (profile pictures).

### obfuscateHandlesAndUserNames

default: `false`

Blurs out user names and handles (e.g. @twitter).

### hideHandlesAndUserNames

default: `false`

Hides user names and handles (e.g. @twitter).

### enforceLatestTweets

default: `true`

Enforces "Latest Tweets" in the home timeline. Tweets will be displayed in chronological order.

### oldTwitterFontsStack

default: `false`

Brings back the old twitter.com fonts stack.

### hideTimelineSpam

default: `true`

Hides some spam like "Who to Follow" from timelines.

### delayTweet

default: `0`

Starts a count down and when reaches 0 sends the tweet that you just composed. It allows to abort tweets. Set this value to a number of choice, greater than `0` to activate this feature. When this feature is active a long press on the tweet button will send the tweet immediately.

### hideExplore

default: `false`

Hide recommendations in the /explore page.

### dnd (Do Not Disturb)

default: `false`

When set to a range of times in the form `hh:mm`, disables the notifications and DMs badges.

```js
RefinedTwitterLite.setFeatures({
  dnd: ["21:00", "9:30"], // dnd from 21:00 to 9:30 in the morning.
});
```

### likesSearch

default: `true`

Adds a search button to your likes page. It'll use TweetDeck's search column, therefore in order for this to work you need to add the Likes column to your TweetDeck columns.

### tryToHideAds

default: `true`

Tries to hide ads.

### enforceAltTextForImages

default: `true`

When the tweet includes an image without a description it asks you if you want to go back and add one. Please consider adding a description to an image to help visually impaired people understand the context of the tweet.

### showAltTextForImagesOnHover

default: `true`

When hovering images shows its alt text.
