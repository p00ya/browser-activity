import { mockDeep } from 'jest-mock-extended';
import { chrome } from 'jest-chrome';
import DiscordClient from './DiscordClient';

describe('DiscordClient', () => {
  const mockPort = mockDeep<chrome.runtime.Port>();
  chrome.runtime.connectNative.mockReturnValue(mockPort);
  const client = new DiscordClient('TestClient');

  it('connect creates port', () => {
    expect(chrome.runtime.connectNative)
      .toHaveBeenCalledWith('io.github.p00ya.cdb');
  });

  it('sendHandshake posts message', () => {
    client.sendHandshake();
    expect(mockPort.postMessage).toHaveBeenCalledTimes(1);
    const [[handshake]] = mockPort.postMessage.mock.calls;
    expect(handshake.client_id).toBe('TestClient');
  });

  it('sendActivity posts message', () => {
    mockPort.postMessage.mockReset();
    client.sendActivity('TestActivity');
    expect(mockPort.postMessage).toHaveBeenCalledTimes(1);
    const [[activityFrame]] = mockPort.postMessage.mock.calls;
    expect(activityFrame.args.activity.state).toBe('TestActivity');
    expect(activityFrame.cmd).toBe('SET_ACTIVITY');
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
