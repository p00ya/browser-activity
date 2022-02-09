# Browser Activity

Browser Activity is a Chrome extension to publish browser activity to Discord's Rich Presence.

It requires a native app, chrome-discord-bridge, to be installed.

## Development

The Browser Activity extension is written in typescript, which is translated to javascript by webpack.  To get started, install Node.js and yarn, then fetch dependencies by running:

```
yarn
```

To build the extension continuously, run:

```
yarn start
```

To load the extension, navigate to chrome://extensions, enable Developer Mode, and click "Load unpacked".  Select the `dist` directory.

Note the extension ID for Browser Activity that will now be visible in chrome://extensions.

Now go checkout https://github.com/p00ya/chrome-discord-bridge.  You will need to add the extension URL to `cmd/chrome-discord-bridge/origins.txt`, and then run:

```
go build ./cmd/chrome-discord-bridge
./chrome-discord-bridge -install
```

## Usage

In Chrome, click the Extensions menu.  If the site on the current tab is supported, the "Browser Activity" item will appear under the "Access requested" section.  Clicking the item will enable activity publishing for the tab until the tab is closed.

You must have the Discord app running on the same machine to publish activity.  Using Discord from a browser window won't work.

## Differences from PreMiD

Browser Activity's functionality is similar to PreMiD.

Browser Activity is lighter weight and more secure than PreMiD:

 - Browser Activity uses stricter Chrome permissions (`activeTab` instead of `all_urls`), so opting a tab in to publishing activity updates is enforced by Chrome, not the extension itself.  The extension doesn't have access to any of your other tabs.

 - Browser Activity's equivalent of PreMiD's "Presences" (site-specific plugins) do not allow arbitrary code; they are declarative, data-only, configs.  They cannot modify the page content.
 
 - Browser Activity uses a native messaging host to launch and communicate with the native app.  PreMiD uses a native app that you must start separately and listens on a websocket.  Using a native messaging host has several advantages: Chrome starts the native app on demand, and access to the native app is secured by Chrome (no other extensions or websites can call it).

 - Browser Activity's native app (chrome-discord-bridge) is much simpler and uses less resources than PreMiD's app.  It does little more than proxy bytes to Discord, which means logic for extracting activities and communicating with Discord stays sandboxed inside Chrome, instead of running with system access.  Furthermore, it's built on a lighter-weight runtime (compiled Go code rather than Node.js) - it uses <1MB of RAM!

This has some downsides...  Browser Activity is less user-friendly:

 - No "Presence Store" - support for additional sites must be compiled in.
 
 - Much less flexibility for extracting detailed activity states from a page (arbitrary update code is not allowed).
 
 - You have to opt-in publishing activity to Discord for a particular tab.
 
 - Only tested on recent Chrome builds.
 
 - Only tested on macOS.
 
 - Need to run command-line tools to build and install.
