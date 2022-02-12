import { JSDOM } from 'jsdom';
import content from './content';

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

describe('rule with activityStateLiteral', () => {
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

  it('selector present', () => {
    global.document.body.innerHTML = '<div id="foo"><div class="bar"></div></div>';
    expect(content(config)).toStrictEqual(expectedActivity);
  });

  it('selector absent', () => {
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
