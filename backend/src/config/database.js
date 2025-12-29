import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/fb_pages_manager';

// Check if using cloud database (Supabase, etc.) - requires SSL
const isCloudDatabase = databaseUrl.includes('supabase.com') || 
                        databaseUrl.includes('neon.tech') ||
                        databaseUrl.includes('render.com') ||
                        process.env.DATABASE_SSL === 'true';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // SSL configuration for cloud databases
  dialectOptions: isCloudDatabase ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
});

export default sequelize;

