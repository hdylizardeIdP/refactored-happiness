import { Request, Response } from 'express';
import { IncomingSmsPayload, MessageDirection } from '../types/sms';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { sendSms } from '../services/sms.service';
import { recognizeIntent } from '../services/intent.service';
import { handleIntent } from '../services/intent-router.service';
import { formatPhoneNumber } from '../utils/formatters';
import { AppError } from '../middleware/error.middleware';

/**
 * Handle incoming SMS webhook from Twilio
 */
export async function handleIncomingSms(req: Request, res: Response): Promise<Response> {
  const payload = req.body as IncomingSmsPayload;

  logger.info('Incoming SMS received', {
    from: payload.From,
    to: payload.To,
    messageId: payload.MessageSid,
  });

  try {
    // Normalize phone numbers
    const fromPhone = formatPhoneNumber(payload.From);
    const toPhone = formatPhoneNumber(payload.To);
    const messageBody = payload.Body.trim();

    // Log incoming message to database
    await prisma.messageLog.create({
      data: {
        fromPhone,
        toPhone,
        messageBody,
        direction: MessageDirection.INBOUND,
        twilioSid: payload.MessageSid,
        status: 'received',
      },
    });

    // Check if sender is authorized
    const sender = await prisma.user.findUnique({
      where: { phoneNumber: fromPhone },
    });

    if (!sender) {
      logger.warn('Unauthorized sender attempted to send message', { fromPhone });

      // Send polite rejection
      await sendSms({
        to: fromPhone,
        from: toPhone,
        body: "Sorry, I don't recognize your number. Please contact the administrator to get access.",
      });

      return res.status(200).send('<Response></Response>');
    }

    logger.info('Authorized user message', {
      userId: sender.id,
      userName: sender.name,
    });

    // Recognize intent using Claude API
    const intentResult = await recognizeIntent(messageBody, sender);

    // Log intent
    await prisma.messageLog.updateMany({
      where: {
        twilioSid: payload.MessageSid,
      },
      data: {
        intent: intentResult.intent,
      },
    });

    logger.info('Intent recognized', {
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      entities: intentResult.entities,
    });

    // Handle the intent and generate response
    const responseMessage = await handleIntent(intentResult, sender);

    // Send response via SMS
    await sendSms({
      to: fromPhone,
      from: toPhone,
      body: responseMessage,
    });

    logger.info('Response sent successfully', {
      messageLength: responseMessage.length,
    });

    // Return empty TwiML response (we're handling the response ourselves)
    return res.status(200).send('<Response></Response>');
  } catch (error) {
    logger.error('Error processing incoming SMS', {
      error,
      messageId: payload.MessageSid,
    });

    // Send error message to user
    try {
      await sendSms({
        to: payload.From,
        from: payload.To,
        body: "Sorry, I encountered an error processing your message. Please try again later.",
      });
    } catch (sendError) {
      logger.error('Failed to send error message', { error: sendError });
    }

    // Still return 200 to Twilio to prevent retries
    return res.status(200).send('<Response></Response>');
  }
}

/**
 * Handle SMS status callback from Twilio
 */
export async function handleSmsStatus(req: Request, res: Response): Promise<Response> {
  const { MessageSid, MessageStatus } = req.body;

  logger.info('SMS status update received', {
    messageSid: MessageSid,
    status: MessageStatus,
  });

  try {
    // Update message status in database
    await prisma.messageLog.updateMany({
      where: { twilioSid: MessageSid },
      data: { status: MessageStatus },
    });

    return res.status(200).send('<Response></Response>');
  } catch (error) {
    logger.error('Error updating SMS status', { error, MessageSid });
    throw new AppError(500, 'Failed to update SMS status');
  }
}
