'use client'

import { useState, useEffect, useRef } from 'react'
import { Contact as BaseContact } from './VirtualPhoneInterface'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog'

type Contact = BaseContact & {
  lastMessageId?: string
  lastMessageDirection?: string
  listings?: any[]
}

interface MessageListProps {
  onSelectContact: (contact: Contact) => void
}

export default function MessageList({ onSelectContact }: MessageListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [agents, setAgents] = useState<{ agent_name: string, agent_phone: string }[]>([])
  const [readConversations, setReadConversations] = useState<Record<string, string>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingReadContact, setPendingReadContact] = useState<Contact | null>(null)
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null)

  const TWILIO_PHONE = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || ''

  // Load read conversations from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('virtualPhoneReadConversations')
    if (stored) setReadConversations(JSON.parse(stored))
  }, [])

  // Save read conversations to localStorage
  useEffect(() => {
    localStorage.setItem('virtualPhoneReadConversations', JSON.stringify(readConversations))
  }, [readConversations])

  useEffect(() => {
    const fetchAgents = async () => {
      const res = await fetch('/api/contacts')
      const data = await res.json()
      if (data.contacts) {
        // Deduplicate by agent_phone, prefer non-empty agent_name
        const uniqueAgents: { [phone: string]: string } = {}
        data.contacts.forEach((a: any) => {
          const phone = (a.agent_phone || '').replace(/\D/g, '') // normalize to digits only
          if (phone && (!uniqueAgents[phone] || (a.agent_name && a.agent_name.trim()))) {
            uniqueAgents[phone] = a.agent_name?.trim() || phone
          }
        })
        setAgents(Object.entries(uniqueAgents).map(([agent_phone, agent_name]) => ({ agent_phone, agent_name })))
      }
    }
    fetchAgents()
  }, [])

  useEffect(() => {
    const fetchContacts = async () => {
      const res = await fetch('/api/messages?contact=all')
      const data = await res.json()
      const messages = data.contacts || data.messages; // support both keys
      if (messages) {
        // Map Twilio message to Contact type, using agent name if available
        const mapped: Contact[] = messages.map((msg: any, idx: number) => {
          // Determine the other party (not your own Twilio number)
          const otherPhoneRaw = msg.from === TWILIO_PHONE ? msg.to : msg.from
          const otherPhone = (otherPhoneRaw || '').replace(/\D/g, '') // normalize
          if (otherPhone === TWILIO_PHONE.replace(/\D/g, '')) return null // skip self
          const agent = agents.find(a => (a.agent_phone || '').replace(/\D/g, '') === otherPhone)
          // Determine if the last message was received (inbound)
          const isReceived = msg.direction && msg.direction.startsWith('inbound');
          // Use a stable message ID: sid if available, else timestamp string, else idx
          let stableId: string
          if (msg.sid) {
            stableId = msg.sid
          } else if (msg.dateSent) {
            stableId = new Date(msg.dateSent).getTime().toString()
          } else {
            stableId = idx.toString()
          }
          return {
            id: otherPhone + idx,
            name: agent ? agent.agent_name : otherPhoneRaw,
            phone: otherPhoneRaw,
            lastMessage: msg.body,
            lastMessageTime: new Date(msg.dateSent).toLocaleString(),
            isReceived,
            lastMessageId: stableId,
            lastMessageDirection: msg.direction,
          }
        }).filter(Boolean)
        setContacts(mapped)
      }
    }
    fetchContacts()
  }, [agents])

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  )

  // Sort so unread appear first
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    const aUnread = a.isReceived && (!readConversations[a.phone] || readConversations[a.phone] !== a.lastMessageId)
    const bUnread = b.isReceived && (!readConversations[b.phone] || readConversations[b.phone] !== b.lastMessageId)
    if (aUnread === bUnread) return 0
    return aUnread ? -1 : 1
  })

  // Handler for click/shift-click/long-press
  const handleContactClick = (contact: Contact, event: React.MouseEvent) => {
    if (event.shiftKey) {
      setPendingReadContact(contact)
      setDialogOpen(true)
    } else {
      onSelectContact(contact)
    }
  }

  // Mobile: handle long press
  const handleTouchStart = (contact: Contact) => {
    longPressTimeout.current = setTimeout(() => {
      setPendingReadContact(contact)
      setDialogOpen(true)
    }, 500)
  }
  const handleTouchEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current)
      longPressTimeout.current = null
    }
  }

  // Helper to mark as read and persist immediately
  const markAsRead = (contact: Contact) => {
    if (!contact.isReceived || !contact.lastMessageId) return
    setReadConversations(prev => {
      const updated = { ...prev, [contact.phone]: contact.lastMessageId as string }
      localStorage.setItem('virtualPhoneReadConversations', JSON.stringify(updated))
      return updated
    })
  }

  const confirmMarkAsRead = () => {
    if (pendingReadContact) {
      markAsRead(pendingReadContact)
    }
    setDialogOpen(false)
    setPendingReadContact(null)
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Seen?</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to mark this conversation as seen? It will remove the blue dot until a new message is received.</div>
          <DialogFooter>
            <button
              className="px-4 py-2 rounded bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600"
              onClick={() => setDialogOpen(false)}
            >Cancel</button>
            <button
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              onClick={confirmMarkAsRead}
            >Mark as Seen</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="p-3 border-b dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400 dark:text-zinc-400" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-white dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1 bg-white dark:bg-zinc-900">
        {sortedContacts.map(contact => (
          <div 
            key={contact.id}
            className="border-b dark:border-zinc-800 p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer"
            onClick={(e) => handleContactClick(contact, e)}
            onTouchStart={() => handleTouchStart(contact)}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-10 w-10 bg-gray-200 dark:bg-zinc-800">
                  <div className="font-medium text-lg text-gray-700 dark:text-zinc-100">
                    {contact.name.charAt(0)}
                  </div>
                </Avatar>
                {contact.isOnline && (
                  <span className="absolute bottom-0 right-0 rounded-full h-3 w-3 bg-green-500 ring-2 ring-white dark:ring-zinc-900"></span>
                )}
                {/* Show blue dot only if isReceived and not marked as read for this message */}
                {contact.isReceived &&
                  (!readConversations[contact.phone] || readConversations[contact.phone] !== contact.lastMessageId) && (
                  <span className="absolute top-0 right-0 rounded-full h-3 w-3 bg-blue-500 ring-2 ring-white dark:ring-zinc-900"></span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate flex items-center gap-2">
                    {contact.name}
                    {/* High Value Tag */}
                    {Array.isArray(contact.listings) && contact.listings.some((l: any) => l.price > 1500000) && (
                      <span className="ml-2 px-2 py-0.5 rounded bg-yellow-400 text-xs font-semibold text-yellow-900">High Value</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{contact.lastMessageTime}</p>
                </div>
                
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{contact.lastMessage}</p>
                  {contact.unreadCount && (
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500 dark:bg-blue-600 text-xs font-medium text-white">
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 