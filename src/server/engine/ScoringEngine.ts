import { Player, Question } from '../types.js';

export interface ScoreCalculationResult {
  basePoints: number;
  speedBonus: number;
  streakBonus: number;
  specialBonus: number;
  totalPointsAwarded: number;
  newStreak: number;
}

export class ScoringEngine {
  /**
   * Base points for difficulties
   */
  public static readonly BASE_POINTS = {
    NORMAL: 100,
    HARD: 200,
    EXPERT: 300,
    SPECIAL: 250
  };

  public static readonly FIRST_ANSWER_BONUS = 50;
  public static readonly STREAK_3_BONUS = 100;
  public static readonly TAP2_RATE = 100; // 100 raw taps = 1 VP

  /**
   * Calculates points for a winning answer in a round
   */
  public static calculateQuizPoints(
    question: Question,
    currentStreak: number,
    isFirstCorrectAnswer: boolean = true
  ): ScoreCalculationResult {
    // 1. Base difficulty points
    let base = question.points || this.BASE_POINTS[question.difficulty] || 100;

    // 2. Bonus first answer (+50)
    const speedBonus = isFirstCorrectAnswer ? this.FIRST_ANSWER_BONUS : 0;

    // 3. Special challenge bonus (+250 if special category/difficulty)
    const specialBonus = question.difficulty === 'SPECIAL' || question.category === 'SPECIAL_CHALLENGE' ? 0 : 0;

    // 4. Streak calculation: if current streak + 1 is a multiple of 3, award +100 bonus
    const nextStreak = currentStreak + 1;
    const streakBonus = (nextStreak >= 3 && nextStreak % 3 === 0) ? this.STREAK_3_BONUS : 0;

    const totalAwarded = base + speedBonus + specialBonus + streakBonus;

    return {
      basePoints: base,
      speedBonus,
      streakBonus,
      specialBonus,
      totalPointsAwarded: totalAwarded,
      newStreak: nextStreak
    };
  }

  /**
   * Calculates Tap2 Points from raw tap count: FLOOR(Total Tap2 / 100)
   */
  public static calculateTap2Points(rawTap2: number): number {
    if (!rawTap2 || rawTap2 < 0) return 0;
    return Math.floor(rawTap2 / this.TAP2_RATE);
  }

  /**
   * Calculates Total VP: Quiz Point + Tap2 Point
   */
  public static calculateTotalVP(quizPoints: number, rawTap2: number): {
    quizPoints: number;
    rawTap2: number;
    tap2Points: number;
    totalVP: number;
  } {
    const tap2Points = this.calculateTap2Points(rawTap2);
    const totalVP = quizPoints + tap2Points;
    return {
      quizPoints,
      rawTap2,
      tap2Points,
      totalVP
    };
  }

  /**
   * Deterministic Tie-Breaker sorting according to Section 4:
   * 1. Total Viewer Point tertinggi
   * 2. Total Tap2 mentah tertinggi
   * 3. Quiz Point tertinggi
   * 4. Jumlah kemenangan soal terbanyak
   * 5. Fallback: Sudden Death / stable ordering
   */
  public static sortLeaderboard(players: Player[]): Player[] {
    return [...players].sort((a, b) => {
      // 1. Total Viewer Point
      if (b.totalVP !== a.totalVP) {
        return b.totalVP - a.totalVP;
      }
      // 2. Total Tap2 mentah
      if (b.rawTap2 !== a.rawTap2) {
        return b.rawTap2 - a.rawTap2;
      }
      // 3. Quiz Point
      if (b.quizPoints !== a.quizPoints) {
        return b.quizPoints - a.quizPoints;
      }
      // 4. Jumlah kemenangan soal terbanyak
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      // 5. Tie: preserve deterministic ID order (host can trigger sudden death)
      return a.id.localeCompare(b.id);
    });
  }
}

