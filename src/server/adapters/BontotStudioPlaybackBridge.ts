import { IPlaybackBridge } from './IPlaybackBridge.js';
import { PlaybackBridgeStatus, PlaybackRequest } from '../types.js';

export class BontotStudioPlaybackBridge implements IPlaybackBridge {
  private endpoint: string;
  private isConnected: boolean = false;
  private lastPingTime: number = 0;
  private recentCalls: PlaybackRequest[] = [];

  constructor(endpoint: string = 'http://127.0.0.1:8999/api/playback') {
    this.endpoint = endpoint;
  }

  public setEndpoint(endpoint: string): void {
    this.endpoint = endpoint;
  }

  public getStatus(): PlaybackBridgeStatus {
    return {
      connected: this.isConnected,
      mode: 'BONTOT_STUDIO_BRIDGE',
      endpoint: this.endpoint,
      lastPingTimestamp: this.lastPingTime,
      recentCalls: [...this.recentCalls]
    };
  }

  /**
   * Probes the external BONTOT STUDIO playback engine endpoint with a 1.5s timeout.
   */
  public async testConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(`${this.endpoint}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      this.isConnected = res.ok;
      this.lastPingTime = Date.now();
      return this.isConnected;
    } catch {
      this.isConnected = false;
      this.lastPingTime = Date.now();
      return false;
    }
  }

  /**
   * Dispatches playback command to external BONTOT STUDIO playback engine.
   * If offline or failed, records status FAILED and does not block the game scoring.
   */
  public async requestPlayback(title: string, artist: string): Promise<PlaybackRequest> {
    const reqId = `bs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const requestRecord: PlaybackRequest = {
      id: reqId,
      songTitle: title,
      artist: artist,
      requestedAt: Date.now(),
      status: 'PENDING'
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PLAY_ANSWER_SONG',
          title,
          artist,
          source: 'MUSIC_LEGEND_LIVE',
          timestamp: Date.now()
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        requestRecord.status = 'SUCCESS';
        this.isConnected = true;
      } else {
        requestRecord.status = 'FAILED';
        requestRecord.errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
    } catch (err: any) {
      requestRecord.status = 'FAILED';
      requestRecord.errorMessage = `EXTERNAL_BRIDGE_OFFLINE: BONTOT STUDIO playback engine unreachable at ${this.endpoint} (${err.message || 'Connection refused'})`;
      this.isConnected = false;
    }

    this.recentCalls.unshift(requestRecord);
    if (this.recentCalls.length > 20) {
      this.recentCalls.pop();
    }

    return requestRecord;
  }
}

