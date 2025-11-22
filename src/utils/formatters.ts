/**
 * Format utilities for SMS messages
 */

/**
 * SMS character limit (standard)
 */
const SMS_CHAR_LIMIT = 1600;

/**
 * Truncate text to fit SMS character limit
 */
export function truncateForSms(text: string, maxLength: number = SMS_CHAR_LIMIT): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If it doesn't start with country code, assume US (+1)
  if (!digits.startsWith('1') && digits.length === 10) {
    return `+1${digits}`;
  }

  // Already has country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // Return with + prefix
  return digits.startsWith('+') ? digits : `+${digits}`;
}

/**
 * Format distance in meters to human-readable string
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} meters`;
  }

  const miles = meters / 1609.34;
  if (miles < 10) {
    return `${miles.toFixed(1)} miles`;
  }

  return `${Math.round(miles)} miles`;
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }

  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}

/**
 * Format ETA timestamp to human-readable string
 */
export function formatEta(estimatedArrival: Date): string {
  const now = new Date();
  const diffMs = estimatedArrival.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 0) {
    return 'arrived';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (minutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }

  return `${hours}h ${minutes}m`;
}

/**
 * Format list items for SMS display
 */
export function formatListForSms(
  listName: string,
  items: Array<{ content: string; quantity?: string | null; isCompleted: boolean }>
): string {
  if (items.length === 0) {
    return `${listName} is empty.`;
  }

  const header = `${listName} (${items.length} ${items.length === 1 ? 'item' : 'items'}):\n\n`;

  const itemsText = items
    .map((item, index) => {
      const checkbox = item.isCompleted ? '✓' : '○';
      const quantity = item.quantity ? ` (${item.quantity})` : '';
      return `${checkbox} ${index + 1}. ${item.content}${quantity}`;
    })
    .join('\n');

  return truncateForSms(header + itemsText);
}

/**
 * Format contact information for SMS display
 */
export function formatContactForSms(contact: {
  name: string;
  phoneNumber?: string | null;
  email?: string | null;
  relationship?: string | null;
}): string {
  let text = `${contact.name}`;

  if (contact.relationship) {
    text += ` (${contact.relationship})`;
  }

  text += '\n';

  if (contact.phoneNumber) {
    text += `Phone: ${contact.phoneNumber}\n`;
  }

  if (contact.email) {
    text += `Email: ${contact.email}\n`;
  }

  return text.trim();
}

/**
 * Create help message
 */
export function formatHelpMessage(): string {
  return truncateForSms(`I can help you with:

📱 Contacts
• "What's [name]'s phone number?"
• "Get [name]'s email"

📝 Lists
• "Add [item] to grocery list"
• "Show me the grocery list"
• "Mark [item] as bought"
• "Remove [item]"

📍 Location (coming soon)
• "I'm at [location]"
• "Where is [person]?"

Reply with your command or question!`);
}
