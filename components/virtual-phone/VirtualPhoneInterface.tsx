'use client'

import { useState } from 'react'
import MessageList from './MessageList'
import ConversationView from './ConversationView'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Settings } from 'lucide-react'

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
  const [showDebug, setShowDebug] = useState(false)
  const [debugResult, setDebugResult] = useState<any>(null)

  const handleBackToList = () => {
    setSelectedContact(null)
  }

  const runDiagnostic = async () => {
    try {
      const response = await fetch('/api/twilio-test')
      const result = await response.json()
      setDebugResult(result)
      console.log('Diagnostic result:', result)
    } catch (error) {
      setDebugResult({ error: error instanceof Error ? error.message : 'Unknown error' })
      console.error('Diagnostic error:', error)
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-zinc-800 max-w-2xl mx-auto min-h-screen h-screen flex flex-col">
      {selectedContact ? (
        <div className="flex flex-col flex-1 h-full">
          <div className="md:hidden flex items-center p-3 border-b dark:border-zinc-800">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBackToList}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-medium">{selectedContact.name}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <ConversationView contact={selectedContact} onBack={handleBackToList} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 h-full">
          <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Messages</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Debug
            </Button>
          </div>

          {showDebug && (
            <div className="p-4 border-b dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <Button onClick={runDiagnostic} size="sm">
                  Test Twilio Connection
                </Button>
              </div>
              {debugResult && (
                <div className="mt-2 p-2 bg-white dark:bg-zinc-900 rounded border text-xs">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(debugResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <MessageList onSelectContact={setSelectedContact} />
          </div>
        </div>
      )}
    </div>
  )
} 