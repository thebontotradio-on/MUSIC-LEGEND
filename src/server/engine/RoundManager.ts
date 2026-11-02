import { Question, RoundResult, CatalogStats, QuestionCategory, QuestionDifficulty } from '../types.js';
import { QUESTION_CATALOG } from '../catalog/questions.js';

export class RoundManager {
  private questions: Question[] = [...QUESTION_CATALOG];
  private currentRound: RoundResult | null = null;
  private roundCount: number = 0;
  private isLocked: boolean = false;

  // Question Intelligence & Anti-Repetition State
  private usedInSession: Set<string> = new Set();
  private persistentHistoryIds: Set<string> = new Set();
  private lastCategory: string | null = null;
  private lastArtist: string | null = null;

  constructor(customCatalog?: Question[], initialHistoryIds?: string[]) {
    if (customCatalog && customCatalog.length > 0) {
      this.questions = [...customCatalog];
    }
    if (initialHistoryIds && initialHistoryIds.length > 0) {
      this.persistentHistoryIds = new Set(initialHistoryIds);
    }
  }

  public reset(): void {
    this.currentRound = null;
    this.roundCount = 0;
    this.isLocked = false;
    this.usedInSession.clear();
    this.lastCategory = null;
    this.lastArtist = null;
  }

  public setHistoryQuestionIds(ids: string[]): void {
    this.persistentHistoryIds = new Set(ids);
  }

  public addQuestions(newQuestions: Question[]): void {
    for (const q of newQuestions) {
      if (!this.questions.some(existing => existing.id === q.id)) {
        this.questions.push(q);
      }
    }
  }

  public getUsedInSession(): string[] {
    return Array.from(this.usedInSession);
  }

  public getCatalogStats(): CatalogStats {
    const categories: Record<string, number> = {};
    const difficulties: Record<string, number> = {};
    for (const q of this.questions) {
      categories[q.category] = (categories[q.category] || 0) + 1;
      difficulties[q.difficulty] = (difficulties[q.difficulty] || 0) + 1;
    }
    return {
      totalQuestions: this.questions.length,
      categories,
      difficulties,
      usedInSession: this.usedInSession.size,
      totalHistoricalUsed: this.persistentHistoryIds.size
    };
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
   * Integrates Anti-Repetition and Question Intelligence
   */
  public startNewRound(
    specificQuestionId?: string,
    isBonus: boolean = false,
    filter?: { category?: QuestionCategory; difficulty?: QuestionDifficulty }
  ): RoundResult {
    let question: Question;

    if (specificQuestionId) {
      const found = this.questions.find(q => q.id === specificQuestionId);
      if (!found) {
        throw new Error(`Question ${specificQuestionId} not found in catalog.`);
      }
      question = found;
    } else {
      question = this.selectSmartNextQuestion(filter);
    }

    // Mark as used in session and in history
    this.usedInSession.add(question.id);
    this.persistentHistoryIds.add(question.id);
    this.lastCategory = question.category;
    this.lastArtist = question.expectedArtist;

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
   * Smart question selection adhering to Anti-Repetition and Category/Era rotation
   */
  private selectSmartNextQuestion(filter?: { category?: QuestionCategory; difficulty?: QuestionDifficulty }): Question {
    // 1. Base candidates matching filter if provided
    let pool = this.questions;
    if (filter?.category) {
      const catFiltered = pool.filter(q => q.category === filter.category);
      if (catFiltered.length > 0) pool = catFiltered;
    }
    if (filter?.difficulty) {
      const diffFiltered = pool.filter(q => q.difficulty === filter.difficulty);
      if (diffFiltered.length > 0) pool = diffFiltered;
    }

    // 2. Candidates not yet used in current session
    let available = pool.filter(q => !this.usedInSession.has(q.id));

    // If all questions in the pool have been used in current session, recycle session history
    // while excluding the immediately previous question to prevent immediate repeat
    if (available.length === 0) {
      const lastId = this.currentRound?.question?.id;
      this.usedInSession.clear();
      available = pool.filter(q => q.id !== lastId);
      if (available.length === 0) {
        available = pool;
      }
    }

    // 3. Prioritize questions not in persistent history across sessions
    const neverUsedHistory = available.filter(q => !this.persistentHistoryIds.has(q.id));
    const candidateGroup = neverUsedHistory.length > 0 ? neverUsedHistory : available;

    // 4. Question variety: prefer questions with different category and artist than last question
    if (candidateGroup.length > 1 && (this.lastCategory || this.lastArtist)) {
      const rotated = candidateGroup.filter(q =>
        q.category !== this.lastCategory && q.expectedArtist !== this.lastArtist
      );
      if (rotated.length > 0) {
        return rotated[Math.floor(Math.random() * rotated.length)];
      }

      const diffCategory = candidateGroup.filter(q => q.category !== this.lastCategory);
      if (diffCategory.length > 0) {
        return diffCategory[Math.floor(Math.random() * diffCategory.length)];
      }
    }

    // 5. Select from candidates
    return candidateGroup[Math.floor(Math.random() * candidateGroup.length)];
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
