# Browser Activity

Browser Activity is a Chrome extension to publish website browsing activity to Discord's activity status (also known as "Rich Presence").  It will publish activity from particular Chrome tabs that you enable.  That activity will be visible to your Discord friends and other users on the same Discord servers as you.

## License

Copyright 2022, Dean Scarff.

Browser Activity (including all code in this repository) is subject to the terms of the Mozilla Public License, v. 2.0.  You can obtain a copy of the MPL at https://mozilla.org/MPL/2.0/.

## Usage and Installation

See the [User Documentation](https://p00ya.github.io/browser-activity) for instructions on how to install the Chrome extension and chrome-discord-bridge.  The User Documentation also contains information on usage, and a comparison to PreMiD.

## Development

The Browser Activity extension is written in TypeScript with ES6 modules, which is translated to javascript by ts-loader and webpack.  This means you need to build the source code before you can load the extension from Chrome.

### Building and loading the extension

These instructions assume you are familiar with the terminal, and have already installed [git](https://github.com/git-guides/install-git), [Node.js](https://nodejs.org/), and [yarn](https://yarnpkg.com/getting-started/install).

Clone the repository:

    git clone https://github.com/p00ya/browser-activity.git
    cd browser-activity

Fetch dependencies by running:

    yarn

Then run:

    yarn start

to start a process that continuously monitors for changes to the source code and builds the extension to the `dist` directory.

To load the extension in Chrome, navigate to chrome://extensions, enable Developer Mode, and click "Load unpacked".  Select the `dist` directory.

Note the extension ID for Browser Activity that will now be visible in chrome://extensions.

For the unpacked extension to work, you will also have to build chrome-discord-bridge from source rather than use a pre-built binary.

### Building chrome-discord-bridge

Install [Go](https://go.dev/dl/) 1.17 if it's not already installed on your system.

Clone the chrome-discord-bridge git repository:

    git clone https://github.com/p00ya/chrome-discord-bridge.git
    cd chrome-discord-bridge

Remember the ID of the unpacked extension from chrome://extensions?  It will be something like `nglhipbdoknhpejdpceibmeaohidgcod`.  Open the file `cmd/chrome-discord-bridge/origins.txt` in a text editor and add a line with that ID, like:

    chrome-extension://nglhipbdoknhpejdpceibmeaohidgcod/


> :warning: WARNING: if the path to the unpacked extension changes, the Chrome extension ID may change and you must repeat this process with the new ID.

Build the `chrome-discord-bridge` binary:

    go build ./cmd/chrome-discord-bridge

Run:

    ./chrome-discord-bridge -install

### Making changes to Browser Activity

If you ran `yarn start` as above, then webpack will continuosly rebuild the extension whenever you make a change to the source.  To see the changes in Chrome, open chrome://extensions and click Browser Activity's ↻ (Reload) button.

After making changes, test them with:

    yarn test

Check for style issues with:

    yarn lint

### Adding a Site Config

I expect the most common modification to Browser Activity will be adding support for new sites.

To do this, add a new JSON file corresponding to the site, for example `src/configs/example.json`.  The JSON should follow the `Config` interface documented in `src/index.d.ts`.  You can look at the existing JSON files in the `src/configs` directory for examples.

Then modify `src/configs/index.ts` to import the new JSON file, and add it as a member of the `allConfigs` array.

That's it!

