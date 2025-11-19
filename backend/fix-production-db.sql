-- ============================================================================
-- Production Database Migration Fix
-- Database: dooh_audio_platform
-- Date: November 18, 2025
-- Purpose: Fix foreign key references and migration tracking
-- ============================================================================

-- STEP 1: Update SequelizeMeta to reflect correct migration filename
-- ============================================================================
UPDATE SequelizeMeta 
SET name = '20251115000001-1-create-brands.js' 
WHERE name = '20251115000001-5-create-brands.js';

SELECT 'Step 1 Complete: Updated SequelizeMeta' AS Status;


-- STEP 2: Check current foreign key constraints
-- ============================================================================
SELECT 'Checking current users table foreign keys...' AS Status;

SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'brandId'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

SELECT 'Checking current campaigns table foreign keys...' AS Status;

SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'campaigns'
  AND COLUMN_NAME = 'brandId'
  AND REFERENCED_TABLE_NAME IS NOT NULL;


-- STEP 3: Fix users.brandId foreign key (if it references 'companies')
-- ============================================================================
-- Note: Replace 'users_ibfk_1' with actual constraint name from Step 2

SET @constraint_name = (
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'brandId'
      AND REFERENCED_TABLE_NAME = 'companies'
    LIMIT 1
);

-- Only run if constraint exists and points to wrong table
SET @drop_users_fk = IF(@constraint_name IS NOT NULL,
    CONCAT('ALTER TABLE users DROP FOREIGN KEY ', @constraint_name),
    'SELECT "No users FK to drop" AS Info'
);

PREPARE stmt FROM @drop_users_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add correct foreign key if it was dropped
SELECT IF(@constraint_name IS NOT NULL,
    'Dropped old users FK constraint',
    'No users FK to drop'
) AS Status;

-- Create new constraint pointing to brands
SET @add_users_fk = IF(@constraint_name IS NOT NULL,
    'ALTER TABLE users ADD CONSTRAINT users_brandId_fkey FOREIGN KEY (brandId) REFERENCES brands(id) ON UPDATE CASCADE ON DELETE SET NULL',
    'SELECT "Users FK already correct" AS Info'
);

PREPARE stmt FROM @add_users_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Step 3 Complete: Fixed users.brandId foreign key' AS Status;


-- STEP 4: Fix campaigns.brandId foreign key (if it references 'companies')
-- ============================================================================
SET @constraint_name = (
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'campaigns'
      AND COLUMN_NAME = 'brandId'
      AND REFERENCED_TABLE_NAME = 'companies'
    LIMIT 1
);

-- Drop old constraint
SET @drop_campaigns_fk = IF(@constraint_name IS NOT NULL,
    CONCAT('ALTER TABLE campaigns DROP FOREIGN KEY ', @constraint_name),
    'SELECT "No campaigns FK to drop" AS Info'
);

PREPARE stmt FROM @drop_campaigns_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT IF(@constraint_name IS NOT NULL,
    'Dropped old campaigns FK constraint',
    'No campaigns FK to drop'
) AS Status;

-- Create new constraint pointing to brands
SET @add_campaigns_fk = IF(@constraint_name IS NOT NULL,
    'ALTER TABLE campaigns ADD CONSTRAINT campaigns_brandId_fkey FOREIGN KEY (brandId) REFERENCES brands(id) ON UPDATE CASCADE ON DELETE SET NULL',
    'SELECT "Campaigns FK already correct" AS Info'
);

PREPARE stmt FROM @add_campaigns_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Step 4 Complete: Fixed campaigns.brandId foreign key' AS Status;


-- STEP 5: Verify all foreign keys are correct
-- ============================================================================
SELECT 
    '=== ALL FOREIGN KEY RELATIONSHIPS ===' AS Info;

SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;


-- STEP 6: Verify SequelizeMeta is correct
-- ============================================================================
SELECT '=== MIGRATION STATUS ===' AS Info;

SELECT name AS MigrationFile 
FROM SequelizeMeta 
ORDER BY name;


-- STEP 7: Summary
-- ============================================================================
SELECT 
    '=== MIGRATION FIX COMPLETE ===' AS Status,
    'All foreign keys now reference correct tables' AS Detail,
    'SequelizeMeta updated to reflect correct filenames' AS Detail2,
    'Ready to restart application' AS NextStep;
