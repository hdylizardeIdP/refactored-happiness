import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

/**
 * Claude API configuration
 */
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  logger.error('Missing Anthropic API key. Please set ANTHROPIC_API_KEY environment variable.');
}

/**
 * Anthropic Claude client instance
 */
export const anthropic = new Anthropic({
  apiKey: apiKey || '',
});

/**
 * Claude model to use for intent recognition
 */
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

/**
 * Maximum tokens for Claude API responses
 */
export const MAX_TOKENS = 1024;

/**
 * Default temperature for Claude API
 */
export const TEMPERATURE = 0.3; // Lower temperature for more consistent intent classification
