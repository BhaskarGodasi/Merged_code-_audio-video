require('dotenv').config();
const { sequelize } = require('./models');
const fs = require('fs');
const path = require('path');

/**
 * Complete Database Export with Data
 * Exports all tables with their data as SQL INSERT statements
 */

const tables = [
  'companies',
  'brands',
  'users',
  'jingles',
  'devices',
  'campaigns',
  'campaign_jingles',
  'device_schedules',
  'device_schedule_jingles',
  'logs'
];

async function exportDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const exportDir = path.join(__dirname, 'exports');
  
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const exportFile = path.join(exportDir, `full_export_${timestamp}.sql`);
  let sqlContent = `-- Database Export: ${new Date().toISOString()}\n`;
  sqlContent += `-- Database: ${process.env.DB_NAME}\n\n`;
  sqlContent += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

  console.log('Starting database export...\n');

  try {
    // Export schema and data for each table
    for (const table of tables) {
      console.log(`Exporting table: ${table}...`);
      
      // Get CREATE TABLE statement
      const [createResult] = await sequelize.query(`SHOW CREATE TABLE \`${table}\``);
      if (createResult && createResult[0]) {
        sqlContent += `-- Table: ${table}\n`;
        sqlContent += `DROP TABLE IF EXISTS \`${table}\`;\n`;
        sqlContent += `${createResult[0]['Create Table']};\n\n`;
      }

      // Get row count
      const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM \`${table}\``);
      const rowCount = countResult[0].count;
      console.log(`  → Found ${rowCount} rows`);

      if (rowCount > 0) {
        // Export data in batches
        const batchSize = 100;
        const batches = Math.ceil(rowCount / batchSize);
        
        for (let i = 0; i < batches; i++) {
          const offset = i * batchSize;
          const [rows] = await sequelize.query(
            `SELECT * FROM \`${table}\` LIMIT ${batchSize} OFFSET ${offset}`
          );

          if (rows.length > 0) {
            // Get column names
            const columns = Object.keys(rows[0]);
            const columnsList = columns.map(c => `\`${c}\``).join(', ');

            // Build INSERT statement
            sqlContent += `-- Data for ${table} (batch ${i + 1}/${batches})\n`;
            sqlContent += `INSERT INTO \`${table}\` (${columnsList}) VALUES\n`;

            const values = rows.map(row => {
              const rowValues = columns.map(col => {
                const value = row[col];
                if (value === null) return 'NULL';
                if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
                if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
                if (typeof value === 'string') return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
                return value;
              });
              return `(${rowValues.join(', ')})`;
            });

            sqlContent += values.join(',\n');
            sqlContent += ';\n\n';
          }
        }
      }

      sqlContent += '\n';
    }

    sqlContent += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    // Write to file
    fs.writeFileSync(exportFile, sqlContent, 'utf8');
    
    console.log(`\n✓ Export completed successfully!`);
    console.log(`✓ File saved to: ${exportFile}`);
    console.log(`✓ File size: ${(fs.statSync(exportFile).size / 1024).toFixed(2)} KB\n`);

    // Create import instructions
    const instructionsFile = path.join(exportDir, 'IMPORT_INSTRUCTIONS.txt');
    const instructions = `
DATABASE IMPORT INSTRUCTIONS
============================
Generated: ${new Date().toISOString()}

IMPORT THIS DATABASE EXPORT:
---------------------------

Option 1: Using MySQL Command Line
-----------------------------------
mysql -u YOUR_USERNAME -p YOUR_DATABASE_NAME < ${path.basename(exportFile)}

Option 2: Using Node.js Script
-------------------------------
node import-database.js

Option 3: Using phpMyAdmin or similar
--------------------------------------
1. Open phpMyAdmin
2. Select your database
3. Click "Import" tab
4. Choose file: ${path.basename(exportFile)}
5. Click "Go"

IMPORTANT NOTES:
----------------
1. Make sure the target database exists
2. Backup your target database before importing
3. The script will DROP existing tables and recreate them
4. FOREIGN_KEY_CHECKS are temporarily disabled during import
5. All data will be imported in the correct order

DATABASE CONFIGURATION:
-----------------------
Make sure your .env file has correct credentials:

DB_NAME=${process.env.DB_NAME}
DB_USER=YOUR_USERNAME
DB_PASSWORD=YOUR_PASSWORD
DB_HOST=YOUR_HOST
DB_PORT=3306
`;

    fs.writeFileSync(instructionsFile, instructions, 'utf8');
    console.log(`✓ Import instructions saved to: ${instructionsFile}\n`);

    // Summary
    console.log('EXPORT SUMMARY:');
    console.log('===============');
    for (const table of tables) {
      const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM \`${table}\``);
      console.log(`  ${table.padEnd(30)} ${countResult[0].count} rows`);
    }

    return exportFile;

  } catch (error) {
    console.error('Export failed:', error.message);
    throw error;
  }
}

// Run export
exportDatabase()
  .then((file) => {
    console.log('\n✓ Database export completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Export failed:', error);
    process.exit(1);
  });
