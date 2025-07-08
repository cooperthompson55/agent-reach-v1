import { NextResponse } from 'next/server';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromPhone = process.env.TWILIO_PHONE_NUMBER!;

// Validate environment variables
if (!accountSid || !authToken || !fromPhone) {
  console.error('Missing required Twilio environment variables:', {
    accountSid: !!accountSid,
    authToken: !!authToken,
    fromPhone: !!fromPhone
  });
}

let twilio: any;
try {
  twilio = require('twilio')(accountSid, authToken);
} catch (error) {
  console.error('Failed to initialize Twilio client:', error);
}

// GET /api/messages?contact=+1234567890&before=...&limit=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contact = searchParams.get('contact');
  const before = searchParams.get('before'); // date string or SID
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  if (!contact) {
    return NextResponse.json({ error: 'Missing contact parameter' }, { status: 400 });
  }

  // Check if Twilio is properly configured
  if (!accountSid || !authToken || !fromPhone || !twilio) {
    console.error('Twilio configuration missing:', {
      accountSid: !!accountSid,
      authToken: !!authToken,
      fromPhone: !!fromPhone,
      twilioClient: !!twilio
    });
    return NextResponse.json({ 
      error: 'Twilio configuration is incomplete. Please check environment variables.',
      details: {
        accountSid: !!accountSid,
        authToken: !!authToken,
        fromPhone: !!fromPhone,
        twilioClient: !!twilio
      }
    }, { status: 500 });
  }

  if (contact === 'all') {
    try {
      console.log('Fetching all messages from Twilio...');
      // Fetch recent messages (limit 2000 for performance)
      const messages = await twilio.messages.list({
        limit: 2000,
      });
      
      console.log(`Fetched ${messages.length} messages from Twilio`);
      
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
      console.log(`Grouped into ${contacts.length} unique contacts`);
      
      return NextResponse.json({ contacts });
    } catch (error: any) {
      console.error('Twilio API error:', error);
      return NextResponse.json({ 
        error: error.message || 'Failed to fetch contacts',
        twilioError: true,
        details: error.code || error.status || 'Unknown error'
      }, { status: 500 });
    }
  }

  try {
    // Prepare Twilio list params
    const baseParams: any = {
      limit,
    };
    if (before) {
      // Try to parse as date
      const beforeDate = new Date(before);
      if (!isNaN(beforeDate.getTime())) {
        baseParams.dateSentBefore = beforeDate;
      }
      // else: could add SID-based pagination if needed
    }
    // Fetch messages to or from the contact
    const messages = await twilio.messages.list({
      to: contact,
      from: fromPhone,
      ...baseParams,
    });
    const messagesFrom = await twilio.messages.list({
      from: contact,
      to: fromPhone,
      ...baseParams,
    });
    // Combine and sort by date
    const allMessages = [...messages, ...messagesFrom].sort((a, b) => new Date(a.dateSent).getTime() - new Date(b.dateSent).getTime());
    // Pagination: if we got 'limit' or more messages, there may be more
    let hasMore = false;
    let nextCursor = null;
    if (allMessages.length >= limit) {
      hasMore = true;
      nextCursor = allMessages[0]?.dateSent;
    }
    return NextResponse.json({ messages: allMessages, hasMore, nextCursor });
  } catch (error: any) {
    console.error('Twilio API error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch messages',
      twilioError: true,
      details: error.code || error.status || 'Unknown error'
    }, { status: 500 });
  }
} 