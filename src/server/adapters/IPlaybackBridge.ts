import { PlaybackBridgeStatus, PlaybackRequest } from '../types.js';

export interface IPlaybackBridge {
  getStatus(): PlaybackBridgeStatus;
  requestPlayback(title: string, artist: string): Promise<PlaybackRequest>;
  testConnection(): Promise<boolean>;
}

