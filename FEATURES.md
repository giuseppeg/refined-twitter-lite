# Refined Twitter Lite

Refined Twitter Lite comes with a set of features that can be enabled or disabled via the global `RefinedTwitterLite.setFeatures` function.

```js
RefinedTwitterLite.setFeatures({
  hideAvatars: true,
  singleColumn: false,
})
```

## Features

### singleColumn

default: `true`

Hides the sidebar for every page that has a timeline.

### composeButtonTextCursor

default: `true`

Sets the `cursor: text` when hovering over the _What's happening?_ button (fake input).

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

### isExploreLinkLast

default: `false`

Moves the "Explore" link to the end of the main navigation bar.

### hideExploreLink

default: `true`

Removes the "Explore" link from the main navigation bar.

### oldTwitterFontsStack

default: `false`

Brings back the old twitter.com fonts stack.

### hideTimelineSpam

default: `true`

Hides some spam like "Who to Follow" from timelines.

### delayTweet

default: `0`

Starts a count down and when reaches 0 sends the tweet that you just composed. It allows to abort tweets. Set this value to a number of choice, greater than `0` to activate this feature. When this feature is active a long press on the tweet button will send the tweet immediately.

### highlightMissingAltForImages

default: `true`

Makes the alt text link in the compose dialog red to highlight the feature and hopefully encourage people to add descriptions to images.
