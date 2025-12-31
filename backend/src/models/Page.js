import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Page = sequelize.define('Page', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  facebookPageId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  picture: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pageAccessToken: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isSelected: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false
  },
  lastSyncedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Source of the page (personal OAuth or Business Manager)
  source: {
    type: DataTypes.ENUM('personal', 'business_manager'),
    defaultValue: 'personal',
    allowNull: false
  }
}, {
  tableName: 'pages',
  timestamps: true,
  indexes: [
    { fields: ['facebookPageId'] },
    { fields: ['userId'] },
    { unique: true, fields: ['facebookPageId', 'userId'] }
  ]
});

// Define associations
User.hasMany(Page, { foreignKey: 'userId', as: 'pages' });
Page.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Page;

