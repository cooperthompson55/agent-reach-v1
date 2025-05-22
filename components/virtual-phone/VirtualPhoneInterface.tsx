'use client'

import { useState } from 'react'
import MessageList from './MessageList'
import ConversationView from './ConversationView'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export type Contact = {
  id: string
  name: string
  phone: string
  lastMessage: string
  lastMessageTime: string
  unreadCount?: number
  isOnline?: boolean
  avatar?: string
  role?: string
  isReceived?: boolean
}

export type Message = {
  id: string
  content: string
  timestamp: string
  isIncoming: boolean
  status?: 'sent' | 'delivered' | 'read'
}

export default function VirtualPhoneInterface() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  const handleBackToList = () => {
    setSelectedContact(null)
  }

    return (    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-zinc-800 max-w-2xl mx-auto">      {selectedContact ? (        <div className="flex flex-col h-[600px]">          <div className="md:hidden flex items-center p-3 border-b dark:border-zinc-800">            <Button               variant="ghost"               size="icon"               onClick={handleBackToList}              className="mr-2"            >              <ArrowLeft className="h-5 w-5" />            </Button>            <span className="font-medium">{selectedContact.name}</span>          </div>          <div className="flex-1 overflow-hidden">            <ConversationView contact={selectedContact} onBack={handleBackToList} />          </div>        </div>      ) : (
        <div className="h-[600px]">
          <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Messages</h2>
          </div>
          <MessageList onSelectContact={setSelectedContact} />
        </div>
      )}
    </div>
  )
} 