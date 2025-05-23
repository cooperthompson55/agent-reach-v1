import { NextResponse } from 'next/server';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromPhone = process.env.TWILIO_PHONE_NUMBER!;

const twilio = require('twilio')(accountSid, authToken);

// GET /api/messages?contact=+1234567890
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contact = searchParams.get('contact');

  if (!contact) {
    return NextResponse.json({ error: 'Missing contact parameter' }, { status: 400 });
  }

  if (contact === 'all') {
    try {
      // Fetch recent messages (limit 100 for performance)
      const messages = await twilio.messages.list({
        limit: 100,
      });
      // Group by contact (other party in the conversation)
      const contactMap = new Map();
      messages.forEach((msg: any) => {
        // Determine the other party
        let other = msg.from === fromPhone ? msg.to : msg.from;
        if (!contactMap.has(other)) {
          contactMap.set(other, msg);
        }
      });
      // Return as array
      const contacts = Array.from(contactMap.values());
      return NextResponse.json({ contacts });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to fetch contacts' }, { status: 500 });
    }
  }

  try {
    // Support batching: limit and before (date or sid)
    const limit = parseInt(searchParams.get('limit') || '200', 10)
    const before = searchParams.get('before') // ISO date string or message SID

    // Helper to build Twilio list params
    const buildParams = (direction: 'to' | 'from') => {
      const params: any = {
        limit,
      }
      if (direction === 'to') {
        params.to = contact
        params.from = fromPhone
      } else {
        params.from = contact
        params.to = fromPhone
      }
      if (before) {
        // Twilio API supports 'dateSentBefore' (date only, not SID)
        // If before is a date, use it; if SID, ignore (could be improved with extra lookup)
        const beforeDate = new Date(before)
        if (!isNaN(beforeDate.getTime())) {
          params.dateSentBefore = beforeDate
        }
      }
      return params
    }

    const messages = await twilio.messages.list(buildParams('to'))
    const messagesFrom = await twilio.messages.list(buildParams('from'))
    // Combine and sort by date
    const allMessages = [...messages, ...messagesFrom].sort((a, b) => new Date(a.dateSent).getTime() - new Date(b.dateSent).getTime())
    return NextResponse.json({ messages: allMessages })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch messages' }, { status: 500 });
  }
} 