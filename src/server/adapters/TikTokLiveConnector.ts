import { ITikTokConnector, CommentEvent, CommentHandler, LikeHandler } from './ITikTokConnector.js';
import { TikTokConnectorStatus } from '../types.js';
import { Tap2Event } from '../engine/Tap2Aggregator.js';

/**
 * Adapter skeleton for real TikTok LIVE connection (via Webhook, official bridge, or WebSocket bridge).
 * Enforces SINGLE listener source to avoid duplicate event processing.
 */
export class TikTokLiveConnector implements ITikTokConnector {
  private commentHandlers: CommentHandler[] = [];
  private likeHandlers: LikeHandler[] = [];
  private isConnected: boolean = false;
  private targetUsername: string = '';
  private totalComments: number = 0;
  private totalLikes: number = 0;
  private lastEventTime: number = 0;
  private activeViewers: number = 0;

  constructor(targetUsername: string = '') {
    this.targetUsername = targetUsername;
  }

  public getStatus(): TikTokConnectorStatus {
    return {
      connected: this.isConnected,
      mode: 'LIVE_CONNECTOR',
      liveUsername: this.targetUsername,
      activeViewersCount: this.activeViewers,
      totalLikesReceived: this.totalLikes,
      totalCommentsProcessed: this.totalComments,
      lastEventTimestamp: this.lastEventTime
    };
  }

  public async connect(targetUsername?: string): Promise<boolean> {
    if (targetUsername) {
      this.targetUsername = targetUsername;
    }
    if (!this.targetUsername) {
      this.isConnected = false;
      return false;
    }

    // In a live environment with network access & TikTok Live credentials/token,
    // this initializes the real TikTok socket stream.
    // For standalone execution without unauthorized live scraping:
    this.isConnected = false;
    return false;
  }

  public async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  public onComment(handler: CommentHandler): void {
    this.commentHandlers.push(handler);
  }

  public onLike(handler: LikeHandler): void {
    this.likeHandlers.push(handler);
  }

  /**
   * Internal ingestion method for incoming raw webhook/socket events
   */
  public ingestRawComment(userId: string, nickname: string, text: string, avatarUrl?: string): void {
    if (!this.isConnected) return;
    this.totalComments++;
    this.lastEventTime = Date.now();
    const event: CommentEvent = {
      userId,
      nickname,
      text,
      avatarUrl,
      timestamp: Date.now()
    };
    for (const h of this.commentHandlers) {
      h(event);
    }
  }

  public ingestRawLike(eventId: string, userId: string, nickname: string, count: number, isCumulative: boolean): void {
    if (!this.isConnected) return;
    this.totalLikes += count;
    this.lastEventTime = Date.now();
    const event: Tap2Event = {
      eventId,
      userId,
      nickname,
      likeCount: count,
      isCumulative,
      timestamp: Date.now()
    };
    for (const h of this.likeHandlers) {
      h(event);
    }
  }
}

