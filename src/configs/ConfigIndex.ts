// SPDX-License-Identifier: MPL-2.0

/** Provides lookups for configs. */
export default class ConfigIndex {
  readonly #map: { [host: string]: Config };

  constructor(configs: readonly Config[]) {
    this.#map = Object.fromEntries(
      configs.flatMap(
        (config) => config.hosts.map((host) => [host, config]),
      ),
    );
  }

  /** Fetches the config for the given URL, or returns null if none match. */
  forUrl(url: string): Config | null {
    try {
      const parsedURL = new URL(url);
      return this.#map[parsedURL.host] || null;
    } catch (e) {
      console.warn(e);
      return null;
    }
  }
}
