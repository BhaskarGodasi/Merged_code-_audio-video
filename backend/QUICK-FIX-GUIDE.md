# Production Server Fix - Step by Step

## Your Error Analysis
The error `Can't connect to local server through socket '/run/mysqld/mysqld.sock'` means:
- MySQL is not running, OR
- You need to connect via TCP/IP instead of socket

## Solution: Use TCP Connection

### Step 1: Check if MySQL is running
```bash
sudo systemctl status mysql
# or
sudo systemctl status mysqld
```

If not running, start it:
```bash
sudo systemctl start mysql
# or
sudo systemctl start mysqld
```

### Step 2: Connect using TCP (not socket)
```bash
# Your credentials from .env:
# DB_USER=audio_dooh_user
# DB_PASSWORD=Aa12345678!
# DB_NAME=dooh_audio_platform

# Connect with -h flag (forces TCP connection)
mysql -h127.0.0.1 -uaudio_dooh_user -p dooh_audio_platform

# When prompted, enter password: Aa12345678!
```

### Step 3: Run the fix SQL directly
Once connected to MySQL, paste these commands:

```sql
-- 1. Update SequelizeMeta
UPDATE SequelizeMeta 
SET name = '20251115000001-1-create-brands.js' 
WHERE name = '20251115000001-5-create-brands.js';

-- 2. Check current FK constraints
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
```

### Step 4: Fix Foreign Keys (based on output from Step 3)

**If users.brandId references 'companies':**
```sql
-- Replace 'users_ibfk_1' with actual constraint name from Step 3
ALTER TABLE users DROP FOREIGN KEY users_ibfk_1;
ALTER TABLE users ADD CONSTRAINT users_brandId_fkey 
  FOREIGN KEY (brandId) REFERENCES brands(id) 
  ON UPDATE CASCADE ON DELETE SET NULL;
```

**If campaigns.brandId references 'companies':**
```sql
-- Replace 'campaigns_ibfk_1' with actual constraint name from Step 3
ALTER TABLE campaigns DROP FOREIGN KEY campaigns_ibfk_1;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_brandId_fkey 
  FOREIGN KEY (brandId) REFERENCES brands(id) 
  ON UPDATE CASCADE ON DELETE SET NULL;
```

### Step 5: Verify the fix
```sql
-- Check all FK relationships
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'dooh_audio_platform'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;

-- Check migration tracking
SELECT * FROM SequelizeMeta ORDER BY name;

-- Exit MySQL
EXIT;
```

## Alternative: Use SQL File

If you prefer, upload `simple-fix.sql` to your server and run:

```bash
cd /www/wwwroot/audio_dooh/backend

# Run the diagnostic SQL file
mysql -h127.0.0.1 -uaudio_dooh_user -p dooh_audio_platform < simple-fix.sql

# This will show you the constraint names
# Then manually run the ALTER TABLE commands
```

## Alternative: Use the Shell Script

Upload `fix-production-migration.sh` and run:

```bash
cd /www/wwwroot/audio_dooh/backend
chmod +x fix-production-migration.sh
./fix-production-migration.sh
```

## After Fixing

1. **Verify migration status:**
```bash
cd /www/wwwroot/audio_dooh/backend
npx sequelize-cli db:migrate:status
```

2. **Restart application:**
```bash
pm2 restart dooh-backend
# or if using different process name:
pm2 list  # to see your process names
```

3. **Check logs:**
```bash
pm2 logs dooh-backend
```

## Troubleshooting

### If you can't connect with audio_dooh_user
Try with root:
```bash
mysql -h127.0.0.1 -uroot -p dooh_audio_platform
```

### If MySQL socket error persists
Add this to your MySQL command:
```bash
mysql --protocol=TCP -h127.0.0.1 -uaudio_dooh_user -p dooh_audio_platform
```

### If you need to create the user
```sql
-- Connect as root first
mysql -h127.0.0.1 -uroot -p

-- Create user and grant privileges
CREATE USER IF NOT EXISTS 'audio_dooh_user'@'localhost' IDENTIFIED BY 'Aa12345678!';
CREATE USER IF NOT EXISTS 'audio_dooh_user'@'127.0.0.1' IDENTIFIED BY 'Aa12345678!';
GRANT ALL PRIVILEGES ON dooh_audio_platform.* TO 'audio_dooh_user'@'localhost';
GRANT ALL PRIVILEGES ON dooh_audio_platform.* TO 'audio_dooh_user'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

## Quick One-Liner Fix

If you just want to update SequelizeMeta:
```bash
mysql -h127.0.0.1 -uaudio_dooh_user -p -e "USE dooh_audio_platform; UPDATE SequelizeMeta SET name = '20251115000001-1-create-brands.js' WHERE name = '20251115000001-5-create-brands.js'; SELECT * FROM SequelizeMeta ORDER BY name;"
```

---

**The key is using `-h127.0.0.1` to force TCP connection instead of socket!**
