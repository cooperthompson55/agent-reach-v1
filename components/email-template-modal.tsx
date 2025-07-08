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
Cooper
RePhotos.ca`,
  },
  {
    id: "low-quality",
    name: "Low Quality",
    subject: "Quick Note on Your {PropertyAddress} Listing",
    body: `Hi {FirstName},

I came across your listing at {PropertyAddress} and noticed it could benefit from a few more high-quality photos to show its full potential.

I'm a local real estate photographer and would love to help bring out the best in the property. Let me know if you're interested—happy to share examples or chat availability.

Thanks!
Cooper
RePhotos.ca`,
  },
  {
    id: "zero-photos",
    name: "0 Photos",
    subject: "Quick Note on Your {PropertyAddress} Listing",
    body: `Hi {FirstName},

I noticed your listing at {PropertyAddress} doesn't have any photos yet. I'm a local real estate photographer and would be happy to help capture the property to showcase it beautifully and attract more buyers.

Let me know if you're interested—happy to send over examples.

Thanks!
Cooper
RePhotos.ca`,
  },
  {
    id: "no-drone",
    name: "No Drone",
    subject: "Highlight {PropertyAddress} with Aerial Views",
    body: `Hi {FirstName},

I came across your listing at {PropertyAddress}—the photos look great, but I noticed there aren't any drone or aerial shots. Adding a few aerial perspectives can really help showcase the property's surroundings and give buyers a better sense of the location.

I'm a local real estate photographer and would be happy to help with that. Let me know if you're interested!

Thanks,
Cooper
RePhotos.ca`,
  },
  {
    id: "pricing",
    name: "Pricing",
    subject: "Professional Real Estate Media Packages",
    body: `Hi {FirstName},

I'm Cooper, and I help agents and home owners showcase their listings with professional photography and media that gets results.

Here's what sets us apart:

- Every photo is part of the story we tell
- Designed to bring out each home's best features
- No hidden fees. What you see is what you pay
- Photos delivered in 24 hours, videos in 48-72 hours

Package Options:
ESSENTIAL – $229.99 HDR Photography + 1-2 aerial photos • Perfect for condos and standard listings.

PREMIUM – $489.99 HDR photos + 360° virtual tour + 2-3 drone aerials + floor plans • Great for detached homes and larger properties.

COMPLETE – $829.99 Photos + customizable video (choose between landscape or vertical orientation to fit your marketing needs) + 3-5 drone aerials + 360° virtual tour + twilight shots + more • Ideal for luxury listings and competitive markets.

All packages can be customized with floor plans, virtual staging, and additional video content.

Where we work:
Milton, Oakville, Burlington, Brampton, Hamilton, Guelph, Cambridge, Kitchener, Waterloo, Halton-Hills

Get Started Today:
See my work: rephotos.ca/portfolio
Book online: rephotos.ca/book-now
Questions? Just reply to this email or call/text 905-299-9300

I'm here to make your listings shine and sell faster. What property are you working on next?

Best, Cooper Thompson
RePhotos | 905-299-9300 | rephotos.ca`,
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
  listings?: { id: string; property_address: string; property_city: string }[];
}

export default function EmailTemplateModal({ 
  isOpen, 
  onClose, 
  agentName, 
  agentEmail, 
  propertyAddress,
  town = "the area",
  listings = [],
}: EmailTemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(emailTemplates[0])
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [toEmail, setToEmail] = useState(agentEmail || "")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedListingId, setSelectedListingId] = useState<string>(listings[0]?.id || '');
  const selectedListing = listings.find(l => l.id === selectedListingId) || listings[0] || null;

  useEffect(() => {
    setToEmail(agentEmail || "")
  }, [agentEmail])

  // Function to replace variables in text
  const replaceVariables = (text: string) => {
    const variables: Record<string, string> = {
      FirstName: agentName?.split(" ")[0] || "",
      AgentName: agentName || "",
      AgentEmail: agentEmail || "",
      PropertyAddress: selectedListing?.property_address || propertyAddress || "",
      Town: selectedListing?.property_city || town || "the area",
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
  }, [agentName, agentEmail, selectedListing, propertyAddress, town]) // Re-apply when props change

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
      // Update agent_status to 'Contacted' in Supabase and log the email
      const logEntry = {
        type: 'email',
        message: finalBody,
        timestamp: new Date().toISOString(),
        property_id: selectedListing?.id || null,
        property_address: selectedListing?.property_address || propertyAddress || null,
        sent_by: 'Cooper',
        subject: finalSubject,
        to: toEmail,
      };
      await fetch('/api/update-agent-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentEmail: agentEmail, agentName: agentName, status: 'Contacted', logEntry })
      })
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
