import DiscordClient from './DiscordClient';

/** A high-level wrapper for setting and clearing Discord's activity state. */
export default class ActivityManager {
  #client?: DiscordClient;

  #activityState?: string;

  clearActivity() {
    this.#client?.disconnect();
  }

  async setActivity(clientId: string, activity: string) {
    // Make sure the client is connected with the appropriate clientId.
    if (!this.#client?.connected) {
      this.#client = new DiscordClient(clientId);
      await this.#client.sendHandshake();
    } else if (this.#client.clientId !== clientId) {
      // Since the client ID is established when the connection to Discord is
      // initialized, we must disconnect to change it.
      this.#client.disconnect();

      this.#client = new DiscordClient(clientId);
      await this.#client.sendHandshake();
    }

    if (this.#activityState === activity) {
      return; // Activity is already set.
    }

    this.#client.sendActivity(activity).then((response) => {
      const { cmd, data } = response;
      if (cmd !== 'SET_ACTIVITY') {
        return; // Error?
      }

      this.#activityState = data?.state;
    });
  }
}
