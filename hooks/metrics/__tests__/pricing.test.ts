/**
 * Tests for pricing.ts
 *
 * Tests model pricing data and fallback behavior (EC003).
 */

import { describe, it, expect } from 'vitest';
import {
  getModelPricing,
  getKnownModels,
  hasExactPricing,
} from '../pricing';

describe('getModelPricing', () => {
  describe('exact matches', () => {
    it('should return exact pricing for claude-opus-4-5', () => {
      const result = getModelPricing('claude-opus-4-5');
      expect(result.isFallback).toBe(false);
      expect(result.detectedTier).toBeUndefined();
      expect(result.pricing).toEqual({
        model: 'claude-opus-4-5',
        inputPerMTok: 15.00,
        outputPerMTok: 75.00,
        cacheReadPerMTok: 1.50,
        cacheCreationPerMTok: 18.75,
      });
    });

    it('should return exact pricing for claude-sonnet-4-5', () => {
      const result = getModelPricing('claude-sonnet-4-5');
      expect(result.isFallback).toBe(false);
      expect(result.pricing.inputPerMTok).toBe(3.00);
      expect(result.pricing.outputPerMTok).toBe(15.00);
    });

    it('should return exact pricing for claude-haiku-3-5', () => {
      const result = getModelPricing('claude-haiku-3-5');
      expect(result.isFallback).toBe(false);
      expect(result.pricing.inputPerMTok).toBe(0.80);
      expect(result.pricing.outputPerMTok).toBe(4.00);
    });

    it('should return exact pricing for claude-3-5-sonnet-20241022', () => {
      const result = getModelPricing('claude-3-5-sonnet-20241022');
      expect(result.isFallback).toBe(false);
      expect(result.pricing.model).toBe('claude-3-5-sonnet-20241022');
    });

    it('should return exact pricing for all known models', () => {
      const knownModels = getKnownModels();
      expect(knownModels.length).toBeGreaterThan(0);

      knownModels.forEach(model => {
        const result = getModelPricing(model);
        expect(result.isFallback).toBe(false);
        expect(result.pricing.model).toBe(model);
      });
    });
  });

  describe('fallback behavior (EC003)', () => {
    it('should use opus tier for unknown opus model', () => {
      const result = getModelPricing('claude-opus-5');
      expect(result.isFallback).toBe(true);
      expect(result.detectedTier).toBe('opus');
      expect(result.pricing.inputPerMTok).toBe(15.00);
      expect(result.pricing.outputPerMTok).toBe(75.00);
    });

    it('should use sonnet tier for unknown sonnet model', () => {
      const result = getModelPricing('claude-sonnet-5');
      expect(result.isFallback).toBe(true);
      expect(result.detectedTier).toBe('sonnet');
      expect(result.pricing.inputPerMTok).toBe(3.00);
      expect(result.pricing.outputPerMTok).toBe(15.00);
    });

    it('should use haiku tier for unknown haiku model', () => {
      const result = getModelPricing('claude-haiku-4');
      expect(result.isFallback).toBe(true);
      expect(result.detectedTier).toBe('haiku');
      expect(result.pricing.inputPerMTok).toBe(0.80);
      expect(result.pricing.outputPerMTok).toBe(4.00);
    });

    it('should use default tier for completely unknown model', () => {
      const result = getModelPricing('unknown-model-xyz');
      expect(result.isFallback).toBe(true);
      expect(result.detectedTier).toBe('default');
      expect(result.pricing.inputPerMTok).toBe(3.00);
      expect(result.pricing.outputPerMTok).toBe(15.00);
    });

    it('should be case-insensitive for tier detection', () => {
      const opusResult = getModelPricing('CLAUDE-OPUS-FUTURE');
      expect(opusResult.detectedTier).toBe('opus');

      const sonnetResult = getModelPricing('Custom-SONNET-Model');
      expect(sonnetResult.detectedTier).toBe('sonnet');

      const haikuResult = getModelPricing('test-HAIKU-v2');
      expect(haikuResult.detectedTier).toBe('haiku');
    });

    it('should prioritize opus over sonnet in model name', () => {
      // Edge case: model name contains both
      const result = getModelPricing('claude-opus-sonnet-hybrid');
      expect(result.detectedTier).toBe('opus');
    });
  });

  describe('pricing consistency', () => {
    it('should have cache read pricing as 10% of input', () => {
      const models = getKnownModels();
      models.forEach(model => {
        const { pricing } = getModelPricing(model);
        expect(pricing.cacheReadPerMTok).toBeCloseTo(pricing.inputPerMTok * 0.1, 5);
      });
    });

    it('should have cache creation pricing as 125% of input', () => {
      const models = getKnownModels();
      models.forEach(model => {
        const { pricing } = getModelPricing(model);
        expect(pricing.cacheCreationPerMTok).toBeCloseTo(pricing.inputPerMTok * 1.25, 5);
      });
    });
  });
});

describe('getKnownModels', () => {
  it('should return array of model identifiers', () => {
    const models = getKnownModels();
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
  });

  it('should include all specified models', () => {
    const models = getKnownModels();
    const expectedModels = [
      'claude-opus-4-5',
      'claude-opus-4',
      'claude-sonnet-4-5',
      'claude-sonnet-4',
      'claude-3-5-sonnet-20241022',
      'claude-haiku-3-5',
      'claude-3-5-haiku-20241022',
    ];

    expectedModels.forEach(expected => {
      expect(models).toContain(expected);
    });
  });
});

describe('hasExactPricing', () => {
  it('should return true for known models', () => {
    expect(hasExactPricing('claude-opus-4-5')).toBe(true);
    expect(hasExactPricing('claude-sonnet-4-5')).toBe(true);
    expect(hasExactPricing('claude-haiku-3-5')).toBe(true);
  });

  it('should return false for unknown models', () => {
    expect(hasExactPricing('claude-opus-5')).toBe(false);
    expect(hasExactPricing('unknown-model')).toBe(false);
    expect(hasExactPricing('test-model-123')).toBe(false);
  });

  it('should be case-sensitive', () => {
    expect(hasExactPricing('CLAUDE-OPUS-4-5')).toBe(false);
    expect(hasExactPricing('claude-opus-4-5')).toBe(true);
  });
});

describe('pricing values', () => {
  it('should have correct opus-4-5 pricing', () => {
    const { pricing } = getModelPricing('claude-opus-4-5');
    expect(pricing.inputPerMTok).toBe(15.00);
    expect(pricing.outputPerMTok).toBe(75.00);
    expect(pricing.cacheReadPerMTok).toBe(1.50);
    expect(pricing.cacheCreationPerMTok).toBe(18.75);
  });

  it('should have correct opus-4 pricing', () => {
    const { pricing } = getModelPricing('claude-opus-4');
    expect(pricing.inputPerMTok).toBe(15.00);
    expect(pricing.outputPerMTok).toBe(75.00);
    expect(pricing.cacheReadPerMTok).toBe(1.50);
    expect(pricing.cacheCreationPerMTok).toBe(18.75);
  });

  it('should have correct sonnet-4-5 pricing', () => {
    const { pricing } = getModelPricing('claude-sonnet-4-5');
    expect(pricing.inputPerMTok).toBe(3.00);
    expect(pricing.outputPerMTok).toBe(15.00);
    expect(pricing.cacheReadPerMTok).toBe(0.30);
    expect(pricing.cacheCreationPerMTok).toBe(3.75);
  });

  it('should have correct sonnet-4 pricing', () => {
    const { pricing } = getModelPricing('claude-sonnet-4');
    expect(pricing.inputPerMTok).toBe(3.00);
    expect(pricing.outputPerMTok).toBe(15.00);
    expect(pricing.cacheReadPerMTok).toBe(0.30);
    expect(pricing.cacheCreationPerMTok).toBe(3.75);
  });

  it('should have correct 3-5-sonnet-20241022 pricing', () => {
    const { pricing } = getModelPricing('claude-3-5-sonnet-20241022');
    expect(pricing.inputPerMTok).toBe(3.00);
    expect(pricing.outputPerMTok).toBe(15.00);
    expect(pricing.cacheReadPerMTok).toBe(0.30);
    expect(pricing.cacheCreationPerMTok).toBe(3.75);
  });

  it('should have correct haiku-3-5 pricing', () => {
    const { pricing } = getModelPricing('claude-haiku-3-5');
    expect(pricing.inputPerMTok).toBe(0.80);
    expect(pricing.outputPerMTok).toBe(4.00);
    expect(pricing.cacheReadPerMTok).toBe(0.08);
    expect(pricing.cacheCreationPerMTok).toBe(1.00);
  });

  it('should have correct 3-5-haiku-20241022 pricing', () => {
    const { pricing } = getModelPricing('claude-3-5-haiku-20241022');
    expect(pricing.inputPerMTok).toBe(0.80);
    expect(pricing.outputPerMTok).toBe(4.00);
    expect(pricing.cacheReadPerMTok).toBe(0.08);
    expect(pricing.cacheCreationPerMTok).toBe(1.00);
  });
});
