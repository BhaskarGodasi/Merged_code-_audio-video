-- ============================================================================
-- Simple Production Database Fix
-- Run this with: mysql -h127.0.0.1 -uaudio_dooh_user -p dooh_audio_platform < simple-fix.sql
-- ============================================================================

USE dooh_audio_platform;

-- 1. Update SequelizeMeta
UPDATE SequelizeMeta 
SET name = '20251115000001-1-create-brands.js' 
WHERE name = '20251115000001-5-create-brands.js';

SELECT 'Updated SequelizeMeta' AS Status;

-- 2. Show current users FK
SELECT 
    CONCAT('users.brandId currently references: ', 
           COALESCE(REFERENCED_TABLE_NAME, 'NO FK')) AS CurrentState
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'dooh_audio_platform'
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'brandId'
  AND REFERENCED_TABLE_NAME IS NOT NULL
LIMIT 1;

-- 3. Show current campaigns FK
SELECT 
    CONCAT('campaigns.brandId currently references: ', 
           COALESCE(REFERENCED_TABLE_NAME, 'NO FK')) AS CurrentState
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'dooh_audio_platform'
  AND TABLE_NAME = 'campaigns'
  AND COLUMN_NAME = 'brandId'
  AND REFERENCED_TABLE_NAME IS NOT NULL
LIMIT 1;

-- 4. List all constraint names for manual fixing
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'dooh_audio_platform'
  AND TABLE_NAME IN ('users', 'campaigns')
  AND COLUMN_NAME = 'brandId'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- ============================================================================
-- MANUAL FIX COMMANDS (if needed)
-- Copy the constraint names from above and run these:
-- ============================================================================
-- 
-- For users table:
-- ALTER TABLE users DROP FOREIGN KEY <constraint_name_from_above>;
-- ALTER TABLE users ADD CONSTRAINT users_brandId_fkey 
--   FOREIGN KEY (brandId) REFERENCES brands(id) 
--   ON UPDATE CASCADE ON DELETE SET NULL;
--
-- For campaigns table:
-- ALTER TABLE campaigns DROP FOREIGN KEY <constraint_name_from_above>;
-- ALTER TABLE campaigns ADD CONSTRAINT campaigns_brandId_fkey 
--   FOREIGN KEY (brandId) REFERENCES brands(id) 
--   ON UPDATE CASCADE ON DELETE SET NULL;
-- ============================================================================

SELECT '=== Fix Complete! Run the ALTER TABLE commands above if needed ===' AS NextStep;
