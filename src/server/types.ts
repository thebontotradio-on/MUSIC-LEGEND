export type StageType = 'IDLE' | 'GUESSING' | 'WINNER' | 'CHAMPION';

export type SessionState = 'IDLE' | 'ACTIVE' | 'PAUSED' | 'ENDED';

export type QuestionCategory =
  | 'TEBAK_JUDUL'
  | 'TEBAK_PENYANYI'
  | 'TEKA_TEKI'
  | 'TRIVIA'
  | 'TEBAK_ERA'
  | 'EMOJI_PUZZLE'
  | 'NOSTALGIA_80S'
  | 'NOSTALGIA_90S'
  | 'NOSTALGIA_2000S'
  | 'PILIHAN_GANDA'
  | 'SPECIAL_CHALLENGE'
  | 'TEBAK_GENRE'
  | 'TEBAK_SOUNDTRACK'
  | 'TEBAK_INSTRUMEN'
  | 'TEBAK_PETUNJUK'
  | 'MUSIK_DAERAH';

export type QuestionDifficulty = 'NORMAL' | 'HARD' | 'EXPERT' | 'SPECIAL';

export interface QuestionUsageRecord {
  questionId: string;
  lastUsedAt: number;
  timesUsed: number;
  lastSessionId?: string;
}

export interface CatalogStats {
  totalQuestions: number;
  categories: Record<string, number>;
  difficulties: Record<string, number>;
  usedInSession: number;
  totalHistoricalUsed: number;
}

export interface Question {
  id: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  prompt: string;
  hint?: string;
  expectedTitle: string;
  expectedArtist: string;
  titleAliases?: string[];
  artistAliases?: string[];
  options?: string[]; // for PILIHAN_GANDA
  year?: number;
  releaseEra?: string;
  points: number;
}

export interface Player {
  id: string; // unique viewer id
  nickname: string;
  avatarUrl?: string;
  quizPoints: number;
  rawTap2: number;
  tap2Points: number;
  totalVP: number;
  wins: number;
  streak: number;
  lastWinTimestamp?: number;
}

export interface RoundResult {
  roundNumber: number;
  question: Question;
  winner?: {
    player: Player;
    pointsAwarded: number;
    breakdown: {
      base: number;
      speedBonus: number;
      streakBonus: number;
      specialBonus: number;
    };
    rawComment: string;
    answeredAt: number;
  };
  revealedWithoutWinner: boolean;
  startedAt: number;
  endedAt?: number;
}

export interface SafeZoneConfig {
  x: number; // percentage from left, e.g. 5
  y: number; // percentage from top, e.g. 8
  width: number; // percentage, e.g. 90
  height: number; // percentage, e.g. 55
  margin: number; // px, e.g. 24
  chatExclusionHeight: number; // percentage of bottom screen reserved for TikTok comments, e.g. 35
}

export type ChampionRewardStatus = 'ELIGIBLE' | 'REDEEMED';

export interface ChampionRewardRecord {
  id: string; // e.g. "rew_sess123_rank1"
  sessionId: string;
  rank: 1 | 2 | 3;
  userId: string;
  nickname: string;
  totalVP: number;
  rewardTitle: string; // "1 Free Request Song"
  status: ChampionRewardStatus; // 'ELIGIBLE' | 'REDEEMED'
  awardedAt: number;
  redeemedAt?: number;
  requestedSong?: string; // Optional track requested by champion
  notes?: string;
}

export interface SessionArchiveSummary {
  id: string;
  sessionCode: string;
  startedAt: number;
  endedAt: number;
  totalRounds: number;
  totalParticipants: number;
  champion: {
    nickname: string;
    totalVP: number;
    quizPoints: number;
    tap2Points: number;
  } | null;
  top3Champions?: ChampionRewardRecord[];
  championRewards?: ChampionRewardRecord[];
  players: Player[];
  rounds: RoundResult[];
}

export interface PlaybackRequest {
  id: string;
  songTitle: string;
  artist: string;
  requestedAt: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  errorMessage?: string;
}

export interface PlaybackBridgeStatus {
  connected: boolean;
  mode: 'MOCK' | 'BONTOT_STUDIO_BRIDGE' | 'RVTIK_CHAT_OUTPUT';
  endpoint: string;
  lastPingTimestamp?: number;
  recentCalls: PlaybackRequest[];
}

export type RVTikChatOutputMode = 'CLIPBOARD_ASSIST' | 'WINDOW_AUTOMATION' | 'DIRECT_BRIDGE' | 'SIMULATION';
export type RVTikChatCommandStatus = 'PENDING' | 'SENT' | 'COPIED_TO_CLIPBOARD' | 'FAILED' | 'NOT_VERIFIED';

export interface RVTikChatCommandRecord {
  id: string;
  command: string; // e.g. "!play Dewa 19 Kangen"
  songTitle: string;
  artist: string;
  winnerNickname?: string;
  mode: RVTikChatOutputMode;
  status: RVTikChatCommandStatus;
  sentAt: number;
  errorMessage?: string;
  verifiedInChat: boolean;
}

export interface RVTikChatOutputStatus {
  enabled: boolean;
  autoSendEnabled: boolean;
  activeMode: RVTikChatOutputMode;
  targetWindowPattern: string;
  recentCommands: RVTikChatCommandRecord[];
  lastCommand?: RVTikChatCommandRecord;
}

export interface TikTokConnectorStatus {
  connected: boolean;
  mode: 'SIMULATION' | 'LIVE_CONNECTOR';
  liveUsername: string;
  activeViewersCount: number;
  totalLikesReceived: number;
  totalCommentsProcessed: number;
  lastEventTimestamp?: number;
}

export interface GameState {
  stage: StageType;
  sessionState: SessionState;
  sessionId: string;
  roundNumber: number;
  currentQuestion: Question | null;
  currentRound: RoundResult | null;
  isQuestionLocked: boolean; // Atomic lock
  players: Record<string, Player>;
  leaderboard: Player[];
  top3Champions?: ChampionRewardRecord[];
  championRewards?: ChampionRewardRecord[];
  podiumVisible?: boolean;
  safeZone: SafeZoneConfig;
  audio: {
    bgmPlaying: boolean;
    bgmVolume: number;
  };
  playbackStatus: PlaybackBridgeStatus;
  tiktokStatus: TikTokConnectorStatus;
  rvtikChatStatus?: RVTikChatOutputStatus;
  announcement?: string;
}

