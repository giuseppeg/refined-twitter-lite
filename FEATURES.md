# Refined Twitter Lite

## New X interface

Enable or disable features from the browser console:

```js
RefinedTwitterLite.setFeatures({
  hideNavigationIcons: true,
  singleColumn: false,
});
```

Image-description checks and delayed posts support English composer labels.

### singleColumn

default: `true`

Hides the sidebar for every page that has a timeline.

### hideNavigationIcons

default: `true`

Hides selected navigation items. On the new interface, edit the URL list in `index.new.js` to change which items are hidden.

### enforceLatestTweets

default: `true`

Enforces "Following" (formerly "Latest Tweets") in the home timeline. Tweets will be displayed in chronological order.

### hideTimelineSpam

default: `true`

Hides some spam like "Who to Follow" from timelines.

### delayTweet

default: `0`

Starts a count down and when reaches 0 sends the tweet that you just composed. It allows to abort tweets. Set this value to a number of choice, greater than `0` to activate this feature. When this feature is active a long press on the tweet button will send the tweet immediately.

### hideExplore

default: `false`

Hide recommendations in the /explore page.

### tryToHideAds

default: `true`

Tries to hide ads.

### enforceAltTextForImages

default: `true`

When the tweet includes an image without a description it asks you if you want to go back and add one. Please consider adding a description to an image to help visually impaired people understand the context of the tweet.

### showAltTextForImagesOnHover

default: `true`

When hovering images shows its alt text.

### invertedFollowButtonStyle

default: `true`

Restores the old Follow/Unfollow buttons style (inverted).

### videoDownload

default: `true`

Call `RefinedTwitterLite.getVideos()` in the browser console on a post with a video. It returns HLS playlist URLs observed by the browser. These may include videos from other posts and may not appear until playback.

## Old X interface

The old interface supports the features above, although video download returns
video links found in post details. It also has the following features, which
were intentionally left out of the new interface. Saved settings are retained
when switching between versions.

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

### oldTwitterFontsStack

default: `false`

Brings back the old twitter.com fonts stack.

### dnd (Do Not Disturb)

default: `false`

When set to a range of times in the form `hh:mm`, disables the notifications and DMs badges.

```js
RefinedTwitterLite.setFeatures({
  dnd: ["21:00", "9:30"], // dnd from 21:00 to 9:30 in the morning.
});
```

### blackAndWhite

default: `false`

Displays the page in grayscale.
