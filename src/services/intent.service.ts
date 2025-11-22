import { anthropic, CLAUDE_MODEL, MAX_TOKENS, TEMPERATURE } from '../config/claude';
import { IntentType, IntentResult } from '../types/intents';
import { logger } from '../utils/logger';
import { User } from '@prisma/client';

/**
 * System prompt for intent recognition
 */
const INTENT_RECOGNITION_PROMPT = `You are an intent classification system for a personal SMS assistant.

Your task is to analyze incoming text messages and classify them into specific intents, then extract relevant entities.

Available intents:
- location_query: User asking where someone is
- eta_query: User asking when someone will arrive
- location_update: User updating their location
- trip_start: User starting a trip to a destination
- trip_cancel: User canceling a trip
- contact_lookup: User looking up contact information
- contact_share: User asking to share contact info with someone
- list_add_item: Adding item(s) to a list (usually grocery list)
- list_remove_item: Removing item(s) from a list
- list_view: Viewing list contents
- list_clear: Clearing all items from a list
- list_mark_complete: Marking item(s) as complete/bought
- list_create: Creating a new list
- list_share: Sharing a list with someone
- help: User asking for help or what the system can do
- status: User asking for system status
- unknown: Message doesn't match any known intent

For each message, respond with a JSON object containing:
{
  "intent": "intent_name",
  "confidence": 0.0-1.0,
  "entities": {
    "contactName": "extracted contact name if applicable",
    "listName": "extracted list name if applicable (default to 'Grocery List' if not specified)",
    "listItem": "extracted item name if applicable",
    "quantity": "extracted quantity if applicable",
    "location": "extracted location if applicable",
    "destination": "extracted destination if applicable",
    "duration": "extracted duration/time if applicable"
  }
}

Only include entities that are relevant to the intent. Return ONLY valid JSON, no other text.`;

/**
 * Recognize intent from user message using Claude API
 */
export async function recognizeIntent(
  message: string,
  user: User
): Promise<IntentResult> {
  try {
    logger.debug('Recognizing intent for message', {
      message,
      userId: user.id,
      userName: user.name,
    });

    // Prepare user context for better intent recognition
    const userContext = `User name: ${user.name}\nUser phone: ${user.phoneNumber}`;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: INTENT_RECOGNITION_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${userContext}\n\nMessage to classify: "${message}"`,
        },
      ],
    });

    // Extract response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    // Parse JSON response
    const result = JSON.parse(content.text) as {
      intent: string;
      confidence: number;
      entities: Record<string, string>;
    };

    logger.info('Intent recognized', {
      intent: result.intent,
      confidence: result.confidence,
      entities: result.entities,
    });

    // Validate and return
    return {
      intent: (result.intent as IntentType) || IntentType.UNKNOWN,
      confidence: result.confidence || 0.5,
      entities: result.entities || {},
      rawMessage: message,
    };
  } catch (error) {
    logger.error('Error recognizing intent', {
      error,
      message,
    });

    // Return unknown intent on error
    return {
      intent: IntentType.UNKNOWN,
      confidence: 0,
      entities: {},
      rawMessage: message,
    };
  }
}
