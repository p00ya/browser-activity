// Fields in UrlFilter have the same semantics as chrome.events.UrlFilter.
// The URL must match all specified fields.
interface UrlFilter {
  // Exact match on the URL (with no fragment identifier).
  urlEquals?: string;

  // A regular expression matched against the URL (with no fragment identifier).
  // Will match on a substring unless anchored (with `^$`).
  urlMatches?: string;
}

// Maps conditions for the URL and content of a page to an activity state.
// To publish an activity, the filter/selectors must match, *and* the activity
// state must be resolved through one of the other fields.
interface ActivityRule {
  // A filter for the URL.
  pageUrl: UrlFilter;

  // A CSS selector.  There must be a matching element for the rule to apply.
  hasSelector?: string;

  // A literal string to set as the activity state.
  activityStateLiteral?: string;

  // An element ID; the text content of the matching element will be used as
  // the activity state.
  activityStateFromId?: string;

  // The matching element / content will be used as the activity state.
  activityStateFromSelector?: {
    // A CSS selector; there must be a matching element for the rule to apply.
    selector: string;

    // Use the given DOM attribute on the matching element as the activity
    // state.
    attribute: string;
  };
}

// Configuration for mapping a particular website to activity states.
interface Config {
  // The host for this config.  Rules will only be evaluated for configs with
  // matching hosts.  Hosts must not appear in multiple configs.
  hosts: string[];

  // The discord application/client ID.
  discordClientId: string;

  // The extension's action should be shown if any of the conditions are true.
  // It's generally pointless to match on anything more specific than the
  // scheme + host, since the effect is sticky for a single origin.
  showActionConditions: chrome.declarativeContent.PageStateMatcher[];

  // A list of rules that will be matched against the page content.  The first
  // to match will be used to set the status.
  activityRules: ActivityRule[];
}

interface ClearActivityCommand {
}

interface SetActivityCommand {
  clientId: string;
  activityState: string;
}

// Message from the content script to the service worker.
interface ContentRequest {
  clearActivity?: ClearActivityCommand;
  setActivity?: SetActivityCommand;
}
