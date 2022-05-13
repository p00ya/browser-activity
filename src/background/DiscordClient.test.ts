// SPDX-License-Identifier: MPL-2.0

import { mockDeep } from 'jest-mock-extended';
import chromeMock from '../testutils/chromeMock';
import DiscordClient from './DiscordClient';

test('connect creates port', async () => {
  const mockPort = mockDeep<chrome.runtime.Port>();
  chromeMock.runtime.connectNative.mockReturnValue(mockPort);

  await DiscordClient.connect('TestClient');
  expect(chromeMock.runtime.connectNative)
    .toHaveBeenCalledWith('io.github.p00ya.cdb');
});

describe('DiscordClient', () => {
  const mockPort = mockDeep<chrome.runtime.Port>();
  chromeMock.runtime.connectNative.mockReturnValue(mockPort);

  const client = new DiscordClient('TestClient', mockPort);
  const [[onMessage]] = mockPort.onMessage.addListener.mock.calls;

  it('sendHandshake posts message', () => {
    const wait = client.sendHandshake();

    expect(mockPort.postMessage).toHaveBeenCalledTimes(1);
    const [[handshake]] = mockPort.postMessage.mock.calls;
    expect(handshake.client_id).toBe('TestClient');
    expect(handshake.nonce).toBe('');

    onMessage({ cmd: 'DISPATCH', nonce: null }, mockPort);
    return wait;
  });

  it('sendActivity posts message', () => {
    mockPort.postMessage.mockReset();
    const wait = client.sendActivity('TestActivity');

    expect(mockPort.postMessage).toHaveBeenCalledTimes(1);
    const [[activityFrame]] = mockPort.postMessage.mock.calls;
    expect(activityFrame.args.activity.state).toBe('TestActivity');
    expect(activityFrame.cmd).toBe('SET_ACTIVITY');

    onMessage({
      cmd: 'SET_ACTIVITY',
      data: {
        state: 'TestActivity',
      },
      nonce: activityFrame.nonce,
    }, mockPort);
    return wait;
  });

  it('disconnect disconnects port', () => {
    client.disconnect();
    expect(mockPort.disconnect).toHaveBeenCalledTimes(1);
  });

  it('disconnect is idempotent', () => {
    client.disconnect();
    expect(mockPort.disconnect).toHaveBeenCalledTimes(1);
  });
});

describe('DiscordClient broken port', () => {
  const mockPort = mockDeep<chrome.runtime.Port>();
  chromeMock.runtime.connectNative.mockReturnValue(mockPort);
  const client = new DiscordClient('TestClient', mockPort);
  const [[onDisconnect]] = mockPort.onDisconnect.addListener.mock.calls;

  it('sendHandshake is rejected', () => {
    const wait = expect(client.sendHandshake()).rejects.toThrow('disconnected');
    onDisconnect(mockPort);
    return wait;
  });
});
