-- Migration: Hybrid Search Infrastructure
-- Description: Add google_place_id column to places table and create search_cache table
-- Requirements: 3.3, 5.1, 5.2
-- Date: 2024-01-15

-- 1. Add google_place_id column to places table with unique index
-- This column stores the Google Places API place_id to prevent duplicates
-- and enable enrichment of existing records
ALTER TABLE places ADD COLUMN IF NOT EXISTS google_place_id VARCHAR(255);

-- Create unique index on google_place_id to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_places_google_place_id_unique 
ON places(google_place_id) 
WHERE google_place_id IS NOT NULL;

-- 2. Create search_cache table for logging API calls
-- This table tracks all Google Places API calls for cost monitoring and optimization
CREATE TABLE IF NOT EXISTS search_cache (
  id SERIAL PRIMARY KEY,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  radius INTEGER NOT NULL,
  results_count INTEGER,
  response_time_ms INTEGER,
  estimated_cost DECIMAL(10, 4),
  error_message TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'failed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_cache_location ON search_cache(lat, lng);
CREATE INDEX IF NOT EXISTS idx_search_cache_created_at ON search_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_search_cache_status ON search_cache(status);

-- 3. Verification queries
-- Check if google_place_id column was added
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'places' AND column_name = 'google_place_id';

-- Check if search_cache table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'search_cache';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('places', 'search_cache') 
AND indexname LIKE '%google_place_id%' OR indexname LIKE '%search_cache%';
