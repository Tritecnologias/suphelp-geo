# Database Migrations

This directory contains SQL migration files for the SupHelp Geo database.

## Migration Files

### 001_hybrid_search_infrastructure.sql

**Purpose**: Prepare database infrastructure for hybrid search functionality (local + Google Places API)

**Changes**:
1. Adds `google_place_id VARCHAR(255)` column to `places` table with unique index
2. Creates `search_cache` table for logging Google Places API calls
3. Creates performance indexes on `search_cache` table

**Requirements**: 3.3, 5.1, 5.2 from hybrid-search spec

**Status**: ✅ Executed successfully on 2024-01-15

## Running Migrations

### Execute a migration:
```bash
node backend/src/migrations/run_migration.js [migration_file.sql]
```

Example:
```bash
node backend/src/migrations/run_migration.js 001_hybrid_search_infrastructure.sql
```

If no file is specified, it will run `001_hybrid_search_infrastructure.sql` by default.

### Verify migration:
```bash
node backend/src/migrations/verify_migration.js
```

This will check:
- ✅ `google_place_id` column exists in `places` table
- ✅ Unique index on `google_place_id`
- ✅ `search_cache` table exists with all required columns
- ✅ All indexes on `search_cache` table

## Database Schema Changes

### places table (modified)

Added column:
- `google_place_id VARCHAR(255)` - Stores Google Places API place_id to prevent duplicates

Added index:
- `idx_places_google_place_id_unique` - Unique index on google_place_id (where not null)

### search_cache table (new)

Columns:
- `id SERIAL PRIMARY KEY`
- `lat DECIMAL(10, 7) NOT NULL` - Search center latitude
- `lng DECIMAL(10, 7) NOT NULL` - Search center longitude
- `radius INTEGER NOT NULL` - Search radius in meters
- `results_count INTEGER` - Number of results returned by API
- `response_time_ms INTEGER` - API response time in milliseconds
- `estimated_cost DECIMAL(10, 4)` - Estimated cost of API call
- `error_message TEXT` - Error message if call failed
- `status VARCHAR(20) NOT NULL` - 'completed' or 'failed'
- `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

Indexes:
- `idx_search_cache_location` - On (lat, lng) for location-based queries
- `idx_search_cache_created_at` - On created_at for time-based queries
- `idx_search_cache_status` - On status for filtering by success/failure

## Rollback

To rollback this migration, execute:

```sql
-- Remove google_place_id column from places
ALTER TABLE places DROP COLUMN IF EXISTS google_place_id;

-- Drop search_cache table
DROP TABLE IF EXISTS search_cache;
```

## Notes

- All migrations use `IF NOT EXISTS` / `IF EXISTS` clauses to be idempotent
- Migrations are wrapped in transactions (BEGIN/COMMIT/ROLLBACK)
- The unique index on `google_place_id` uses `WHERE google_place_id IS NOT NULL` to allow multiple NULL values
- The `search_cache` table has a CHECK constraint on status to ensure only 'completed' or 'failed' values
