import { NextResponse } from 'next/server';
import { Resend } from 'resend';
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const from = data.get('From');
    const to = data.get('To');
    const body = data.get('Body');
    // Log the received SMS in contact_logs
    const { data: listings, error: fetchError } = await supabase
      .from('listings')
      .select('id, contact_logs')
      .eq('agent_phone', from);
    if (listings && Array.isArray(listings) && listings.length > 0) {
      for (const listing of listings) {
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
        await supabase
          .from('listings')
          .update({ contact_logs: logs })
          .eq('id', listing.id);
      }
    }
    // Send email notification
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const virtualPhoneUrl = `${baseUrl}/virtual-phone`;
      
      await resend.emails.send({
        from: 'Cooper Thompson <cooper@rephotos.ca>',
        to: ['cooperthompson55955@gmail.com'],
        subject: 'New Message Received',
        text: `New message received from ${from}:\n\n${body}\n\nClick here to view and reply: ${virtualPhoneUrl}`,
        html: `
          <h2>New Message Received</h2>
          <p><strong>From:</strong> ${from}</p>
          <p><strong>Message:</strong></p>
          <p style="padding: 10px; background: #f5f5f5; border-radius: 4px;">${body}</p>
          <p><a href="${virtualPhoneUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">View and Reply</a></p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't throw the error - we still want to acknowledge the SMS
    }

    return new Response('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process webhook' }, { status: 500 });
  }
} 