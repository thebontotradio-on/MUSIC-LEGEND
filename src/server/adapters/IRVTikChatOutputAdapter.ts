import type { RVTikChatOutputStatus, RVTikChatCommandRecord, RVTikChatOutputMode } from '../types.js';

export interface IRVTikChatOutputAdapter {
  getStatus(): RVTikChatOutputStatus;
  setMode(mode: RVTikChatOutputMode): void;
  setAutoSend(enabled: boolean): void;
  setTargetWindowPattern(pattern: string): void;
  setBridgeEndpoint(endpoint: string): void;
  setAuthorizedSenders?(senders: string[]): void;
  formatCommand(title: string, artist: string): string;
  prepareCommand(title: string, artist: string, winnerNickname?: string): RVTikChatCommandRecord;
  dispatchCommand(commandId?: string, forceMode?: RVTikChatOutputMode): Promise<RVTikChatCommandRecord>;
  verifyIncomingMessage(message: string, username: string, timestamp?: number): boolean;
  clearHistory(): void;
}

