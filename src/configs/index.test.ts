// SPDX-License-Identifier: MPL-2.0

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
    observerRules: [],
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
    observerRules: [],
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
  const rules = configs.makeRules(testConditions);
  expect(rules.length).toBe(2);
});
