/**
 * Incoming SMS webhook payload from Twilio
 */
export interface IncomingSmsPayload {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
  [key: string]: string | undefined;
}

/**
 * Outgoing SMS message
 */
export interface OutgoingSmsMessage {
  to: string;
  from: string;
  body: string;
}

/**
 * SMS sending result
 */
export interface SmsSendResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

/**
 * Direction of SMS message
 */
export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}
