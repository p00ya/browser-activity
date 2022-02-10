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
    if (filter.urlEquals !== undefined) {
      return document.URL === filter.urlEquals;
    }
    return false;
  };

  /** Extracts the activity state from the page if it should be published. */
  const getActivity = (): string | null => {
    for (const { pageUrl, activityStateLiteral, activityStateFromId } of config.activityRules) {
      if (!filterMatches(pageUrl, document)) {
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
