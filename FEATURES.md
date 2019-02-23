# Refined Twitter Lite

Refined Twitter Lite comes with a set of features that can be enabled or disabled via the global `setRefinedTwitterLiteFeatures`.

```js
setRefinedTwitterLiteFeatures({
  hideAvatars: true,
  singleColum: false,
})
```

## Features

### singleColum

default: `true`

Hide the sidebar for every page that has a timeline.

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
