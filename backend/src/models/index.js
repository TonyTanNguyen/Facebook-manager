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
    
    await sequelize.sync(options);
    console.log('✓ Database models synchronized');
  } catch (error) {
    console.error('✗ Unable to connect to the database:', error);
    throw error;
  }
};

export { sequelize, syncDatabase, User, Page };
export default models;

