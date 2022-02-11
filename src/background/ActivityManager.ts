import DiscordClient, { IDiscordClient } from './DiscordClient';

export type ClientFactory = (clientId: string) => IDiscordClient;

/** A high-level wrapper for setting and clearing Discord's activity state. */
export default class ActivityManager {
  #client?: IDiscordClient;

  #activityState?: string;

  /**
   * @param clientFactory constructs a DiscordClient
   */
  constructor(
    private readonly clientFactory: ClientFactory = (clientId) => new DiscordClient(clientId),
  ) { }

  clearActivity() {
    this.#activityState = undefined;
    this.#client?.disconnect();
  }

  async setActivity(clientId: string, activity: string) {
    // Make sure the client is connected with the appropriate clientId.
    if (!this.#client?.connected) {
      this.#client = this.clientFactory(clientId);
      await this.#client.sendHandshake();
    } else if (this.#client.clientId !== clientId) {
      // Since the client ID is established when the connection to Discord is
      // initialized, we must disconnect to change it.
      this.clearActivity();

      this.#client = this.clientFactory(clientId);
      await this.#client.sendHandshake();
    }

    if (this.#activityState === activity) {
      return; // Activity is already set.
    }

    const { cmd, data } = await this.#client.sendActivity(activity);
    if (cmd !== 'SET_ACTIVITY') {
      console.warn(`Unexpected response; got ${cmd}, wanted 'SET_ACTIVITY'`);
      return;
    }

    this.#activityState = data?.state;
  }
}
