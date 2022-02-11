import ActivityManager, { ClientFactory } from './ActivityManager';
import { IDiscordClient } from './DiscordClient';

interface MockClient extends IDiscordClient {
  sendHandshake: jest.MockedFunction<IDiscordClient['sendHandshake']>;
  sendActivity: jest.MockedFunction<IDiscordClient['sendActivity']>;
}

describe('ActivityManager', () => {
  let mockClient: MockClient | null = null;

  const clientFactory = jest.fn() as jest.MockedFunction<ClientFactory>;
  clientFactory.mockImplementation((clientId) => {
    mockClient = {
      clientId,
      connected: true,
      sendHandshake: jest.fn() as MockClient['sendHandshake'],
      sendActivity: jest.fn() as MockClient['sendActivity'],
      disconnect(): void {
        this.connected = false;
      },
    };

    mockClient.sendHandshake.mockReturnValue(Promise.resolve({ cmd: 'DISPATCH' }));

    mockClient.sendActivity.mockImplementation((activity) => Promise.resolve({
      cmd: 'SET_ACTIVITY',
      data: {
        state: activity,
      },
    }));

    return Promise.resolve(mockClient);
  });

  const activityManager = new ActivityManager(clientFactory);

  it('constructor does not create client', () => {
    expect(clientFactory).not.toBeCalled();
  });

  it('setActivity connects and sends handshake', async () => {
    await activityManager.setActivity('TestClientId', 'test activity');

    expect(clientFactory).toHaveBeenCalledTimes(1);
    expect(clientFactory).toHaveBeenLastCalledWith('TestClientId');

    expect(mockClient).not.toBeNull();
    // Redundant type-narrowing for TypeScript.
    if (mockClient !== null) {
      expect(mockClient.sendHandshake).toHaveBeenCalledTimes(1);
      expect(mockClient.sendActivity).toHaveBeenCalledTimes(1);
      expect(mockClient.sendActivity).toHaveBeenCalledWith('test activity');
    }
  });

  it('setActivity with cached activity is ignored', async () => {
    clientFactory.mockClear();
    mockClient?.sendHandshake.mockClear();
    mockClient?.sendActivity.mockClear();

    await activityManager.setActivity('TestClientId', 'test activity');

    expect(clientFactory).not.toBeCalled();
    expect(mockClient).not.toBeNull();
    // Redundant type-narrowing for TypeScript.
    if (mockClient !== null) {
      expect(mockClient.sendHandshake).not.toBeCalled();
      expect(mockClient.sendActivity).not.toBeCalled();
    }
  });

  it('setActivity with different state', async () => {
    clientFactory.mockClear();
    mockClient?.sendHandshake.mockClear();
    mockClient?.sendActivity.mockClear();

    await activityManager.setActivity('TestClientId', 'new activity');

    expect(clientFactory).not.toBeCalled();
    expect(mockClient).not.toBeNull();
    // Redundant type-narrowing for TypeScript.
    if (mockClient !== null) {
      expect(mockClient.clientId).toBe('TestClientId');
      expect(mockClient.sendHandshake).not.toBeCalled();
      expect(mockClient.sendActivity).toHaveBeenCalledTimes(1);
      expect(mockClient.sendActivity).toHaveBeenCalledWith('new activity');
    }
  });

  it('setActivity with different clientId', async () => {
    clientFactory.mockClear();
    await activityManager.setActivity('NewClientId', 'new activity');

    expect(clientFactory).toHaveBeenCalledTimes(1);
    expect(mockClient).not.toBeNull();
    // Redundant type-narrowing for TypeScript.
    if (mockClient !== null) {
      expect(mockClient.clientId).toBe('NewClientId');
      expect(mockClient.sendHandshake).toHaveBeenCalledTimes(1);
      expect(mockClient.sendActivity).toHaveBeenCalledTimes(1);
    }
  });

  it('clearActivity disconnects', () => {
    clientFactory.mockClear();
    mockClient?.sendHandshake.mockClear();
    mockClient?.sendActivity.mockClear();

    activityManager.clearActivity();

    expect(clientFactory).not.toBeCalled();
    expect(mockClient).not.toBeNull();
    // Redundant type-narrowing for TypeScript.
    if (mockClient !== null) {
      expect(mockClient.connected).toBe(false);
      expect(mockClient.sendHandshake).not.toBeCalled();
      expect(mockClient.sendActivity).not.toBeCalled();
    }
  });
});
