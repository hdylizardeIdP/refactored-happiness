/**
 * Intent types for classifying incoming SMS messages
 */
export enum IntentType {
  // Location & Travel
  LOCATION_QUERY = 'location_query', // "Where is David?"
  ETA_QUERY = 'eta_query', // "When will you arrive?"
  LOCATION_UPDATE = 'location_update', // "I'm at the store"
  TRIP_START = 'trip_start', // "Heading home"
  TRIP_CANCEL = 'trip_cancel', // "Cancel my trip"

  // Contacts
  CONTACT_LOOKUP = 'contact_lookup', // "What's Mom's number?"
  CONTACT_SHARE = 'contact_share', // "Send John Sarah's number"

  // Lists
  LIST_ADD_ITEM = 'list_add_item', // "Add milk to grocery list"
  LIST_REMOVE_ITEM = 'list_remove_item', // "Remove eggs"
  LIST_VIEW = 'list_view', // "Show me the grocery list"
  LIST_CLEAR = 'list_clear', // "Clear the list"
  LIST_MARK_COMPLETE = 'list_mark_complete', // "Mark milk as bought"
  LIST_CREATE = 'list_create', // "Create a packing list"
  LIST_SHARE = 'list_share', // "Share list with Natalie"

  // System
  HELP = 'help', // "What can you do?"
  STATUS = 'status', // "System status"
  UNKNOWN = 'unknown', // Unrecognized intent
}

/**
 * Entities extracted from the message based on intent
 */
export interface IntentEntities {
  contactName?: string;
  listName?: string;
  listItem?: string;
  quantity?: string;
  location?: string;
  destination?: string;
  duration?: string;
}

/**
 * Result of intent recognition
 */
export interface IntentResult {
  intent: IntentType;
  confidence: number;
  entities: IntentEntities;
  rawMessage: string;
}
