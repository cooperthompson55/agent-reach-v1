import { NextResponse } from 'next/server';
const { createClient } = require('@supabase/supabase-js');

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromPhone = process.env.TWILIO_PHONE_NUMBER!;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const twilio = require('twilio')(accountSid, authToken);
const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Log the sent SMS in contact_logs
    const { data, error: fetchError } = await supabase
      .from('listings')
      .select('id, contact_logs')
      .eq('agent_phone', to)
      .limit(1)
      .single();
    let logs = [];
    if (data && data.contact_logs) {
      try {
        logs = Array.isArray(data.contact_logs) ? data.contact_logs : JSON.parse(data.contact_logs);
      } catch {
        logs = [];
      }
    }
    logs.push({
      type: 'sms',
      message: body,
      timestamp: new Date().toISOString(),
      sent_by: 'Cooper',
      to,
      direction: 'outbound',
    });
    if (data && data.id) {
      // Determine if we should update status
      let updateFields: any = { contact_logs: logs };
      const lockedStatuses = ['Interested', 'Not Interested', 'Client', 'Bad Lead'];
      // Fetch current status
      const { data: statusData } = await supabase
        .from('listings')
        .select('agent_status')
        .eq('id', data.id)
        .single();
      const currentStatus = statusData?.agent_status || 'Not Contacted';
      if (!lockedStatuses.includes(currentStatus) && currentStatus !== 'Contacted') {
        updateFields = { ...updateFields, agent_status: 'Contacted' };
      }
      await supabase
        .from('listings')
        .update(updateFields)
        .eq('id', data.id);
    }

    return NextResponse.json({ success: true, sid: message.sid });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to send SMS' }, { status: 500 });
  }
} 