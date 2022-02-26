// SPDX-License-Identifier: MPL-2.0

// Sets activity on Discord via the chrome-discord-bridge.

// chrome-discord-bridge should be installed using this name.
const host = 'io.github.p00ya.cdb';

/** Handshake Discord-IPC payload. */
interface Handshake {
  client_id: string;
  nonce: string;
  v: number;
}

/** Activity Discord-IPC payload. */
interface ActivityFrame {
  args: {
    activity: {
      state: string;
    };
    pid: number;
  };
  cmd: string;
  nonce: string;
}

interface ResolveReject {
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  done: boolean;
}

export interface IDiscordClient {
  readonly clientId: string;
  connected: boolean;
  sendHandshake(): Promise<any>;
  sendActivity(activity: string): Promise<any>;
  disconnect(): void;
}

/**
 * An interface for sending specific messages to Discord via
 * chrome-discord-bridge.
 */
export default class DiscordClient implements IDiscordClient {
  /** Whether the native messaging port is connected. */
  connected = true;

  /** Executors to resolve/reject response promises, indexed by nonce. */
  #executors: { [key: string]: ResolveReject } = {};

  readonly clientId: string;

  /** Native messaging port connected to chrome-discord-bridge. */
  readonly #port: chrome.runtime.Port;

  /** Creates a new client. */
  static connect(clientId: string): Promise<DiscordClient> {
    const port = chrome.runtime.connectNative(host);
    if (chrome.runtime.lastError !== undefined) {
      return Promise.reject(chrome.runtime.lastError);
    }
    return Promise.resolve(new DiscordClient(clientId, port));
  }

  constructor(clientId: string, port: chrome.runtime.Port) {
    this.clientId = clientId;
    this.#port = port;

    this.#port.onMessage.addListener((response) => {
      console.debug(`Received: ${JSON.stringify(response)}`);
      const nonce = String(response.nonce);
      const executor = this.#executors[nonce];

      if (executor === undefined) {
        console.debug(`Unexpected response with nonce ${nonce}`);
        return;
      }

      executor.resolve(response);
      executor.done = true;
    });

    this.#port.onDisconnect.addListener(() => {
      this.rejectAll('host disconnected');
      this.connected = false;
    });
  }

  private rejectAll(reason: string) {
    Object.values(this.#executors).forEach(({ done, reject }) => {
      if (!done) {
        reject(new Error(reason));
      }
    });
    this.#executors = {};
  }

  private promiseResponse(nonce: string) {
    return new Promise((resolve, reject) => {
      this.#executors[nonce] = { done: false, resolve, reject };
    });
  }

  /** Sends Discord-IPC's "handshake" message. */
  sendHandshake(): Promise<any> {
    if (!this.connected) {
      return Promise.reject(new Error('not connected'));
    }

    // Discord doesn't echo the nonce from the handshake, it just sends back
    // null.
    const nonce = 'null';
    const response = this.promiseResponse(nonce);

    const handshake: Handshake = {
      client_id: this.clientId,
      nonce: '',
      v: 1,
    };

    console.debug(`Send: ${JSON.stringify(handshake)}`);
    this.#port.postMessage(handshake);
    return response;
  }

  /** Sends Discord-IPC's "SET_ACTIVITY" command. */
  sendActivity(activity: string): Promise<any> {
    if (!this.connected) {
      return Promise.reject(new Error('not connected'));
    }

    const nonce = `${Date.now()}`;
    const response = this.promiseResponse(nonce);

    const activityFrame: ActivityFrame = {
      args: {
        activity: {
          state: activity,
        },
        pid: 0, // not really our PID, but Discord complains if missing
      },
      cmd: 'SET_ACTIVITY',
      nonce,
    };

    console.debug(`Send: ${JSON.stringify(activityFrame)}`);
    this.#port.postMessage(activityFrame);
    return response;
  }

  /**
   * Disconnect from Discord.
   *
   * Further calls to sendHandshake or sendActivity will fail.
   */
  disconnect() {
    if (!this.connected) {
      return;
    }

    console.debug('Disconnect');
    this.#port.disconnect();
    this.connected = false;
  }
}
