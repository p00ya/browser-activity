import DiscordClient, { IDiscordClient } from './DiscordClient';

export type ClientFactory = (clientId: string) => Promise<IDiscordClient>;

/** A high-level wrapper for setting and clearing Discord's activity state. */
export default class ActivityManager {
  #client?: IDiscordClient;

  #activityState?: string;

  /**
   * @param clientFactory - constructs a DiscordClient
   */
  constructor(
    private readonly clientFactory: ClientFactory = DiscordClient.connect,
  ) { }

  async clearActivity() {
    this.#activityState = undefined;
    await this.#client?.disconnect();
  }

  async setActivity(clientId: string, activity: string) {
    if (this.#client?.connected && this.#client.clientId !== clientId) {
      // Since the client ID is established when the connection to Discord is
      // initialized, we must disconnect to change it.
      await this.clearActivity();
    }

    // Make sure the client is connected with the appropriate clientId.
    if (!this.#client?.connected) {
      this.#client = await this.clientFactory(clientId);
      const { cmd } = await this.#client.sendHandshake();
      if (cmd !== 'DISPATCH') {
        console.debug(`Unexpected response; got ${cmd}, wanted 'DISPATCH'`);
      }
    }

    if (this.#activityState === activity) {
      return; // Activity is already set.
    }

    const response = await this.#client.sendActivity(activity);
    const { cmd, data } = response;
    if (cmd !== 'SET_ACTIVITY') {
      console.debug(`Unexpected response; got ${cmd}, wanted 'SET_ACTIVITY'`);
      return;
    }

    this.#activityState = data?.state;
  }
}
