import type { IPlaybackBridge } from './IPlaybackBridge.js';
import type { PlaybackBridgeStatus, PlaybackRequest } from '../types.js';
import { RVTikChatOutputAdapter } from './RVTikChatOutputAdapter.js';

export class RVTikPlaybackBridge implements IPlaybackBridge {
  private rvtikAdapter: RVTikChatOutputAdapter;
  private recentCalls: PlaybackRequest[] = [];

  constructor(rvtikAdapter?: RVTikChatOutputAdapter) {
    this.rvtikAdapter = rvtikAdapter || new RVTikChatOutputAdapter();
  }

  public getRVTikAdapter(): RVTikChatOutputAdapter {
    return this.rvtikAdapter;
  }

  public getStatus(): PlaybackBridgeStatus {
    return {
      connected: true,
      mode: 'RVTIK_CHAT_OUTPUT',
      endpoint: 'RVTIK_TIKTOK_LIVE_CHAT_COMMAND_OUTPUT',
      lastPingTimestamp: Date.now(),
      recentCalls: [...this.recentCalls]
    };
  }

  public async testConnection(): Promise<boolean> {
    return true;
  }

  public async requestPlayback(title: string, artist: string): Promise<PlaybackRequest> {
    const record = this.rvtikAdapter.prepareCommand(title, artist);

    const request: PlaybackRequest = {
      id: record.id,
      songTitle: title,
      artist: artist,
      requestedAt: Date.now(),
      status: 'SUCCESS'
    };

    this.recentCalls.unshift(request);
    if (this.recentCalls.length > 20) {
      this.recentCalls.pop();
    }

    return request;
  }
}
