import { ITikTokConnector, CommentEvent, CommentHandler, LikeHandler } from './ITikTokConnector.js';
import { TikTokConnectorStatus } from '../types.js';
import { Tap2Event } from '../engine/Tap2Aggregator.js';

export class MockTikTokConnector implements ITikTokConnector {
  private commentHandlers: CommentHandler[] = [];
  private likeHandlers: LikeHandler[] = [];
  private isConnected: boolean = true;
  private targetUsername: string = 'thebontotradio.simulated';
  private totalComments: number = 0;
  private totalLikes: number = 0;
  private lastEventTime: number = 0;

  public getStatus(): TikTokConnectorStatus {
    return {
      connected: this.isConnected,
      mode: 'SIMULATION',
      liveUsername: this.targetUsername,
      activeViewersCount: 42,
      totalLikesReceived: this.totalLikes,
      totalCommentsProcessed: this.totalComments,
      lastEventTimestamp: this.lastEventTime
    };
  }

  public async connect(targetUsername: string = 'thebontotradio.simulated'): Promise<boolean> {
    this.targetUsername = targetUsername;
    this.isConnected = true;
    return true;
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
   * Simulates an incoming comment from the dashboard or test runner
   */
  public simulateComment(comment: {
    userId: string;
    nickname: string;
    text: string;
    avatarUrl?: string;
  }): void {
    if (!this.isConnected) return;
    this.totalComments++;
    this.lastEventTime = Date.now();
    const event: CommentEvent = {
      userId: comment.userId,
      nickname: comment.nickname,
      text: comment.text,
      avatarUrl: comment.avatarUrl,
      timestamp: Date.now()
    };
    for (const handler of this.commentHandlers) {
      handler(event);
    }
  }

  /**
   * Simulates incoming tap2 / like events
   */
  public simulateLike(like: {
    eventId?: string;
    userId: string;
    nickname: string;
    likeCount: number;
    isCumulative?: boolean;
    avatarUrl?: string;
  }): void {
    if (!this.isConnected) return;
    this.totalLikes += like.likeCount;
    this.lastEventTime = Date.now();
    const event: Tap2Event = {
      eventId: like.eventId,
      userId: like.userId,
      nickname: like.nickname,
      likeCount: like.likeCount,
      isCumulative: like.isCumulative,
      avatarUrl: like.avatarUrl,
      timestamp: Date.now()
    };
    for (const handler of this.likeHandlers) {
      handler(event);
    }
  }
}

