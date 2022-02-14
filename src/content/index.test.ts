import { JSDOM } from 'jsdom';
import content from './index';

// See: https://github.com/simon360/jest-environment-jsdom-global/issues/5#issuecomment-508749508
declare global {
  const jsdom: JSDOM;
}

const expectedActivityState = 'TestState';

/** Expected ContentRequest when the rule matches. */
const expectedActivity: ContentRequest = {
  setActivity: {
    clientId: 'TestClientId',
    activityState: expectedActivityState,
  },
};

const clearActivity: ContentRequest = {
  clearActivity: {},
};

const pageUrl = 'https://example.com/page';

describe('pageUrl.urlEquals', () => {
  const config: Config = {
    hosts: [],
    discordClientId: 'TestClientId',
    showActionConditions: [],
    activityRules: [
      {
        activityStateLiteral: expectedActivityState,
        pageUrl: {
          urlEquals: pageUrl,
        },
      },
    ],
  };

  it('pageUrl.urlEquals matches exactly', () => {
    jsdom.reconfigure({ url: pageUrl });
    expect(content(config)).toStrictEqual(expectedActivity);
  });

  it('pageUrl.urlEquals ignores fragment', () => {
    jsdom.reconfigure({ url: `${pageUrl}#hash` });
    expect(content(config)).toStrictEqual(expectedActivity);
  });

  it('pageUrl.urlEquals does not match', () => {
    jsdom.reconfigure({ url: `${pageUrl}nomatch` });
    expect(content(config)).toStrictEqual(clearActivity);
  });

  it('pageUrl.urlEquals respects query', () => {
    jsdom.reconfigure({ url: `${pageUrl}?query` });
    expect(content(config)).toStrictEqual(clearActivity);
  });
});

describe('pageUrl.urlMatches', () => {
  const config: Config = {
    hosts: [],
    discordClientId: 'TestClientId',
    showActionConditions: [],
    activityRules: [
      {
        activityStateLiteral: expectedActivityState,
        pageUrl: {
          // RegExp literal with a URL full of slashes is awkward:
          // eslint-disable-next-line prefer-regex-literals
          urlMatches: '^https://example\\.com/page(?:/foo)?$',
        },
      },
    ],
  };

  it('pageUrl.urlMatches matches entire URL', () => {
    jsdom.reconfigure({ url: `${pageUrl}` });
    expect(content(config)).toStrictEqual(expectedActivity);

    jsdom.reconfigure({ url: `${pageUrl}/foo` });
    expect(content(config)).toStrictEqual(expectedActivity);
  });

  it('pageUrl.urlMatches ignores fragment', () => {
    jsdom.reconfigure({ url: `${pageUrl}/foo#hash` });
    expect(content(config)).toStrictEqual(expectedActivity);
  });

  it('pageUrl.urlMatches only matches prefix', () => {
    jsdom.reconfigure({ url: `${pageUrl}/foobar` });
    expect(content(config)).toStrictEqual(clearActivity);
  });

  it('pageUrl.urlMatches does not match', () => {
    jsdom.reconfigure({ url: `${pageUrl}/nomatch` });
    expect(content(config)).toStrictEqual(clearActivity);
  });
});

describe('rule with hasSelector', () => {
  const config: Config = {
    hosts: [],
    discordClientId: 'TestClientId',
    showActionConditions: [],
    activityRules: [
      {
        activityStateLiteral: expectedActivityState,
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
    expect(content(config)).toStrictEqual(expectedActivity);
  });

  it('selector doesn\'t match', () => {
    global.document.body.innerHTML = '<div><div></div></div>';
    expect(content(config)).toStrictEqual(clearActivity);
  });
});

describe('rule with activityStateFromId', () => {
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
    expect(content(config)).toStrictEqual(clearActivity);
  });

  it('element present', () => {
    global.document.body.innerHTML = '<div id="test">TestState</div>';
    expect(content(config)).toStrictEqual(expectedActivity);
  });
});

describe('rule with activityStateFromSelector', () => {
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
    expect(content(config)).toStrictEqual(expectedActivity);
  });

  it('selector matches and attribute missing', () => {
    global.document.head.innerHTML = '<meta property="foo">'
      + '<title>Title</title>';
    expect(content(config)).toStrictEqual(clearActivity);
  });

  it('selector doesn\'t match', () => {
    global.document.head.innerHTML = '<meta property="bar" content="TestState">'
      + '<title>Title</title>';
    expect(content(config)).toStrictEqual(clearActivity);
  });
});

test('first rule of many wins', () => {
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

  const firstActivityState: ContentRequest = {
    setActivity: {
      clientId: 'TestClientId',
      activityState: 'literal1',
    },
  };

  jsdom.reconfigure({ url: 'https://example.com/page' });
  expect(content(config)).toStrictEqual(firstActivityState);
});
