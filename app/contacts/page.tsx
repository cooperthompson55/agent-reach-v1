"use client"
import React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Filter, MoreHorizontal, Trash2, Edit2, Eye, ChevronLeft, ChevronRight, Check, Loader2, MessageSquare, Mail, Search } from "lucide-react";
import ContactDetailsModal from "@/components/contacts/ContactDetailsModal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { supabase } from '@/lib/supabase'; // Corrected import path
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import SmsTemplateModal from '@/components/sms-template-modal';
import EmailTemplateModal from '@/components/email-template-modal';

// Define Contact interface
interface Contact {
  id: string; // Will use agent_email
  name: string; // agent_name
  email: string; // agent_email
  phone?: string; // agent_phone - optional
  brokerage?: string; // brokerage_name - optional
  instagram?: string; // instagram_account - optional
  listings: number; // Count of listings per agent
  lastContact: string; // Default or placeholder
  avatar: string; // First letter of name or placeholder
  favorite: boolean; // Default to false
  agent_tags?: string | null;
  agent_status?: string | null;
  contact_logs: any[]; // Assuming contact_logs is of type any[]
}

// Tag options and color map
const TAG_OPTIONS = [
  '<10-Photos', 'High Value', 'Medium Value', 'Low Value', 'New', 'Responsive', 'Unresponsive', 'Follow Up', 'Priority'
];
const TAG_COLORS: Record<string, string> = {
  '<10-Photos': 'bg-green-700 text-white',
  'High Value': 'bg-orange-800 text-white',
  'Medium Value': 'bg-blue-800 text-white',
  'Low Value': 'bg-gray-600 text-white',
  'New': 'bg-green-800 text-white',
  'Responsive': 'bg-purple-700 text-white',
  'Unresponsive': 'bg-red-700 text-white',
  'Follow Up': 'bg-orange-600 text-white',
  'Priority': 'bg-pink-800 text-white',
};

// Add status options and color map
const STATUS_OPTIONS = [
  'Not Contacted',
  'Contacted',
  'Interested',
  'Not Interested',
  'Client',
  'Bad Lead',
];
const STATUS_COLORS: Record<string, string> = {
  'Not Contacted': 'bg-yellow-700 text-white',
  'Contacted': 'bg-blue-900 text-white',
  'Interested': 'bg-green-900 text-white',
  'Not Interested': 'bg-gray-700 text-white',
  'Client': 'bg-purple-900 text-white',
  'Bad Lead': 'bg-red-900 text-white',
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortByListings, setSortByListings] = useState<null | 'asc' | 'desc'>(null);
  const [updatingTagId, setUpdatingTagId] = useState<string | null>(null);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [contactDetailsTab, setContactDetailsTab] = useState<string>('Overview');
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [smsContact, setSmsContact] = useState<Contact | null>(null);
  const [smsListings, setSmsListings] = useState<any[]>([]);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailContact, setEmailContact] = useState<Contact | null>(null);
  const [emailListings, setEmailListings] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [bulkSmsModalOpen, setBulkSmsModalOpen] = useState(false);
  const [bulkSmsContacts, setBulkSmsContacts] = useState<Contact[]>([]);
  const [bulkSmsListings, setBulkSmsListings] = useState<any[]>([]);
  const [bulkSmsAgentListingsMap, setBulkSmsAgentListingsMap] = useState<Record<string, any[]>>({});

  // Filter contacts by search term
  const filteredContacts = React.useMemo(() => {
    let result = contacts;
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(contact =>
        (contact.name && contact.name.toLowerCase().includes(lower)) ||
        (contact.phone && contact.phone.toLowerCase().includes(lower)) ||
        (contact.brokerage && contact.brokerage.toLowerCase().includes(lower))
      );
    }
    if (filterTags.length > 0) {
      result = result.filter(contact => {
        const tags = contact.agent_tags ? contact.agent_tags.split(',') : [];
        return filterTags.every(tag => tags.includes(tag));
      });
    }
    if (filterStatus) {
      result = result.filter(contact => (contact.agent_status || 'Not Contacted') === filterStatus);
    }
    return result;
  }, [contacts, searchTerm, filterTags, filterStatus]);

  // Sort by listings
  const sortedContacts = React.useMemo(() => {
    if (!sortByListings) return filteredContacts;
    return [...filteredContacts].sort((a, b) =>
      sortByListings === 'asc' ? a.listings - b.listings : b.listings - a.listings
    );
  }, [filteredContacts, sortByListings]);

  // Calculate pagination
  const totalPages = pageSize === -1 ? 1 : Math.ceil(sortedContacts.length / pageSize);
  const paginatedContacts = React.useMemo(() => {
    if (pageSize === -1) return sortedContacts;
    const start = (page - 1) * pageSize;
    return sortedContacts.slice(start, start + pageSize);
  }, [sortedContacts, page, pageSize]);

  // Helper to get all visible contact IDs
  const visibleContactIds = paginatedContacts.map(c => c.id);
  const allSelected = visibleContactIds.length > 0 && visibleContactIds.every(id => selectedContacts.includes(id));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedContacts(selectedContacts.filter(id => !visibleContactIds.includes(id)));
    } else {
      setSelectedContacts([...new Set([...selectedContacts, ...visibleContactIds])]);
    }
  };
  const toggleSelectContact = (id: string, index: number, event?: React.MouseEvent) => {
    if (event && event.shiftKey && lastSelectedIndex !== null) {
      // Shift-click: select range
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const idsInRange = paginatedContacts.slice(start, end + 1).map(c => c.id);
      setSelectedContacts(prev => Array.from(new Set([...prev, ...idsInRange])));
    } else if (event && (event.metaKey || event.ctrlKey)) {
      // Cmd/Ctrl-click: toggle individual
      setSelectedContacts(selectedContacts =>
        selectedContacts.includes(id)
          ? selectedContacts.filter(cid => cid !== id)
          : [...selectedContacts, id]
      );
      setLastSelectedIndex(index);
    } else {
      // Regular click: toggle and set last index
      setSelectedContacts(selectedContacts =>
        selectedContacts.includes(id)
          ? selectedContacts.filter(cid => cid !== id)
          : [...selectedContacts, id]
      );
      setLastSelectedIndex(index);
    }
  };

  const handleTagChange = async (contact: Contact, tag: string) => {
    setUpdatingTagId(contact.id);
    await supabase
      .from('listings')
      .update({ agent_tags: tag === "No tag" ? null : tag })
      .eq('agent_name', contact.name)
      .eq('agent_phone', contact.phone);
    // Update the tag in local state instead of refetching
    setContacts(prevContacts => prevContacts.map(c =>
      c.id === contact.id ? { ...c, agent_tags: tag === "No tag" ? null : tag } : c
    ));
    setUpdatingTagId(null);
  };

  // Move fetchContactsData outside useEffect
  const fetchContactsData = async () => {
    setRefreshing(true);
    setRefreshMessage(null);
    const { data: listingsData, error } = await supabase
      .from('listings')
      .select('agent_name, agent_email, agent_phone, brokerage_name, instagram_account, property_address, property_city, agent_tags, agent_status, contact_logs');

    if (error) {
      console.error('Error fetching listings:', error);
      setRefreshMessage('Failed to refresh contacts.');
      setRefreshing(false);
      setTimeout(() => setRefreshMessage(null), 2000);
      return;
    }

    if (listingsData) {
      const agentMap = new Map<string, { contact: Contact, addresses: Set<string> }>();
      const uniqueAgentKeys = new Set();

      listingsData.forEach((listing) => {
        const agentKey = `${listing.agent_name || ''}|${listing.agent_phone || ''}`;
        if (!listing.agent_name && !listing.agent_phone) return;
        uniqueAgentKeys.add(agentKey);

        if (agentMap.has(agentKey)) {
          const entry = agentMap.get(agentKey)!;
          if (listing.property_address && !entry.addresses.has(listing.property_address)) {
            entry.addresses.add(listing.property_address);
            entry.contact.listings += 1;
          }
        } else {
          agentMap.set(agentKey, {
            contact: {
              id: agentKey,
              name: listing.agent_name || 'N/A',
              email: listing.agent_email || '',
              phone: listing.agent_phone,
              brokerage: listing.brokerage_name,
              instagram: listing.instagram_account,
              listings: listing.property_address ? 1 : 0,
              lastContact: 'N/A',
              avatar: listing.agent_name ? listing.agent_name[0].toUpperCase() : '?',
              favorite: false,
              agent_tags: listing.agent_tags || null,
              agent_status: listing.agent_status || 'Not Contacted',
              contact_logs: listing.contact_logs || [],
            },
            addresses: listing.property_address ? new Set([listing.property_address]) : new Set(),
          });
        }
      });
      setContacts(Array.from(agentMap.values()).map(entry => entry.contact));
      setRefreshMessage('Contacts refreshed!');
      setTimeout(() => setRefreshMessage(null), 2000);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchContactsData();
    const onFocus = () => fetchContactsData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleTagAll = async () => {
    // 1. Fetch all listings with photo_count < 10
    const { data: lowPhotoListings, error } = await supabase
      .from('listings')
      .select('agent_name, agent_phone, agent_tags')
      .lt('photo_count', 10);
    if (error) {
      console.error('Error fetching low photo listings:', error);
      return;
    }
    // 2. Find unique agents
    const agentMap = new Map();
    lowPhotoListings.forEach(listing => {
      if (!listing.agent_name && !listing.agent_phone) return;
      const key = `${listing.agent_name || ''}|${listing.agent_phone || ''}`;
      if (!agentMap.has(key)) {
        agentMap.set(key, listing.agent_tags || null);
      }
    });
    // 3. For each agent, add <10-Photos tag if not present
    for (const [key, tags] of agentMap.entries()) {
      const [agent_name, agent_phone] = key.split('|');
      let tagArr = tags ? tags.split(',') : [];
      if (!tagArr.includes('<10-Photos')) {
        tagArr.push('<10-Photos');
        await supabase
          .from('listings')
          .update({ agent_tags: tagArr.join(',') })
          .eq('agent_name', agent_name)
          .eq('agent_phone', agent_phone);
        // Update local state
        setContacts(prevContacts => prevContacts.map(c =>
          c.name === agent_name && c.phone === agent_phone
            ? { ...c, agent_tags: tagArr.join(',') }
            : c
        ));
      }
    }
  };

  return (
    <div className="w-full py-8 px-4 md:px-8">
      {/* <h1 className="text-4xl font-bold mb-2">Lead Manager</h1> */}
      <h1 className="text-4xl font-bold mb-2">Contacts</h1>
      <div className="text-gray-500 dark:text-zinc-400 mb-4">Total Contacts: {filteredContacts.length}</div>
      <div className="flex items-center gap-2 mb-4">
        <Input
          placeholder="Search contacts..."
          className="max-w-md"
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-2 flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filter
              {filterTags.length > 0 && (
                <span className="ml-1 bg-blue-500 text-white rounded-full px-2 text-xs">●</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="p-4 min-w-[220px]">
            <div className="mb-2">
              <div className="font-semibold text-xs mb-1">Status</div>
              <div className="flex flex-col gap-1 mb-2">
                {STATUS_OPTIONS.map(status => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status-filter"
                      checked={filterStatus === status}
                      onChange={() => setFilterStatus(status)}
                    />
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-300 text-black'}`}>{status}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status-filter"
                    checked={filterStatus === null}
                    onChange={() => setFilterStatus(null)}
                  />
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">All</span>
                </label>
              </div>
              <div className="font-semibold text-xs mb-1">Tags</div>
              <div className="flex flex-col gap-1">
                {TAG_OPTIONS.map(tag => (
                  <label key={tag} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterTags.includes(tag)}
                      onChange={e => {
                        setFilterTags(prev => e.target.checked ? [...prev, tag] : prev.filter(t => t !== tag));
                      }}
                    />
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TAG_COLORS[tag] || 'bg-gray-300 text-black'}`}>{tag}</span>
                  </label>
                ))}
              </div>
            </div>
            {(filterTags.length > 0 || filterStatus) && (
              <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => { setFilterTags([]); setFilterStatus(null); }}>
                Clear Filters
              </Button>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" className="ml-2">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        <Button className="ml-auto flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Contact
        </Button>
        <Button variant="outline" className="ml-2 flex items-center gap-2" onClick={handleTagAll}>
          Tag All
        </Button>
        <Button variant="outline" className="ml-2 flex items-center gap-2" onClick={fetchContactsData} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Refresh Contacts
        </Button>
        {refreshMessage && (
          <span className={`ml-2 text-sm ${refreshMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>{refreshMessage}</span>
        )}
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border border-gray-200 dark:border-zinc-800 overflow-x-auto w-full">
        {/* Bulk Actions Bar */}
        {selectedContacts.length > 0 && (
          <div className="flex items-center gap-4 p-3 border-b dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800">
            <span className="font-medium">{selectedContacts.length} selected</span>
            {/* Bulk Tag */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">Tag</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {TAG_OPTIONS.map(tag => (
                  <DropdownMenuItem key={tag} onClick={async () => {
                    // Bulk add tag
                    for (const id of selectedContacts) {
                      const contact = contacts.find(c => c.id === id);
                      if (!contact) continue;
                      const newTags = contact.agent_tags ? Array.from(new Set([...contact.agent_tags.split(','), tag])) : [tag];
                      await supabase
                        .from('listings')
                        .update({ agent_tags: newTags.join(',') })
                        .eq('agent_name', contact.name)
                        .eq('agent_phone', contact.phone);
                      contact.agent_tags = newTags.join(',');
                    }
                    setContacts([...contacts]);
                  }}>{tag}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Bulk Detag */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">Remove Tag</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {TAG_OPTIONS.map(tag => (
                  <DropdownMenuItem key={tag} onClick={async () => {
                    // Bulk remove tag
                    for (const id of selectedContacts) {
                      const contact = contacts.find(c => c.id === id);
                      if (!contact) continue;
                      const newTags = contact.agent_tags ? contact.agent_tags.split(',').filter(t => t !== tag) : [];
                      await supabase
                        .from('listings')
                        .update({ agent_tags: newTags.length ? newTags.join(',') : null })
                        .eq('agent_name', contact.name)
                        .eq('agent_phone', contact.phone);
                      contact.agent_tags = newTags.length ? newTags.join(',') : null;
                    }
                    setContacts([...contacts]);
                  }}>{tag}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Bulk Status Change */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">Change Status</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {STATUS_OPTIONS.map(status => (
                  <DropdownMenuItem key={status} onClick={async () => {
                    for (const id of selectedContacts) {
                      const contact = contacts.find(c => c.id === id);
                      if (!contact) continue;
                      await supabase
                        .from('listings')
                        .update({ agent_status: status })
                        .eq('agent_name', contact.name)
                        .eq('agent_phone', contact.phone);
                      contact.agent_status = status;
                    }
                    setContacts([...contacts]);
                  }}>{status}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Bulk SMS */}
            <Button size="sm" variant="outline" onClick={async () => {
              const selected = contacts.filter(c => selectedContacts.includes(c.id));
              setBulkSmsContacts(selected);
              // Fetch all listings for selected contacts
              let allListings: any[] = [];
              let agentListingsMap: Record<string, any[]> = {};
              for (const contact of selected) {
                const { data } = await supabase
                  .from('listings')
                  .select('id, property_address, property_city, agent_name, agent_phone')
                  .eq('agent_name', contact.name)
                  .eq('agent_phone', contact.phone);
                if (data) {
                  allListings = allListings.concat(data);
                  agentListingsMap[`${contact.name}|${contact.phone}`] = data;
                }
              }
              // Deduplicate listings by id
              const dedupedListings = Array.from(new Map(allListings.map(l => [l.id, l])).values());
              setBulkSmsListings(dedupedListings);
              setBulkSmsAgentListingsMap(agentListingsMap);
              setBulkSmsModalOpen(true);
            }}>
              SMS
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedContacts([])}>Clear</Button>
          </div>
        )}
        <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
          <thead>
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="accent-blue-500 w-4 h-4 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Brokerage</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer select-none" onClick={() => setSortByListings(s => s === null ? 'desc' : s === 'desc' ? 'asc' : null)}>
                Active Listings
                <span className="ml-1">
                  {sortByListings === 'desc' && '▼'}
                  {sortByListings === 'asc' && '▲'}
                  {sortByListings === null && ''}
                </span>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Interactions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Tags</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-100 dark:divide-zinc-800">
            {paginatedContacts.map((contact, idx) => (
              <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer">
                <td className="px-2 py-4">
                  <input
                    type="checkbox"
                    checked={selectedContacts.includes(contact.id)}
                    onClick={e => { e.preventDefault(); toggleSelectContact(contact.id, idx, e); }}
                    readOnly
                    className="accent-blue-500 w-4 h-4 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3" onClick={() => { setSelectedContact(contact); setContactDetailsTab('Overview'); }}>
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-lg font-bold">
                    {contact.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-1">
                      {contact.name}
                      {contact.favorite && <span title="Favorite" className="text-yellow-400 ml-1">★</span>}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-zinc-400">{contact.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-zinc-100" onClick={() => { setSelectedContact(contact); setContactDetailsTab('Overview'); }}>{contact.brokerage}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center cursor-pointer" onClick={() => { setSelectedContact(contact); setContactDetailsTab('Listings'); }}>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-black dark:bg-zinc-200 text-white dark:text-zinc-900">{contact.listings}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-zinc-100">{
                  (() => {
                    let logs = [];
                    if (Array.isArray(contact.contact_logs)) {
                      logs = contact.contact_logs;
                    } else if (typeof contact.contact_logs === 'string' && (contact.contact_logs + '').trim().length > 0) {
                      try {
                        logs = JSON.parse(contact.contact_logs);
                      } catch {
                        logs = [];
                      }
                    }
                    return logs.length;
                  })()
                }</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-zinc-100 max-w-[220px]">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex flex-col gap-1 max-w-[200px] min-h-[32px] cursor-pointer">
                        {contact.agent_tags ? contact.agent_tags.split(',').map(tag => (
                          <span key={tag} className={`px-2 py-0.5 rounded-full text-xs font-medium ${TAG_COLORS[tag] || 'bg-gray-300 text-black'}`}>{tag}</span>
                        )) : <span className="text-xs text-gray-400">No tag</span>}
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <TagDropdownContent
                        contact={contact}
                        onSave={async (newTags) => {
                          setUpdatingTagId(contact.id);
                          await supabase
                            .from('listings')
                            .update({ agent_tags: newTags.length ? newTags.join(',') : null })
                            .eq('agent_name', contact.name)
                            .eq('agent_phone', contact.phone);
                          setContacts(prevContacts => prevContacts.map(c =>
                            c.id === contact.id ? { ...c, agent_tags: newTags.length ? newTags.join(',') : null } : c
                          ));
                          setUpdatingTagId(null);
                        }}
                        updating={updatingTagId === contact.id}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-zinc-100">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${STATUS_COLORS[contact.agent_status || 'Not Contacted']}`}>{contact.agent_status || 'Not Contacted'}</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <div className="p-2 min-w-[180px]">
                        <div className="font-semibold text-xs mb-2">Update Status</div>
                        {STATUS_OPTIONS.map(status => (
                          <DropdownMenuItem
                            key={status}
                            onClick={async () => {
                              await supabase
                                .from('listings')
                                .update({ agent_status: status })
                                .eq('agent_name', contact.name)
                                .eq('agent_phone', contact.phone);
                              setContacts(prevContacts => prevContacts.map(c =>
                                c.id === contact.id ? { ...c, agent_status: status } : c
                              ));
                            }}
                            className={`flex items-center gap-2 px-2 py-1 rounded ${STATUS_COLORS[status]} ${contact.agent_status === status ? 'ring-2 ring-white' : ''}`}
                          >
                            {contact.agent_status === status && <span className="mr-2">✓</span>}
                            {status}
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
                <td className="px-2 py-4 text-center flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-black hover:bg-black/90 text-white w-7 h-7 p-0 rounded-full"
                    onClick={async () => {
                      setEmailContact(contact);
                      // Fetch listings for this agent
                      const { data } = await supabase
                        .from('listings')
                        .select('id, property_address, property_city')
                        .eq('agent_name', contact.name)
                        .eq('agent_phone', contact.phone);
                      setEmailListings(data || []);
                      setEmailModalOpen(true);
                    }}
                    title="Send Email"
                  >
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-blue-500 hover:bg-blue-600 text-white w-7 h-7 p-0 rounded-full"
                    onClick={async () => {
                      setSmsContact(contact);
                      // Fetch listings for this agent
                      const { data } = await supabase
                        .from('listings')
                        .select('id, property_address, property_city')
                        .eq('agent_name', contact.name)
                        .eq('agent_phone', contact.phone);
                      setSmsListings(data || []);
                      setSmsModalOpen(true);
                    }}
                    title="Send SMS"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-gray-600 hover:bg-gray-700 text-white w-7 h-7 p-0 rounded-full"
                    onClick={() => {
                      const searchQuery = contact.email
                        ? `${contact.email}`
                        : `${contact.name} ${contact.brokerage || ''} real estate agent Contact Email`;
                      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
                    }}
                    title="Google Search Email"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-5 w-5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedContact(contact)}>
                        <Eye className="h-4 w-4 mr-2" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit2 className="h-4 w-4 mr-2" /> Edit Contact
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/30">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Contact
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>First</Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</Button>
        </div>
        <Select value={pageSize.toString()} onValueChange={(value) => { setPageSize(Number(value)); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Rows per page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 rows</SelectItem>
            <SelectItem value="20">20 rows</SelectItem>
            <SelectItem value="50">50 rows</SelectItem>
            <SelectItem value="100">100 rows</SelectItem>
            <SelectItem value="200">200 rows</SelectItem>
            <SelectItem value="400">400 rows</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {selectedContact && (
        <ContactDetailsModal
          contact={selectedContact}
          initialTab={contactDetailsTab}
          onClose={() => setSelectedContact(null)}
          onTagChange={(tag: string[]) => {
            if (!selectedContact) return;
            setContacts(prevContacts => prevContacts.map(c =>
              c.id === selectedContact.id ? { ...c, agent_tags: tag.length ? tag.join(',') : null } : c
            ));
            setSelectedContact(prev => prev ? { ...prev, agent_tags: tag.length ? tag.join(',') : null } : prev);
          }}
        />
      )}
      {smsContact && (
        <SmsTemplateModal
          isOpen={smsModalOpen}
          onClose={() => setSmsModalOpen(false)}
          agentName={smsContact.name}
          agentPhone={smsContact.phone || ''}
          listings={smsListings}
        />
      )}
      {emailContact && (
        <EmailTemplateModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          agentName={emailContact.name}
          agentEmail={emailContact.email || ''}
          propertyAddress={''}
          town={''}
          listings={emailListings}
        />
      )}
      {bulkSmsModalOpen && (
        <SmsTemplateModal
          isOpen={bulkSmsModalOpen}
          onClose={() => setBulkSmsModalOpen(false)}
          agentName={''}
          agentPhone={''}
          contacts={bulkSmsContacts}
          listings={bulkSmsListings}
          agentListingsMap={bulkSmsAgentListingsMap}
        />
      )}
    </div>
  );
}

function TagDropdownContent({ contact, onSave, updating }: { contact: Contact, onSave: (tags: string[]) => void, updating: boolean }) {
  const [selected, setSelected] = useState<string[]>(contact.agent_tags ? contact.agent_tags.split(',') : []);
  const [dirty, setDirty] = useState(false);
  const saveRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setSelected(contact.agent_tags ? contact.agent_tags.split(',') : []); }, [contact.agent_tags]);

  const toggleTag = (tag: string) => {
    setSelected(prev => {
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
            className={`flex items-center gap-2 px-2 py-1 rounded ${selected.includes(tag) ? TAG_COLORS[tag] : 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200'} text-xs w-full text-left`}
            onClick={() => toggleTag(tag)}
            type="button"
          >
            <span className={`inline-block w-3 h-3 rounded-full ${TAG_COLORS[tag] || 'bg-gray-300'}`}></span>
            <span className="flex-1">{tag}</span>
            {selected.includes(tag) && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
      <Button
        ref={saveRef}
        size="sm"
        className="w-full mt-1"
        disabled={updating || !dirty}
        onClick={() => { onSave(selected); setDirty(false); }}
      >
        {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
      </Button>
    </div>
  );
} 