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
  listings?: { id: string; property_address: string; property_city: string; agent_name?: string; agent_phone?: string }[];
  contacts?: { name: string; phone?: string }[];
  agentListingsMap?: Record<string, { id: string; property_address: string; property_city: string; agent_name?: string; agent_phone?: string }[]>;
}

export default function SmsTemplateModal({ 
  isOpen, 
  onClose, 
  agentName, 
  agentPhone, 
  listings = [],
  contacts = [],
  agentListingsMap = {},
}: SmsTemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate>(smsTemplates[0])
  const [smsBody, setSmsBody] = useState("")
  const [toPhone, setToPhone] = useState(agentPhone || "")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedListingId, setSelectedListingId] = useState<string>(listings[0]?.id || '');
  const selectedListing = listings.find(l => l.id === selectedListingId) || listings[0] || null;
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>(listings.map(l => l.id));

  useEffect(() => {
    setToPhone(agentPhone || "");
    if (isOpen) {
      setSelectedListingIds(listings.map(l => l.id));
    }
    // eslint-disable-next-line
  }, [isOpen]);

  const replaceVariables = (text: string, name?: string, phone?: string, listing?: { property_address: string; property_city: string; id: string }) => {
    const variables: Record<string, string> = {
      FirstName: name?.split(" ")[0] || agentName?.split(" ")[0] || "",
      AgentName: name || agentName || "",
      AgentPhone: phone || agentPhone || "",
      PropertyAddress: listing?.property_address || selectedListing?.property_address || "",
      Town: listing?.property_city || selectedListing?.property_city || "the area",
      Time: "2:00 PM",
    };
    return text.replace(/\{([^}]+)\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  };

  const applyTemplate = (template: SmsTemplate) => {
    setSelectedTemplate(template)
    setSmsBody(template.body)
  }

  useEffect(() => {
    if (smsTemplates.length > 0) {
      applyTemplate(smsTemplates[0])
    }
  }, [agentName, agentPhone, selectedListing, contacts, listings])

  const handleSendSms = async () => {
    setIsSending(true)
    setError(null)
    setSuccess(null)
    let progressCount = 0;
    let totalCount = 0;
    let progressResults: string[] = [];
    if (contacts && contacts.length > 0) {
      // Bulk mode
      // 1. Build unique (contact, listing) pairs
      const sendPairs: { contact: typeof contacts[0]; listing: any }[] = [];
      const seen = new Set<string>();
      for (const contact of contacts) {
        if (!contact.phone) continue;
        const agentKey = `${contact.name}|${contact.phone}`;
        const agentListings = (agentListingsMap[agentKey] || []).filter(l => selectedListingIds.includes(l.id));
        for (const listing of agentListings) {
          const pairKey = `${contact.phone}|${listing.id}`;
          if (!seen.has(pairKey)) {
            sendPairs.push({ contact, listing });
            seen.add(pairKey);
          }
        }
      }
      totalCount = sendPairs.length;
      // 2. Send in batches
      const BATCH_SIZE = 10;
      for (let i = 0; i < sendPairs.length; i += BATCH_SIZE) {
        const batch = sendPairs.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async ({ contact, listing }) => {
          const finalBody = replaceVariables(smsBody, contact.name, contact.phone, listing);
          try {
            const response = await fetch('/api/send-sms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to: contact.phone, body: finalBody }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed');
            // Log and update status
            const logEntry = {
              type: 'sms',
              message: finalBody,
              timestamp: new Date().toISOString(),
              property_id: listing.id || null,
              property_address: listing.property_address || null,
              sent_by: 'Cooper',
              to: contact.phone,
            };
            await fetch('/api/update-agent-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ agentPhone: contact.phone, agentName: contact.name, status: 'Contacted', logEntry, property_id: listing.id })
            });
            progressResults.push(`${contact.name} (${listing.property_address}): Sent`);
          } catch (err) {
            progressResults.push(`${contact.name} (${listing.property_address}): Failed`);
          }
          progressCount++;
          setSuccess(`Sent ${progressCount} of ${totalCount} messages...\n${progressResults.slice(-10).join('\n')}`);
        }));
        // Throttle between batches
        if (i + BATCH_SIZE < sendPairs.length) {
          await new Promise(res => setTimeout(res, 500));
        }
      }
      setSuccess(progressResults.join('\n'));
      setIsSending(false);
      setTimeout(() => { setSuccess(null); onClose(); }, 2000);
      return;
    }
    // Single mode
    try {
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
      setSuccess('SMS sent successfully!');
      setTimeout(() => { setSuccess(null); onClose(); }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send SMS')
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
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
          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm whitespace-pre-line">
              {success}
            </div>
          )}
          {contacts && contacts.length > 0 ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Recipients</label>
                <div className="max-h-24 overflow-y-auto border rounded p-2 bg-gray-50 dark:bg-zinc-800 text-xs">
                  {contacts.map((c, i) => (
                    <div key={i}>{c.name} {c.phone ? `(${c.phone})` : '(No phone)'}</div>
                  ))}
                </div>
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">Listings to include</label>
                <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50 dark:bg-zinc-800 text-xs flex flex-col gap-1">
                  {listings.map(listing => (
                    <label key={listing.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedListingIds.includes(listing.id)}
                        onChange={e => {
                          setSelectedListingIds(ids =>
                            e.target.checked
                              ? [...ids, listing.id]
                              : ids.filter(id => id !== listing.id)
                          );
                        }}
                        className="accent-blue-500"
                      />
                      <span>{listing.property_address}, {listing.property_city}</span>
                    </label>
                  ))}
                  {listings.length === 0 && <span className="text-gray-400">No listings available</span>}
                </div>
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="toPhone" className="block text-sm font-medium mb-1">
                To
              </label>
              <Input 
                id="toPhone" 
                value={toPhone} 
                onChange={(e) => setToPhone(e.target.value)}
                placeholder="Enter recipient phone number"
              />
            </div>
          )}
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
              placeholder="Enter SMS message"
              value={smsBody}
              onChange={(e) => setSmsBody(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleSendSms} 
              disabled={isSending || (contacts && contacts.length > 0 ? false : (!toPhone || !smsBody))}
            >
              {isSending ? 'Sending...' : contacts && contacts.length > 0 ? 'Send Bulk SMS' : 'Send SMS'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 