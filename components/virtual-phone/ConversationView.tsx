'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Contact, Message } from './VirtualPhoneInterface'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Paperclip, CheckCheck, Clock, ArrowLeft, MessageSquare, Loader2 } from 'lucide-react'
import ContactDetailsModal from '@/components/contacts/ContactDetailsModal'
import SmsTemplateModal from '@/components/sms-template-modal'
import { supabase } from '@/lib/supabase'

interface ConversationViewProps {
  contact: Contact
  onBack: () => void
}

export default function ConversationView({ contact, onBack }: ConversationViewProps) {
  const [messageText, setMessageText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [agents, setAgents] = useState<{ agent_name: string, agent_phone: string }[]>([])
  const [contactDetailsOpen, setContactDetailsOpen] = useState(false)
  const [smsModalOpen, setSmsModalOpen] = useState(false)
  const [smsContact, setSmsContact] = useState<Contact | null>(null)
  const [smsListings, setSmsListings] = useState<any[]>([])
  const [fullContactDetails, setFullContactDetails] = useState<any | null>(null)
  const [loadingContactDetails, setLoadingContactDetails] = useState(false)

  // Helper to map API messages to Message type
  const mapMessages = (msgs: any[]): Message[] =>
    msgs.map((msg: any) => ({
      id: msg.sid,
      content: msg.body,
      timestamp: new Date(msg.dateSent).toLocaleString(),
      isIncoming: msg.direction.startsWith('inbound'),
      status: msg.status,
    }))

  // Initial fetch (latest messages)
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?contact=${encodeURIComponent(contact.phone)}&limit=30`)
      const data = await res.json()
      if (data.messages) {
        setMessages(mapMessages(data.messages))
        setHasMore(data.hasMore)
        setNextCursor(data.nextCursor)
      }
    } catch (e) {}
  }, [contact.phone])

  // Fetch older messages (pagination)
  const fetchOlderMessages = async () => {
    if (!hasMore || loadingMore || !nextCursor) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/messages?contact=${encodeURIComponent(contact.phone)}&limit=30&before=${encodeURIComponent(nextCursor)}`)
      const data = await res.json()
      if (data.messages && data.messages.length > 0) {
        setMessages(prev => [...mapMessages(data.messages), ...prev])
        setHasMore(data.hasMore)
        setNextCursor(data.nextCursor)
      } else {
        setHasMore(false)
      }
    } catch (e) {
      setHasMore(false)
    }
    setLoadingMore(false)
  }

  // On mount or contact change, load latest messages
  useEffect(() => {
    setMessages([])
    setHasMore(true)
    setNextCursor(null)
    fetchMessages()
  }, [fetchMessages])

  // Poll for new messages every 10s
  useEffect(() => {
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  // Scroll to bottom on new messages (if not loading more)
  useEffect(() => {
    if (!loadingMore) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loadingMore])

  // Fetch agents for display name
  useEffect(() => {
    const fetchAgents = async () => {
      const res = await fetch('/api/contacts')
      const data = await res.json()
      if (data.contacts) setAgents(data.contacts)
    }
    fetchAgents()
  }, [])

  // Infinite scroll: load more when scrolled to top
  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (!container || loadingMore || !hasMore) return
    if (container.scrollTop < 50) {
      fetchOlderMessages()
    }
  }

  const handleSendMessage = async () => {
    if (messageText.trim() === '') return
    try {
      await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: contact.phone, body: messageText })
      })
      setMessageText('')
      fetchMessages() // Refresh after sending
    } catch (e) {}
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Find agent name for this conversation
  const agent = agents.find(a => a.agent_phone === contact.phone)
  const displayName = contact.name || (agent ? agent.agent_name : contact.phone)

  // Helper to normalize phone numbers to digits only, with optional country code handling
  function normalizePhone(phone: string): string {
    let digits = (phone || '').replace(/\D/g, '')
    if (digits.length === 10) {
      digits = '1' + digits
    }
    return '+' + digits
  }

  // Handler to open SMS modal with listings (copied from MessageList)
  const handleMessageIconClick = async () => {
    // Normalize phone for querying
    const normalizedPhone = normalizePhone(contact.phone);

    // Try to fetch listings with both name and phone
    let { data } = await supabase
      .from('listings')
      .select('id, property_address, property_city, agent_name, agent_phone')
      .eq('agent_name', contact.name)
      .eq('agent_phone', normalizedPhone);

    // If no listings, try with just phone
    if (!data || data.length === 0) {
      const alt = await supabase
        .from('listings')
        .select('id, property_address, property_city, agent_name, agent_phone')
        .eq('agent_phone', normalizedPhone);
      data = alt.data;
    }

    // If still no listings, try with just name
    if ((!data || data.length === 0) && contact.name) {
      const alt = await supabase
        .from('listings')
        .select('id, property_address, property_city, agent_name, agent_phone')
        .eq('agent_name', contact.name);
      data = alt.data;
    }

    setSmsListings(data || []);

    // Use agent_name and agent_phone from the first listing if available
    let modalContact = contact;
    if (data && data.length > 0) {
      modalContact = {
        ...contact,
        name: data[0].agent_name || contact.name,
        phone: data[0].agent_phone || contact.phone,
      };
    }

    setSmsContact(modalContact);
    setSmsModalOpen(true);
  };

  // Fetch full contact details when opening the modal
  const handleOpenContactDetails = async () => {
    setLoadingContactDetails(true)
    // Try to fetch by phone (normalized)
    let normalizedPhone = contact.phone
    if (normalizedPhone && !normalizedPhone.startsWith('+')) {
      let digits = normalizedPhone.replace(/\D/g, '')
      if (digits.length === 10) digits = '1' + digits
      normalizedPhone = '+' + digits
    }
    let { data, error } = await supabase
      .from('contacts')
      .select('*')
      .or(`agent_phone.eq.${normalizedPhone},phone.eq.${normalizedPhone}`)
      .limit(1)
      .single()
    // If not found, try by name
    if ((!data || error) && contact.name) {
      const alt = await supabase
        .from('contacts')
        .select('*')
        .eq('agent_name', contact.name)
        .limit(1)
        .single()
      data = alt.data
    }
    // Fetch listings for this contact
    let listingsCount = 0
    if (data?.agent_name && data?.agent_phone) {
      const { data: listingsData } = await supabase
        .from('listings')
        .select('id')
        .eq('agent_name', data.agent_name)
        .eq('agent_phone', data.agent_phone)
      listingsCount = listingsData ? listingsData.length : 0
    }
    // Ensure contact_logs is present and is an array
    let logs = data?.contact_logs || []
    if (typeof logs === 'string') {
      try {
        logs = JSON.parse(logs)
      } catch {
        logs = []
      }
    }
    // Compute lastContact from logs if possible
    let lastContact = ''
    if (Array.isArray(logs) && logs.length > 0) {
      const lastLog = logs.reduce((latest, log) => {
        if (!log.timestamp) return latest
        if (!latest) return log
        return new Date(log.timestamp) > new Date(latest.timestamp) ? log : latest
      }, null)
      if (lastLog && lastLog.timestamp) {
        lastContact = new Date(lastLog.timestamp).toLocaleString()
      }
    }
    // Enrich the contact object to match the shape expected by ContactDetailsModal
    const enriched = {
      id: data?.id || contact.id || '',
      name: data?.agent_name || contact.name || '',
      email: data?.agent_email || data?.email || '',
      phone: data?.agent_phone || contact.phone || '',
      brokerage: data?.brokerage || data?.brokerage_name || '',
      instagram: data?.instagram_account || '',
      listings: listingsCount,
      lastContact,
      avatar: (data?.agent_name || contact.name || ' ')[0],
      favorite: !!data?.favorite,
      agent_tags: data?.agent_tags || '',
      agent_status: data?.agent_status || '',
      contact_logs: logs,
      ...data,
      ...Object.fromEntries(Object.entries(contact).filter(([k]) => !['id','name','phone','avatar','role','isOnline','isReceived','lastMessage','lastMessageTime','unreadCount'].includes(k)))
    }
    setFullContactDetails(enriched)
    setLoadingContactDetails(false)
    setContactDetailsOpen(true)
  }

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-zinc-900">
      <div className="flex items-center p-4 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="flex items-center space-x-3 flex-1">
          <Avatar className="h-10 w-10 bg-gray-200 dark:bg-zinc-800">
            <div className="font-medium text-lg text-gray-700 dark:text-zinc-100">
              {displayName.charAt(0)}
            </div>
          </Avatar>
          <div>
            <h3
              className="text-sm font-medium text-gray-900 dark:text-zinc-100 cursor-pointer hover:underline"
              onClick={handleOpenContactDetails}
              title="View contact details"
            >
              {displayName}
            </h3>
            {contact.role && <p className="text-xs text-gray-500 dark:text-zinc-400">{contact.role}</p>}
          </div>
        </div>
        {/* Message icon button */}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={handleMessageIconClick}
          title="Send SMS"
        >
          <MessageSquare className="h-5 w-5 text-blue-500" />
        </Button>
      </div>
      
      <div
        className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-zinc-900"
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {loadingMore && (
          <div className="flex justify-center py-2 text-xs text-gray-500 dark:text-zinc-400">Loading more...</div>
        )}
        {(messages.length > 1000 ? messages.slice(-1000) : messages).map((message) => (
          <div 
            key={message.id} 
            className={`flex mb-4 ${message.isIncoming ? 'justify-start' : 'justify-end'}`}
          >
            <div 
              className={`max-w-[75%] rounded-lg px-4 py-2 ${
                message.isIncoming 
                  ? 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 border border-gray-200 dark:border-zinc-700' 
                  : 'bg-blue-500 dark:bg-blue-600 text-white'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <div className={`flex items-center justify-end mt-1 text-xs ${
                message.isIncoming ? 'text-gray-500 dark:text-zinc-400' : 'text-blue-100'
              }`}>
                <span>{message.timestamp}</span>
                {!message.isIncoming && message.status && (
                  <span className="ml-1">
                    {message.status === 'sent' && <Clock className="h-3 w-3" />}
                    {message.status === 'delivered' && <CheckCheck className="h-3 w-3" />}
                    {message.status === 'read' && <CheckCheck className="h-3 w-3 text-blue-200" />}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
            <Paperclip className="h-5 w-5 text-gray-500 dark:text-zinc-400" />
          </Button>
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 rounded-full bg-white dark:bg-zinc-800 dark:text-zinc-100"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={messageText.trim() === ''}
            className="rounded-full bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white"
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {contactDetailsOpen && (
        loadingContactDetails ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          </div>
        ) : (
          <ContactDetailsModal
            contact={fullContactDetails || contact}
            onClose={() => setContactDetailsOpen(false)}
          />
        )
      )}
      {smsModalOpen && smsContact && (
        <SmsTemplateModal
          isOpen={smsModalOpen}
          onClose={() => setSmsModalOpen(false)}
          agentName={smsContact.name}
          agentPhone={smsContact.phone}
          contacts={[{ name: smsContact.name, phone: smsContact.phone }]}
          listings={smsListings}
          agentListingsMap={{ [`${smsContact.name}|${smsContact.phone}`]: smsListings }}
        />
      )}
    </div>
  )
} 