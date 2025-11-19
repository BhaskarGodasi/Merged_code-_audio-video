-- Fix SequelizeMeta table to reflect correct migration name
-- Run this SQL in your production database

-- Update the migration name from old to new
UPDATE SequelizeMeta 
SET name = '20251115000001-1-create-brands.js' 
WHERE name = '20251115000001-5-create-brands.js';

-- Verify the update
SELECT * FROM SequelizeMeta ORDER BY name;
