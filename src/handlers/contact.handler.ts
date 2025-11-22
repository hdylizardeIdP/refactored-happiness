import { User } from '@prisma/client';
import { IntentResult } from '../types/intents';
import { searchContacts, getContactByName } from '../services/contact.service';
import { formatContactForSms } from '../utils/formatters';
import { logger } from '../utils/logger';

/**
 * Handle contact lookup intent
 */
export async function handleContactLookup(
  intent: IntentResult,
  user: User
): Promise<string> {
  const contactName = intent.entities.contactName;

  if (!contactName) {
    return "I couldn't figure out which contact you're looking for. Please specify a name.";
  }

  logger.info('Handling contact lookup', {
    userId: user.id,
    contactName,
  });

  // Search for contacts
  const matches = await searchContacts(user.id, contactName);

  if (matches.length === 0) {
    return `I couldn't find any contact matching "${contactName}". Please check the spelling or add them to your contacts first.`;
  }

  if (matches.length === 1) {
    // Single match - return contact info
    return formatContactForSms(matches[0]);
  }

  // Multiple matches - ask user to be more specific
  const namesList = matches.map((c) => c.name).join(', ');
  return `I found ${matches.length} contacts matching "${contactName}": ${namesList}. Please be more specific.`;
}

/**
 * Handle contact share intent
 */
export async function handleContactShare(
  intent: IntentResult,
  user: User
): Promise<string> {
  // This is a more complex feature for Phase 2
  // For now, just return a helpful message
  return "Contact sharing isn't implemented yet, but I'm working on it! For now, you can look up the contact and copy the information manually.";
}
