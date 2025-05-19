"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// Email template data
const emailTemplates = [
  {
    id: "final-delivery",
    name: "Final Delivery",
    subject: "Your Real Estate Photos Are Ready! | [Property Address]",
    body: `Hi [Agent Name],

I'm pleased to let you know that your real estate photos for [Property Address] are now ready!

You can view and download the full gallery here: [Gallery Link]

The photos highlight all the key features we discussed, and I'm confident they'll help showcase this property at its best.

Please let me know if you need any adjustments or have any questions.

Best regards,
[Your Name]
[Your Business]
[Your Contact Info]`,
  },
  {
    id: "booking-confirmation",
    name: "Booking Confirmation",
    subject: "Booking Confirmation | Real Estate Photography | [Property Address]",
    body: `Hi [Agent Name],

This email confirms your booking for real estate photography services:

Property: [Property Address]
Date: [Shoot Date]
Time: [Shoot Time]
Services: [Services Booked]

Please ensure the property is ready for photography:
- All lights turned on
- Blinds/curtains open
- Personal items tidied away
- Vehicles removed from driveway

If you need to reschedule or have any questions, please contact me at least 24 hours before the appointment.

Looking forward to working with you!

Best regards,
[Your Name]
[Your Business]
[Your Contact Info]`,
  },
  {
    id: "date-time-change",
    name: "Date/Time Change",
    subject: "Schedule Change Request | [Property Address] Photography",
    body: `Hi [Agent Name],

I'm writing regarding our scheduled photography session for [Property Address].

[Reason for change - weather, scheduling conflict, etc.]

Would it be possible to reschedule to one of the following times?
- [Alternative Date/Time 1]
- [Alternative Date/Time 2]
- [Alternative Date/Time 3]

Please let me know what works best for you, and I'll update our schedule accordingly.

Thank you for your understanding.

Best regards,
[Your Name]
[Your Business]
[Your Contact Info]`,
  },
  {
    id: "invoice-reminder",
    name: "Invoice Reminder",
    subject: "Invoice Reminder | [Property Address] Photography Services",
    body: `Hi [Agent Name],

I hope this email finds you well. This is a friendly reminder that invoice #[Invoice Number] for photography services at [Property Address] is currently outstanding.

Invoice Details:
- Invoice #: [Invoice Number]
- Amount Due: [Amount]
- Due Date: [Due Date]
- Services: [Services Provided]

You can make payment via [Payment Methods].

If you have any questions about the invoice or if you've already sent payment, please let me know.

Thank you for your business!

Best regards,
[Your Name]
[Your Business]
[Your Contact Info]`,
  },
  {
    id: "thank-you-review",
    name: "Thank You + Review",
    subject: "Thank You for Your Business | [Property Address]",
    body: `Hi [Agent Name],

Thank you for choosing my services for your listing at [Property Address]. It was a pleasure working with you!

I hope the photos are helping to showcase the property effectively and attract potential buyers.

If you have a moment, I'd greatly appreciate if you could leave a brief review of your experience working with me. Your feedback helps my business grow and helps other agents find quality photography services.

You can leave a review here: [Review Link]

I look forward to working with you on future listings!

Best regards,
[Your Name]
[Your Business]
[Your Contact Info]`,
  },
  {
    id: "custom-follow-up",
    name: "Custom Follow-Up",
    subject: "Following Up | Real Estate Photography Services",
    body: `Hi [Agent Name],

I hope this email finds you well. I noticed your listing at [Property Address] and wanted to reach out to introduce my real estate photography services.

I specialize in creating high-quality images that help properties stand out in a competitive market. My services include:

- Professional photography
- Virtual tours
- Aerial drone photography
- Floor plans
- Twilight shots

I'd be happy to discuss how I can help showcase your current and future listings. Would you be available for a quick call this week?

You can view my portfolio here: [Portfolio Link]

Looking forward to potentially working together!

Best regards,
[Your Name]
[Your Business]
[Your Contact Info]`,
  },
]

export default function EmailTemplateModal({ isOpen, onClose, agentName, agentEmail, propertyAddress }) {
  const [selectedTemplate, setSelectedTemplate] = useState(emailTemplates[0])
  const [emailSubject, setEmailSubject] = useState(emailTemplates[0].subject)
  const [emailBody, setEmailBody] = useState(emailTemplates[0].body)

  // Apply template and replace placeholders
  const applyTemplate = (template) => {
    setSelectedTemplate(template)

    let subject = template.subject
    let body = template.body

    // Replace placeholders with actual data
    subject = subject.replace("[Property Address]", propertyAddress || "")
    body = body.replace(/\[Agent Name\]/g, agentName || "").replace(/\[Property Address\]/g, propertyAddress || "")

    setEmailSubject(subject)
    setEmailBody(body)
  }

  const handleSendEmail = () => {
    // In a real implementation, this would send the email
    // For now, we'll just log the data and close the modal
    console.log({
      to: agentEmail,
      subject: emailSubject,
      body: emailBody,
      template: selectedTemplate.id,
    })

    // Show success message
    alert(`Email would be sent to ${agentEmail}`)
    onClose()
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
          <div>
            <label htmlFor="to" className="block text-sm font-medium mb-1">
              To
            </label>
            <Input id="to" value={agentEmail} readOnly className="bg-muted/50" />
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
            <Button onClick={handleSendEmail}>Send Email</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
