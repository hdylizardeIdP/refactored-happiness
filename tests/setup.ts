/**
 * Test setup and configuration
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests

// Mock environment variables for tests
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/sms_assistant_test';
process.env.TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'test_twilio_sid';
process.env.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'test_twilio_token';
process.env.TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+15555550000';
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test_anthropic_key';
process.env.GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'test_google_maps_key';
process.env.PRIMARY_USER_PHONE = process.env.PRIMARY_USER_PHONE || '+15555550001';
process.env.PRIMARY_USER_NAME = process.env.PRIMARY_USER_NAME || 'Test User';
process.env.SKIP_TWILIO_VALIDATION = 'true';

// Global test timeout
jest.setTimeout(10000);
