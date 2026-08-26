require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dbConfig = require('../config/database');

const pool = new Pool(dbConfig);

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting database migration...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${dbConfig.database}`);
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Разбиваем на отдельные команды (исключая CREATE DATABASE)
    const commands = schema
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.includes('CREATE DATABASE') && !cmd.includes('\\c'));
    
    console.log(`📝 Executing ${commands.length} SQL commands...`);
    
    for (let i = 0; i < commands.length; i++) {
      try {
        await client.query(commands[i]);
        console.log(`✅ Command ${i + 1}/${commands.length} executed successfully`);
      } catch (error) {
        // Игнорируем ошибки "already exists"
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Command ${i + 1}/${commands.length} - object already exists, skipping...`);
        } else {
          console.error(`❌ Error in command ${i + 1}:`, error.message);
          throw error;
        }
      }
    }
    
    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Запуск миграции
runMigration()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration error:', error);
    process.exit(1);
  });
