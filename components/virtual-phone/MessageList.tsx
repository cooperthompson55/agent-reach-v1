'use client'

import { useState, useEffect } from 'react'
import { Contact } from './VirtualPhoneInterface'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Search } from 'lucide-react'

interface MessageListProps {
  onSelectContact: (contact: Contact) => void
}

export default function MessageList({ onSelectContact }: MessageListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [agents, setAgents] = useState<{ agent_name: string, agent_phone: string }[]>([])

  const TWILIO_PHONE = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || ''

  useEffect(() => {
    const fetchAgents = async () => {
      const res = await fetch('/api/contacts')
      const data = await res.json()
      if (data.contacts) setAgents(data.contacts)
    }
    fetchAgents()
  }, [])

  useEffect(() => {
    const fetchContacts = async () => {
      const res = await fetch('/api/messages?contact=all')
      const data = await res.json()
      if (data.contacts) {
        // Map Twilio message to Contact type, using agent name if available
        const mapped: Contact[] = data.contacts.map((msg: any, idx: number) => {
          // Determine the other party (not your own Twilio number)
          const otherPhone = msg.from === TWILIO_PHONE ? msg.to : msg.from
          if (otherPhone === TWILIO_PHONE) return null // skip self
          const agent = agents.find(a => a.agent_phone === otherPhone)
          return {
            id: otherPhone + idx,
            name: agent ? agent.agent_name : otherPhone,
            phone: otherPhone,
            lastMessage: msg.body,
            lastMessageTime: new Date(msg.dateSent).toLocaleString(),
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

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
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
        {filteredContacts.map(contact => (
          <div 
            key={contact.id}
            className="border-b dark:border-zinc-800 p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer"
            onClick={() => onSelectContact(contact)}
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
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{contact.name}</p>
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
      
      <div className="p-4 border-t dark:border-zinc-800 flex justify-between bg-white dark:bg-zinc-900">
        <button className="flex items-center justify-center w-full py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md text-sm font-medium text-gray-900 dark:text-zinc-100">
          Messages
        </button>
        <button className="flex items-center justify-center w-full py-2 rounded-md text-sm font-medium text-gray-900 dark:text-zinc-100">
          Contacts
        </button>
      </div>
    </div>
  )
} 