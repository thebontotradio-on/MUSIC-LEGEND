import { IPlaybackBridge } from './IPlaybackBridge.js';
import { PlaybackBridgeStatus, PlaybackRequest } from '../types.js';

export class MockPlaybackBridge implements IPlaybackBridge {
  private recentCalls: PlaybackRequest[] = [];
  private simulateFailure: boolean = false;

  constructor(simulateFailure: boolean = false) {
    this.simulateFailure = simulateFailure;
  }

  public setSimulateFailure(fail: boolean): void {
    this.simulateFailure = fail;
  }

  public getStatus(): PlaybackBridgeStatus {
    return {
      connected: !this.simulateFailure,
      mode: 'MOCK',
      endpoint: 'mock://local-audio-bridge',
      lastPingTimestamp: Date.now(),
      recentCalls: [...this.recentCalls]
    };
  }

  public async testConnection(): Promise<boolean> {
    return !this.simulateFailure;
  }

  public async requestPlayback(title: string, artist: string): Promise<PlaybackRequest> {
    const request: PlaybackRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      songTitle: title,
      artist: artist,
      requestedAt: Date.now(),
      status: this.simulateFailure ? 'FAILED' : 'SUCCESS',
      errorMessage: this.simulateFailure ? 'MOCK_ERROR: Simulated playback bridge unavailable' : undefined
    };

    this.recentCalls.unshift(request);
    if (this.recentCalls.length > 20) {
      this.recentCalls.pop();
    }

    return request;
  }
}

