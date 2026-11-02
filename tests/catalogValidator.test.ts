import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { QUESTION_CATALOG } from '../src/server/catalog/questions.js';
import { validateQuestionCatalog } from '../src/server/catalog/catalogValidator.js';

describe('Standalone QUESTION_CATALOG validation', () => {
  test('validates zero duplicates and catalog integrity across 85 questions', () => {
    const report = validateQuestionCatalog(QUESTION_CATALOG);
    assert.equal(report.isValid, true, `Validation failed: ${report.errors.join(', ')}`);
    assert.equal(report.errors.length, 0);
    assert.ok(report.stats.totalQuestions >= 85);
  });
});
