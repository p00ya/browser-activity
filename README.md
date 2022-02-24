# Browser Activity

[Browser Activity](https://github.com/p00ya/browser-activity) is a Chrome extension to publish website browsing activity to Discord's activity status (also known as "Rich Presence").  It will publish activity from particular Chrome tabs that you enable.  That activity will be visible to your Discord friends and other users on the same Discord servers as you.

## Installation

You will need to install both the Chrome extension and the native chrome-discord-bridge program.

### Installing the extension

The easiest way to install the extension is from the [Chrome Web Store](https://chrome.google.com/webstore/detail/browser-activity/cemkhompnmfhdjkkmodjhlgomcmddefi).

The version on the Chrome Web Store may be older than the latest version available on GitHub.  See the [Development](#development) section below for building the latest from source.

### Installing chrome-discord-bridge

These instructions assume experience with the terminal.

1.  Download the latest release of chrome-discord-bridge for your platform from its [GitHub releases page](https://github.com/p00ya/chrome-discord-bridge/releases).

2.  Extract the archive with:

        tar -xf chrome-discord-bridge_*.tar.xz

    On macOS, you will also need to run:

        xattr -d com.apple.quarantine chrome-discord-bridge

3.  Move the `chrome-discord-bridge` binary somewhere permanent.

> :warning: WARNING: if you move the `chrome-discord-bridge` binary again later, you must repeat step 4.

4.  Run:

        ./chrome-discord-bridge -install

    This will write a file `io.github.p00ya.cdb.json` to Google Chrome's user configuration directory (the location varies between operating systems).

That's it - you don't need to run `chrome-discord-bridge` manually; Chrome will start it on demand.

## Usage

For Browser Activity to work, you must be running the Discord desktop app (not the web app) and have chrome-discord-bridge installed (see above).

> ⚠️ WARNING: if you're seeing a red badge on the extension item, it means the native apps aren't installed or running.

In Google Chrome, open the Chrome extensions menu.  If Browser Activity is showing in the "No access needed" section of the menu, it means the extension doesn't support the site that's currently open in the tab.  Otherwise, you can enable Browser Activity for the tab by clicking the Browser Activity item in the menu.

> 😎 NOTE: the extension doesn't have access to any of your browsing activity other than the tabs you've explicitly enabled it for.

After it's enabled for a tab, the Browser Activity icon in the extensions menu will have a purple badge on it.  If the page satisfies particular rules, an activity message corresponding to what you're doing on the page will be sent to Discord.

If you close the tab, or navigate to a different website, the extension will be disabled, and your Discord status will get cleared.

Currently, the supported sites are:

 * https://boardgamearena.com (active table)
 * https://dominion.games (active game)
 * https://monkeytype.com (typing page)
 * https://www.wanikani.com (lessons and reviews)


## Differences from PreMiD

Browser Activity's functionality is similar to PreMiD.  Browser Activity (combined with chrome-discord-bridge) is lighter weight and more secure than PreMiD, at the cost of being less user-friendly.


| PreMiD                          | Browser Activity + chrome-discord-bridge  |
| ------------------------------- | ----------------------------------------- |
| Works on many platforms         | Only tested on Chrome and macOS           |
| Click to install app            | Run commands to install                   |
| App >500MB on disk              | chrome-discord-bridge <2MB on disk        |
| >50MB RAM for app               | <1MB RAM for chrome-discord-bridge        |
| App accesses system events      | No special permissions needed             |
| Has access to all tabs          | Must manually enable each tab             |
| Unsecured websocket             | Chrome native messaging host              |
| Arbitrary Presence code         | Restrictive site configs                  |
| Lots of Presences in Store      | Few configs, or write your own            |
| Lots of UI features             | Minimal UI features                       |
| Lots of code, no tests          | Very little code, lots of tests           |

Advantages of Browser Activity and chrome-discord-bridge:

 -  Browser Activity uses stricter Chrome permissions (`activeTab` instead of `<all_urls>`), so Chrome stops your activity being inadvertently published, not the extension itself.  The extension doesn't have access to any of your other tabs.  See Google's [explanation of activeTab](https://developer.chrome.com/docs/extensions/mv3/manifest/activeTab/#motivation) for more details.

 -  Browser Activity's equivalent of PreMiD's "Presences" (site-specific plugins) do not allow arbitrary code; they are declarative, data-only, configs.  They cannot modify the page content.

 -  Browser Activity uses a native messaging host to launch and communicate with the native app.  PreMiD uses a native app that you must start separately and listens on a websocket.  Using a native messaging host has several advantages: Chrome starts the native app on demand, and access to the native app is secured by Chrome (no other extensions or websites can call it).

 -  Browser Activity's native app (chrome-discord-bridge) is much simpler and uses less resources than PreMiD's app.  It does little more than proxy bytes to Discord, which means logic for extracting activities and communicating with Discord stays sandboxed inside Chrome, instead of running with system access.  Furthermore, it's built on a lighter-weight runtime (compiled Go code rather than Electron)!

 -  The Browser Activity and chrome-discord-bridge code is unit-tested.

Disadvantages:

 -  No "Presence Store" - support for additional sites must be compiled in.

 -  Much less flexibility for extracting detailed activity states from a page (arbitrary update code is not allowed).

 -  You have to opt-in publishing activity to Discord for a particular tab.

 -  Only tested on recent Chrome builds.

 -  Only tested on macOS.

 -  Need to run command-line tools to build and install.
