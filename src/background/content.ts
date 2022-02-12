/**
 * Publish the activity state to the service worker.
 *
 * This function should run as a content script for a particular tab.
 * It will send a ContentRequest message to the service worker.
 */
export default function content(config: Config): ContentRequest {
  // Note that other declarations in this module won't be bound in this function
  // when it's invoked via chrome.scripting.executeScript, so we must declare
  // helpers inline.

  /** Whether the given document matches the filter. */
  const filterMatches = (filter: UrlFilter, document: Document) => {
    // Ignore the fragment identifier when comparing URLs.
    const hash = document.URL.indexOf('#');
    const urlNoHash = (hash === -1) ? document.URL : document.URL.substring(0, hash);

    if (filter.urlEquals !== undefined) {
      return urlNoHash === filter.urlEquals;
    }

    if (filter.urlMatches !== undefined) {
      // TODO: cache the compiled RegExps.
      const regexp = new RegExp(filter.urlMatches);
      return regexp.test(urlNoHash);
    }

    return true;
  };

  /** Extracts the activity state from the page if it should be published. */
  const getActivity = (): string | null => {
    for (const rule of config.activityRules) {
      const {
        pageUrl,
        hasSelector,
        activityStateLiteral,
        activityStateFromId,
      } = rule;
      if (!filterMatches(pageUrl, document)) {
        continue;
      }

      if (hasSelector !== undefined
          && document.querySelector(hasSelector) === null) {
        continue;
      }

      if (activityStateLiteral !== undefined) {
        return activityStateLiteral;
      }

      if (activityStateFromId !== undefined) {
        const element = document.getElementById(activityStateFromId);
        if (element != null) {
          return element.textContent;
        }
      }
    }
    return null;
  };

  const activity = getActivity();
  if (activity === null) {
    return {
      clearActivity: {},
    };
  }
  return {
    setActivity: {
      clientId: config.discordClientId,
      activityState: activity,
    },
  };

  return {};
}
