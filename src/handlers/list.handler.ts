import { User } from '@prisma/client';
import { IntentResult } from '../types/intents';
import {
  getOrCreateGroceryList,
  getList,
  getListItems,
  addListItem,
  removeListItem,
  markItemComplete,
  clearList,
  createList,
} from '../services/list.service';
import { formatListForSms } from '../utils/formatters';
import { logger } from '../utils/logger';

/**
 * Handle list view intent
 */
export async function handleListView(intent: IntentResult, user: User): Promise<string> {
  const listName = intent.entities.listName;

  logger.info('Handling list view', {
    userId: user.id,
    listName,
  });

  // Get the list (defaults to grocery list if not specified)
  const list = await getList(user.id, listName);

  if (!list) {
    return listName
      ? `I couldn't find a list named "${listName}". Try "show me the grocery list" or create a new list first.`
      : "You don't have a grocery list yet. Add items to get started!";
  }

  // Get items
  const items = await getListItems(list.id);

  return formatListForSms(list.name, items);
}

/**
 * Handle add item to list intent
 */
export async function handleListAddItem(
  intent: IntentResult,
  user: User
): Promise<string> {
  const listName = intent.entities.listName;
  const itemContent = intent.entities.listItem;
  const quantity = intent.entities.quantity;

  if (!itemContent) {
    return "I couldn't figure out what item to add. Please specify the item name.";
  }

  logger.info('Handling list add item', {
    userId: user.id,
    listName,
    itemContent,
    quantity,
  });

  // Get or create the list
  const list = await getList(user.id, listName);

  if (!list) {
    // If no list found and name not specified, use grocery list
    if (!listName) {
      const groceryList = await getOrCreateGroceryList(user.id);
      const item = await addListItem(groceryList.id, itemContent, quantity, user.id);

      if (!item) {
        return 'Sorry, I had trouble adding that item. Please try again.';
      }

      return `Added "${itemContent}"${quantity ? ` (${quantity})` : ''} to ${groceryList.name}.`;
    }

    return `I couldn't find a list named "${listName}". Would you like me to create it? (This feature is coming soon!)`;
  }

  // Add item to list
  const item = await addListItem(list.id, itemContent, quantity, user.id);

  if (!item) {
    return 'Sorry, I had trouble adding that item. Please try again.';
  }

  return `Added "${itemContent}"${quantity ? ` (${quantity})` : ''} to ${list.name}.`;
}

/**
 * Handle remove item from list intent
 */
export async function handleListRemoveItem(
  intent: IntentResult,
  user: User
): Promise<string> {
  const listName = intent.entities.listName;
  const itemContent = intent.entities.listItem;

  if (!itemContent) {
    return "I couldn't figure out what item to remove. Please specify the item name.";
  }

  logger.info('Handling list remove item', {
    userId: user.id,
    listName,
    itemContent,
  });

  // Get the list
  const list = await getList(user.id, listName);

  if (!list) {
    return listName
      ? `I couldn't find a list named "${listName}".`
      : "You don't have a grocery list yet.";
  }

  // Remove item(s)
  const removedCount = await removeListItem(list.id, itemContent);

  if (removedCount === 0) {
    return `I couldn't find "${itemContent}" in ${list.name}.`;
  }

  return removedCount === 1
    ? `Removed "${itemContent}" from ${list.name}.`
    : `Removed ${removedCount} items matching "${itemContent}" from ${list.name}.`;
}

/**
 * Handle mark item complete intent
 */
export async function handleListMarkComplete(
  intent: IntentResult,
  user: User
): Promise<string> {
  const listName = intent.entities.listName;
  const itemContent = intent.entities.listItem;

  if (!itemContent) {
    return "I couldn't figure out what item to mark as complete. Please specify the item name.";
  }

  logger.info('Handling list mark complete', {
    userId: user.id,
    listName,
    itemContent,
  });

  // Get the list
  const list = await getList(user.id, listName);

  if (!list) {
    return listName
      ? `I couldn't find a list named "${listName}".`
      : "You don't have a grocery list yet.";
  }

  // Mark item(s) complete
  const markedCount = await markItemComplete(list.id, itemContent);

  if (markedCount === 0) {
    return `I couldn't find "${itemContent}" in ${list.name}, or it's already marked as complete.`;
  }

  return markedCount === 1
    ? `Marked "${itemContent}" as complete in ${list.name}.`
    : `Marked ${markedCount} items matching "${itemContent}" as complete in ${list.name}.`;
}

/**
 * Handle clear list intent
 */
export async function handleListClear(intent: IntentResult, user: User): Promise<string> {
  const listName = intent.entities.listName;

  logger.info('Handling list clear', {
    userId: user.id,
    listName,
  });

  // Get the list
  const list = await getList(user.id, listName);

  if (!list) {
    return listName
      ? `I couldn't find a list named "${listName}".`
      : "You don't have a grocery list yet.";
  }

  // Clear all items
  const clearedCount = await clearList(list.id);

  if (clearedCount === 0) {
    return `${list.name} is already empty.`;
  }

  return `Cleared ${clearedCount} ${clearedCount === 1 ? 'item' : 'items'} from ${list.name}.`;
}

/**
 * Handle create list intent
 */
export async function handleListCreate(
  intent: IntentResult,
  user: User
): Promise<string> {
  const listName = intent.entities.listName;

  if (!listName) {
    return "I couldn't figure out what to name the new list. Please specify a name.";
  }

  logger.info('Handling list create', {
    userId: user.id,
    listName,
  });

  // Create the list
  const list = await createList(user.id, listName);

  if (!list) {
    return 'Sorry, I had trouble creating that list. Please try again.';
  }

  return `Created "${list.name}". You can now add items to it!`;
}

/**
 * Handle share list intent
 */
export async function handleListShare(
  intent: IntentResult,
  user: User
): Promise<string> {
  // This is a more complex feature for Phase 2
  return "List sharing isn't fully implemented yet, but I'm working on it! The grocery list is already shared with family members by default.";
}
