"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// Email template data
const emailTemplates = [
  {
    id: "pro-photos",
    name: "Pro Photos",
    subject: "{PropertyAddress}, {Town}",
    body: `Hi {FirstName},

I saw your new listing at {PropertyAddress}—looks like a great property.

I'm Cooper, a local real estate photographer and founder of RePhotos. I work with agents across {Town}, offering HDR photography, drone photos, 360° virtual tours, floor plans, and video—all delivered next-day.

Agents I work with typically see more showings, better listing performance, and faster sales.

If you'd like, I can send over some recent examples from similar properties.

Thanks,
Cooper Thompson
905-299-9300
RePhotos.ca`,
  },
]

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface EmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
  agentEmail: string;
  propertyAddress: string;
  town?: string;
}

export default function EmailTemplateModal({ 
  isOpen, 
  onClose, 
  agentName, 
  agentEmail, 
  propertyAddress,
  town = "the area" // Default value if town is not provided
}: EmailTemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(emailTemplates[0])
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [toEmail, setToEmail] = useState(agentEmail || "")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setToEmail(agentEmail || "")
  }, [agentEmail])

  // Function to replace variables in text
  const replaceVariables = (text: string) => {
    const variables: Record<string, string> = {
      FirstName: agentName?.split(" ")[0] || "",
      AgentName: agentName || "",
      AgentEmail: agentEmail || "",
      PropertyAddress: propertyAddress || "",
      Town: town || "the area",
    }

    return text.replace(/\{([^}]+)\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match
    })
  }

  // Apply template and replace placeholders
  const applyTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setEmailSubject(replaceVariables(template.subject))
    setEmailBody(replaceVariables(template.body))
  }

  // Initialize with the first template
  useEffect(() => {
    applyTemplate(emailTemplates[0])
  }, [agentName, agentEmail, propertyAddress, town]) // Re-apply when props change

  const handleSendEmail = async () => {
    try {
      setIsSending(true)
      setError(null)

      // Replace variables one final time before sending
      const finalSubject = replaceVariables(emailSubject)
      const finalBody = replaceVariables(emailBody)

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: toEmail,
          from: "Cooper from RePhotos <cooper@rephotos.ca>",
          subject: finalSubject,
          body: finalBody,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      // Show success message
      alert('Email sent successfully!')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">Create Email</span>
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
            <label htmlFor="to" className="block text-sm font-medium mb-1">
              To
            </label>
            <Input 
              id="to" 
              value={toEmail} 
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="Enter recipient email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Templates</label>
            <div className="flex flex-wrap gap-2">
              {emailTemplates.map((template) => (
                <Button
                  key={template.id}
                  variant={selectedTemplate.id === template.id ? "default" : "outline"}
                  onClick={() => applyTemplate(template)}
                  className="text-sm"
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-1">
              Subject
            </label>
            <Input
              id="subject"
              placeholder="Enter email subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">
              Message
            </label>
            <Textarea
              id="message"
              placeholder="Enter email message"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              className="min-h-[200px]"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleSendEmail} 
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
