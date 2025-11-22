import { User } from '@prisma/client';
import { IntentResult, IntentType } from '../types/intents';
import { handleContactLookup, handleContactShare } from '../handlers/contact.handler';
import {
  handleListView,
  handleListAddItem,
  handleListRemoveItem,
  handleListMarkComplete,
  handleListClear,
  handleListCreate,
  handleListShare,
} from '../handlers/list.handler';
import {
  handleLocationUpdate,
  handleTripStart,
  handleTripCancel,
  handleLocationQuery,
  handleEtaQuery,
} from '../handlers/location.handler';
import { handleHelp, handleStatus, handleUnknown } from '../handlers/help.handler';
import { logger } from '../utils/logger';

/**
 * Route intent to appropriate handler and generate response
 */
export async function handleIntent(intent: IntentResult, user: User): Promise<string> {
  logger.info('Routing intent to handler', {
    intent: intent.intent,
    userId: user.id,
  });

  try {
    switch (intent.intent) {
      // Contact intents
      case IntentType.CONTACT_LOOKUP:
        return await handleContactLookup(intent, user);

      case IntentType.CONTACT_SHARE:
        return await handleContactShare(intent, user);

      // List intents
      case IntentType.LIST_VIEW:
        return await handleListView(intent, user);

      case IntentType.LIST_ADD_ITEM:
        return await handleListAddItem(intent, user);

      case IntentType.LIST_REMOVE_ITEM:
        return await handleListRemoveItem(intent, user);

      case IntentType.LIST_MARK_COMPLETE:
        return await handleListMarkComplete(intent, user);

      case IntentType.LIST_CLEAR:
        return await handleListClear(intent, user);

      case IntentType.LIST_CREATE:
        return await handleListCreate(intent, user);

      case IntentType.LIST_SHARE:
        return await handleListShare(intent, user);

      // Location & Travel intents
      case IntentType.LOCATION_UPDATE:
        return await handleLocationUpdate(intent, user);

      case IntentType.TRIP_START:
        return await handleTripStart(intent, user);

      case IntentType.TRIP_CANCEL:
        return await handleTripCancel(intent, user);

      case IntentType.LOCATION_QUERY:
        return await handleLocationQuery(intent, user);

      case IntentType.ETA_QUERY:
        return await handleEtaQuery(intent, user);

      // System intents
      case IntentType.HELP:
        return await handleHelp(intent, user);

      case IntentType.STATUS:
        return await handleStatus(intent, user);

      // Unknown intent
      case IntentType.UNKNOWN:
      default:
        return await handleUnknown(intent, user);
    }
  } catch (error) {
    logger.error('Error handling intent', {
      error,
      intent: intent.intent,
      userId: user.id,
    });

    return "Sorry, I encountered an error processing your request. Please try again.";
  }
}
