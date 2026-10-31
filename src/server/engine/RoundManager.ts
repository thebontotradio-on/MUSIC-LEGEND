import { Question, RoundResult } from '../types.js';
import { QUESTION_CATALOG } from '../catalog/questions.js';

export class RoundManager {
  private questions: Question[] = [...QUESTION_CATALOG];
  private currentQuestionIndex: number = -1;
  private currentRound: RoundResult | null = null;
  private roundCount: number = 0;
  private isLocked: boolean = false;

  constructor(customCatalog?: Question[]) {
    if (customCatalog && customCatalog.length > 0) {
      this.questions = [...customCatalog];
    }
  }

  public reset(): void {
    this.currentQuestionIndex = -1;
    this.currentRound = null;
    this.roundCount = 0;
    this.isLocked = false;
  }

  public isQuestionLocked(): boolean {
    return this.isLocked;
  }

  public setLocked(locked: boolean): void {
    this.isLocked = locked;
  }

  public getCurrentRound(): RoundResult | null {
    return this.currentRound;
  }

  public getCurrentQuestion(): Question | null {
    return this.currentRound ? this.currentRound.question : null;
  }

  public getRoundNumber(): number {
    return this.roundCount;
  }

  /**
   * Starts a new round with the next question (or specific question)
   */
  public startNewRound(specificQuestionId?: string, isBonus: boolean = false): RoundResult {
    let question: Question;

    if (specificQuestionId) {
      const found = this.questions.find(q => q.id === specificQuestionId);
      if (!found) {
        throw new Error(`Question ${specificQuestionId} not found in catalog.`);
      }
      question = found;
    } else {
      this.currentQuestionIndex = (this.currentQuestionIndex + 1) % this.questions.length;
      question = this.questions[this.currentQuestionIndex];
    }

    if (isBonus) {
      // Create bonus version of question with extra points
      question = {
        ...question,
        points: question.points + 100,
        prompt: `⭐ BONUS ROUND (+100 VP): ${question.prompt}`
      };
    }

    this.roundCount += 1;
    this.isLocked = false;

    this.currentRound = {
      roundNumber: this.roundCount,
      question,
      revealedWithoutWinner: false,
      startedAt: Date.now()
    };

    return this.currentRound;
  }

  /**
   * Atomic lock on winning answer.
   * Returns true if successfully claimed by this winner, false if already locked.
   */
  public lockWinner(winnerData: NonNullable<RoundResult['winner']>): boolean {
    if (this.isLocked || !this.currentRound) {
      return false; // Already locked or no active round
    }

    this.isLocked = true;
    this.currentRound.winner = winnerData;
    this.currentRound.endedAt = Date.now();
    return true;
  }

  /**
   * Host reveals answer manually without any winner awarding points
   */
  public revealAnswer(): void {
    if (this.currentRound) {
      this.isLocked = true;
      this.currentRound.revealedWithoutWinner = true;
      this.currentRound.endedAt = Date.now();
    }
  }

  /**
   * Ends current round
   */
  public endRound(): void {
    if (this.currentRound && !this.currentRound.endedAt) {
      this.currentRound.endedAt = Date.now();
    }
    this.isLocked = true;
  }
}

