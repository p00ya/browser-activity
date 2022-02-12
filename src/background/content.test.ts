import { JSDOM } from 'jsdom';
import content from './content';

// See: https://github.com/simon360/jest-environment-jsdom-global/issues/5#issuecomment-508749508
declare global {
  const jsdom: JSDOM;
}

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
        activityStateLiteral: 'Test Activity State',
        pageUrl: {
          urlEquals: pageUrl,
        },
      },
    ],
  };

  const literalActivity: ContentRequest = {
    setActivity: {
      clientId: 'TestClientId',
      activityState: 'Test Activity State',
    },
  };

  it('pageUrl.urlEquals matches exactly', () => {
    jsdom.reconfigure({ url: pageUrl });
    expect(content(config)).toStrictEqual(literalActivity);
  });

  it('pageUrl.urlEquals ignores fragment', () => {
    jsdom.reconfigure({ url: `${pageUrl}#hash` });
    expect(content(config)).toStrictEqual(literalActivity);
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
        activityStateLiteral: 'Test Activity State',
        hasSelector: '#foo .bar',
        pageUrl: {
          urlEquals: pageUrl,
        },
      },
    ],
  };

  const literalActivity: ContentRequest = {
    setActivity: {
      clientId: 'TestClientId',
      activityState: 'Test Activity State',
    },
  };

  beforeEach(() => {
    jsdom.reconfigure({ url: pageUrl });
  });

  it('selector present', () => {
    global.document.body.innerHTML = '<div id="foo"><div class="bar"></div></div>';
    expect(content(config)).toStrictEqual(literalActivity);
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

  const activityStateFromId: ContentRequest = {
    setActivity: {
      clientId: 'TestClientId',
      activityState: 'Text Content',
    },
  };

  beforeEach(() => {
    jsdom.reconfigure({ url: pageUrl });
  });

  it('element missing', () => {
    global.document.body.innerHTML = '<div>Text Content</div>';
    expect(content(config)).toStrictEqual(clearActivity);
  });

  it('element present', () => {
    global.document.body.innerHTML = '<div id="test">Text Content</div>';
    expect(content(config)).toStrictEqual(activityStateFromId);
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
