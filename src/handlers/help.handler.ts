import { User } from '@prisma/client';
import { IntentResult } from '../types/intents';
import { formatHelpMessage } from '../utils/formatters';
import { logger } from '../utils/logger';

/**
 * Handle help intent
 */
export async function handleHelp(_intent: IntentResult, user: User): Promise<string> {
  logger.info('Handling help request', {
    userId: user.id,
  });

  return formatHelpMessage();
}

/**
 * Handle status intent
 */
export async function handleStatus(_intent: IntentResult, user: User): Promise<string> {
  logger.info('Handling status request', {
    userId: user.id,
  });

  if (!user.isPrimaryUser) {
    return "You don't have permission to view system status.";
  }

  // Return basic system status for primary user
  return `SMS Assistant v1.0

Status: ✓ Running
Environment: ${process.env.NODE_ENV || 'development'}

All systems operational.`;
}

/**
 * Handle unknown intent
 */
export async function handleUnknown(intent: IntentResult, _user: User): Promise<string> {
  logger.info('Handling unknown intent', {
    message: intent.rawMessage,
  });

  return `I didn't quite understand that. ${formatHelpMessage()}`;
}
