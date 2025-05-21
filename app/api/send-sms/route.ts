import { NextResponse } from 'next/server';
import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Format phone number to E.164 format
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If the number starts with 1, add +1
  if (cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // If it's a 10-digit number, add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If it's already in E.164 format, return as is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // Default case: assume it's a 10-digit number and add +1
  return `+1${cleaned}`;
}

export async function POST(request: Request) {
  try {
    // Debug environment variables
    console.log('All environment variables:', {
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
      NODE_ENV: process.env.NODE_ENV,
    });

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error('Missing environment variables:', {
        accountSid: !accountSid,
        authToken: !authToken,
        twilioPhoneNumber: !twilioPhoneNumber
      });
      return NextResponse.json(
        { error: 'Missing required Twilio environment variables' },
        { status: 500 }
      );
    }

    const client = twilio(accountSid, authToken);

    const { to, message } = await request.json();

    // Validate required fields
    if (!to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Original phone number:', to);
    
    // Format the phone number to E.164 format
    const formattedPhone = formatPhoneNumber(to);
    console.log('Formatted phone number:', formattedPhone);

    // Send SMS using Twilio
    const data = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone,
    });

    console.log('Twilio response:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
} 