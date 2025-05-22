import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  const { agentEmail, agentPhone, agentName, status, logEntry, property_id } = await request.json()
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
  if (property_id) {
    query = query.eq('id', property_id)
  }
  // If logEntry is provided, fetch current logs, append, and update
  if (logEntry) {
    // Get all matching rows for this agent
    let logQuery = supabase
      .from('listings')
      .select('id, contact_logs')
      .eq('agent_name', agentName)
      .eq(agentEmail ? 'agent_email' : 'agent_phone', agentEmail || agentPhone)
    const { data: rows, error: fetchError } = await logQuery
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No listings found for this agent' }, { status: 404 })
    }
    // For each row, append the log and set status
    for (const row of rows) {
      let logs = []
      if (row && row.contact_logs) {
        try {
          logs = Array.isArray(row.contact_logs) ? row.contact_logs : JSON.parse(row.contact_logs)
        } catch {
          logs = []
        }
      }
      logs.push(logEntry)
      await supabase
        .from('listings')
        .update({ agent_status: status, contact_logs: logs })
        .eq('id', row.id)
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