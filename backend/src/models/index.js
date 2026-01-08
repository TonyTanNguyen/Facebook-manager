import sequelize from '../config/database.js';
import User from './User.js';
import Page from './Page.js';

// Initialize all models and associations
const models = {
  User,
  Page
};

// Sync database
const syncDatabase = async (options = {}) => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');

    // Drop foreign key constraint on pages table to support internal admin user
    const dropForeignKeys = async () => {
      try {
        // Get all foreign key constraints on pages table
        const [results] = await sequelize.query(`
          SELECT constraint_name
          FROM information_schema.table_constraints
          WHERE table_name = 'pages'
          AND constraint_type = 'FOREIGN KEY';
        `);

        for (const row of results) {
          await sequelize.query(`ALTER TABLE pages DROP CONSTRAINT IF EXISTS "${row.constraint_name}";`);
          console.log(`✓ Dropped constraint: ${row.constraint_name}`);
        }
      } catch (err) {
        console.log('Note: Could not drop constraints (table may not exist yet)');
      }
    };

    await dropForeignKeys();
    await sequelize.sync(options);
    console.log('✓ Database models synchronized');

    // Drop constraints again after sync (Sequelize might re-add them)
    await dropForeignKeys();
  } catch (error) {
    console.error('✗ Unable to connect to the database:', error);
    throw error;
  }
};

export { sequelize, syncDatabase, User, Page };
export default models;

