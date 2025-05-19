export interface Listing {
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

export type CreateListingInput = Omit<Listing, 'id' | 'created_at' | 'updated_at'>
export type UpdateListingInput = Partial<CreateListingInput> 