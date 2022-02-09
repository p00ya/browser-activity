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

/**
 * An interface for sending specific messages to Discord via
 * chrome-discord-bridge.
 */
export default class DiscordClient {
  /**
   * A native messaging port connected to chrome-discord-bridge.
   *
   * Set to null if disconnected.
   */
  #port: chrome.runtime.Port;

  /** The client ID used for this Discord connection. */
  clientId: string;

  /** The activity.state as last confirmed by Discord. */
  activityState?: string;

  connected = false;

  /** Resolves to the next JSON payload to be received from Discord. */
  #nextResponse: Promise<any>;

  /** Resolves the #nextResponse promise. */
  #resolveNextResponse?: (response: object) => void;

  /** Rejects the #nextResponse promise. */
  #rejectNextResponse?: (reason: Error) => void;

  constructor(clientId: string) {
    this.clientId = clientId;
    this.#port = chrome.runtime.connectNative(host);
    this.connected = true;
    this.#nextResponse = this.makeNextResponse();

    this.#port.onMessage.addListener((response) => {
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

    nextResponse.then(() => {
      // Use a new promise for the next response.
      this.#nextResponse = this.makeNextResponse();
    });

    return nextResponse;
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

    this.#port.disconnect();
  }
}
