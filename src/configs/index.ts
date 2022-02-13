import * as boardgamearena from './boardgamearena.json';
import * as monkeytype from './monkeytype.json';
import * as wanikani from './wanikani.json';

/** All of the configs for matching sites and extracting activity strings. */
export const allConfigs: readonly Config[] = [
  boardgamearena,
  monkeytype,
  wanikani,
];

/**
 * The union of all conditions for enabling the extension, according to the
 * given configs.
 */
export const getConditions = function getConditions(configs: readonly Config[]) {
  const union: chrome.declarativeContent.PageStateMatcher[] = [];
  return union.concat(...configs.map((c) => c.showActionConditions));
};

/** Returns the union of all Chrome "rules" for enabling the extension. */
export const makeRules = function makeRules(
  matchers: chrome.declarativeContent.PageStateMatcher[],
) {
  const showAction = new chrome.declarativeContent.ShowAction();
  return matchers.map((matcher) => (
    {
      actions: [showAction],
      conditions: [
        new chrome.declarativeContent.PageStateMatcher(matcher),
      ],
    }
  ));
};

/** Provides lookups for configs. */
export class ConfigIndex {
  private readonly map: { [host: string]: Config };

  constructor(configs: readonly Config[]) {
    this.map = Object.fromEntries(
      configs.flatMap(
        (config) => config.hosts.map((host) => [host, config]),
      ),
    );
  }

  /** Fetches the config for the given URL, or returns null if none match. */
  forUrl(url: string): Config | null {
    try {
      const parsedURL = new URL(url);
      return this.map[parsedURL.host] || null;
    } catch (e) {
      console.warn(e);
      return null;
    }
  }
}
