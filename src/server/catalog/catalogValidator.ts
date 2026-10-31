import type { Question } from '../types.js';

export interface CatalogValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalQuestions: number;
    categoryCounts: Record<string, number>;
    difficultyCounts: Record<string, number>;
    totalVP: number;
  };
}

/**
 * Validates the question catalog to ensure:
 * 1. Zero duplicate question IDs
 * 2. Zero duplicate question prompt texts
 * 3. Unambiguous answers (non-empty expectedTitle and expectedArtist)
 * 4. Valid aliases with no empty or invalid tokens
 * 5. Difficulty and point consistency according to official rules:
 *    - NORMAL: 100 VP
 *    - HARD: 200 VP
 *    - EXPERT: 300 VP
 *    - SPECIAL: 250 VP
 */
export function validateQuestionCatalog(catalog: Question[]): CatalogValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();
  const seenPrompts = new Map<string, string>(); // normalized prompt -> questionId

  const categoryCounts: Record<string, number> = {};
  const difficultyCounts: Record<string, number> = {};
  let totalVP = 0;

  const EXPECTED_DIFFICULTY_POINTS: Record<string, number> = {
    NORMAL: 100,
    HARD: 200,
    EXPERT: 300,
    SPECIAL: 250
  };

  for (let i = 0; i < catalog.length; i++) {
    const q = catalog[i];
    const indexLabel = `Index ${i} (ID: ${q.id || 'MISSING'})`;

    // 1. Check ID
    if (!q.id || typeof q.id !== 'string' || q.id.trim() === '') {
      errors.push(`${indexLabel}: Missing or empty question ID.`);
    } else if (seenIds.has(q.id)) {
      errors.push(`${indexLabel}: Duplicate question ID "${q.id}".`);
    } else {
      seenIds.add(q.id);
    }

    // 2. Check Prompt
    if (!q.prompt || typeof q.prompt !== 'string' || q.prompt.trim() === '') {
      errors.push(`${indexLabel}: Missing or empty prompt.`);
    } else {
      const normPrompt = q.prompt.trim().toLowerCase();
      if (seenPrompts.has(normPrompt)) {
        errors.push(
          `${indexLabel}: Duplicate question content matching "${seenPrompts.get(normPrompt)}".`
        );
      } else {
        seenPrompts.set(normPrompt, q.id);
      }
    }

    // 3. Check Answers
    if (!q.expectedTitle || typeof q.expectedTitle !== 'string' || q.expectedTitle.trim() === '') {
      errors.push(`${indexLabel}: Missing or empty expectedTitle.`);
    }
    if (!q.expectedArtist || typeof q.expectedArtist !== 'string' || q.expectedArtist.trim() === '') {
      errors.push(`${indexLabel}: Missing or empty expectedArtist.`);
    }

    if (
      q.expectedTitle &&
      q.expectedArtist &&
      q.expectedTitle.trim().toLowerCase() === q.expectedArtist.trim().toLowerCase() &&
      q.category !== 'SPECIAL_CHALLENGE' // Guruh Gipsy is self-titled
    ) {
      warnings.push(
        `${indexLabel}: expectedTitle equals expectedArtist ("${q.expectedTitle}"). Verify this is intentional.`
      );
    }

    // 4. Check Aliases
    if (q.titleAliases) {
      if (!Array.isArray(q.titleAliases) || q.titleAliases.some((a) => typeof a !== 'string' || a.trim() === '')) {
        errors.push(`${indexLabel}: titleAliases contains invalid or empty items.`);
      }
    }
    if (q.artistAliases) {
      if (!Array.isArray(q.artistAliases) || q.artistAliases.some((a) => typeof a !== 'string' || a.trim() === '')) {
        errors.push(`${indexLabel}: artistAliases contains invalid or empty items.`);
      }
    }

    // 5. Check Points and Category
    if (typeof q.points !== 'number' || q.points <= 0) {
      errors.push(`${indexLabel}: Invalid points "${q.points}". Must be positive number.`);
    } else {
      totalVP += q.points;
      if (q.difficulty && EXPECTED_DIFFICULTY_POINTS[q.difficulty] !== undefined) {
        if (q.points !== EXPECTED_DIFFICULTY_POINTS[q.difficulty]) {
          errors.push(
            `${indexLabel}: Scoring integrity violation for "${q.difficulty}". Expected ${EXPECTED_DIFFICULTY_POINTS[q.difficulty]} VP, got ${q.points} VP.`
          );
        }
      }
    }

    if (q.category) {
      categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1;
    } else {
      errors.push(`${indexLabel}: Missing category.`);
    }

    if (q.difficulty) {
      difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;
    } else {
      errors.push(`${indexLabel}: Missing difficulty.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalQuestions: catalog.length,
      categoryCounts,
      difficultyCounts,
      totalVP
    }
  };
}
