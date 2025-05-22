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
    id: "low-quality",
    name: "Low Quality",
    body: `Hey {FirstName}, saw your listing at {PropertyAddress} and noticed the photos could be upgraded to really make the property shine. I'm a local real estate photographer who helps agents showcase their listings with crisp, professional shots that grab attention and generate more interest. Would love to help with this property's presentation if you're interested. Thanks! - Cooper`,
  },
  {
    id: "zero-photos",
    name: "0 Photos",
    body: `Hey {FirstName}, saw your listing at {PropertyAddress} is missing photos and thought I could help out. I'm a local real estate photographer who helps agents showcase their listings with crisp, professional shots. Let me know if you're interested. Thanks! - Cooper`,
  },
  {
    id: "no-interiors",
    name: "No Interiors",
    body: `Hey {FirstName}, saw your listing at {PropertyAddress} and noticed it could use more interior shots to really show off the space. I'm a local photographer and can help capture high-quality interior shots to better showcase your listing. Let me know if you're interested in adding some interior shots. Thanks! - Cooper`,
  },
  {
    id: "no-drone",
    name: "No Drone",
    body: `Hey {FirstName}, saw your listing at {PropertyAddress} and thought some drone shots could really make it stand out. I'm a local real estate photographer who captures stunning aerial views that help buyers see the full property layout and neighborhood context. Let me know if you're interested in adding some drone shots to your listing. Thanks! - Cooper`,
},
{
  id: "pro-photos",
  name: "Pro Photos",
  body: `Hey {FirstName}, saw your listing at {PropertyAddress} and the photography looks great! I'm a local real estate photographer always looking to connect with agents who value quality visuals. Would love to introduce myself in case you ever need a photographer for future listings. Thanks! - Cooper, Owner of RePhotos.ca`,
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
  agentPhone: string;
  listings?: { id: string; property_address: string; property_city: string }[];
}

export default function SmsTemplateModal({ 
  isOpen, 
  onClose, 
  agentName, 
  agentPhone, 
  listings = [],
}: SmsTemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate>(smsTemplates[0])
  const [smsBody, setSmsBody] = useState("")
  const [toPhone, setToPhone] = useState(agentPhone || "") // Changed from toEmail
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedListingId, setSelectedListingId] = useState<string>(listings[0]?.id || '');
  const selectedListing = listings.find(l => l.id === selectedListingId) || listings[0] || null;

  useEffect(() => {
    setToPhone(agentPhone || "")
  }, [agentPhone])

  const replaceVariables = (text: string) => {
    const variables: Record<string, string> = {
      FirstName: agentName?.split(" ")[0] || "",
      AgentName: agentName || "",
      AgentPhone: agentPhone || "",
      PropertyAddress: selectedListing?.property_address || "",
      Town: selectedListing?.property_city || "the area",
      Time: "2:00 PM",
    };
    return text.replace(/\{([^}]+)\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  };

  const applyTemplate = (template: SmsTemplate) => {
    setSelectedTemplate(template)
    setSmsBody(replaceVariables(template.body))
  }

  useEffect(() => {
    if (smsTemplates.length > 0) {
      applyTemplate(smsTemplates[0])
    }
  }, [agentName, agentPhone, selectedListing]) // Re-apply when props change

  const handleSendSms = async () => {
    try {
      setIsSending(true)
      setError(null)

      const finalBody = replaceVariables(smsBody)

      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: toPhone,
          body: finalBody,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS')
      }

      alert('SMS sent successfully!')
      // Update agent_status to 'Contacted' in Supabase and log the SMS
      const logEntry = {
        type: 'sms',
        message: finalBody,
        timestamp: new Date().toISOString(),
        property_id: selectedListing?.id || null,
        property_address: selectedListing?.property_address || null,
        sent_by: 'Cooper',
        to: toPhone,
      };
      await fetch('/api/update-agent-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentPhone: agentPhone, agentName: agentName, status: 'Contacted', logEntry })
      })
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

          <div className="mb-4">
            {listings.length > 0 && (
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">Listing</label>
                <select
                  className="w-full rounded border px-3 py-2 bg-white dark:bg-zinc-900 dark:text-zinc-100"
                  value={selectedListingId}
                  onChange={e => setSelectedListingId(e.target.value)}
                >
                  {listings.map(listing => (
                    <option key={listing.id} value={listing.id}>
                      {listing.property_address}, {listing.property_city}
                    </option>
                  ))}
                </select>
              </div>
            )}
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