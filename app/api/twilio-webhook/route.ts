import { NextResponse } from 'next/server';
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const from = data.get('From');
    const to = data.get('To');
    const body = data.get('Body');
    // Log the received SMS in contact_logs
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('id, contact_logs')
      .eq('agent_phone', from)
      .limit(1)
      .single();
    let logs = [];
    if (listing && listing.contact_logs) {
      try {
        logs = Array.isArray(listing.contact_logs) ? listing.contact_logs : JSON.parse(listing.contact_logs);
      } catch {
        logs = [];
      }
    }
    logs.push({
      type: 'sms',
      message: body,
      timestamp: new Date().toISOString(),
      sent_by: from,
      to,
      direction: 'inbound',
    });
    if (listing && listing.id) {
      await supabase
        .from('listings')
        .update({ contact_logs: logs })
        .eq('id', listing.id);
    }
    // For now, just log the message. You can extend this to store in DB, etc.
    console.log('Incoming SMS:', { from, to, body });
    return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process webhook' }, { status: 500 });
  }
} 