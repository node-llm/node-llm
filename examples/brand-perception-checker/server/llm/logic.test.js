import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateAlignment, createResilientIntrinsicFallback } from './logic.js';

describe('Brand Auditor Logic', () => {

  test('calculateAlignment - Consensus Positive', () => {
    const aiPerception = [
      { sentiment: 'positive', error: false },
      { sentiment: 'positive', error: false },
      { sentiment: 'neutral', error: false }
    ];
    const marketAudit = { risk_signals: [] };
    
    const result = calculateAlignment(aiPerception, marketAudit);
    assert.strictEqual(result.consensusVibe, 'Positive');
    assert.strictEqual(result.divergence, 'Medium'); // positive & neutral = 2 types
  });

  test('calculateAlignment - Consensus Neutral', () => {
    const aiPerception = [
      { sentiment: 'neutral', error: false },
      { sentiment: 'negative', error: false }
    ];
    const marketAudit = { risk_signals: [] };
    
    const result = calculateAlignment(aiPerception, marketAudit);
    assert.strictEqual(result.consensusVibe, 'Neutral');
  });

  test('calculateAlignment - High Divergence', () => {
    const aiPerception = [
      { sentiment: 'positive', error: false },
      { sentiment: 'neutral', error: false },
      { sentiment: 'negative', error: false }
    ];
    
    const result = calculateAlignment(aiPerception, {});
    assert.strictEqual(result.divergence, 'High');
  });

  test('calculateAlignment - Handles Errors Gracefully', () => {
    const aiPerception = [
      { sentiment: 'positive', error: false },
      { sentiment: 'unknown', error: true } // Should be ignored
    ];
    
    const result = calculateAlignment(aiPerception, {});
    assert.strictEqual(result.consensusVibe, 'Positive');
    assert.strictEqual(result.divergence, 'Low'); // Only 1 valid sentiment
  });

  test('calculateAlignment - Identifies Key Gap', () => {
    const marketAudit = { risk_signals: ['Competitor pricing pressure'] };
    const result = calculateAlignment([], marketAudit);
    assert.strictEqual(result.keyGap, 'Competitor pricing pressure');
  });

  test('createResilientIntrinsicFallback', () => {
    const fallback = createResilientIntrinsicFallback('openai', 'gpt-4o', 'Timeout');
    assert.strictEqual(fallback.error, true);
    assert.strictEqual(fallback.risk_mentions[0], 'Timeout');
    assert.strictEqual(fallback.sentiment, 'Unknown');
  });
});
