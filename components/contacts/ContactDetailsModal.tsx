"use client"
import { useState, useEffect, useRef } from "react";
import { X, Star, Edit2, Check, Loader2, Mail, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import EmailTemplateModal from '@/components/email-template-modal';
import SmsTemplateModal from '@/components/sms-template-modal';

const TABS = ["Overview", "Listings", "Contact History", "Notes", "Log Interaction"];
const TAG_OPTIONS = [
  '<10-Photos', 'Contacted', 'Not Contacted', 'High Value', 'Medium Value', 'Low Value', 'New', 'Responsive', 'Unresponsive', 'Follow Up', 'Priority'
];
const TAG_COLORS: Record<string, string> = {
  '<10-Photos': 'bg-green-700 text-white',
  'Contacted': 'bg-blue-600 text-white',
  'Not Contacted': 'bg-yellow-600 text-white',
  'High Value': 'bg-orange-800 text-white',
  'Medium Value': 'bg-blue-800 text-white',
  'Low Value': 'bg-gray-600 text-white',
  'New': 'bg-green-800 text-white',
  'Responsive': 'bg-purple-700 text-white',
  'Unresponsive': 'bg-red-700 text-white',
  'Follow Up': 'bg-orange-600 text-white',
  'Priority': 'bg-pink-800 text-white',
};

export default function ContactDetailsModal({ contact, onClose, onTagChange, initialTab }: { contact: any; onClose: () => void; onTagChange?: (tag: string[]) => void; initialTab?: string }) {
  const [tab, setTab] = useState(initialTab || "Overview");
  const [currentContact, setCurrentContact] = useState<any>(contact);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tag, setTag] = useState<string[]>([]);
  const [editingTags, setEditingTags] = useState(false);
  const [updatingTag, setUpdatingTag] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState(contact?.email || "");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [emailListings, setEmailListings] = useState<any[]>([]);
  const [smsListings, setSmsListings] = useState<any[]>([]);

  // Helper to normalize phone numbers
  function normalizePhone(phone: string): string {
    let digits = (phone || '').replace(/\D/g, '');
    if (digits.length === 10) digits = '1' + digits;
    return '+' + digits;
  }

  useEffect(() => {
    // When contact prop changes, update currentContact and reset related states
    setCurrentContact(contact);
    setListings([]); // Reset listings
    setTag(contact?.agent_tags ? contact.agent_tags.split(',') : []);
    setEmailValue(contact?.email || "");
    // Potentially reset other contact-specific states here if necessary
  }, [contact]);

  useEffect(() => {
    async function fetchContactData() {
      if (!currentContact?.phone && !currentContact?.name) {
        setLoading(false);
        return;
      }
      setLoading(true);

      let contactDetailsToUse = { ...currentContact };

      // Fetch full contact details from 'contacts' table if not all details are present
      if (!contactDetailsToUse.brokerage || !contactDetailsToUse.email || !contactDetailsToUse.instagram_account) {
        const normalizedPhone = contactDetailsToUse.phone ? normalizePhone(contactDetailsToUse.phone) : null;
        let { data: fetchedContactData, error: contactError } = await supabase
          .from('contacts') // Assuming your main contacts table is named 'contacts'
          .select('*')
          .or(`agent_phone.eq.${normalizedPhone},phone.eq.${normalizedPhone}`)
          .limit(1)
          .single();
        
        if ((!fetchedContactData || contactError) && contactDetailsToUse.name) {
           const { data: altContactData, error: altContactError } = await supabase
            .from('contacts')
            .select('*')
            .eq('agent_name', contactDetailsToUse.name)
            .limit(1)
            .single();
          if (altContactData) fetchedContactData = altContactData;
        }

        if (fetchedContactData) {
          // Update local copy for this fetch cycle
          contactDetailsToUse = { ...contactDetailsToUse, ...fetchedContactData };
          // Update state if it's different from initial currentContact, to trigger re-renders for dependent UI
          if (JSON.stringify(currentContact) !== JSON.stringify(contactDetailsToUse)) {
            setCurrentContact(contactDetailsToUse);
          }
          setTag(fetchedContactData.agent_tags ? fetchedContactData.agent_tags.split(',') : []);
          setEmailValue(fetchedContactData.email || "");
        }
      }

      // Fetch listings for the current contact using the potentially updated contactDetailsToUse
      const phoneToQuery = contactDetailsToUse.phone ? normalizePhone(contactDetailsToUse.phone) : null;
      const nameToQuery = contactDetailsToUse.name;
      
      let listingsData = null;
      let listingsError = null;

      if (!nameToQuery && !phoneToQuery) {
        // No identifiers to query listings, so set to empty and skip fetching.
        setListings([]);
        // setLoading(false) will be called at the end of fetchContactData
      } else {
        let queryBuilder = supabase
          .from('listings')
          .select('id, listing_date, listing_url, photo_count, property_price, property_address, property_city, agent_name, agent_phone');

        if (nameToQuery && phoneToQuery) {
          // Most specific: match both name and phone on the listing
          queryBuilder = queryBuilder.eq('agent_name', nameToQuery).eq('agent_phone', phoneToQuery);
        } else if (nameToQuery) {
          // Match by name only
          queryBuilder = queryBuilder.eq('agent_name', nameToQuery);
        } else { // phoneToQuery must be non-null here as per the initial check
          // Match by phone only
          queryBuilder = queryBuilder.eq('agent_phone', phoneToQuery);
        }
        
        const { data, error } = await queryBuilder;
        listingsData = data;
        listingsError = error;
      }

      if (!listingsError && listingsData) {
        setListings(listingsData);
      } else if (listingsError) {
        console.error("Error fetching listings:", listingsError.message);
        setListings([]);
      } else {
        // Handles cases where listingsData might be null without an error (e.g., if !nameToQuery && !phoneToQuery)
        // or if the query returned no results (data would be an empty array or null).
        setListings(listingsData || []); 
      }
      
      setLoading(false);
    }

    if (tab === "Listings" || tab === "Overview") {
      fetchContactData();
    }
  }, [tab, currentContact, contact]); // Added contact prop to dependencies for safety, though currentContact should reflect it

  const handleTagSave = async (newTags: string[]) => {
    setUpdatingTag(true);
    await supabase
      .from('listings')
      .update({ agent_tags: newTags.length ? newTags.join(',') : null })
      .eq('agent_name', currentContact.name)
      .eq('agent_phone', currentContact.phone);
    setTag(newTags);
    if (onTagChange) onTagChange(newTags);
    setUpdatingTag(false);
  };

  const handleEmailSave = async () => {
    setSavingEmail(true);
    setEmailError(null);
    const { error } = await supabase
      .from('listings')
      .update({ agent_email: emailValue })
      .eq('agent_name', currentContact.name)
      .eq('agent_phone', currentContact.phone);
    if (error) {
      setEmailError('Failed to update email.');
    } else {
      setEditingEmail(false);
      currentContact.email = emailValue;
    }
    setSavingEmail(false);
  };

  // Only close on background click if no child modal is open
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (!emailModalOpen && !smsModalOpen) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleBackgroundClick}>
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl mx-auto p-6 relative overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-2xl font-bold">
            {currentContact.name[0]}
          </div>
          <div className="flex-1">
            <div className="text-xl font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
              {currentContact.name}
              {currentContact.favorite && <Star className="h-5 w-5 text-yellow-400" fill="#facc15" />}
            </div>
            <div className="text-gray-500 dark:text-zinc-400">{currentContact.brokerage}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-6 w-6" /></Button>
        </div>
        {/* Quick Action Buttons */}
        <div className="flex gap-3 justify-center mb-4">
          <Button
            variant="outline"
            size="icon"
            className="bg-black hover:bg-black/90 text-white w-10 h-10 p-0 rounded-full"
            onClick={async () => {
              // Fetch listings for this agent
              const { data } = await supabase
                .from('listings')
                .select('id, property_address, property_city')
                .eq('agent_name', currentContact.name)
                .eq('agent_phone', currentContact.phone);
              setEmailListings(data || []);
              setEmailModalOpen(true);
            }}
            title="Send Email"
          >
            <Mail className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 p-0 rounded-full"
            onClick={async () => {
              // Fetch listings for this agent
              const { data } = await supabase
                .from('listings')
                .select('id, property_address, property_city')
                .eq('agent_name', currentContact.name)
                .eq('agent_phone', currentContact.phone);
              setSmsListings(data || []);
              setSmsModalOpen(true);
            }}
            title="Send SMS"
          >
            <MessageSquare className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-gray-600 hover:bg-gray-700 text-white w-10 h-10 p-0 rounded-full"
            onClick={() => {
              const searchQuery = currentContact.email
                ? `${currentContact.email}`
                : `${currentContact.name} ${currentContact.brokerage || ''} real estate agent Contact Email`;
              window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
            }}
            title="Google Search Email"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-zinc-800 mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              className={`px-4 py-2 text-sm font-medium focus:outline-none ${tab === t ? "border-b-2 border-black dark:border-white text-black dark:text-white" : "text-gray-500 dark:text-zinc-400"}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {/* Tab Content */}
        {tab === "Overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Contact Info */}
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-zinc-800">
              <h2 className="text-lg font-semibold mb-2">Contact Information</h2>
              {/* Editable Email Section */}
              <div className="mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-zinc-200">Email: </span>
                {editingEmail ? (
                  <span className="flex items-center gap-2">
                    <Input
                      value={emailValue}
                      onChange={e => setEmailValue(e.target.value)}
                      className="w-48"
                      type="email"
                      placeholder="Enter email"
                    />
                    <Button size="sm" onClick={handleEmailSave} disabled={savingEmail || !emailValue}>
                      {savingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingEmail(false); setEmailValue(currentContact.email || ""); }}>
                      Cancel
                    </Button>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 dark:text-zinc-200">{currentContact.email || <span className="italic text-gray-400">No email</span>}</span>
                    <Button size="sm" variant="ghost" onClick={() => setEditingEmail(true)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </span>
                )}
                {emailError && <div className="text-xs text-red-600 mt-1">{emailError}</div>}
              </div>
              {currentContact.phone && <div className="text-sm text-gray-700 dark:text-zinc-200 mb-1">{currentContact.phone}</div>}
              {currentContact.brokerage && <div className="text-sm text-gray-700 dark:text-zinc-200 mb-1">{currentContact.brokerage}</div>}
              {currentContact.instagram && <div className="text-sm text-gray-700 dark:text-zinc-200 mb-1">Instagram: {currentContact.instagram}</div>}
              {tag.length ? <div className="text-sm text-gray-700 dark:text-zinc-200 mb-1 flex flex-col gap-1">{tag.map(t => <span key={t} className={`px-2 py-0.5 rounded-full text-xs font-medium ${TAG_COLORS[t] || 'bg-gray-300 text-black'}`}>{t}</span>)}</div> : <div className="text-sm text-gray-400 dark:text-zinc-500 mb-1">Tag: No tag</div>}
              {/* Add more fields as needed */}
            </div>
            {/* Activity Summary */}
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-zinc-800">
              <h2 className="text-lg font-semibold mb-2">Activity Summary</h2>
              <div className="flex items-center justify-between mb-2">
                <span>Active Listings</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-black dark:bg-zinc-200 text-white dark:text-zinc-900">{currentContact.listings}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span>Last Contact</span>
                <span className="text-sm">{currentContact.lastContact}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Interactions</span>
                <span className="text-sm">{
                  (() => {
                    let logs = [];
                    if (Array.isArray(currentContact.contact_logs)) {
                      logs = currentContact.contact_logs;
                    } else if (typeof currentContact.contact_logs === 'string' && currentContact.contact_logs.trim().length > 0) {
                      try {
                        logs = JSON.parse(currentContact.contact_logs);
                      } catch {
                        logs = [];
                      }
                    }
                    return logs.length;
                  })()
                }</span>
              </div>
            </div>
          </div>
        )}
        {tab === "Listings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {loading ? (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-zinc-400">Loading listings...</div>
            ) : listings.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-zinc-400">No listings found for this agent.</div>
            ) : (
              listings.map((listing) => {
                const formattedPrice = listing.property_price ? `$${Number(listing.property_price).toLocaleString()}` : 'N/A';
                return (
                  <div key={listing.id} className="border rounded-lg bg-gray-50 dark:bg-zinc-800 p-4 flex flex-col">
                    <div className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">{listing.property_address}, {listing.property_city}</div>
                    <div className="text-sm text-gray-500 dark:text-zinc-400 mb-2">Price: {formattedPrice}</div>
                    <div className="text-sm text-gray-500 dark:text-zinc-400 mb-2">Photos: {listing.photo_count}</div>
                    <div className="text-sm text-gray-500 dark:text-zinc-400 mb-2">Date: {listing.listing_date ? formatDistanceToNow(parseISO(listing.listing_date), { addSuffix: true }) : 'N/A'}</div>
                    <a href={listing.listing_url} target="_blank" rel="noopener noreferrer" className="mt-auto">
                      <Button variant="default" className="w-full">View Listing</Button>
                    </a>
                  </div>
                );
              })
            )}
          </div>
        )}
        {tab === "Contact History" && (
          <div className="py-4 px-2">
            <h2 className="text-lg font-semibold mb-4 text-center">Contact History</h2>
            {(() => {
              let logs = [];
              if (Array.isArray(currentContact.contact_logs)) {
                logs = currentContact.contact_logs;
              } else if (typeof currentContact.contact_logs === 'string' && currentContact.contact_logs.trim().length > 0) {
                try {
                  logs = JSON.parse(currentContact.contact_logs);
                } catch {
                  logs = [];
                }
              }
              if (logs.length > 0) {
                return (
                  <div className="space-y-4">
                    {[...logs].reverse().map((log, idx) => (
                      <div key={idx} className={`border rounded-lg p-4 shadow-sm ${idx % 2 === 0 ? 'bg-gray-50 dark:bg-zinc-800' : 'bg-white dark:bg-zinc-900'}`}> 
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${log.type === 'email' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{log.type?.toUpperCase() || 'LOG'}</span>
                          <span className="text-xs text-gray-500">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</span>
                          {log.sent_by && <span className="ml-auto text-xs text-gray-400">by {log.sent_by}</span>}
                        </div>
                        {log.property_address && (
                          <div className="text-xs text-gray-600 dark:text-zinc-300 mb-1">Property: {log.property_address}</div>
                        )}
                        {log.subject && (
                          <div className="text-xs text-gray-600 dark:text-zinc-300 mb-1">Subject: {log.subject}</div>
                        )}
                        <div className="text-sm text-gray-900 dark:text-zinc-100 whitespace-pre-line mb-1">{log.message}</div>
                        {log.to && (
                          <div className="text-xs text-gray-500">To: {log.to}</div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              } else {
                return <div className="text-gray-500 dark:text-zinc-400 text-center py-8">No contact history yet.</div>;
              }
            })()}
          </div>
        )}
        {tab === "Notes" && (
          <div className="text-gray-500 dark:text-zinc-400 text-center py-8">Notes for this contact will appear here.</div>
        )}
        {tab === "Log Interaction" && (
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-zinc-800 mb-6">
            <h2 className="text-lg font-semibold mb-2">Log Interaction</h2>
            <div className="mb-2">
              <select className="w-full rounded border px-3 py-2 bg-white dark:bg-zinc-900 dark:text-zinc-100">
                <option>Select interaction type</option>
                <option>Call</option>
                <option>Email</option>
                <option>Meeting</option>
                <option>Text</option>
              </select>
            </div>
            <textarea className="w-full rounded border px-3 py-2 mb-2 bg-white dark:bg-zinc-900 dark:text-zinc-100" rows={3} placeholder="Notes about the interaction..." />
            <Button>Log Interaction</Button>
          </div>
        )}
      </div>
      {emailModalOpen && (
        <EmailTemplateModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          agentName={currentContact.name}
          agentEmail={currentContact.email || ''}
          propertyAddress={''}
          town={''}
          listings={emailListings}
        />
      )}
      {smsModalOpen && (
        <SmsTemplateModal
          isOpen={smsModalOpen}
          onClose={() => setSmsModalOpen(false)}
          agentName={currentContact.name}
          agentPhone={currentContact.phone || ''}
          listings={smsListings}
        />
      )}
    </div>
  );
}

function TagDropdownContentModal({ selectedTags, onSave, updating }: { selectedTags: string[], onSave: (tags: string[]) => void, updating: boolean }) {
  const [localSelected, setLocalSelected] = useState<string[]>(selectedTags);
  const [dirty, setDirty] = useState(false);
  const saveRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setLocalSelected(selectedTags); }, [selectedTags]);

  const toggleTag = (tag: string) => {
    setLocalSelected(prev => {
      const exists = prev.includes(tag);
      setDirty(true);
      return exists ? prev.filter(t => t !== tag) : [...prev, tag];
    });
  };

  return (
    <div className="p-2 min-w-[200px]">
      <div className="flex flex-col gap-1 mb-2">
        {TAG_OPTIONS.map(tag => (
          <button
            key={tag}
            className={`flex items-center gap-2 px-2 py-1 rounded ${localSelected.includes(tag) ? TAG_COLORS[tag] : 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200'} text-xs w-full text-left`}
            onClick={() => toggleTag(tag)}
            type="button"
          >
            <span className={`inline-block w-3 h-3 rounded-full ${TAG_COLORS[tag] || 'bg-gray-300'}`}></span>
            <span className="flex-1">{tag}</span>
            {localSelected.includes(tag) && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
      <Button
        ref={saveRef}
        size="sm"
        className="w-full mt-1"
        disabled={updating || !dirty}
        onClick={() => { onSave(localSelected); setDirty(false); }}
      >
        {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
      </Button>
    </div>
  );
} 