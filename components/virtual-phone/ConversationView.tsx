'use client'

import { useState, useRef, useEffect } from 'react'
import { Contact, Message } from './VirtualPhoneInterface'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Paperclip, CheckCheck, Clock, ArrowLeft } from 'lucide-react'

interface ConversationViewProps {
  contact: Contact
  onBack: () => void
}

export default function ConversationView({ contact, onBack }: ConversationViewProps) {
  const [messageText, setMessageText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [agents, setAgents] = useState<{ agent_name: string, agent_phone: string }[]>([])

  // Fetch messages from backend
  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?contact=${encodeURIComponent(contact.phone)}`)
      const data = await res.json()
      if (data.messages) {
        // Map Twilio messages to Message type
        const mapped: Message[] = data.messages.map((msg: any) => ({
          id: msg.sid,
          content: msg.body,
          timestamp: new Date(msg.dateSent).toLocaleString(),
          isIncoming: msg.direction.startsWith('inbound'),
          status: msg.status,
        }))
        setMessages(mapped)
      }
    } catch (e) {
      // Optionally handle error
    }
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [contact.phone])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const fetchAgents = async () => {
      const res = await fetch('/api/contacts')
      const data = await res.json()
      if (data.contacts) setAgents(data.contacts)
    }
    fetchAgents()
  }, [])

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
  const displayName = agent ? agent.agent_name : contact.phone

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
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{displayName}</h3>
            {contact.role && <p className="text-xs text-gray-500 dark:text-zinc-400">{contact.role}</p>}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-zinc-900">
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
    </div>
  )
} 