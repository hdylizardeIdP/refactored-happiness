import { Request, Response, NextFunction } from 'express';
import { validateTwilioSignature } from '../config/twilio';
import { AppError } from './error.middleware';
import { logger } from '../utils/logger';
import crypto from 'crypto';

/**
 * Middleware to validate Twilio request signature
 * This ensures the request actually came from Twilio and hasn't been tampered with
 */
export function twilioAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Get the signature from headers
  const signature = req.headers['x-twilio-signature'] as string;

  if (!signature) {
    logger.warn('Missing Twilio signature in request');
    throw new AppError(401, 'Unauthorized: Missing Twilio signature');
  }

  // Construct the full URL
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const url = `${protocol}://${host}${req.originalUrl}`;

  // Validate the signature
  const isValid = validateTwilioSignature(signature, url, req.body);

  if (!isValid) {
    logger.warn('Invalid Twilio signature', {
      url,
      signature,
    });
    throw new AppError(401, 'Unauthorized: Invalid Twilio signature');
  }

  logger.debug('Twilio signature validated successfully');
  next();
}

/**
 * Middleware to validate admin API key for system endpoints
 * This ensures only authorized administrators can access sensitive system information
 */
export function adminAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Get the API key from Authorization header (Bearer token format required)
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    logger.warn('Missing Authorization header in admin request');
    throw new AppError(401, 'Unauthorized: Missing Authorization header');
  }

  if (!authHeader.startsWith('Bearer ')) {
    logger.warn('Invalid Authorization header format');
    throw new AppError(401, 'Unauthorized: Invalid Authorization header format. Expected: Bearer <api_key>');
  }

  const apiKey = authHeader.substring(7);

  // Check if ADMIN_API_KEY is configured
  const adminApiKey = process.env.ADMIN_API_KEY;
  if (!adminApiKey) {
    logger.error('ADMIN_API_KEY environment variable is not configured');
    throw new AppError(500, 'Server configuration error');
  }

  if (!apiKey) {
    logger.warn('Empty API key in admin request');
    throw new AppError(401, 'Unauthorized: Missing API key');
  }

  // Use constant-time comparison to prevent timing attacks
  const apiKeyBuffer = Buffer.from(apiKey);
  const adminApiKeyBuffer = Buffer.from(adminApiKey);

  // Ensure both buffers are the same length to avoid timing leaks
  if (apiKeyBuffer.length !== adminApiKeyBuffer.length) {
    logger.warn('Invalid admin API key attempt (length mismatch)');
    throw new AppError(401, 'Unauthorized: Invalid API key');
  }

  // Perform constant-time comparison
  try {
    if (!crypto.timingSafeEqual(apiKeyBuffer, adminApiKeyBuffer)) {
      logger.warn('Invalid admin API key attempt');
      throw new AppError(401, 'Unauthorized: Invalid API key');
    }
  } catch (error) {
    logger.warn('Invalid admin API key attempt', { error });
    throw new AppError(401, 'Unauthorized: Invalid API key');
  }

  logger.debug('Admin API key validated successfully');
  next();
}
