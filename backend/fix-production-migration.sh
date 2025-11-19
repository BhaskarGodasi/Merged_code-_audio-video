#!/bin/bash
# ============================================================================
# Production Database Migration Fix Script
# Database: dooh_audio_platform
# Date: November 18, 2025
# ============================================================================

echo "==============================================="
echo "Audio DOOH Platform - Database Migration Fix"
echo "==============================================="
echo ""

# Database credentials from your .env
DB_NAME="dooh_audio_platform"
DB_USER="audio_dooh_user"
DB_PASSWORD="Aa12345678!"
DB_HOST="127.0.0.1"

echo "Step 1: Checking MySQL service status..."
if systemctl is-active --quiet mysql || systemctl is-active --quiet mysqld; then
    echo "✓ MySQL is running"
else
    echo "⚠ MySQL service not running. Starting..."
    sudo systemctl start mysql || sudo systemctl start mysqld
fi

echo ""
echo "Step 2: Testing database connection..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT 'Connection successful' AS Status;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ Database connection successful"
else
    echo "✗ Connection failed. Please check credentials"
    echo "Trying with root user..."
    read -sp "Enter MySQL root password: " ROOT_PASSWORD
    echo ""
    DB_USER="root"
    DB_PASSWORD="$ROOT_PASSWORD"
fi

echo ""
echo "Step 3: Backing up database..."
BACKUP_FILE="dooh_backup_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ Backup created: $BACKUP_FILE"
else
    echo "⚠ Backup failed, continuing anyway..."
fi

echo ""
echo "Step 4: Applying migration fixes..."

# Create temporary SQL file
cat > /tmp/fix_migration.sql << 'EOF'
-- Update SequelizeMeta
UPDATE SequelizeMeta 
SET name = '20251115000001-1-create-brands.js' 
WHERE name = '20251115000001-5-create-brands.js';

SELECT 'Step 4.1: Updated SequelizeMeta' AS Status;

-- Check users FK
SELECT CONCAT('Current users.brandId references: ', IFNULL(REFERENCED_TABLE_NAME, 'NONE')) AS Info
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'brandId'
  AND REFERENCED_TABLE_NAME IS NOT NULL
LIMIT 1;

-- Fix users FK if needed
SET @constraint_name = (
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'brandId'
      AND REFERENCED_TABLE_NAME = 'companies'
    LIMIT 1
);

SET @sql = IF(@constraint_name IS NOT NULL,
    CONCAT('ALTER TABLE users DROP FOREIGN KEY ', @constraint_name),
    'SELECT "No users FK to drop" AS Info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(@constraint_name IS NOT NULL,
    'ALTER TABLE users ADD CONSTRAINT users_brandId_fkey FOREIGN KEY (brandId) REFERENCES brands(id) ON UPDATE CASCADE ON DELETE SET NULL',
    'SELECT "Users FK already correct" AS Info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Step 4.2: Fixed users.brandId FK' AS Status;

-- Check campaigns FK
SELECT CONCAT('Current campaigns.brandId references: ', IFNULL(REFERENCED_TABLE_NAME, 'NONE')) AS Info
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'campaigns'
  AND COLUMN_NAME = 'brandId'
  AND REFERENCED_TABLE_NAME IS NOT NULL
LIMIT 1;

-- Fix campaigns FK if needed
SET @constraint_name = (
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'campaigns'
      AND COLUMN_NAME = 'brandId'
      AND REFERENCED_TABLE_NAME = 'companies'
    LIMIT 1
);

SET @sql = IF(@constraint_name IS NOT NULL,
    CONCAT('ALTER TABLE campaigns DROP FOREIGN KEY ', @constraint_name),
    'SELECT "No campaigns FK to drop" AS Info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(@constraint_name IS NOT NULL,
    'ALTER TABLE campaigns ADD CONSTRAINT campaigns_brandId_fkey FOREIGN KEY (brandId) REFERENCES brands(id) ON UPDATE CASCADE ON DELETE SET NULL',
    'SELECT "Campaigns FK already correct" AS Info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Step 4.3: Fixed campaigns.brandId FK' AS Status;

-- Verification
SELECT '=== VERIFICATION RESULTS ===' AS '';
SELECT name AS 'Migration Files' FROM SequelizeMeta ORDER BY name;

SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;

EOF

# Execute the SQL
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < /tmp/fix_migration.sql

if [ $? -eq 0 ]; then
    echo "✓ Migration fixes applied successfully"
else
    echo "✗ Failed to apply fixes"
    exit 1
fi

echo ""
echo "Step 5: Verifying migration status..."
cd /www/wwwroot/audio_dooh/backend
npx sequelize-cli db:migrate:status

echo ""
echo "==============================================="
echo "✓ Database migration fix completed!"
echo "==============================================="
echo ""
echo "Next steps:"
echo "1. Restart your application: pm2 restart dooh-backend"
echo "2. Check logs: pm2 logs dooh-backend"
echo "3. Test the application"
echo ""
echo "Backup file: $BACKUP_FILE"
echo ""

# Cleanup
rm -f /tmp/fix_migration.sql
