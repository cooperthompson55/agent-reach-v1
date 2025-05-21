import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

export async function sendSMS(leadId: string, message: string) {
  try {
    // Get the lead's phone number
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('phone_numbers')
      .eq('id', leadId)
      .single();

    if (leadError) throw leadError;
    if (!lead.phone_numbers || lead.phone_numbers.length === 0) {
      throw new Error('No phone number found for this lead');
    }

    // Format the phone number to E.164 format
    const formattedPhone = formatPhoneNumber(lead.phone_numbers[0]);

    // Send SMS using Twilio
    const response = await fetch('/.netlify/functions/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send SMS');
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
} 