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
  connected = false;

  /** Resolves to the next JSON payload to be received from Discord. */
  #nextResponse: Promise<any>;

  /** Resolves the #nextResponse promise. */
  #resolveNextResponse?: (response: object) => void;

  /** Rejects the #nextResponse promise. */
  #rejectNextResponse?: (reason: Error) => void;

  readonly clientId: string;

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
    this.connected = true;
    this.#nextResponse = this.makeNextResponse();

    this.#port.onMessage.addListener((response) => {
      console.debug(`Received: ${JSON.stringify(response)}`);
      if (this.#resolveNextResponse !== undefined) {
        this.#resolveNextResponse(response);
      }
    });

    this.#port.onDisconnect.addListener(() => {
      if (this.#rejectNextResponse !== undefined) {
        this.#rejectNextResponse(new Error('disconnected'));
      }
      this.connected = false;
    });
  }

  private makeNextResponse() {
    const nextResponse = new Promise<any>((resolve, reject) => {
      // We use this indirection so that the #port listener only needs to be
      // registered once, and it will resolve the current promise.
      this.#resolveNextResponse = resolve;
      this.#rejectNextResponse = reject;
    });

    return nextResponse.then((response) => {
      // Use a new promise for the next response.
      this.#nextResponse = this.makeNextResponse();
      return response;
    });
  }

  /** Sends Discord-IPC's "handshake" message. */
  sendHandshake(): Promise<any> {
    if (!this.connected) {
      return Promise.reject(new Error('not connected'));
    }

    const handshake: Handshake = {
      client_id: this.clientId,
      nonce: `${Date.now()}`,
      v: 1,
    };

    const nextResponse = this.#nextResponse;
    console.debug(`Send: ${JSON.stringify(handshake)}`);
    this.#port.postMessage(handshake);
    return nextResponse;
  }

  /** Sends Discord-IPC's "SET_ACTIVITY" command. */
  sendActivity(activity: string): Promise<any> {
    if (!this.connected) {
      return Promise.reject(new Error('not connected'));
    }

    const activityFrame: ActivityFrame = {
      args: {
        activity: {
          state: activity,
        },
        pid: 0, // not really our PID, but Discord complains if missing
      },
      cmd: 'SET_ACTIVITY',
      nonce: `${Date.now()}`,
    };

    const nextResponse = this.#nextResponse;
    console.debug(`Send: ${JSON.stringify(activityFrame)}`);
    this.#port.postMessage(activityFrame);
    return nextResponse;
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
