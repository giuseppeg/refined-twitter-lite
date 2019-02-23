# Refined Twitter Lite

Refined Twitter Lite comes with a set of features that can be enabled or disabled via the global `setRefinedTwitterLiteFeatures` function.

```js
setRefinedTwitterLiteFeatures({
  hideAvatars: true,
  singleColumn: false,
})
```

Right now this function is only available within the refined-twitter-lite frame.

<img height="300" alt="select the refined-twitter-lite frame to use the setRefinedTwitterLiteFeatures function" src="https://user-images.githubusercontent.com/711311/53285685-c224ea80-3763-11e9-9106-a9933cdb40ca.png">

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
