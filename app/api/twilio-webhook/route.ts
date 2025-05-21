import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const from = data.get('From');
    const to = data.get('To');
    const body = data.get('Body');
    // For now, just log the message. You can extend this to store in DB, etc.
    console.log('Incoming SMS:', { from, to, body });
    return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process webhook' }, { status: 500 });
  }
} 