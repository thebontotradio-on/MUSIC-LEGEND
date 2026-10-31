export interface Tap2Event {
  eventId?: string;
  userId: string;
  nickname: string;
  avatarUrl?: string;
  likeCount?: number; // delta count or cumulative count
  isCumulative?: boolean;
  timestamp: number;
}

export class Tap2Aggregator {
  // Store processed event IDs for deduplication (capped at 5,000 recent events)
  private processedEventIds: Set<string> = new Set();
  private maxHistory: number = 5000;

  // Track the highest cumulative like count reported per userId
  private userLastCumulative: Map<string, number> = new Map();

  /**
   * Resets all internal tracking (called on new session)
   */
  public reset(): void {
    this.processedEventIds.clear();
    this.userLastCumulative.clear();
  }

  /**
   * Processes an incoming like event from TikTok connector.
   * Returns the clean positive delta of raw taps to credit to the user, or 0 if duplicate/invalid.
   */
  public processTap(event: Tap2Event, isSessionActive: boolean): number {
    // 1. Must be during an ACTIVE live session
    if (!isSessionActive) {
      return 0;
    }

    const userId = (event.userId || '').trim();
    if (!userId) {
      return 0; // Invalid event without consistent userId
    }

    // 2. Prevent duplicate event ID
    if (event.eventId) {
      const cleanEventId = event.eventId.trim();
      if (this.processedEventIds.has(cleanEventId)) {
        return 0; // Duplicate event, reject
      }
      this.processedEventIds.add(cleanEventId);
      if (this.processedEventIds.size > this.maxHistory) {
        // Prune older items
        const first = this.processedEventIds.values().next().value;
        if (first) this.processedEventIds.delete(first);
      }
    }

    // 3. Handle cumulative vs delta likes
    if (event.isCumulative && typeof event.likeCount === 'number') {
      const incomingCumulative = Math.max(0, event.likeCount);
      const previous = this.userLastCumulative.get(userId) || 0;

      if (incomingCumulative <= previous) {
        // Not a new tap, same or stale update
        return 0;
      }

      const delta = incomingCumulative - previous;
      this.userLastCumulative.set(userId, incomingCumulative);
      return delta;
    }

    // If direct incremental delta
    const count = typeof event.likeCount === 'number' ? event.likeCount : 1;
    if (count <= 0) return 0;

    const currentCumulative = (this.userLastCumulative.get(userId) || 0) + count;
    this.userLastCumulative.set(userId, currentCumulative);

    return count;
  }
}
