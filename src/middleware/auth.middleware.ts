import { Request, Response, NextFunction } from 'express';
import { validateTwilioSignature } from '../config/twilio';
import { AppError } from './error.middleware';
import { logger } from '../utils/logger';

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
