import { pool } from '../src/core/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    console.log('✅ Schema created successfully');
    
    const seedPath = path.join(__dirname, '../db/seed.sql');
    const seed = fs.readFileSync(seedPath, 'utf8');
    
    await pool.query(seed);
    console.log('✅ Seed data inserted successfully');
    
    console.log('✅ Database initialization complete');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    await pool.end();
    process.exit(1);
  }
}

initDatabase();