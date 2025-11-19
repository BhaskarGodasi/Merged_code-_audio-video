require('dotenv').config();
const { sequelize } = require('./models');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Database Import Script
 * Imports SQL file with all tables and data
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function importDatabase() {
  console.log('=================================');
  console.log('DATABASE IMPORT TOOL');
  console.log('=================================\n');

  // List available export files
  const exportDir = path.join(__dirname, 'exports');
  if (!fs.existsSync(exportDir)) {
    console.error('✗ No exports directory found. Please run export-database.js first.');
    process.exit(1);
  }

  const files = fs.readdirSync(exportDir).filter(f => f.endsWith('.sql'));
  
  if (files.length === 0) {
    console.error('✗ No SQL export files found in exports directory.');
    console.error('  Run: node export-database.js to create an export first.');
    process.exit(1);
  }

  console.log('Available export files:\n');
  files.forEach((file, index) => {
    const stats = fs.statSync(path.join(exportDir, file));
    const size = (stats.size / 1024).toFixed(2);
    console.log(`  ${index + 1}. ${file} (${size} KB)`);
  });

  console.log('\n');
  const fileIndex = await question('Select file number to import (or press Enter for latest): ');
  
  let selectedFile;
  if (fileIndex.trim() === '') {
    // Use latest file
    selectedFile = files.sort().reverse()[0];
    console.log(`\nUsing latest file: ${selectedFile}\n`);
  } else {
    const index = parseInt(fileIndex) - 1;
    if (index < 0 || index >= files.length) {
      console.error('✗ Invalid selection');
      process.exit(1);
    }
    selectedFile = files[index];
  }

  const filePath = path.join(exportDir, selectedFile);
  const sqlContent = fs.readFileSync(filePath, 'utf8');

  console.log('\n⚠️  WARNING: This will DROP and RECREATE all tables!');
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`File: ${selectedFile}\n`);

  const confirm = await question('Are you sure you want to continue? (yes/no): ');
  
  if (confirm.toLowerCase() !== 'yes') {
    console.log('\n✗ Import cancelled.');
    rl.close();
    process.exit(0);
  }

  console.log('\nStarting import...\n');

  try {
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';\n')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Show progress
      if (i % 10 === 0 || statement.includes('CREATE TABLE')) {
        const progress = ((i / statements.length) * 100).toFixed(1);
        process.stdout.write(`\rProgress: ${progress}% (${i}/${statements.length} statements)`);
        
        if (statement.includes('CREATE TABLE')) {
          const match = statement.match(/CREATE TABLE `(.+?)`/);
          if (match) {
            console.log(`\n  → Creating table: ${match[1]}`);
          }
        }
      }

      try {
        await sequelize.query(statement);
        successCount++;
      } catch (error) {
        errorCount++;
        if (!error.message.includes('already exists')) {
          console.error(`\n✗ Error in statement ${i + 1}:`, error.message);
        }
      }
    }

    console.log('\n\n✓ Import completed!');
    console.log(`  → Successful statements: ${successCount}`);
    console.log(`  → Errors (non-critical): ${errorCount}\n`);

    // Verify import
    console.log('Verifying import...\n');
    const tables = [
      'companies', 'brands', 'users', 'jingles', 'devices',
      'campaigns', 'campaign_jingles', 'device_schedules',
      'device_schedule_jingles', 'logs'
    ];

    console.log('TABLE COUNTS:');
    console.log('=============');
    for (const table of tables) {
      try {
        const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM \`${table}\``);
        console.log(`  ${table.padEnd(30)} ${result[0].count} rows`);
      } catch (error) {
        console.log(`  ${table.padEnd(30)} Table not found`);
      }
    }

    console.log('\n✓ Database import completed successfully!\n');

  } catch (error) {
    console.error('\n✗ Import failed:', error.message);
    throw error;
  } finally {
    rl.close();
  }
}

// Run import
importDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Import failed:', error);
    process.exit(1);
  });
