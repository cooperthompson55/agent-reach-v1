-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL,
    agent_email TEXT,
    agent_phone TEXT,
    property_address TEXT NOT NULL,
    property_city TEXT NOT NULL,
    property_postal TEXT NOT NULL,
    property_price TEXT NOT NULL,
    photo_count INTEGER DEFAULT 0,
    listing_url TEXT,
    listing_date TEXT NOT NULL,
    brokerage_name TEXT NOT NULL,
    listing_source TEXT NOT NULL,
    notes TEXT,
    instagram_account TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for commonly searched fields
CREATE INDEX IF NOT EXISTS idx_listings_agent_name ON listings(agent_name);
CREATE INDEX IF NOT EXISTS idx_listings_property_city ON listings(property_city);
CREATE INDEX IF NOT EXISTS idx_listings_listing_date ON listings(listing_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Disable Row Level Security
ALTER TABLE listings DISABLE ROW LEVEL SECURITY; 