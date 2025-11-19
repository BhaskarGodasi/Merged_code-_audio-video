# Production Migration Fix - Step by Step Guide

## Current Situation
- Old migration `20251115000001-5-create-brands.js` already ran in production
- This migration had wrong FK reference (companies instead of brands)
- Need to update the database to reflect correct migration state

## Solution Steps

### Step 1: Update SequelizeMeta Table
Run this SQL in your production MySQL database:

```sql
-- Update migration tracking to use new filename
UPDATE SequelizeMeta 
SET name = '20251115000001-1-create-brands.js' 
WHERE name = '20251115000001-5-create-brands.js';

-- Verify
SELECT * FROM SequelizeMeta ORDER BY name;
```

### Step 2: Verify Migration Status
```bash
cd /www/wwwroot/audio_dooh/backend
npx sequelize-cli db:migrate:status
```

Expected output: All migrations should show "up" status

### Step 3: Check Foreign Key Constraints

Run in MySQL to verify current FK constraints:

```sql
-- Check users table foreign keys
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'dooh_audio_platform'
  AND TABLE_NAME = 'users'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Check campaigns table foreign keys
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'dooh_audio_platform'
  AND TABLE_NAME = 'campaigns'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

### Step 4: Fix Foreign Key References (If Needed)

If `users.brandId` or `campaigns.brandId` still reference `companies` instead of `brands`:

```sql
-- For users table
-- Drop old constraint (find actual constraint name from Step 3)
ALTER TABLE users 
DROP FOREIGN KEY users_ibfk_1;  -- Replace with actual constraint name

-- Add correct constraint
ALTER TABLE users
ADD CONSTRAINT users_brandId_fkey 
FOREIGN KEY (brandId) 
REFERENCES brands(id) 
ON UPDATE CASCADE 
ON DELETE SET NULL;

-- For campaigns table
-- Drop old constraint
ALTER TABLE campaigns 
DROP FOREIGN KEY campaigns_ibfk_1;  -- Replace with actual constraint name

-- Add correct constraint
ALTER TABLE campaigns
ADD CONSTRAINT campaigns_brandId_fkey 
FOREIGN KEY (brandId) 
REFERENCES brands(id) 
ON UPDATE CASCADE 
ON DELETE SET NULL;
```

### Step 5: Verify Schema Integrity

```sql
-- Check all tables exist
SHOW TABLES;

-- Verify brands table structure
DESCRIBE brands;

-- Verify users table structure
DESCRIBE users;

-- Verify campaigns table structure
DESCRIBE campaigns;

-- Check all foreign key relationships
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'dooh_audio_platform'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;
```

### Step 6: Restart Application

```bash
cd /www/wwwroot/audio_dooh/backend
pm2 restart dooh-backend  # or whatever your process name is
```

## For Fresh Database (New Installation)

If deploying to a completely new/empty database:

```bash
cd /www/wwwroot/audio_dooh/backend

# Verify migration files are in correct order
ls -la migrations/

# Run all migrations
npm run migrate
# or
npx sequelize-cli db:migrate

# Verify all migrations completed
npx sequelize-cli db:migrate:status
```

## Migration File Order (Final)

1. `20251115000001-1-create-brands.js` ✅
2. `20251115000001-create-companies.js` ✅
3. `20251115000002-create-users.js` ✅ (FK: brands)
4. `20251115000003-create-jingles.js` ✅
5. `20251115000004-create-devices.js` ✅
6. `20251115000005-create-campaigns.js` ✅ (FK: brands)
7. `20251115000006-create-campaign-jingles.js` ✅
8. `20251115000007-create-device-schedules.js` ✅
9. `20251115000008-create-device-schedule-jingles.js` ✅
10. `20251115000009-create-logs.js` ✅

## Fixed Foreign Key Relationships

- `brands.companyId` → `companies.id` ✅
- `users.brandId` → `brands.id` ✅ (FIXED: was pointing to companies)
- `campaigns.brandId` → `brands.id` ✅ (FIXED: was pointing to companies)
- `campaign_jingles.campaignId` → `campaigns.id` ✅
- `campaign_jingles.jingleId` → `jingles.id` ✅
- `device_schedules.deviceId` → `devices.id` ✅
- `device_schedule_jingles.deviceScheduleId` → `device_schedules.id` ✅
- `device_schedule_jingles.jingleId` → `jingles.id` ✅
- `logs.deviceId` → `devices.id` ✅
- `logs.campaignId` → `campaigns.id` ✅
- `logs.jingleId` → `jingles.id` ✅

## Troubleshooting

### If migration still fails with FK error:

1. Check which table is missing:
   ```sql
   SHOW TABLES;
   ```

2. Check if the referenced table exists before the referencing table in migration order

3. Manually inspect SequelizeMeta:
   ```sql
   SELECT * FROM SequelizeMeta ORDER BY name;
   ```

4. If needed, rollback and re-run:
   ```bash
   npx sequelize-cli db:migrate:undo:all
   npx sequelize-cli db:migrate
   ```

### If constraint name conflicts:

```sql
-- Find existing constraint
SHOW CREATE TABLE users;

-- Drop it
ALTER TABLE users DROP FOREIGN KEY constraint_name_here;

-- Recreate with correct reference
ALTER TABLE users
ADD CONSTRAINT users_brandId_fkey 
FOREIGN KEY (brandId) REFERENCES brands(id) 
ON UPDATE CASCADE ON DELETE SET NULL;
```

## Success Verification

Run these checks to confirm everything is correct:

```bash
# 1. All migrations are up
npx sequelize-cli db:migrate:status

# 2. Application starts without errors
npm run dev

# 3. Can query all tables
mysql -u root -p dooh_audio_platform -e "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM brands; SELECT COUNT(*) FROM campaigns;"
```

---

**Created**: November 18, 2025
**Status**: Ready for production deployment
