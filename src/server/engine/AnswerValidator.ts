import { Question } from '../types.js';

export interface AnswerValidationResult {
  isValidCommand: boolean;
  isCorrect: boolean;
  cleanInput: string;
  matchedTitle?: string;
  matchedArtist?: string;
  matchScore: number; // 1.0 = exact match
  reason?: string;
}

/**
 * Computes the Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Optimize memory with 2 rows
  let prevRow = new Array(n + 1);
  let currRow = new Array(n + 1);

  for (let j = 0; j <= n; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    const aChar = a[i - 1];
    for (let j = 1; j <= n; j++) {
      const bChar = b[j - 1];
      const cost = aChar === bChar ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1, // insertion
        prevRow[j] + 1, // deletion
        prevRow[j - 1] + cost // substitution
      );
    }
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[n];
}

/**
 * Normalizes text: lowercase, removes punctuation/diacritics, compresses whitespace.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/gi, ' ') // replace punctuation/symbols with space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks similarity ratio between 0.0 and 1.0 based on Levenshtein distance
 */
export function calculateSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1 - dist / maxLen);
}

export class AnswerValidator {
  /**
   * Validates a viewer comment against the current active question.
   * Format required: !jawab <judul> <penyanyi> (or inverted <penyanyi> <judul>)
   */
  public static validate(comment: string, question: Question): AnswerValidationResult {
    const rawTrimmed = (comment || '').trim();

    // Must start with !jawab command (case-insensitive)
    const commandMatch = rawTrimmed.match(/^!jawab\s+(.+)$/i);
    if (!commandMatch) {
      return {
        isValidCommand: false,
        isCorrect: false,
        cleanInput: '',
        matchScore: 0,
        reason: 'COMMAND_SYNTAX_ERROR: Harus diawali !jawab <judul lagu> <penyanyi>'
      };
    }

    const userInput = normalizeText(commandMatch[1]);
    if (!userInput || userInput.length < 2) {
      return {
        isValidCommand: true,
        isCorrect: false,
        cleanInput: userInput,
        matchScore: 0,
        reason: 'ANSWER_TOO_SHORT'
      };
    }

    // Collect all valid title and artist variations
    const titles = [question.expectedTitle, ...(question.titleAliases || [])].map(normalizeText);
    const artists = [question.expectedArtist, ...(question.artistAliases || [])].map(normalizeText);

    let bestScore = 0;
    let matchedTitle = '';
    let matchedArtist = '';

    for (const title of titles) {
      for (const artist of artists) {
        // Pattern 1: Title + Artist ("separuh aku noah")
        const pattern1 = `${title} ${artist}`;
        // Pattern 2: Artist + Title ("noah separuh aku")
        const pattern2 = `${artist} ${title}`;

        // 1. Exact match test
        if (userInput === pattern1 || userInput === pattern2) {
          return {
            isValidCommand: true,
            isCorrect: true,
            cleanInput: userInput,
            matchedTitle: title,
            matchedArtist: artist,
            matchScore: 1.0
          };
        }

        // 2. Similarity test for Pattern 1
        const sim1 = calculateSimilarity(userInput, pattern1);
        if (sim1 > bestScore) {
          bestScore = sim1;
          matchedTitle = title;
          matchedArtist = artist;
        }

        // 3. Similarity test for Pattern 2
        const sim2 = calculateSimilarity(userInput, pattern2);
        if (sim2 > bestScore) {
          bestScore = sim2;
          matchedTitle = title;
          matchedArtist = artist;
        }

        // 4. Component-wise fuzzy check (tolerant to light typo in either title or artist)
        const componentResult = this.checkComponentsFuzzy(userInput, title, artist);
        if (componentResult.isMatch && componentResult.score > bestScore) {
          bestScore = componentResult.score;
          matchedTitle = title;
          matchedArtist = artist;
        }
      }
    }

    // Strict threshold: tolerance for light typos (80% similarity or higher),
    // rejecting answers that are too far from the truth.
    const ACCEPTANCE_THRESHOLD = 0.82;

    if (bestScore >= ACCEPTANCE_THRESHOLD) {
      return {
        isValidCommand: true,
        isCorrect: true,
        cleanInput: userInput,
        matchedTitle,
        matchedArtist,
        matchScore: bestScore
      };
    }

    return {
      isValidCommand: true,
      isCorrect: false,
      cleanInput: userInput,
      matchScore: bestScore,
      reason: bestScore > 0.5 ? 'NEAR_MISS: Jawaban kurang tepat' : 'INCORRECT: Jawaban salah'
    };
  }

  /**
   * Evaluates if user's tokens match title and artist components with fuzzy tolerance
   */
  private static checkComponentsFuzzy(
    userInput: string,
    expectedTitle: string,
    expectedArtist: string
  ): { isMatch: boolean; score: number } {
    const inputWords = userInput.split(' ').filter(Boolean);
    const titleWords = expectedTitle.split(' ').filter(Boolean);
    const artistWords = expectedArtist.split(' ').filter(Boolean);

    // If total word count is wildly different, reject
    const expectedWordCount = titleWords.length + artistWords.length;
    if (Math.abs(inputWords.length - expectedWordCount) > 2) {
      return { isMatch: false, score: 0 };
    }

    // Try separating input into (first N words = title, rest = artist) and vice-versa
    const permutations = [
      { tWords: inputWords.slice(0, titleWords.length), aWords: inputWords.slice(titleWords.length) },
      { tWords: inputWords.slice(artistWords.length), aWords: inputWords.slice(0, artistWords.length) }
    ];

    let maxScore = 0;

    for (const { tWords, aWords } of permutations) {
      if (tWords.length === 0 || aWords.length === 0) continue;
      const tCandidate = tWords.join(' ');
      const aCandidate = aWords.join(' ');

      const tSim = calculateSimilarity(tCandidate, expectedTitle);
      const aSim = calculateSimilarity(aCandidate, expectedArtist);

      // Light typo tolerance: both title and artist should have good similarity (e.g. >= 0.75 each)
      // and overall average >= 0.82
      const avgSim = (tSim * 0.6) + (aSim * 0.4);
      if (tSim >= 0.75 && aSim >= 0.70 && avgSim > maxScore) {
        maxScore = avgSim;
      }
    }

    return {
      isMatch: maxScore >= 0.82,
      score: maxScore
    };
  }
}

