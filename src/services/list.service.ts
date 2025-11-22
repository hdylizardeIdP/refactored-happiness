import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { List, ListItem, User } from '@prisma/client';

/**
 * Get or create the default grocery list for a user
 */
export async function getOrCreateGroceryList(userId: string): Promise<List> {
  try {
    // Try to find existing grocery list
    let list = await prisma.list.findFirst({
      where: {
        ownerId: userId,
        type: 'grocery',
      },
    });

    // Create if doesn't exist
    if (!list) {
      list = await prisma.list.create({
        data: {
          ownerId: userId,
          name: 'Grocery List',
          type: 'grocery',
          isShared: false,
        },
      });

      logger.info('Created grocery list', {
        userId,
        listId: list.id,
      });
    }

    return list;
  } catch (error) {
    logger.error('Error getting/creating grocery list', {
      error,
      userId,
    });
    throw error;
  }
}

/**
 * Get list by name or type
 * 
 * Access Control Model:
 * - Users can access lists they own (ownerId = userId)
 * - Users can access lists shared with them (via ListShare relationship)
 * - By default, only owned lists are queried for performance
 * - Use includeShares=true to eagerly load share relationships and check shared access
 * 
 * @param userId - The user requesting the list
 * @param listNameOrType - Optional name or type to search for
 * @param includeShares - Whether to eagerly load ListShare data (default: false)
 * @returns The list if found and accessible, null otherwise
 */
export async function getList(
  userId: string,
  listNameOrType?: string,
  includeShares: boolean = false
): Promise<List | null> {
  try {
    // Default to grocery list if no name specified
    if (!listNameOrType) {
      return getOrCreateGroceryList(userId);
    }

    // Search by name or type
    // Note: Currently only searches owned lists. For shared list access,
    // use getUserAccessibleList() which checks both owned and shared lists.
    const list = await prisma.list.findFirst({
      where: {
        OR: [
          {
            ownerId: userId,
            name: {
              contains: listNameOrType,
              mode: 'insensitive',
            },
          },
          {
            ownerId: userId,
            type: listNameOrType.toLowerCase(),
          },
        ],
      },
      // Optionally include shares to avoid N+1 queries when checking access
      ...(includeShares && {
        include: {
          shares: true,
        },
      }),
    });

    return list;
  } catch (error) {
    logger.error('Error getting list', {
      error,
      userId,
      listNameOrType,
    });
    return null;
  }
}

/**
 * Get list items
 */
export async function getListItems(listId: string): Promise<ListItem[]> {
  try {
    const items = await prisma.listItem.findMany({
      where: { listId },
      orderBy: [{ isCompleted: 'asc' }, { createdAt: 'asc' }],
    });

    return items;
  } catch (error) {
    logger.error('Error getting list items', {
      error,
      listId,
    });
    return [];
  }
}

/**
 * Add item to list
 */
export async function addListItem(
  listId: string,
  content: string,
  quantity?: string,
  addedByUserId?: string
): Promise<ListItem | null> {
  try {
    const item = await prisma.listItem.create({
      data: {
        listId,
        content: content.trim(),
        quantity,
        addedByUserId,
      },
    });

    logger.info('List item added', {
      listId,
      itemId: item.id,
      content: item.content,
    });

    return item;
  } catch (error) {
    logger.error('Error adding list item', {
      error,
      listId,
      content,
    });
    return null;
  }
}

/**
 * Remove item from list by content match
 */
export async function removeListItem(
  listId: string,
  contentToRemove: string
): Promise<number> {
  try {
    const result = await prisma.listItem.deleteMany({
      where: {
        listId,
        content: {
          contains: contentToRemove,
          mode: 'insensitive',
        },
      },
    });

    logger.info('List items removed', {
      listId,
      contentToRemove,
      count: result.count,
    });

    return result.count;
  } catch (error) {
    logger.error('Error removing list item', {
      error,
      listId,
      contentToRemove,
    });
    return 0;
  }
}

/**
 * Mark item as complete
 */
export async function markItemComplete(
  listId: string,
  contentToMark: string
): Promise<number> {
  try {
    const result = await prisma.listItem.updateMany({
      where: {
        listId,
        content: {
          contains: contentToMark,
          mode: 'insensitive',
        },
        isCompleted: false,
      },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    logger.info('List items marked complete', {
      listId,
      contentToMark,
      count: result.count,
    });

    return result.count;
  } catch (error) {
    logger.error('Error marking item complete', {
      error,
      listId,
      contentToMark,
    });
    return 0;
  }
}

/**
 * Clear all items from list
 */
export async function clearList(listId: string): Promise<number> {
  try {
    const result = await prisma.listItem.deleteMany({
      where: { listId },
    });

    logger.info('List cleared', {
      listId,
      itemsRemoved: result.count,
    });

    return result.count;
  } catch (error) {
    logger.error('Error clearing list', {
      error,
      listId,
    });
    return 0;
  }
}

/**
 * Create new list
 */
export async function createList(
  ownerId: string,
  name: string,
  type: string = 'general'
): Promise<List | null> {
  try {
    const list = await prisma.list.create({
      data: {
        ownerId,
        name,
        type,
        isShared: false,
      },
    });

    logger.info('List created', {
      ownerId,
      listId: list.id,
      name: list.name,
    });

    return list;
  } catch (error) {
    logger.error('Error creating list', {
      error,
      ownerId,
      name,
    });
    return null;
  }
}

/**
 * Get a list that the user has access to (either as owner or via sharing)
 * 
 * This function checks both:
 * 1. Lists owned by the user
 * 2. Lists shared with the user via ListShare
 * 
 * Eagerly loads share relationships to avoid N+1 queries when checking permissions.
 * 
 * @param userId - The user requesting access
 * @param listNameOrType - Optional name or type to search for
 * @returns The list if found and accessible, null otherwise
 */
export async function getUserAccessibleList(
  userId: string,
  listNameOrType?: string
): Promise<List | null> {
  try {
    // Default to grocery list if no name specified
    if (!listNameOrType) {
      return getOrCreateGroceryList(userId);
    }

    // Search for lists the user owns OR lists shared with them
    const list = await prisma.list.findFirst({
      where: {
        OR: [
          // Lists owned by user
          {
            ownerId: userId,
            OR: [
              {
                name: {
                  contains: listNameOrType,
                  mode: 'insensitive',
                },
              },
              {
                type: listNameOrType.toLowerCase(),
              },
            ],
          },
          // Lists shared with user
          {
            shares: {
              some: {
                sharedWithUserId: userId,
              },
            },
            OR: [
              {
                name: {
                  contains: listNameOrType,
                  mode: 'insensitive',
                },
              },
              {
                type: listNameOrType.toLowerCase(),
              },
            ],
          },
        ],
      },
      // Eagerly load shares to check permissions without additional queries
      include: {
        shares: true,
      },
    });

    return list;
  } catch (error) {
    logger.error('Error getting user accessible list', {
      error,
      userId,
      listNameOrType,
    });
    return null;
  }
}

/**
 * Check if a user has access to a list (either as owner or via sharing)
 * 
 * @param list - The list to check (should include shares)
 * @param userId - The user to check access for
 * @param requireEdit - Whether to require edit permission (default: false)
 * @returns True if user has access, false otherwise
 */
export function hasListAccess(
  list: List & { shares?: Array<{ sharedWithUserId: string; canEdit: boolean }> },
  userId: string,
  requireEdit: boolean = false
): boolean {
  // Check if user is the owner
  if (list.ownerId === userId) {
    return true;
  }

  // Check if list is shared with user
  if (list.shares) {
    const share = list.shares.find((s) => s.sharedWithUserId === userId);
    if (share) {
      return !requireEdit || share.canEdit;
    }
  }

  return false;
}

/**
 * Share list with user
 */
export async function shareList(
  listId: string,
  sharedWithUserId: string,
  canEdit: boolean = true
): Promise<boolean> {
  try {
    await prisma.listShare.create({
      data: {
        listId,
        sharedWithUserId,
        canEdit,
      },
    });

    // Update list to mark as shared
    await prisma.list.update({
      where: { id: listId },
      data: { isShared: true },
    });

    logger.info('List shared', {
      listId,
      sharedWithUserId,
      canEdit,
    });

    return true;
  } catch (error) {
    logger.error('Error sharing list', {
      error,
      listId,
      sharedWithUserId,
    });
    return false;
  }
}
