import { NextResponse } from 'next/server';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromPhone = process.env.TWILIO_PHONE_NUMBER!;

const twilio = require('twilio')(accountSid, authToken);

export async function POST(request: Request) {
  try {
    const { to, body } = await request.json();

    if (!to || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const message = await twilio.messages.create({
      body,
      from: fromPhone,
      to,
    });

    return NextResponse.json({ success: true, sid: message.sid });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to send SMS' }, { status: 500 });
  }
} 