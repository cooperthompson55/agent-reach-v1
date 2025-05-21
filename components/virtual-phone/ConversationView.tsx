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

// Mock messages for demonstration
const generateMockMessages = (contactId: string): Message[] => {
  const messages: Message[] = []
  
  if (contactId === '1') { // Sarah Johnson conversation
    messages.push(
      {
        id: '1-1',
        content: 'Hello! How can I help you today?',
        timestamp: '10:15 AM',
        isIncoming: true
      },
      {
        id: '1-2',
        content: 'Hi Sarah, I\'m wondering about my recent order #45678.',
        timestamp: '10:20 AM',
        isIncoming: false,
        status: 'read'
      },
      {
        id: '1-3',
        content: 'I\'ll check on your order status right away.',
        timestamp: '10:30 AM',
        isIncoming: true
      }
    )
  } else {
    // Generic conversation for other contacts
    messages.push(
      {
        id: `${contactId}-1`,
        content: 'Hello there!',
        timestamp: 'Yesterday',
        isIncoming: true
      },
      {
        id: `${contactId}-2`,
        content: 'Hi, thanks for reaching out.',
        timestamp: 'Yesterday',
        isIncoming: false,
        status: 'read'
      },
      {
        id: `${contactId}-3`,
        content: 'How can I assist you today?',
        timestamp: 'Just now',
        isIncoming: false,
        status: 'delivered'
      }
    )
  }
  
  return messages
}

export default function ConversationView({ contact, onBack }: ConversationViewProps) {
  const [messageText, setMessageText] = useState('')
  const [messages, setMessages] = useState<Message[]>(() => generateMockMessages(contact.id))
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (messageText.trim() === '') return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: messageText,
      timestamp: 'Just now',
      isIncoming: false,
      status: 'sent'
    }

    setMessages([...messages, newMessage])
    setMessageText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
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
              {contact.name.charAt(0)}
            </div>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100">{contact.name}</h3>
            {contact.role && <p className="text-xs text-gray-500 dark:text-zinc-400">{contact.role}</p>}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-zinc-900">
        {messages.map((message) => (
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