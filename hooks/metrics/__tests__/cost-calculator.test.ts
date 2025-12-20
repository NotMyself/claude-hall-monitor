/**
 * Tests for CostCalculator
 *
 * Implements F009 test cases following TDD workflow.
 */

import { describe, it, expect, vi } from 'vitest';
import { CostCalculator } from '../cost-calculator';
import type { TokenUsage } from '../types';

describe('CostCalculator', () => {
  const calculator = new CostCalculator();

  describe('calculate', () => {
    it('calculates input tokens cost correctly', () => {
      const tokens: TokenUsage = {
        input_tokens: 1_000_000,
        output_tokens: 0,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      };

      const result = calculator.calculate(tokens, 'claude-sonnet-4-5');

      // Sonnet: $3 per million input tokens
      expect(result.input_cost_usd).toBe(3.00);
      expect(result.output_cost_usd).toBe(0);
      expect(result.cache_read_cost_usd).toBe(0);
      expect(result.cache_creation_cost_usd).toBe(0);
    });

    it('calculates output tokens cost correctly', () => {
      const tokens: TokenUsage = {
        input_tokens: 0,
        output_tokens: 2_000_000,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      };

      const result = calculator.calculate(tokens, 'claude-sonnet-4-5');

      // Sonnet: $15 per million output tokens
      // 2M tokens = 2 * $15 = $30
      expect(result.input_cost_usd).toBe(0);
      expect(result.output_cost_usd).toBe(30.00);
      expect(result.cache_read_cost_usd).toBe(0);
      expect(result.cache_creation_cost_usd).toBe(0);
    });

    it('calculates cache read cost correctly', () => {
      const tokens: TokenUsage = {
        input_tokens: 0,
        output_tokens: 0,
        cache_read_input_tokens: 10_000_000,
        cache_creation_input_tokens: 0,
      };

      const result = calculator.calculate(tokens, 'claude-opus-4-5');

      // Opus: $1.50 per million cache read tokens
      // 10M tokens = 10 * $1.50 = $15
      expect(result.input_cost_usd).toBe(0);
      expect(result.output_cost_usd).toBe(0);
      expect(result.cache_read_cost_usd).toBe(15.00);
      expect(result.cache_creation_cost_usd).toBe(0);
    });

    it('calculates cache creation cost correctly', () => {
      const tokens: TokenUsage = {
        input_tokens: 0,
        output_tokens: 0,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 500_000,
      };

      const result = calculator.calculate(tokens, 'claude-haiku-3-5');

      // Haiku: $1.00 per million cache creation tokens
      // 0.5M tokens = 0.5 * $1.00 = $0.50
      expect(result.input_cost_usd).toBe(0);
      expect(result.output_cost_usd).toBe(0);
      expect(result.cache_read_cost_usd).toBe(0);
      expect(result.cache_creation_cost_usd).toBe(0.50);
    });

    it('total equals sum of components', () => {
      const tokens: TokenUsage = {
        input_tokens: 1_000_000,
        output_tokens: 500_000,
        cache_read_input_tokens: 2_000_000,
        cache_creation_input_tokens: 1_000_000,
      };

      const result = calculator.calculate(tokens, 'claude-sonnet-4-5');

      // Sonnet pricing:
      // Input: 1M * $3 = $3.00
      // Output: 0.5M * $15 = $7.50
      // Cache read: 2M * $0.30 = $0.60
      // Cache creation: 1M * $3.75 = $3.75
      // Total: $14.85
      expect(result.input_cost_usd).toBe(3.00);
      expect(result.output_cost_usd).toBe(7.50);
      expect(result.cache_read_cost_usd).toBe(0.60);
      expect(result.cache_creation_cost_usd).toBe(3.75);
      expect(result.total_cost_usd).toBe(14.85);
    });

    it('known models use exact pricing', () => {
      const tokens: TokenUsage = {
        input_tokens: 1_000_000,
        output_tokens: 1_000_000,
        cache_read_input_tokens: 1_000_000,
        cache_creation_input_tokens: 1_000_000,
      };

      // Test Opus
      const opusResult = calculator.calculate(tokens, 'claude-opus-4-5');
      expect(opusResult.input_cost_usd).toBe(15.00);
      expect(opusResult.output_cost_usd).toBe(75.00);
      expect(opusResult.cache_read_cost_usd).toBe(1.50);
      expect(opusResult.cache_creation_cost_usd).toBe(18.75);
      expect(opusResult.total_cost_usd).toBe(110.25);

      // Test Sonnet
      const sonnetResult = calculator.calculate(tokens, 'claude-sonnet-4-5');
      expect(sonnetResult.input_cost_usd).toBe(3.00);
      expect(sonnetResult.output_cost_usd).toBe(15.00);
      expect(sonnetResult.cache_read_cost_usd).toBe(0.30);
      expect(sonnetResult.cache_creation_cost_usd).toBe(3.75);
      expect(sonnetResult.total_cost_usd).toBe(22.05);

      // Test Haiku
      const haikuResult = calculator.calculate(tokens, 'claude-haiku-3-5');
      expect(haikuResult.input_cost_usd).toBe(0.80);
      expect(haikuResult.output_cost_usd).toBe(4.00);
      expect(haikuResult.cache_read_cost_usd).toBe(0.08);
      expect(haikuResult.cache_creation_cost_usd).toBe(1.00);
      expect(haikuResult.total_cost_usd).toBe(5.88);
    });

    it('unknown models use fallback (EC003)', () => {
      const tokens: TokenUsage = {
        input_tokens: 1_000_000,
        output_tokens: 1_000_000,
        cache_read_input_tokens: 1_000_000,
        cache_creation_input_tokens: 1_000_000,
      };

      // Spy on console.warn
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Test unknown opus-tier model
      const opusResult = calculator.calculate(tokens, 'claude-opus-9000-turbo');
      expect(opusResult.total_cost_usd).toBe(110.25); // Same as opus pricing
      expect(warnSpy).toHaveBeenCalledWith(
        'Using fallback pricing for model: claude-opus-9000-turbo (detected tier: opus)'
      );

      warnSpy.mockClear();

      // Test unknown sonnet-tier model
      const sonnetResult = calculator.calculate(tokens, 'claude-sonnet-future');
      expect(sonnetResult.total_cost_usd).toBe(22.05); // Same as sonnet pricing
      expect(warnSpy).toHaveBeenCalledWith(
        'Using fallback pricing for model: claude-sonnet-future (detected tier: sonnet)'
      );

      warnSpy.mockClear();

      // Test unknown haiku-tier model
      const haikuResult = calculator.calculate(tokens, 'claude-haiku-next-gen');
      expect(haikuResult.total_cost_usd).toBe(5.88); // Same as haiku pricing
      expect(warnSpy).toHaveBeenCalledWith(
        'Using fallback pricing for model: claude-haiku-next-gen (detected tier: haiku)'
      );

      warnSpy.mockClear();

      // Test completely unknown model (default tier)
      const defaultResult = calculator.calculate(tokens, 'completely-unknown-model');
      expect(defaultResult.total_cost_usd).toBe(22.05); // Same as sonnet pricing (default tier)
      expect(warnSpy).toHaveBeenCalledWith(
        'Using fallback pricing for model: completely-unknown-model (detected tier: default)'
      );

      warnSpy.mockRestore();
    });

    it('zero tokens returns zero costs', () => {
      const tokens: TokenUsage = {
        input_tokens: 0,
        output_tokens: 0,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      };

      const result = calculator.calculate(tokens, 'claude-opus-4-5');

      expect(result.input_cost_usd).toBe(0);
      expect(result.output_cost_usd).toBe(0);
      expect(result.cache_read_cost_usd).toBe(0);
      expect(result.cache_creation_cost_usd).toBe(0);
      expect(result.total_cost_usd).toBe(0);
    });

    it('handles fractional token amounts correctly', () => {
      const tokens: TokenUsage = {
        input_tokens: 12_345,
        output_tokens: 67_890,
        cache_read_input_tokens: 123,
        cache_creation_input_tokens: 456,
      };

      const result = calculator.calculate(tokens, 'claude-sonnet-4-5');

      // Sonnet pricing:
      // Input: 12_345 / 1_000_000 * $3 = $0.037035
      // Output: 67_890 / 1_000_000 * $15 = $1.01835
      // Cache read: 123 / 1_000_000 * $0.30 = $0.0000369
      // Cache creation: 456 / 1_000_000 * $3.75 = $0.001710
      expect(result.input_cost_usd).toBeCloseTo(0.037035, 6);
      expect(result.output_cost_usd).toBeCloseTo(1.01835, 6);
      expect(result.cache_read_cost_usd).toBeCloseTo(0.0000369, 6);
      expect(result.cache_creation_cost_usd).toBeCloseTo(0.001710, 6);
      expect(result.total_cost_usd).toBeCloseTo(1.0571319, 6);
    });
  });
});
