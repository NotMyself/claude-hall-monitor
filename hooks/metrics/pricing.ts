/**
 * Model pricing data for Claude API usage
 *
 * All prices are in USD per million tokens (MTok).
 * Data current as of December 2024.
 *
 * Edge case EC003: Unknown models use tier-based fallbacks.
 */

/**
 * Pricing for a single model
 */
export interface ModelPricing {
  model: string;
  inputPerMTok: number;
  outputPerMTok: number;
  cacheReadPerMTok: number;
  cacheCreationPerMTok: number;
}

/**
 * Model pricing database (December 2024)
 */
const MODEL_PRICING: Record<string, ModelPricing> = {
  // Opus 4.5
  'claude-opus-4-5': {
    model: 'claude-opus-4-5',
    inputPerMTok: 15.00,
    outputPerMTok: 75.00,
    cacheReadPerMTok: 1.50,
    cacheCreationPerMTok: 18.75,
  },
  // Opus 4
  'claude-opus-4': {
    model: 'claude-opus-4',
    inputPerMTok: 15.00,
    outputPerMTok: 75.00,
    cacheReadPerMTok: 1.50,
    cacheCreationPerMTok: 18.75,
  },
  // Sonnet 4.5
  'claude-sonnet-4-5': {
    model: 'claude-sonnet-4-5',
    inputPerMTok: 3.00,
    outputPerMTok: 15.00,
    cacheReadPerMTok: 0.30,
    cacheCreationPerMTok: 3.75,
  },
  // Sonnet 4
  'claude-sonnet-4': {
    model: 'claude-sonnet-4',
    inputPerMTok: 3.00,
    outputPerMTok: 15.00,
    cacheReadPerMTok: 0.30,
    cacheCreationPerMTok: 3.75,
  },
  // Sonnet 3.5 (October 2024)
  'claude-3-5-sonnet-20241022': {
    model: 'claude-3-5-sonnet-20241022',
    inputPerMTok: 3.00,
    outputPerMTok: 15.00,
    cacheReadPerMTok: 0.30,
    cacheCreationPerMTok: 3.75,
  },
  // Haiku 3.5
  'claude-haiku-3-5': {
    model: 'claude-haiku-3-5',
    inputPerMTok: 0.80,
    outputPerMTok: 4.00,
    cacheReadPerMTok: 0.08,
    cacheCreationPerMTok: 1.00,
  },
  // Haiku 3.5 (October 2024)
  'claude-3-5-haiku-20241022': {
    model: 'claude-3-5-haiku-20241022',
    inputPerMTok: 0.80,
    outputPerMTok: 4.00,
    cacheReadPerMTok: 0.08,
    cacheCreationPerMTok: 1.00,
  },
};

/**
 * Fallback pricing tiers for unknown models
 *
 * Uses heuristics based on model name patterns:
 * - opus → highest tier
 * - sonnet → mid tier
 * - haiku → low tier
 * - default → mid tier (conservative estimate)
 */
const FALLBACK_TIERS: Record<string, ModelPricing> = {
  opus: {
    model: 'unknown-opus-tier',
    inputPerMTok: 15.00,
    outputPerMTok: 75.00,
    cacheReadPerMTok: 1.50,
    cacheCreationPerMTok: 18.75,
  },
  sonnet: {
    model: 'unknown-sonnet-tier',
    inputPerMTok: 3.00,
    outputPerMTok: 15.00,
    cacheReadPerMTok: 0.30,
    cacheCreationPerMTok: 3.75,
  },
  haiku: {
    model: 'unknown-haiku-tier',
    inputPerMTok: 0.80,
    outputPerMTok: 4.00,
    cacheReadPerMTok: 0.08,
    cacheCreationPerMTok: 1.00,
  },
  default: {
    model: 'unknown-default-tier',
    inputPerMTok: 3.00,
    outputPerMTok: 15.00,
    cacheReadPerMTok: 0.30,
    cacheCreationPerMTok: 3.75,
  },
};

/**
 * Get pricing for a model
 *
 * @param model - Model identifier (e.g., 'claude-opus-4-5')
 * @returns Pricing information with fallback if model unknown
 *
 * Edge case EC003: Unknown models use tier-based heuristics.
 * A warning should be logged by the caller when isFallback is true.
 */
export function getModelPricing(model: string): {
  pricing: ModelPricing;
  isFallback: boolean;
  detectedTier?: 'opus' | 'sonnet' | 'haiku' | 'default';
} {
  // Exact match
  if (MODEL_PRICING[model]) {
    return {
      pricing: MODEL_PRICING[model],
      isFallback: false,
    };
  }

  // Fallback using tier detection
  const lowerModel = model.toLowerCase();
  let tier: 'opus' | 'sonnet' | 'haiku' | 'default' = 'default';

  if (lowerModel.indexOf('opus') !== -1) {
    tier = 'opus';
  } else if (lowerModel.indexOf('sonnet') !== -1) {
    tier = 'sonnet';
  } else if (lowerModel.indexOf('haiku') !== -1) {
    tier = 'haiku';
  }

  return {
    pricing: FALLBACK_TIERS[tier],
    isFallback: true,
    detectedTier: tier,
  };
}

/**
 * Get all known model identifiers
 */
export function getKnownModels(): string[] {
  return Object.keys(MODEL_PRICING);
}

/**
 * Check if a model has exact pricing data
 */
export function hasExactPricing(model: string): boolean {
  return model in MODEL_PRICING;
}
