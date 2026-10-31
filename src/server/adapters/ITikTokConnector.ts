import { TikTokConnectorStatus } from '../types.js';
import { Tap2Event } from '../engine/Tap2Aggregator.js';

export interface CommentEvent {
  userId: string;
  nickname: string;
  text: string;
  avatarUrl?: string;
  timestamp: number;
}

export type CommentHandler = (event: CommentEvent) => void;
export type LikeHandler = (event: Tap2Event) => void;

export interface ITikTokConnector {
  getStatus(): TikTokConnectorStatus;
  connect(targetUsername?: string): Promise<boolean>;
  disconnect(): Promise<void>;
  onComment(handler: CommentHandler): void;
  onLike(handler: LikeHandler): void;
}

