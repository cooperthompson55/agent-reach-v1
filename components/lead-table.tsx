"use client"

import React, { useState, useEffect } from "react"
import {
  ArrowUpDown,
  Building,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Clock,
  DollarSign,
  Facebook,
  Filter,
  Globe,
  Home,
  Instagram,
  Link,
  Mail,
  MailOpen,
  MapPin,
  Phone,
  Plus,
  Search,
  StickyNote,
  TagIcon,
  Trash2,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import EmailTemplateModal from "./email-template-modal"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { format, formatDistanceToNow } from "date-fns"
import { supabase } from "@/lib/supabase"
import type { Listing } from "@/types/listing"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CSVUpload } from "@/components/csv-upload"

// Available statuses
const statuses = [
  { id: "not-contacted", name: "Not Contacted" as const, color: "bg-yellow-100 text-yellow-900 dark:bg-yellow-700 dark:text-yellow-100" },
  { id: "contacted", name: "Contacted" as const, color: "bg-blue-500/10 text-blue-500 dark:bg-blue-800/40 dark:text-blue-200" },
  { id: "interested", name: "Interested" as const, color: "bg-green-500/10 text-green-500 dark:bg-green-800/40 dark:text-green-200" },
  { id: "not-interested", name: "Not Interested" as const, color: "bg-red-500/10 text-red-500 dark:bg-red-800/40 dark:text-red-200" },
  { id: "client", name: "Client" as const, color: "bg-purple-500/10 text-purple-500 dark:bg-purple-800/40 dark:text-purple-200" },
] as const

// Available tags
const availableTags = [
  { id: "high-value", name: "High Value", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-100 dark:border-amber-700", selectedColor: "bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-50 dark:border-amber-600" },
  { id: "medium-value", name: "Medium Value", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-100 dark:border-blue-700", selectedColor: "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-50 dark:border-blue-600" },
  { id: "low-value", name: "Low Value", color: "bg-gray-100 text-gray-800 dark:bg-gray-800/80 dark:text-gray-100 dark:border-gray-700", selectedColor: "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-50 dark:border-gray-600" },
  { id: "new", name: "New", color: "bg-green-100 text-green-800 dark:bg-green-900/80 dark:text-green-100 dark:border-green-700", selectedColor: "bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-50 dark:border-green-600" },
  { id: "responsive", name: "Responsive", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-100 dark:border-purple-700", selectedColor: "bg-purple-200 text-purple-900 dark:bg-purple-800 dark:text-purple-50 dark:border-purple-600" },
  { id: "unresponsive", name: "Unresponsive", color: "bg-red-100 text-red-800 dark:bg-red-900/80 dark:text-red-100 dark:border-red-700", selectedColor: "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-50 dark:border-red-600" },
  { id: "follow-up", name: "Follow Up", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/80 dark:text-orange-100 dark:border-orange-700", selectedColor: "bg-orange-200 text-orange-900 dark:bg-orange-800 dark:text-orange-50 dark:border-orange-600" },
  { id: "priority", name: "Priority", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/80 dark:text-pink-100 dark:border-pink-700", selectedColor: "bg-pink-200 text-pink-900 dark:bg-pink-800 dark:text-pink-50 dark:border-pink-600" },
  { id: "many-photos", name: ">10-Photos", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-100 dark:border-emerald-700", selectedColor: "bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-50 dark:border-emerald-600" },
] as const

// Update the status colors
const statusColors: Record<string, string> = {
  "Not Contacted": "bg-yellow-100 text-yellow-900 dark:bg-yellow-700 dark:text-yellow-100",
  "Contacted": "bg-blue-500/10 text-blue-500 dark:bg-blue-800/40 dark:text-blue-200",
  "Interested": "bg-green-500/10 text-green-500 dark:bg-green-800/40 dark:text-green-200",
  "Not Interested": "bg-red-500/10 text-red-500 dark:bg-red-800/40 dark:text-red-200",
  "Meeting Scheduled": "bg-purple-500/10 text-purple-500 dark:bg-purple-800/40 dark:text-purple-200",
  "Follow-up Needed": "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100",
  "Converted": "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-800/40 dark:text-emerald-200",
}

// Update the Lead type to match the database schema
interface Lead {
  id: string
  agent_name: string
  agent_email: string | null
  agent_phone: string | null
  property_address: string
  property_city: string
  property_postal: string
  property_price: string
  photo_count: number
  listing_url: string
  listing_date: string
  brokerage_name: string
  listing_source: string
  notes: string | null
  instagram_account: string | null
  created_at: string
  updated_at: string
}

interface ExtractedInfo {
  email: string | null
  facebook: string | null
  instagram: string | null
  phone: string | null
}

// Add a utility function for price formatting
function formatPrice(price: string | number) {
  const num = typeof price === 'number' ? price : parseFloat((price || '').toString().replace(/[^0-9.-]+/g, ''))
  if (isNaN(num)) return '$0'
  return `$${num.toLocaleString()}`
}

// Add a utility function for location formatting
function formatLocation(city: string, postal: string) {
  if (city && postal && postal !== 'Unknown') return `${city}, ${postal}`
  if (city) return city
  if (postal && postal !== 'Unknown') return postal
  return ''
}

export default function LeadTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [sortColumn, setSortColumn] = useState("listingDate")
  const [sortDirection, setSortDirection] = useState("desc")
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Listing | null>(null)
  const [leads, setLeads] = useState<Listing[]>([])
  const [openStatusPopover, setOpenStatusPopover] = useState<string | null>(null)
  const [clipboardDialogOpen, setClipboardDialogOpen] = useState(false)
  const [clipboardContent, setClipboardContent] = useState("")
  const [clipboardLeadId, setClipboardLeadId] = useState<string | null>(null)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({})
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo>({
    email: null,
    facebook: null,
    instagram: null,
    phone: null,
  })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null)
  const [showExtractedDialog, setShowExtractedDialog] = useState(false)
  const [pendingExtractedInfo, setPendingExtractedInfo] = useState<ExtractedInfo | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    fetchLeads()
  }, [])

  // Add click handler to clear highlight
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Don't clear if clicking on a button or link
      const target = e.target as HTMLElement
      if (target.closest('button') || target.closest('a')) {
        return
      }
      setHighlightedRow(null)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  async function fetchLeads() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('listing_date', { ascending: false })

      if (error) {
        throw error
      }

      setLeads(data || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast({
        title: "Error",
        description: "Failed to fetch leads. Please try refreshing the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate tag and status counts
  useEffect(() => {
    const newTagCounts: Record<string, number> = {}
    const newStatusCounts: Record<string, number> = {}

    leads.forEach((lead) => {
      // Count tags
      (lead.notes || "").split(/\s+/).forEach((word) => {
        newTagCounts[word] = (newTagCounts[word] || 0) + 1
      })

      // Count statuses
      newStatusCounts[lead.listing_source] = (newStatusCounts[lead.listing_source] || 0) + 1
    })

    setTagCounts(newTagCounts)
    setStatusCounts(newStatusCounts)
  }, [leads])

  // Toggle row expansion
  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Open email modal for a lead
  const openEmailModal = (lead: Listing) => {
    setSelectedLead(lead)
    setEmailModalOpen(true)
  }

  // Update the tag handling
  const updateLeadTags = async (leadId: string, tagName: string) => {
    try {
      const lead = leads.find(l => l.id === leadId)
      if (!lead) return

      const currentNotes = lead.notes || ''
      const tags = currentNotes.split(/\s+/).filter(Boolean)
      
      // Remove the tag if it exists, otherwise add it
      const newTags = tags.includes(tagName)
        ? tags.filter(tag => tag !== tagName)
        : [...tags, tagName]

      const { error } = await supabase
        .from('listings')
        .update({ notes: newTags.join(' ') })
        .eq('id', leadId)

      if (error) throw error
      await fetchLeads() // Refresh the data
    } catch (error) {
      console.error('Error updating tags:', error)
    }
  }

  // Toggle tag filter
  const toggleTagFilter = (tagName: string) => {
    setTagFilter((prev) => {
      if (prev === tagName) {
        return null
      } else {
        return tagName
      }
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter(null)
    setTagFilter(null)
    setSearchTerm("")
  }

  // Handle clipboard paste for contact info
  const handleClipboardPaste = (leadId: string) => {
    setClipboardLeadId(leadId)
    setClipboardContent("")
    setClipboardDialogOpen(true)
  }

  // Update the extractContactInfo function to avoid picking up emails as Instagram usernames
  const extractContactInfo = (text: string): ExtractedInfo => {
    if (!text)
      return {
        email: null,
        facebook: null,
        instagram: null,
        phone: null,
      }

    const result: ExtractedInfo = {
      email: null,
      facebook: null,
      instagram: null,
      phone: null,
    }

    // Email regex (find all, pick first)
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    const emailMatches = text.match(emailRegex)
    if (emailMatches && emailMatches.length > 0) {
      result.email = emailMatches[0]
    }

    // Facebook URL regex
    const facebookRegex = /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[a-zA-Z0-9.]+/g
    const facebookMatches = text.match(facebookRegex)
    if (facebookMatches && facebookMatches.length > 0) {
      result.facebook = facebookMatches[0]
    }

    // Instagram URL regex
    const instagramUrlRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+/g
    const instagramUrlMatches = text.match(instagramUrlRegex)
    if (instagramUrlMatches && instagramUrlMatches.length > 0) {
      result.instagram = instagramUrlMatches[0]
    } else {
      // Only match @username if not part of an email (not preceded by a word char or period, and not followed by a domain)
      // This regex: match @username not preceded by [\w\.] and not followed by @ or .
      const instagramUsernameRegex = /(?<![\w.])@([a-zA-Z0-9_.]+)\b(?!@|\.[a-z])/g
      const matches = [...text.matchAll(instagramUsernameRegex)]
      if (matches && matches.length > 0) {
        const username = matches[0][1]
      result.instagram = `https://www.instagram.com/${username}`
      }
    }

    // Phone regex - simplified to avoid special character issues
    const phoneRegex = /\+?[0-9]{1,3}[-.\s]?[0-9]{3}[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g
    const phoneMatches = text.match(phoneRegex)
    if (phoneMatches && phoneMatches.length > 0) {
      result.phone = phoneMatches[0]
    }

    return result
  }

  // Update saveExtractedInfo to use pendingExtractedInfo
  const saveExtractedInfo = async () => {
    if (!clipboardLeadId || !pendingExtractedInfo) return

    try {
      const updates: any = {}

      if (pendingExtractedInfo.email) {
        updates.agent_email = pendingExtractedInfo.email
          }
      if (pendingExtractedInfo.phone) {
        updates.agent_phone = pendingExtractedInfo.phone
          }
      if (pendingExtractedInfo.instagram) {
        updates.instagram_account = pendingExtractedInfo.instagram
          }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('listings')
          .update(updates)
          .eq('id', clipboardLeadId)

        if (error) throw error

        // Update local state
        setLeads((currentLeads) =>
          currentLeads.map((lead) => {
            if (lead.id === clipboardLeadId) {
              return { ...lead, ...updates }
        }
        return lead
          })
    )

      toast({
        title: "Contact information updated",
        description: "The lead has been updated with the extracted contact information.",
      })
    } else {
      toast({
        title: "No contact information found",
          description: "No email, phone, or Instagram account were found in the pasted content.",
        variant: "destructive",
      })
    }
    } catch (error) {
      console.error('Error updating contact information:', error)
      toast({
        title: "Error",
        description: "Failed to update contact information. Please try again.",
        variant: "destructive",
      })
    }

    setShowExtractedDialog(false)
    setClipboardDialogOpen(false)
  }

  // When clipboardDialogOpen is true and clipboardContent is set, extract info and show dialog
  useEffect(() => {
    if (clipboardDialogOpen && clipboardContent) {
      const extracted = extractContactInfo(clipboardContent)
      setPendingExtractedInfo(extracted)
      setShowExtractedDialog(true)
    }
  }, [clipboardDialogOpen, clipboardContent])

  // Memoize filtered and sorted leads
  const filteredLeads = React.useMemo(() => {
    return leads
    .filter((lead) => {
      const matchesSearch =
          searchTerm === "" ||
          lead.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.property_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.property_city.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = !statusFilter || lead.listing_source === statusFilter
        const matchesTag = !tagFilter || (lead.notes || "").includes(tagFilter)

        return matchesSearch && matchesStatus && matchesTag
    })
    .sort((a, b) => {
      if (sortColumn === "listingDate") {
        return sortDirection === "asc"
            ? new Date(a.listing_date).getTime() - new Date(b.listing_date).getTime()
            : new Date(b.listing_date).getTime() - new Date(a.listing_date).getTime()
      } else if (sortColumn === "photoCount") {
          return sortDirection === "asc" ? a.photo_count - b.photo_count : b.photo_count - a.photo_count
      } else if (sortColumn === "agentName") {
          return sortDirection === "asc" ? a.agent_name.localeCompare(b.agent_name) : b.agent_name.localeCompare(a.agent_name)
      } else if (sortColumn === "city") {
        return sortDirection === "asc"
            ? a.property_city.localeCompare(b.property_city)
            : b.property_city.localeCompare(a.property_city)
        } else if (sortColumn === "price") {
          const priceA = parseFloat(a.property_price.replace(/[^0-9.-]+/g, "")) || 0
          const priceB = parseFloat(b.property_price.replace(/[^0-9.-]+/g, "")) || 0
          return sortDirection === "asc" ? priceA - priceB : priceB - priceA
      }
      return 0
    })
  }, [leads, searchTerm, statusFilter, tagFilter, sortColumn, sortDirection])

  // Calculate pagination
  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredLeads.length / pageSize)
  const paginatedLeads = React.useMemo(() => {
    if (pageSize === -1) return filteredLeads;
    const start = (page - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, page, pageSize])

  // Handle sort toggle
  const toggleSort = (column: "listingDate" | "photoCount" | "agentName" | "city" | "price") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // Update the social media functions
  const findAgent = async (agentName: string, brokerageName: string) => {
    const searchQuery = `${agentName} ${brokerageName} real estate agent`
    window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, "_blank")
  }

  // Add deleteLead function after updateLeadStatus
  const deleteLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', leadId)

      if (error) throw error
      await fetchLeads() // Refresh the data
      toast({
        title: "Success",
        description: "Lead deleted successfully.",
      })
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast({
        title: "Error",
        description: "Failed to delete lead. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Update the deleteAllLeads function
  const deleteAllLeads = async () => {
    if (!window.confirm('Are you sure you want to delete ALL leads? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .not('id', 'is', null) // This will match all records

      if (error) throw error
      await fetchLeads() // Refresh the data
      toast({
        title: "Success",
        description: "All leads have been deleted successfully.",
      })
    } catch (error) {
      console.error('Error deleting all leads:', error)
      toast({
        title: "Error",
        description: "Failed to delete leads. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Function to remove duplicate listings based on URL
  const removeDuplicateListings = async () => {
    try {
      setLoading(true);
      
      // Create a map to store unique listings by URL
      const uniqueListingsByUrl = new Map<string, Listing>();
      const duplicateIds: string[] = [];
      
      // Identify duplicates (keep the first occurrence of each URL)
      leads.forEach(lead => {
        if (!uniqueListingsByUrl.has(lead.listing_url)) {
          uniqueListingsByUrl.set(lead.listing_url, lead);
        } else {
          duplicateIds.push(lead.id);
        }
      });
      
      if (duplicateIds.length === 0) {
        toast({
          title: "No duplicates found",
          description: "No duplicate listings were found based on URLs.",
        });
        setLoading(false);
        return;
      }
      
      // Confirm deletion with user
      if (!window.confirm(`Found ${duplicateIds.length} duplicate listings. Do you want to remove them?`)) {
        setLoading(false);
        return;
      }
      
      // Delete duplicates
      const { error } = await supabase
        .from('listings')
        .delete()
        .in('id', duplicateIds);
      
      if (error) throw error;
      
      await fetchLeads(); // Refresh the data
      
      toast({
        title: "Success",
        description: `Removed ${duplicateIds.length} duplicate listings.`,
      });
    } catch (error) {
      console.error('Error removing duplicate listings:', error);
      toast({
        title: "Error",
        description: "Failed to remove duplicate listings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add the Instagram search function
  const findInstagram = async (agentName: string, brokerageName: string) => {
    const searchQuery = `${agentName} ${brokerageName} real estate agent instagram`
    window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, "_blank")
  }

  // Add the openGoogleMaps function
  const openGoogleMaps = (address: string, city: string) => {
    const searchQuery = `${address}, ${city}`
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`, '_blank')
  }

  // Update the email modal props
  {emailModalOpen && selectedLead && (
    <EmailTemplateModal
      isOpen={emailModalOpen}
      onClose={() => setEmailModalOpen(false)}
      agentName={selectedLead.agent_name}
      agentEmail={selectedLead.agent_email || undefined}
      propertyAddress={selectedLead.property_address}
    />
  )}

  // Add updateLeadStatus inside the component
  const updateLeadStatus = async (leadId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ listing_source: status })
        .eq('id', leadId)

      if (error) throw error
      await fetchLeads() // Refresh the data
      setOpenStatusPopover(null) // Close the status popup
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  // Add auto paste function
  const handleAutoPaste = async (leadId: string) => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      const extractedInfo = extractContactInfo(clipboardText)
      
      const updates: any = {}

      if (extractedInfo.email) {
        updates.agent_email = extractedInfo.email
      }

      if (extractedInfo.phone) {
        updates.agent_phone = extractedInfo.phone
      }

      if (extractedInfo.instagram) {
        updates.instagram_account = extractedInfo.instagram
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('listings')
          .update(updates)
          .eq('id', leadId)

        if (error) throw error

        // Update local state
        setLeads((currentLeads) =>
          currentLeads.map((lead) => {
            if (lead.id === leadId) {
              return { ...lead, ...updates }
            }
            return lead
          })
        )

        toast({
          title: "Contact information updated",
          description: "The lead has been updated with the extracted contact information.",
        })
      } else {
        toast({
          title: "No contact information found",
          description: "No email, phone, or Instagram account were found in the clipboard.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating contact information:', error)
      toast({
        title: "Error",
        description: "Failed to update contact information. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Add a function to remove email or instagram
  const removeLeadField = async (leadId: string, field: 'agent_email' | 'instagram_account') => {
    try {
      const updates: any = {};
      updates[field] = null;
      const { error } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', leadId);
      if (error) throw error;
      setLeads((currentLeads) =>
        currentLeads.map((lead) =>
          lead.id === leadId ? { ...lead, [field]: null } : lead
        )
      );
      toast({
        title: 'Removed',
        description: `${field === 'agent_email' ? 'Email' : 'Instagram'} removed.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to remove ${field === 'agent_email' ? 'email' : 'Instagram'}.`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col gap-6 p-6">
        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <CSVUpload onUploadSuccess={fetchLeads} />
            <Button 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={removeDuplicateListings}
              disabled={leads.length === 0 || loading}
            >
              <TagIcon className="h-4 w-4" />
              Remove Duplicates
            </Button>
          <Button variant="outline" className="flex items-center gap-2" onClick={() => setFilterDialogOpen(true)}>
            <Filter className="h-4 w-4" />
            Filter
              {(statusFilter || tagFilter) && (
              <Badge variant="secondary" className="ml-1 rounded-full px-1 py-0 text-xs">
                  {statusFilter ? "1" : tagFilter ? "1" : "0"}
              </Badge>
            )}
          </Button>
            <Button 
              variant="destructive" 
              className="flex items-center gap-2" 
              onClick={deleteAllLeads}
              disabled={leads.length === 0}
            >
              <Trash2 className="h-4 w-4" />
              Delete All
            </Button>
        </div>
      </div>

      {/* Active filters display */}
        {(statusFilter || tagFilter) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
            {statusFilter && (
            <Badge variant="outline" className="flex items-center gap-1">
              Status: {statusFilter}
                <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => setStatusFilter(null)}>
                <X className="h-3 w-3" />
                <span className="sr-only">Remove status filter</span>
              </Button>
            </Badge>
          )}
            {tagFilter && (
              <Badge variant="outline" className="flex items-center gap-1">
                Tag: {tagFilter}
                <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => toggleTagFilter(tagFilter)}>
                <X className="h-3 w-3" />
                <span className="sr-only">Remove tag filter</span>
              </Button>
            </Badge>
            )}
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

        {/* Table Section */}
        <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                <Button
                  variant="ghost"
                  onClick={() => toggleSort("agentName")}
                  className="flex items-center gap-1 font-medium"
                >
                  <User className="h-4 w-4" />
                  Agent
                  {sortColumn === "agentName" && <ArrowUpDown className="h-3 w-3" />}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => toggleSort("city")}
                  className="flex items-center gap-1 font-medium"
                >
                  <MapPin className="h-4 w-4" />
                  Location
                  {sortColumn === "city" && <ArrowUpDown className="h-3 w-3" />}
                </Button>
              </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => toggleSort("price")}
                    className="flex items-center gap-1 font-medium"
                  >
                    <DollarSign className="h-4 w-4" />
                    Price
                    {sortColumn === "price" && <ArrowUpDown className="h-3 w-3" />}
                  </Button>
                </TableHead>
              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => toggleSort("photoCount")}
                  className="flex items-center gap-1 font-medium"
                >
                  <Camera className="h-4 w-4" />
                  Photos
                  {sortColumn === "photoCount" && <ArrowUpDown className="h-3 w-3" />}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => toggleSort("listingDate")}
                  className="flex items-center gap-1 font-medium"
                >
                  <Calendar className="h-4 w-4" />
                  Listed
                  {sortColumn === "listingDate" && <ArrowUpDown className="h-3 w-3" />}
                </Button>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1 font-medium">
                  <TagIcon className="h-4 w-4" />
                  Tags
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1 font-medium">
                  <Clock className="h-4 w-4" />
                  Status
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {loading ? (
              <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading leads...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                  No leads found. Try adjusting your filters or import new leads.
                </TableCell>
              </TableRow>
            ) : (
                paginatedLeads.map((lead, index) => (
                <React.Fragment key={lead.id}>
                    <TableRow 
                      className={`${
                        index % 2 === 0 ? "bg-muted/50" : ""
                      } ${
                        highlightedRow === lead.id ? "ring-2 ring-primary ring-offset-2 transition-all duration-300" : ""
                      }`}
                      onClick={e => {
                        if (e.shiftKey) {
                          e.stopPropagation();
                          handleAutoPaste(lead.id);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                    <TableCell className="font-medium">
                        <button
                          onClick={() => toggleRowExpansion(lead.id)}
                          className="w-full text-left hover:text-primary transition-colors"
                        >
                      <div>
                            {lead.agent_name}
                            {lead.brokerage_name && (
                              <div className="text-xs text-muted-foreground">{lead.brokerage_name}</div>
                            )}
                      </div>
                        </button>
                    </TableCell>
                    <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => openGoogleMaps(lead.property_address, lead.property_city)}
                                className="flex items-center gap-1 hover:text-primary transition-colors"
                              >
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                {formatLocation(lead.property_city, lead.property_postal)}
                                <div className="text-xs text-muted-foreground truncate max-w-[150px]">{lead.property_address}</div>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View on Google Maps</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {formatPrice(lead.property_price)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Camera className="h-3 w-3 text-muted-foreground" />
                          {lead.photo_count}
                      </div>
                    </TableCell>
                      <TableCell>{formatDistanceToNow(new Date(lead.listing_date), { addSuffix: true })}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 items-center">
                        {(lead.notes || "").split(/\s+/).slice(0, 2).map((tag) => {
                          const tagConfig = availableTags.find(t => t.name === tag) || {
                            color: "bg-gray-100 text-gray-800 dark:bg-gray-800/80 dark:text-gray-100 dark:border-gray-700",
                            selectedColor: "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-50 dark:border-gray-600"
                          };
                          return (
                            <Badge
                              key={tag}
                              variant="outline"
                              className={`${tagConfig.color} border text-xs group flex items-center gap-1 hover:bg-muted ${
                                tagFilter === tag ? "ring-2 ring-primary ring-offset-2" : ""
                              }`}
                            >
                              {tag}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateLeadTags(lead.id, tag);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                                <span className="sr-only">Remove tag</span>
                              </button>
                            </Badge>
                          );
                        })}
                        {(lead.notes || "").split(/\s+/).length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{(lead.notes || "").split(/\s+/).length - 2}
                          </Badge>
                        )}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                              <Plus className="h-3 w-3" />
                              <span className="sr-only">Add tag</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2" align="start">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Add Tags</p>
                              <div className="grid grid-cols-2 gap-1">
                                {availableTags.map((tag) => {
                                  const isSelected = (lead.notes || "").includes(tag.name);
                                  return (
                                    <Button
                                      key={tag.id}
                                      variant={isSelected ? "default" : "outline"}
                                      size="sm"
                                      className={`text-xs justify-start ${isSelected ? tag.selectedColor : tag.color}`}
                                      onClick={() => updateLeadTags(lead.id, tag.name)}
                                    >
                                      {isSelected ? <Check className="mr-1 h-3 w-3" /> : null}
                                      {tag.name}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Popover
                        open={openStatusPopover === lead.id}
                        onOpenChange={(open) => setOpenStatusPopover(open ? lead.id : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                              className={`text-xs px-2 py-1 h-auto font-normal ${statusColors[lead.listing_source] || 'bg-gray-100 text-gray-800'}`}
                          >
                              {lead.listing_source}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="start">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Update Status</p>
                            <div className="grid grid-cols-1 gap-1">
                              {statuses.map((status) => (
                                <Button
                                  key={status.id}
                                    variant={lead.listing_source === status.name ? "default" : "outline"}
                                  size="sm"
                                    className={`justify-start ${
                                      lead.listing_source === status.name
                                        ? `${status.color.replace(/bg-\w+-500\/10/, match => match.replace('10', '20')).replace(/dark:bg-\w+-800\/40/, match => match.replace('40', '60'))} ring-2 ring-primary/30`
                                        : status.color
                                    }`}
                                  onClick={() => updateLeadStatus(lead.id, status.name)}
                                >
                                    {lead.listing_source === status.name && <Check className="mr-1 h-3 w-3" />}
                                  {status.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setHighlightedRow(lead.id)
                                  if (lead.listing_url) {
                                    window.open(lead.listing_url, "_blank")
                                  }
                                }}
                                className="h-8 w-8 p-0 bg-red-600 dark:bg-red-900 text-white hover:bg-red-700 dark:hover:bg-red-800 hover:text-white"
                              >
                                <Home className="h-4 w-4" />
                                <span className="sr-only">View on Realtor.ca</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View on Realtor.ca</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setHighlightedRow(lead.id)
                                  findAgent(lead.agent_name, lead.brokerage_name)
                                }}
                                className="h-8 w-8 p-0 bg-blue-600 dark:bg-blue-900 text-white hover:bg-blue-700 dark:hover:bg-blue-800 hover:text-white"
                              >
                                <Search className="h-4 w-4" />
                                <span className="sr-only">Find Agent</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Find Agent</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setHighlightedRow(lead.id)
                                    openEmailModal(lead as Listing)
                                  }}
                                  className={`h-8 w-8 p-0 ${
                                    lead.agent_email
                                      ? "bg-black text-white hover:bg-black/90 hover:text-white"
                                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                                  }`}
                              >
                                <Mail className="h-4 w-4" />
                                <span className="sr-only">Send Email</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Send Email</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                  onClick={() => {
                                    setHighlightedRow(lead.id)
                                    if (lead.instagram_account) {
                                      const instagramUrl = lead.instagram_account.startsWith('http') 
                                        ? lead.instagram_account 
                                        : `https://www.instagram.com/${lead.instagram_account}`
                                      window.open(instagramUrl, "_blank")
                                    } else {
                                      const searchQuery = `${lead.agent_name} ${lead.brokerage_name} real estate agent instagram`
                                      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, "_blank")
                                    }
                                  }}
                                  className={`h-8 w-8 p-0 ${
                                    lead.instagram_account 
                                      ? "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 hover:text-white"
                                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                                  }`}
                              >
                                  <Instagram className="h-4 w-4" />
                                  <span className="sr-only">Find on Instagram</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{lead.instagram_account ? "Open Instagram Profile" : "No Instagram account"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                  onClick={() => handleAutoPaste(lead.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Clipboard className="h-4 w-4" />
                                <span className="sr-only">Paste Contact Info</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Paste Contact Info</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleRowExpansion(lead.id)}
                          aria-label="Toggle details"
                        >
                          {expandedRows[lead.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                    {expandedRows[lead.id] && (
                      <TableRow className={index % 2 === 0 ? "bg-muted/50" : ""}>
                        <TableCell colSpan={8} className="p-0 overflow-hidden">
                      <div
                        className={`border-t border-muted transition-all duration-300 ease-in-out ${
                          expandedRows[lead.id]
                            ? "max-h-[500px] opacity-100 transform-none"
                            : "max-h-0 opacity-0 transform -translate-y-4 overflow-hidden"
                        }`}
                      >
                            <div className="p-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                                  <h4 className="text-sm font-medium mb-4">Agent Details</h4>
                                  <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="font-medium">Name:</span> {lead.agent_name}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Building className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="font-medium">Brokerage:</span> {lead.brokerage_name}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-medium">Email:</span>{' '}
                                  {lead.agent_email ? (
                                    <>
                                      <a
                                        href={`mailto:${lead.agent_email}`}
                                        className="text-foreground hover:text-primary hover:underline transition-colors"
                                      >
                                        {lead.agent_email}
                                      </a>
                                      <button
                                        onClick={() => removeLeadField(lead.id, 'agent_email')}
                                        className="ml-1 text-muted-foreground hover:text-destructive"
                                        title="Remove email"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-muted-foreground">Not available</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-medium">Phone:</span>{" "}
                                      {lead.agent_phone ? (
                                        <a href={`tel:${lead.agent_phone}`} className="text-primary hover:underline">
                                          {lead.agent_phone}
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground">Not available</span>
                                  )}
                                </div>
                                  <div className="flex items-center gap-2">
                                    <Instagram className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="font-medium">Instagram:</span>{' '}
                                    {lead.instagram_account ? (
                                      <>
                                        <a
                                          href={lead.instagram_account.startsWith('http') ? lead.instagram_account : `https://www.instagram.com/${lead.instagram_account}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary hover:underline"
                                        >
                                          {(() => {
                                            const acct = lead.instagram_account;
                                            if (!acct) return null;
                                            if (acct.startsWith('http')) {
                                              const match = acct.match(/instagram.com\/(.+)$/);
                                              return match ? `@${match[1].replace(/\/$/, '')}` : acct;
                                            } else if (acct.startsWith('@')) {
                                              return acct;
                                            } else {
                                              return `@${acct}`;
                                            }
                                          })()}
                                        </a>
                                        <button
                                          onClick={() => removeLeadField(lead.id, 'instagram_account')}
                                          className="ml-1 text-muted-foreground hover:text-destructive"
                                          title="Remove Instagram"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-muted-foreground">Not available</span>
                                    )}
                                  </div>
                              </div>
                            </div>
                            <div>
                                  <h4 className="text-sm font-medium mb-4">Property Details</h4>
                                  <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <Home className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="font-medium">Address:</span> {lead.property_address}
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="font-medium">City:</span> {lead.property_city}
                                </div>
                                <div className="flex items-center gap-2">
                                  <MailOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="font-medium">Postal Code:</span> {lead.property_postal}
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="font-medium">Price:</span> {formatPrice(lead.property_price)}
                                </div>
                              </div>
                            </div>
                            <div>
                                  <h4 className="text-sm font-medium mb-4">Listing Details</h4>
                                  <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <Link className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-medium">URL:</span>{" "}
                                  <a
                                        href={lead.listing_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline truncate max-w-[200px] inline-block align-bottom"
                                  >
                                    View Listing
                                  </a>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-medium">Listed:</span>{" "}
                                      {format(new Date(lead.listing_date), "MM/dd/yyyy")}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="font-medium">Source:</span> {lead.listing_source}
                                </div>
                                <div className="flex items-start gap-2">
                                  <StickyNote className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                  <div>
                                    <span className="font-medium">Notes:</span>{" "}
                                    <span className="text-muted-foreground">{lead.notes || "No notes"}</span>
                                  </div>
                                </div>
                                    <div className="flex items-center gap-2">
                                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        className="h-8"
                                        onClick={() => {
                                          if (window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
                                            deleteLead(lead.id)
                                          }
                                        }}
                                      >
                                        Delete Lead
                                      </Button>
                                    </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                    )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              Last
            </Button>
          </div>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
          >
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
      </div>

      {/* Email Template Modal */}
      {selectedLead && (
        <EmailTemplateModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          agentName={selectedLead.agent_name}
          agentEmail={selectedLead.agent_email || undefined}
          propertyAddress={selectedLead.property_address}
        />
                  )}

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Filter Leads</DialogTitle>
            <DialogDescription>Select filters to narrow down your lead list.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Status Filter */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Filter by Status</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setStatusFilter("all")}
                >
                  All Statuses
                </Button>
                {statuses.map((status) => (
                  <Button
                    key={status.id}
                    variant={statusFilter === status.name ? "default" : "outline"}
                    className={`justify-between ${statusFilter === status.name ? "" : status.color}`}
                    onClick={() => setStatusFilter(status.name)}
                  >
                    <span>{status.name}</span>
                    {statusCounts[status.name] && (
                      <Badge variant="secondary" className="ml-2">
                        {statusCounts[status.name]}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tag Filter */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Filter by Tags</h3>
              <div className="grid grid-cols-2 gap-3">
                {availableTags.map((tag) => {
                  const isSelected = tagFilter === tag.name;
                  const count = tagCounts[tag.name] || 0;

                  return (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleTagFilter(tag.name)}
                        className={`${isSelected ? tag.selectedColor : tag.color}`}
                      />
                      <label
                        htmlFor={`tag-${tag.id}`}
                        className={`flex justify-between items-center w-full text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isSelected ? tag.selectedColor : tag.color}`}
                      >
                        <span>{tag.name}</span>
                        {count > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {count}
                          </Badge>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => {
              clearFilters();
              setFilterDialogOpen(false);
            }}>
              Clear All
            </Button>
            <Button onClick={() => setFilterDialogOpen(false)}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extracted Info Dialog */}
      {showExtractedDialog && pendingExtractedInfo && (
        <Dialog open={showExtractedDialog} onOpenChange={setShowExtractedDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Extracted Contact Info</DialogTitle>
              <DialogDescription>
                Review and edit the extracted information before saving to the lead.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  value={pendingExtractedInfo.email || ''}
                  onChange={e => setPendingExtractedInfo({ ...pendingExtractedInfo, email: e.target.value })}
                  placeholder="Email address"
                />
              </div>
              <div>
                <Label>Instagram</Label>
                <Input
                  value={pendingExtractedInfo.instagram || ''}
                  onChange={e => setPendingExtractedInfo({ ...pendingExtractedInfo, instagram: e.target.value })}
                  placeholder="Instagram URL or @username"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={pendingExtractedInfo.phone || ''}
                  onChange={e => setPendingExtractedInfo({ ...pendingExtractedInfo, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExtractedDialog(false)}>Cancel</Button>
              <Button onClick={saveExtractedInfo}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
