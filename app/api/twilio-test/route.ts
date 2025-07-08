import { NextResponse } from 'next/server';

export async function GET() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;
  const publicPhone = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER;

  console.log('Twilio Test - Environment Variables Check:', {
    accountSid: !!accountSid,
    authToken: !!authToken,
    fromPhone: !!fromPhone,
    publicPhone: !!publicPhone,
    accountSidLength: accountSid?.length,
    authTokenLength: authToken?.length,
  });

  // Check if all required variables are present
  if (!accountSid || !authToken || !fromPhone) {
    return NextResponse.json({
      success: false,
      error: 'Missing required Twilio environment variables',
      details: {
        accountSid: !!accountSid,
        authToken: !!authToken,
        fromPhone: !!fromPhone,
        publicPhone: !!publicPhone,
      }
    }, { status: 500 });
  }

  try {
    // Initialize Twilio client
    const twilio = require('twilio')(accountSid, authToken);
    
    console.log('Twilio Test - Attempting to connect...');
    
    // Test connection by fetching account info
    const account = await twilio.api.accounts(accountSid).fetch();
    
    console.log('Twilio Test - Account fetch successful:', {
      sid: account.sid,
      status: account.status,
      type: account.type
    });

    // Test fetching a small number of messages
    const messages = await twilio.messages.list({ limit: 5 });
    
    console.log('Twilio Test - Messages fetch successful:', {
      messageCount: messages.length,
      firstMessage: messages[0] ? {
        sid: messages[0].sid,
        from: messages[0].from,
        to: messages[0].to,
        direction: messages[0].direction,
        status: messages[0].status
      } : 'No messages'
    });

    return NextResponse.json({
      success: true,
      account: {
        sid: account.sid,
        status: account.status,
        type: account.type
      },
      messages: {
        count: messages.length,
        sample: messages[0] ? {
          sid: messages[0].sid,
          from: messages[0].from,
          to: messages[0].to,
          direction: messages[0].direction,
          status: messages[0].status,
          dateSent: messages[0].dateSent
        } : null
      },
      config: {
        accountSid: !!accountSid,
        authToken: !!authToken,
        fromPhone: !!fromPhone,
        publicPhone: !!publicPhone,
      }
    });

  } catch (error: any) {
    console.error('Twilio Test - Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown Twilio error',
      code: error.code,
      status: error.status,
      details: error.details || error.toString(),
      config: {
        accountSid: !!accountSid,
        authToken: !!authToken,
        fromPhone: !!fromPhone,
        publicPhone: !!publicPhone,
      }
    }, { status: 500 });
  }
} 