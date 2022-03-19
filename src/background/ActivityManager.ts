// SPDX-License-Identifier: MPL-2.0

import DiscordClient, { IDiscordClient } from './DiscordClient';

export type ClientFactory = (clientId: string) => Promise<IDiscordClient>;

/** A high-level wrapper for setting and clearing Discord's activity state. */
export default class ActivityManager {
  #client?: IDiscordClient;

  #activityState?: string;

  readonly #clientFactory: ClientFactory;

  /**
   * A promise that must settle before any additional send operations occur on
   * the client.
   */
  #waiting: Promise<void> = Promise.resolve();

  #nextActivity?: { clientId: string, activity: string };

  constructor(clientFactory: ClientFactory = DiscordClient.connect) {
    this.#clientFactory = clientFactory;
  }

  clearActivity() {
    this.#nextActivity = undefined;
    this.#activityState = undefined;
    this.#client?.disconnect();
  }

  /**
   * Schedule an update to the activity.
   *
   * If there's an outstanding request, don't do anything yet.  When that
   * request returns, only the parameters from the last call to setActivity()
   * will be used.
   *
   * Returns a promise that is resolved or rejected when the update actually
   * runs.
   */
  setActivity(clientId: string, activity: string) {
    this.#nextActivity = { clientId, activity };

    const outstanding = this.#waiting;
    this.#waiting = new Promise<void>((resolve, reject) => {
      outstanding.then(() => {
        if (this.#nextActivity !== undefined) {
          this.maybeConnectAndSend(
            this.#nextActivity.clientId,
            this.#nextActivity.activity,
          ).then(resolve, reject);
          this.#nextActivity = undefined;
        } else {
          resolve();
        }
      });
    });
    return this.#waiting;
  }

  private async maybeConnectAndSend(clientId: string, activity: string) {
    if (this.#client?.connected && this.#client?.clientId !== clientId) {
      // Since the client ID is established when the connection to Discord is
      // initialized, we must disconnect to change it.
      this.clearActivity();
    }

    // Make sure the client is connected with the appropriate clientId.
    if (!this.#client?.connected) {
      this.#client = await this.#clientFactory(clientId);
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
