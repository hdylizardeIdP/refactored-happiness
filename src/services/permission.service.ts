import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { User } from '@prisma/client';

/**
 * Permission types
 */
export enum PermissionType {
  LOCATION = 'location',
  ETA = 'eta',
  CONTACTS = 'contacts',
  LISTS = 'lists',
}

/**
 * Check if a user has permission to access another user's data
 */
export async function hasPermission(
  requestingUser: User,
  targetUserId: string,
  permissionType: PermissionType
): Promise<boolean> {
  try {
    // Primary user has all permissions
    if (requestingUser.isPrimaryUser) {
      logger.debug('Primary user has all permissions', {
        userId: requestingUser.id,
      });
      return true;
    }

    // Check if user is requesting their own data
    if (requestingUser.id === targetUserId) {
      logger.debug('User accessing own data', {
        userId: requestingUser.id,
      });
      return true;
    }

    // Check database for explicit permission
    const permission = await prisma.permission.findUnique({
      where: {
        userId_grantedByUserId_permissionType: {
          userId: requestingUser.id,
          grantedByUserId: targetUserId,
          permissionType,
        },
      },
    });

    if (!permission || !permission.isActive) {
      logger.warn('Permission denied', {
        requestingUserId: requestingUser.id,
        targetUserId,
        permissionType,
      });
      return false;
    }

    // Check if permission has expired
    if (permission.expiresAt && permission.expiresAt < new Date()) {
      logger.warn('Permission expired', {
        requestingUserId: requestingUser.id,
        targetUserId,
        permissionType,
        expiresAt: permission.expiresAt,
      });
      return false;
    }

    logger.debug('Permission granted', {
      requestingUserId: requestingUser.id,
      targetUserId,
      permissionType,
    });

    return true;
  } catch (error) {
    logger.error('Error checking permission', {
      error,
      requestingUserId: requestingUser.id,
      targetUserId,
      permissionType,
    });
    return false;
  }
}

/**
 * Grant permission to a user
 */
export async function grantPermission(
  grantedByUserId: string,
  userId: string,
  permissionType: PermissionType,
  expiresAt?: Date
): Promise<boolean> {
  try {
    await prisma.permission.upsert({
      where: {
        userId_grantedByUserId_permissionType: {
          userId,
          grantedByUserId,
          permissionType,
        },
      },
      update: {
        isActive: true,
        expiresAt,
      },
      create: {
        userId,
        grantedByUserId,
        permissionType,
        isActive: true,
        expiresAt,
      },
    });

    logger.info('Permission granted', {
      userId,
      grantedByUserId,
      permissionType,
      expiresAt,
    });

    return true;
  } catch (error) {
    logger.error('Error granting permission', {
      error,
      userId,
      grantedByUserId,
      permissionType,
    });
    return false;
  }
}

/**
 * Revoke permission from a user
 */
export async function revokePermission(
  grantedByUserId: string,
  userId: string,
  permissionType: PermissionType
): Promise<boolean> {
  try {
    await prisma.permission.updateMany({
      where: {
        userId,
        grantedByUserId,
        permissionType,
      },
      data: {
        isActive: false,
      },
    });

    logger.info('Permission revoked', {
      userId,
      grantedByUserId,
      permissionType,
    });

    return true;
  } catch (error) {
    logger.error('Error revoking permission', {
      error,
      userId,
      grantedByUserId,
      permissionType,
    });
    return false;
  }
}
