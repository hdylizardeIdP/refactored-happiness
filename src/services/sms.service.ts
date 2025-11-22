import { twilioClient, twilioPhoneNumber } from '../config/twilio';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { OutgoingSmsMessage, SmsSendResult, MessageDirection } from '../types/sms';
import { formatPhoneNumber, truncateForSms } from '../utils/formatters';

/**
 * Send SMS message via Twilio
 */
export async function sendSms(message: OutgoingSmsMessage): Promise<SmsSendResult> {
  try {
    // Ensure message body is within SMS limits
    const body = truncateForSms(message.body);

    logger.info('Sending SMS', {
      to: message.to,
      from: message.from,
      bodyLength: body.length,
    });

    // Send via Twilio
    const twilioMessage = await twilioClient.messages.create({
      body,
      from: message.from,
      to: message.to,
    });

    logger.info('SMS sent successfully', {
      messageSid: twilioMessage.sid,
      status: twilioMessage.status,
    });

    // Log outgoing message to database
    await prisma.messageLog.create({
      data: {
        fromPhone: formatPhoneNumber(message.from),
        toPhone: formatPhoneNumber(message.to),
        messageBody: body,
        direction: MessageDirection.OUTBOUND,
        twilioSid: twilioMessage.sid,
        status: twilioMessage.status,
      },
    });

    return {
      success: true,
      messageSid: twilioMessage.sid,
    };
  } catch (error) {
    logger.error('Failed to send SMS', {
      error,
      to: message.to,
      from: message.from,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send SMS with default sender number
 */
export async function sendSmsFromDefault(to: string, body: string): Promise<SmsSendResult> {
  if (!twilioPhoneNumber) {
    logger.error('Twilio phone number not configured');
    return {
      success: false,
      error: 'Twilio phone number not configured',
    };
  }

  return sendSms({
    to,
    from: twilioPhoneNumber,
    body,
  });
}
