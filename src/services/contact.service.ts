import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { User, Contact } from '@prisma/client';

/**
 * Search for contacts by name (fuzzy matching)
 */
export async function searchContacts(
  ownerId: string,
  nameQuery: string
): Promise<Contact[]> {
  try {
    const normalizedQuery = nameQuery.trim().toLowerCase();

    // Search for contacts (case-insensitive partial match)
    const contacts = await prisma.contact.findMany({
      where: {
        ownerId,
        name: {
          contains: normalizedQuery,
          mode: 'insensitive',
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    logger.debug('Contact search results', {
      ownerId,
      query: nameQuery,
      resultsCount: contacts.length,
    });

    return contacts;
  } catch (error) {
    logger.error('Error searching contacts', {
      error,
      ownerId,
      query: nameQuery,
    });
    return [];
  }
}

/**
 * Get contact by exact name
 */
export async function getContactByName(
  ownerId: string,
  name: string
): Promise<Contact | null> {
  try {
    const contact = await prisma.contact.findFirst({
      where: {
        ownerId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    return contact;
  } catch (error) {
    logger.error('Error getting contact by name', {
      error,
      ownerId,
      name,
    });
    return null;
  }
}

/**
 * Get contact by phone number
 */
export async function getContactByPhone(
  ownerId: string,
  phoneNumber: string
): Promise<Contact | null> {
  try {
    const contact = await prisma.contact.findFirst({
      where: {
        ownerId,
        phoneNumber,
      },
    });

    return contact;
  } catch (error) {
    logger.error('Error getting contact by phone', {
      error,
      ownerId,
      phoneNumber,
    });
    return null;
  }
}

/**
 * Add new contact
 */
export async function addContact(
  ownerId: string,
  contactData: {
    name: string;
    phoneNumber?: string;
    email?: string;
    relationship?: string;
    notes?: string;
  }
): Promise<Contact | null> {
  try {
    const contact = await prisma.contact.create({
      data: {
        ownerId,
        ...contactData,
      },
    });

    logger.info('Contact added', {
      ownerId,
      contactId: contact.id,
      contactName: contact.name,
    });

    return contact;
  } catch (error) {
    logger.error('Error adding contact', {
      error,
      ownerId,
      contactData,
    });
    return null;
  }
}

/**
 * Update contact
 */
export async function updateContact(
  contactId: string,
  updates: Partial<{
    name: string;
    phoneNumber: string;
    email: string;
    relationship: string;
    notes: string;
  }>
): Promise<Contact | null> {
  try {
    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: updates,
    });

    logger.info('Contact updated', {
      contactId,
      updates,
    });

    return contact;
  } catch (error) {
    logger.error('Error updating contact', {
      error,
      contactId,
      updates,
    });
    return null;
  }
}

/**
 * Delete contact
 */
export async function deleteContact(contactId: string): Promise<boolean> {
  try {
    await prisma.contact.delete({
      where: { id: contactId },
    });

    logger.info('Contact deleted', { contactId });

    return true;
  } catch (error) {
    logger.error('Error deleting contact', {
      error,
      contactId,
    });
    return false;
  }
}

/**
 * Get all contacts for a user
 */
export async function getAllContacts(ownerId: string): Promise<Contact[]> {
  try {
    const contacts = await prisma.contact.findMany({
      where: { ownerId },
      orderBy: { name: 'asc' },
    });

    return contacts;
  } catch (error) {
    logger.error('Error getting all contacts', {
      error,
      ownerId,
    });
    return [];
  }
}
