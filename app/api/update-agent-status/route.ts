import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  const { agentEmail, agentPhone, agentName, status, logEntry } = await request.json()
  if (!agentName || !status || (!agentEmail && !agentPhone)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  let query = supabase.from('listings').update({ agent_status: status }).eq('agent_name', agentName)
  if (agentEmail) {
    query = query.eq('agent_email', agentEmail)
  }
  if (agentPhone) {
    query = query.eq('agent_phone', agentPhone)
  }
  // If logEntry is provided, fetch current logs, append, and update
  if (logEntry) {
    // Get the first matching row
    const { data, error: fetchError } = await supabase
      .from('listings')
      .select('contact_logs')
      .eq('agent_name', agentName)
      .eq(agentEmail ? 'agent_email' : 'agent_phone', agentEmail || agentPhone)
      .limit(1)
      .single()
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }
    let logs = []
    if (data && data.contact_logs) {
      try {
        logs = Array.isArray(data.contact_logs) ? data.contact_logs : JSON.parse(data.contact_logs)
      } catch {
        logs = []
      }
    }
    logs.push(logEntry)
    // Update both status and logs
    const { error: updateError } = await supabase
      .from('listings')
      .update({ agent_status: status, contact_logs: logs })
      .eq('agent_name', agentName)
      .eq(agentEmail ? 'agent_email' : 'agent_phone', agentEmail || agentPhone)
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }
  // Otherwise, just update status
  const { error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
} 