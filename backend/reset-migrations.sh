#!/bin/bash

# Reset and Run Fresh Migrations Script
# This will clear the SequelizeMeta table and re-run all migrations

echo "=== Resetting Database Migrations ==="
echo ""
echo "WARNING: This will drop all existing tables and re-run migrations"
echo "Press Ctrl+C to cancel, or press Enter to continue..."
read

# Database credentials from .env
DB_USER="audio_dooh_user"
DB_PASSWORD="Aa12345678!"
DB_NAME="dooh_audio_platform"
DB_HOST="127.0.0.1"

echo ""
echo "Step 1: Dropping all existing tables..."
mysql -u $DB_USER -p$DB_PASSWORD -h $DB_HOST $DB_NAME << EOF
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS device_schedule_jingles;
DROP TABLE IF EXISTS device_schedules;
DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS campaign_jingles;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS jingles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS SequelizeMeta;
SET FOREIGN_KEY_CHECKS = 1;
EOF

if [ $? -eq 0 ]; then
    echo "✓ All tables dropped successfully"
else
    echo "✗ Error dropping tables"
    exit 1
fi

echo ""
echo "Step 2: Running fresh migrations..."
cd /www/wwwroot/audio_dooh/backend
npm run migrate

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Migrations completed successfully!"
    echo ""
    echo "Step 3: Checking migration status..."
    npm run migrate:status
else
    echo "✗ Migration failed"
    exit 1
fi

echo ""
echo "=== Migration Reset Complete ==="
