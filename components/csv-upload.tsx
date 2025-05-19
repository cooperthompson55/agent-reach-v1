"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import Papa from "papaparse"
import { Progress } from "@/components/ui/progress"

interface CSVUploadProps {
  onUploadSuccess?: () => void
}

interface CSVRecord {
  "First Name"?: string
  "Last Name"?: string
  "Email"?: string
  "Phone"?: string
  "Website"?: string
  "Price"?: string
  "Number of Listings"?: string
  "Number of Photos"?: string
  "Street Address"?: string
  "Date Posted"?: string
  "Listing URL"?: string
  "Town"?: string
  "Brokerage"?: string
}

interface UploadQueueItem {
  file: File
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  message: string
}

function parseRelativeTime(timeStr: string): string {
  const now = new Date()
  const match = timeStr.match(/(\d+)\s*(min|hour|day|week|month|year)s?\s*ago/i)
  
  if (!match) return timeStr // Return original if not a relative time format
  
  const [, amount, unit] = match
  const value = parseInt(amount)
  
  switch (unit.toLowerCase()) {
    case 'min':
      now.setMinutes(now.getMinutes() - value)
      break
    case 'hour':
      now.setHours(now.getHours() - value)
      break
    case 'day':
      now.setDate(now.getDate() - value)
      break
    case 'week':
      now.setDate(now.getDate() - (value * 7))
      break
    case 'month':
      now.setMonth(now.getMonth() - value)
      break
    case 'year':
      now.setFullYear(now.getFullYear() - value)
      break
  }
  
  return now.toISOString()
}

function parseCityAndPostal(town: string | undefined): { city: string, postal: string } {
  if (!town) return { city: "Unknown City", postal: "Unknown" }
  return { city: town.trim(), postal: "Unknown" }
}

function cleanAddress(address: string | undefined): string {
  if (!address) return "Unknown Address"
  
  // Remove any directional indicators (E, W, S, N) that are followed by a space
  let cleaned = address.replace(/\s+[EWSN]\s+/g, ' ')
  
  // Remove anything in parentheses and the parentheses themselves
  cleaned = cleaned.replace(/\s*\([^)]*\)/g, '')
  
  // Remove the town name if it appears at the end
  const townMatch = cleaned.match(/(.*?)(?:\s+(?:Milton|Toronto|Mississauga|Oakville|Burlington|Hamilton|Brampton|Vaughan|Markham|Richmond Hill|Aurora|Newmarket|Oshawa|Pickering|Ajax|Whitby|Scarborough|Etobicoke|North York|York|East York|Weston|Rexdale|Malton|Port Credit|Streetsville|Clarkson|Lorne Park|Erin Mills|Meadowvale|Churchville|Palgrave|Bolton|Caledon|Georgetown|Acton|Halton Hills|Milton|Burlington|Oakville|Mississauga|Toronto|York Region|Durham Region|Peel Region|Halton Region|GTA|Greater Toronto Area))$/i)
  if (townMatch) {
    cleaned = townMatch[1].trim()
  }
  
  // Remove any extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  return cleaned
}

export function CSVUpload({ onUploadSuccess }: CSVUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([])
  const { toast } = useToast()

  // Add useEffect to monitor queue changes
  useEffect(() => {
    const hasPendingFiles = uploadQueue.some(item => item.status === 'pending')
    if (hasPendingFiles && !isUploading) {
      processQueue()
    }
  }, [uploadQueue, isUploading])

  // Add useEffect to remove completed files
  useEffect(() => {
    const completedFiles = uploadQueue.filter(item => item.status === 'completed' || item.status === 'error')
    
    if (completedFiles.length > 0) {
      const timer = setTimeout(() => {
        setUploadQueue(prev => prev.filter(item => item.status === 'pending' || item.status === 'processing'))
      }, 3000) // Remove after 3 seconds

      return () => clearTimeout(timer)
    }
  }, [uploadQueue])

  const processFile = async (file: File, queueIndex: number) => {
    try {
      // Update queue item status
      setUploadQueue(prev => prev.map((item, idx) => 
        idx === queueIndex ? { ...item, status: 'processing', progress: 0, message: 'Starting upload...' } : item
      ))

      // Parse CSV file
      Papa.parse<CSVRecord>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: async (results) => {
          if (results.errors.length > 0) {
            throw new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`)
          }

          const records = results.data
          if (records.length === 0) {
            throw new Error('No records found in CSV file')
          }

          setUploadQueue(prev => prev.map((item, idx) => 
            idx === queueIndex ? { ...item, progress: 30, message: `Processing ${records.length} records...` } : item
          ))
          
          // Transform CSV data to match database schema
          const transformedRecords = records.map(record => {
            const firstName = record["First Name"]?.trim() || ""
            const lastName = record["Last Name"]?.trim() || ""
            const agentName = `${firstName} ${lastName}`.trim() || "Unknown Agent"
            
            // Parse the date, handling relative time formats
            const datePosted = record["Date Posted"]?.trim()
            const listingDate = datePosted ? parseRelativeTime(datePosted) : new Date().toISOString()
            
            // Add the ">10-Photos" tag if photo count is 10 or less
            const tags = parseInt(record["Number of Photos"] || "0") <= 10 ? ">10-Photos" : null

            // Parse city and postal from Town
            const { city: property_city, postal: property_postal } = parseCityAndPostal(record["Town"])

            return {
              agent_name: agentName,
              agent_email: record["Email"]?.trim() || null,
              agent_phone: record["Phone"]?.trim() || null,
              property_address: cleanAddress(record["Street Address"]),
              property_city,
              property_postal,
              property_price: record["Price"]?.replace(/[$,]/g, '').trim() || "0",
              photo_count: parseInt(record["Number of Photos"] || "0") || 0,
              listing_url: record["Listing URL"]?.trim() || "",
              listing_date: listingDate,
              brokerage_name: record["Brokerage"]?.trim() || "",
              listing_source: "Not Contacted",
              notes: tags,
              instagram_account: null,
              property_type: null,
              building_type: null,
              website: record["Website"]?.trim() || null,
            }
          })

          setUploadQueue(prev => prev.map((item, idx) => 
            idx === queueIndex ? { ...item, progress: 45, message: 'Checking for duplicates...' } : item
          ))

          // Get all existing listing URLs
          const { data: existingListings, error: fetchError } = await supabase
            .from('listings')
            .select('listing_url')

          if (fetchError) {
            throw new Error(`Error fetching existing listings: ${fetchError.message}`)
          }

          const existingUrls = new Set(existingListings?.map(listing => listing.listing_url) || [])
          const uniqueRecords = transformedRecords.filter(record => !existingUrls.has(record.listing_url))

          if (uniqueRecords.length === 0) {
            setUploadQueue(prev => prev.map((item, idx) => 
              idx === queueIndex ? { ...item, status: 'completed', progress: 100, message: 'No new records to import' } : item
            ))
            return
          }

          setUploadQueue(prev => prev.map((item, idx) => 
            idx === queueIndex ? { ...item, progress: 60, message: `Uploading ${uniqueRecords.length} new records...` } : item
          ))

          const { error, data } = await supabase
            .from('listings')
            .insert(uniqueRecords)
            .select()

          if (error) {
            throw new Error(`Database error: ${error.message}`)
          }

          setUploadQueue(prev => prev.map((item, idx) => 
            idx === queueIndex ? { 
              ...item, 
              status: 'completed', 
              progress: 100, 
              message: `Successfully imported ${uniqueRecords.length} new records (${transformedRecords.length - uniqueRecords.length} duplicates skipped)`
            } : item
          ))

          toast({
            title: "Success",
            description: `Successfully imported ${uniqueRecords.length} new records from ${file.name}. ${transformedRecords.length - uniqueRecords.length} duplicates were skipped.`,
          })

          if (onUploadSuccess) {
            onUploadSuccess()
          }
        },
        error: (error: Error) => {
          throw new Error(`Error parsing CSV: ${error.message}`)
        }
      })
    } catch (error) {
      console.error('Error importing CSV:', error)
      setUploadQueue(prev => prev.map((item, idx) => 
        idx === queueIndex ? { 
          ...item, 
          status: 'error', 
          message: error instanceof Error ? error.message : "Failed to import CSV file"
        } : item
      ))
      toast({
        title: "Error",
        description: `Error processing ${file.name}: ${error instanceof Error ? error.message : "Failed to import CSV file"}`,
        variant: "destructive",
      })
    }
  }

  const processQueue = async () => {
    if (isUploading) return

    setIsUploading(true)
    const pendingFiles = uploadQueue.filter(item => item.status === 'pending')
    
    for (let i = 0; i < pendingFiles.length; i++) {
      const queueIndex = uploadQueue.findIndex(item => item.file === pendingFiles[i].file)
      await processFile(pendingFiles[i].file, queueIndex)
    }

    setIsUploading(false)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const newQueueItems: UploadQueueItem[] = Array.from(files).map(file => ({
      file,
      status: 'pending',
      progress: 0,
      message: 'Waiting to process...'
    }))

    setUploadQueue(prev => [...prev, ...newQueueItems])
    // Remove the direct processQueue call since useEffect will handle it
    // processQueue()

    // Reset the file input
    event.target.value = ""
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
          id="csv-upload"
          disabled={isUploading}
          multiple
        />
        <Button
          variant="outline"
          onClick={() => document.getElementById('csv-upload')?.click()}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isUploading ? "Processing..." : "Import CSV Files"}
        </Button>
      </div>

      {uploadQueue.length > 0 && (
        <div className="space-y-4">
          {uploadQueue.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.file.name}</span>
                <span className={item.status === 'error' ? 'text-red-500' : 'text-gray-600'}>
                  {item.message}
                </span>
                {item.status === 'processing' && (
                  <span className="text-gray-500">{item.progress}%</span>
                )}
              </div>
              {item.status === 'processing' && (
                <Progress value={item.progress} className="h-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 