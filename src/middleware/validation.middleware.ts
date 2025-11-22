import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';
import { isValidPhoneNumber } from '../utils/validators';
import { IncomingSmsPayload } from '../types/sms';
import { logger } from '../utils/logger';

/**
 * Validate Twilio webhook payload
 */
export function validateTwilioWebhook(req: Request, _res: Response, next: NextFunction): void {
  const payload = req.body as IncomingSmsPayload;

  // Check required fields
  if (!payload.MessageSid || !payload.From || !payload.To || !payload.Body) {
    throw new AppError(400, 'Invalid Twilio webhook payload: missing required fields');
  }

  // Validate phone numbers
  if (!isValidPhoneNumber(payload.From)) {
    throw new AppError(400, `Invalid sender phone number: ${payload.From}`);
  }

  if (!isValidPhoneNumber(payload.To)) {
    throw new AppError(400, `Invalid recipient phone number: ${payload.To}`);
  }

  // Validate message body is not empty
  if (!payload.Body.trim()) {
    throw new AppError(400, 'Message body cannot be empty');
  }

  next();
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  const { method, url, body } = req;
  const timestamp = new Date().toISOString();

  // Don't log sensitive data in production
  const safeBody =
    process.env.NODE_ENV === 'production'
      ? '(hidden in production)'
      : JSON.stringify(body);

  logger.http(`${method} ${url}`, {
    body: safeBody,
  });

  next();
}
