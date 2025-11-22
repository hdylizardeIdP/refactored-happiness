import { Request, Response } from 'express';
import { testDatabaseConnection } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Basic health check endpoint
 * Returns 200 if service is running
 */
export async function healthCheck(_req: Request, res: Response): Promise<Response> {
  return res.status(200).json({
    success: true,
    message: 'SMS Assistant is running',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Detailed system status check
 * Checks database connectivity and other services
 */
export async function statusCheck(_req: Request, res: Response): Promise<Response> {
  logger.info('Status check requested');

  const status = {
    service: 'SMS Assistant',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    checks: {
      database: false,
      twilio: !!process.env.TWILIO_ACCOUNT_SID,
      claude: !!process.env.ANTHROPIC_API_KEY,
      googleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
    },
  };

  // Test database connection
  try {
    status.checks.database = await testDatabaseConnection();
  } catch (error) {
    logger.error('Database health check failed', { error });
    status.checks.database = false;
  }

  // Determine overall health status
  const isHealthy = Object.values(status.checks).every((check) => check === true);
  const statusCode = isHealthy ? 200 : 503;

  return res.status(statusCode).json({
    success: isHealthy,
    data: status,
  });
}
