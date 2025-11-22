import twilio from 'twilio';
import { logger } from '../utils/logger';

/**
 * Twilio configuration
 */
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
export const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  logger.error('Missing Twilio configuration. Please check environment variables.');
}

/**
 * Twilio client instance
 */
export const twilioClient = twilio(accountSid, authToken);

/**
 * Validate Twilio request signature
 * This ensures the request actually came from Twilio
 */
export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_TWILIO_VALIDATION === 'true') {
    logger.warn('Skipping Twilio signature validation in development mode');
    return true;
  }

  const webhookSecret = process.env.WEBHOOK_SECRET || authToken || '';
  return twilio.validateRequest(webhookSecret, signature, url, params);
}
