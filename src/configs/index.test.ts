import * as configs from './index';

const testConfigs: readonly Config[] = [
  {
    hosts: [
      'example.com',
    ],
    discordClientId: 'comClient',
    showActionConditions: [
      {
        pageUrl: {
          hostEquals: 'example.com',
          schemes: [
            'https',
          ],
        },
      },
    ],
    activityRules: [],
  },
  {
    hosts: [
      'example.net',
    ],
    discordClientId: 'netClient',
    showActionConditions: [
      {
        pageUrl: {
          hostEquals: 'example.net',
          schemes: [
            'https',
          ],
        },
      },
    ],
    activityRules: [],
  },
];

const testConditions: chrome.declarativeContent.PageStateMatcher[] = [
  {
    pageUrl: {
      hostEquals: 'example.com',
      schemes: [
        'https',
      ],
    },
  },
  {
    pageUrl: {
      hostEquals: 'example.net',
      schemes: [
        'https',
      ],
    },
  },
];

test('allConfigs is not empty', () => {
  expect(configs.allConfigs.length).toBeGreaterThan(1);
});

test('getConditions', () => {
  const conditions = configs.getConditions(testConfigs);
  expect(conditions).toStrictEqual(testConditions);
});

test('makeRules', () => {
  chrome.declarativeContent.ShowAction = jest.fn();
  chrome.declarativeContent.PageStateMatcher = jest.fn();

  const rules = configs.makeRules(testConditions);
  expect(rules.length).toBe(2);
});

describe('ConfigIndex', () => {
  const index = new configs.ConfigIndex(testConfigs);

  it('forUrl finds config', () => {
    const config = index.forUrl('https://example.com/page');
    expect(config).not.toBeNull();
    if (config !== null) {
      expect(config.hosts).toStrictEqual(['example.com']);
    }
  });

  it('forUrl returns null', () => {
    const config = index.forUrl('https://notexample.com/');
    expect(config).toBeNull();
  });
});
