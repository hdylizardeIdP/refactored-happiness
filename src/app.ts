import express, { Express } from 'express';
import { healthCheck, statusCheck } from './controllers/health.controller';
import { handleIncomingSms, handleSmsStatus } from './controllers/sms.controller';
import { twilioAuthMiddleware, adminAuthMiddleware } from './middleware/auth.middleware';
import {
  validateTwilioWebhook,
  requestLogger,
} from './middleware/validation.middleware';
import {
  errorHandler,
  notFoundHandler,
  asyncHandler,
} from './middleware/error.middleware';
import { logger } from './utils/logger';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging (in development)
  if (process.env.NODE_ENV === 'development') {
    app.use(requestLogger);
  }

  // Health check routes (no auth required)
  app.get('/health', asyncHandler(healthCheck));
  
  // Status check route (requires admin auth)
  app.get('/status', adminAuthMiddleware, asyncHandler(statusCheck));

  // Twilio webhook routes (with auth and validation)
  app.post(
    '/webhooks/sms/incoming',
    twilioAuthMiddleware,
    validateTwilioWebhook,
    asyncHandler(handleIncomingSms)
  );

  app.post(
    '/webhooks/sms/status',
    twilioAuthMiddleware,
    asyncHandler(handleSmsStatus)
  );

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  logger.info('Express app configured successfully');

  return app;
}
