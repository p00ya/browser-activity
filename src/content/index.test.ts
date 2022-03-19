// SPDX-License-Identifier: MPL-2.0

import { chrome } from 'jest-chrome';
import { JSDOM } from 'jsdom';
import * as content from './index';

// See: https://github.com/simon360/jest-environment-jsdom-global/issues/5#issuecomment-508749508
declare global {
  const jsdom: JSDOM;
}

const pageUrl = 'https://example.com/page';

describe('filterMatches urlEquals', () => {
  const filter: UrlFilter = {
    urlEquals: pageUrl,
  };

  it('matches exactly', () => {
    jsdom.reconfigure({ url: pageUrl });
    expect(content.filterMatches(filter, global.document)).toBe(true);
  });

  it('ignores fragment', () => {
    jsdom.reconfigure({ url: `${pageUrl}#hash` });
    expect(content.filterMatches(filter, global.document)).toBe(true);
  });

  it('does not match', () => {
    jsdom.reconfigure({ url: `${pageUrl}nomatch` });
    expect(content.filterMatches(filter, global.document)).toBe(false);
  });

  it('respects query', () => {
    jsdom.reconfigure({ url: `${pageUrl}?query` });
    expect(content.filterMatches(filter, global.document)).toBe(false);
  });
});

describe('filterMatches urlMatches', () => {
  const filter: UrlFilter = {
    // RegExp literal with a URL full of slashes is awkward:
    // eslint-disable-next-line prefer-regex-literals
    urlMatches: '^https://example\\.com/page(?:/foo)?$',
  };

  it('pageUrl.urlMatches matches entire URL', () => {
    jsdom.reconfigure({ url: `${pageUrl}` });
    expect(content.filterMatches(filter, global.document)).toBe(true);

    jsdom.reconfigure({ url: `${pageUrl}/foo` });
    expect(content.filterMatches(filter, global.document)).toBe(true);
  });

  it('pageUrl.urlMatches ignores fragment', () => {
    jsdom.reconfigure({ url: `${pageUrl}/foo#hash` });
    expect(content.filterMatches(filter, global.document)).toBe(true);
  });

  it('pageUrl.urlMatches only matches prefix', () => {
    jsdom.reconfigure({ url: `${pageUrl}/foobar` });
    expect(content.filterMatches(filter, global.document)).toBe(false);
  });

  it('pageUrl.urlMatches does not match', () => {
    jsdom.reconfigure({ url: `${pageUrl}/nomatch` });
    expect(content.filterMatches(filter, global.document)).toBe(false);
  });
});

describe('getActivity with hasSelector', () => {
  const config: Config = {
    hosts: [],
    discordClientId: 'TestClientId',
    showActionConditions: [],
    activityRules: [
      {
        activityStateLiteral: 'TestState',
        hasSelector: '#foo .bar',
        pageUrl: {
          urlEquals: pageUrl,
        },
      },
    ],
  };

  beforeEach(() => {
    jsdom.reconfigure({ url: pageUrl });
  });

  it('selector matches', () => {
    global.document.body.innerHTML = '<div id="foo"><div class="bar"></div></div>';
    expect(content.getActivity(config, global.document)).toBe('TestState');
  });

  it('selector doesn\'t match', () => {
    global.document.body.innerHTML = '<div><div></div></div>';
    expect(content.getActivity(config, global.document)).toBeNull();
  });
});

describe('getActivity with activityStateFromId', () => {
  const config: Config = {
    hosts: [],
    discordClientId: 'TestClientId',
    showActionConditions: [],
    activityRules: [
      {
        activityStateFromId: 'test',
        pageUrl: {
          urlEquals: pageUrl,
        },
      },
    ],
  };

  beforeEach(() => {
    jsdom.reconfigure({ url: pageUrl });
  });

  it('element missing', () => {
    global.document.body.innerHTML = '<div>TestState</div>';
    expect(content.getActivity(config, global.document)).toBeNull();
  });

  it('element present', () => {
    global.document.body.innerHTML = '<div id="test">TestState</div>';
    expect(content.getActivity(config, global.document)).toBe('TestState');
  });
});

describe('getActivity with activityStateFromSelector', () => {
  const config: Config = {
    hosts: [],
    discordClientId: 'TestClientId',
    showActionConditions: [],
    activityRules: [
      {
        activityStateFromSelector: {
          selector: 'head > meta[property="foo"]',
          attribute: 'content',
        },
        pageUrl: {
          urlEquals: pageUrl,
        },
      },
    ],
  };

  beforeEach(() => {
    jsdom.reconfigure({ url: pageUrl });
  });

  it('selector matches', () => {
    global.document.head.innerHTML = '<meta property="foo" content="TestState">'
      + '<title>Title</title>';
    expect(content.getActivity(config, global.document)).toBe('TestState');
  });

  it('selector matches and attribute missing', () => {
    global.document.head.innerHTML = '<meta property="foo">'
      + '<title>Title</title>';
    expect(content.getActivity(config, global.document)).toBeNull();
  });

  it('selector doesn\'t match', () => {
    global.document.head.innerHTML = '<meta property="bar" content="TestState">'
      + '<title>Title</title>';
    expect(content.getActivity(config, global.document)).toBeNull();
  });
});

test('getActivity first rule of many wins', () => {
  const config: Config = {
    hosts: [],
    discordClientId: 'TestClientId',
    showActionConditions: [],
    activityRules: [
      {
        activityStateLiteral: 'literal1',
        pageUrl: {
          urlEquals: pageUrl,
        },
      },
      {
        activityStateLiteral: 'literal2',
        pageUrl: {
          urlEquals: pageUrl,
        },
      },
    ],
  };

  jsdom.reconfigure({ url: 'https://example.com/page' });
  expect(content.getActivity(config, global.document))
    .toStrictEqual('literal1');
});

describe('makeContentMessage', () => {
  it('null activity', () => {
    expect(content.makeContentMessage('TestClientId', null)).toStrictEqual(
      {
        clearActivity: {},
      },
    );
  });

  it('non-null activity', () => {
    expect(
      content.makeContentMessage('TestClientId', 'TestState'),
    ).toStrictEqual(
      {
        setActivity: {
          clientId: 'TestClientId',
          activityState: 'TestState',
        },
      },
    );
  });
});

test('messaging integration test', () => {
  const config: Config = {
    hosts: [],
    discordClientId: 'TestClientId',
    showActionConditions: [],
    activityRules: [
      {
        activityStateLiteral: 'TestState',
        pageUrl: {
          urlEquals: pageUrl,
        },
      },
    ],
  };

  // Listener should already be registered as a side-effect of loading the
  // content module.
  expect(chrome.runtime.onMessage.hasListeners()).toBe(true);

  const sendResponse = jest.fn() as jest.MockedFunction<() => any>;

  // Simulate the service worker initializing the content script with a config.
  chrome.runtime.onMessage.callListeners(
    { config },
    /* sender */ { },
    sendResponse,
  );

  const expectedResponse: ContentMessage = {
    setActivity: {
      clientId: 'TestClientId',
      activityState: 'TestState',
    },
  };
  expect(sendResponse).toBeCalledWith(expectedResponse);

  sendResponse.mockClear();

  // Simulate the service worker requesting an activity update.
  chrome.runtime.onMessage.callListeners(
    { },
    /* sender */ { },
    sendResponse,
  );
  expect(sendResponse).toBeCalledWith(expectedResponse);
});
