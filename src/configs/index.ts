import * as monkeytype from './monkeytype.json';
import * as wanikani from './wanikani.json';

/** All of the configs for matching sites and extracting activity strings. */
const allConfigs: readonly Config[] = [monkeytype, wanikani];

/**
 * The union of all conditions for enabling the extension, according to the
 * configs.
 */
const showActionConditions = (
  ([] as chrome.declarativeContent.PageStateMatcher[])
    .concat(...allConfigs.map((c) => c.showActionConditions))
);

/** Maps the website's hostname to the config options for that website. */
const hostToConfig: { [host: string]: Config } = (
  Object.fromEntries(allConfigs.flatMap(
    (config) => config.hosts.map((host) => [host, config]),
  ))
);

/** Returns the union of all Chrome "rules" for enabling the extension. */
export const getShowActionConditions = function getShowActionConditonRulesFn() {
  return showActionConditions.map((matcher) => (
    {
      actions: [new chrome.declarativeContent.ShowAction()],
      conditions: [
        new chrome.declarativeContent.PageStateMatcher(matcher),
      ],
    }
  ));
};

/** Fetches the config for the given URL, or returns null if none match. */
export const get = function getConfigForUrl(url: string): Config | null {
  try {
    const parsedURL = new URL(url);
    return hostToConfig[parsedURL.host] || null;
  } catch (e) {
    return null;
  }
};
