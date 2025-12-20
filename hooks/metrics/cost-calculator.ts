/**
 * Cost calculator for token usage
 *
 * Implements F009: Calculate USD costs from token usage using model pricing.
 * Formula: (tokens / 1_000_000) * price_per_million
 */

import type { TokenUsage, CostBreakdown } from './types';
import { getModelPricing } from './pricing';

/**
 * CostCalculator - Converts token usage to USD costs
 *
 * Handles edge case EC003: Unknown models use tier-based fallback pricing.
 */
export class CostCalculator {
  /**
   * Calculate cost from token usage
   *
   * @param tokens - Token usage breakdown
   * @param model - Model identifier (e.g., 'claude-opus-4-5')
   * @returns Cost breakdown in USD with all components
   *
   * Edge case EC003: Logs warning when using fallback pricing for unknown models.
   */
  calculate(tokens: TokenUsage, model: string): CostBreakdown {
    const { pricing, isFallback, detectedTier } = getModelPricing(model);

    if (isFallback) {
      console.warn(`Using fallback pricing for model: ${model} (detected tier: ${detectedTier})`);
    }

    const input_cost_usd = (tokens.input_tokens / 1_000_000) * pricing.inputPerMTok;
    const output_cost_usd = (tokens.output_tokens / 1_000_000) * pricing.outputPerMTok;
    const cache_read_cost_usd = (tokens.cache_read_input_tokens / 1_000_000) * pricing.cacheReadPerMTok;
    const cache_creation_cost_usd = (tokens.cache_creation_input_tokens / 1_000_000) * pricing.cacheCreationPerMTok;

    const total_cost_usd = input_cost_usd + output_cost_usd + cache_read_cost_usd + cache_creation_cost_usd;

    return {
      input_cost_usd,
      output_cost_usd,
      cache_read_cost_usd,
      cache_creation_cost_usd,
      total_cost_usd,
    };
  }
}
