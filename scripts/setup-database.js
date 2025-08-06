const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  // First connect to postgres database to create our database
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres' // Connect to default postgres database
  });

  try {
    console.log('🔄 Setting up database...');
    
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'tender_management';
    await adminPool.query(`CREATE DATABASE ${dbName}`);
    console.log(`✅ Database '${dbName}' created successfully`);
  } catch (error) {
    if (error.code === '42P04') {
      console.log(`ℹ️  Database '${process.env.DB_NAME}' already exists`);
    } else {
      console.error('❌ Error creating database:', error.message);
      process.exit(1);
    }
  } finally {
    await adminPool.end();
  }

  // Now connect to our database to run schema and seed scripts
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'tender_management'
  });

  try {
    // Run schema script
    console.log('🔄 Running database schema...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, '01-create-database-schema.sql'), 'utf8');
    await pool.query(schemaSQL);
    console.log('✅ Database schema created successfully');

    // Run seed script
    console.log('🔄 Seeding initial data...');
    const seedSQL = fs.readFileSync(path.join(__dirname, '02-seed-initial-data.sql'), 'utf8');
    await pool.query(seedSQL);
    console.log('✅ Initial data seeded successfully');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Demo Accounts Created:');
    console.log('Admin: admin@tms.com / password123');
    console.log('Tender Creator: creator@tms.com / password123');
    console.log('Vendor: vendor@tms.com / password123');
    console.log('\n🚀 You can now start the backend server with: npm start');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
