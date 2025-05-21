"use client"

import { useState, useEffect } from "react"
import { X, MessageSquare } from "lucide-react" // Added MessageSquare for SMS icon
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// SMS template data (placeholder)
const smsTemplates = [
  {
    id: "welcome-sms",
    name: "Welcome SMS",
    body: `Hi {FirstName},

Thanks for your interest in {PropertyAddress}. I'll be in touch shortly.

Cooper Thompson
905-299-9300
RePhotos.ca`,
  },
  {
    id: "showing-reminder-sms",
    name: "Showing Reminder",
    body: `Hi {FirstName},

Just a friendly reminder about our showing for {PropertyAddress} tomorrow at {Time}.

See you then,
Cooper Thompson`,
  },
]

interface SmsTemplate {
  id: string;
  name: string;
  body: string;
}

interface SmsTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
  agentPhone: string; // Changed from agentEmail
  propertyAddress: string;
  town?: string;
}

export default function SmsTemplateModal({ 
  isOpen, 
  onClose, 
  agentName, 
  agentPhone, 
  propertyAddress,
  town = "the area"
}: SmsTemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate>(smsTemplates[0])
  const [smsBody, setSmsBody] = useState("")
  const [toPhone, setToPhone] = useState(agentPhone || "") // Changed from toEmail
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setToPhone(agentPhone || "")
  }, [agentPhone])

  const replaceVariables = (text: string) => {
    const variables: Record<string, string> = {
      FirstName: agentName?.split(" ")[0] || "",
      AgentName: agentName || "",
      AgentPhone: agentPhone || "", // Changed from AgentEmail
      PropertyAddress: propertyAddress || "",
      Town: town || "the area",
      // Add any other SMS-specific variables here, e.g., Time for reminders
      Time: "2:00 PM", // Placeholder for Time variable
    }

    return text.replace(/\{([^}]+)\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match
    })
  }

  const applyTemplate = (template: SmsTemplate) => {
    setSelectedTemplate(template)
    setSmsBody(replaceVariables(template.body))
  }

  useEffect(() => {
    if (smsTemplates.length > 0) {
      applyTemplate(smsTemplates[0])
    }
  }, [agentName, agentPhone, propertyAddress, town]) // Re-apply when props change

  const handleSendSms = async () => {
    try {
      setIsSending(true)
      setError(null)

      const finalBody = replaceVariables(smsBody)

      // Placeholder for actual SMS sending logic
      console.log("Sending SMS:", {
        to: toPhone,
        body: finalBody,
      })
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000)); 

      // const response = await fetch('/api/send-sms', { // This would be the actual API endpoint
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     to: toPhone,
      //     body: finalBody,
      //   }),
      // })

      // const data = await response.json()

      // if (!response.ok) {
      //   throw new Error(data.error || 'Failed to send SMS')
      // }

      alert('SMS sent successfully!') // Placeholder success message
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send SMS')
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"> {/* Adjusted width slightly */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> {/* SMS Icon */}
            <span className="text-xl">Create SMS</span>
          </DialogTitle>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="toPhone" className="block text-sm font-medium mb-1"> {/* Changed htmlFor to toPhone */}
              To
            </label>
            <Input 
              id="toPhone" 
              value={toPhone} 
              onChange={(e) => setToPhone(e.target.value)}
              placeholder="Enter recipient phone number" // Changed placeholder
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Templates</label>
            <div className="flex flex-wrap gap-2">
              {smsTemplates.map((template) => (
                <Button
                  key={template.id}
                  variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                  onClick={() => applyTemplate(template)}
                  className="text-sm"
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">
              Message
            </label>
            <Textarea
              id="message"
              placeholder="Enter SMS message" // Changed placeholder
              value={smsBody}
              onChange={(e) => setSmsBody(e.target.value)}
              className="min-h-[150px]" // Adjusted height
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleSendSms} 
              disabled={isSending || !toPhone || !smsBody} // Basic validation
            >
              {isSending ? 'Sending...' : 'Send SMS'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 