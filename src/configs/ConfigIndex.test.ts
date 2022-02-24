import ConfigIndex from './ConfigIndex';

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

describe('ConfigIndex', () => {
  const index = new ConfigIndex(testConfigs);

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