const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

// Define models
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING },
  role: { type: DataTypes.ENUM('admin', 'editor', 'reporter', 'user'), defaultValue: 'user', allowNull: false },
  invitedBy: { type: DataTypes.INTEGER },
  status: { type: DataTypes.STRING, defaultValue: 'pending', allowNull: false },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
}, { tableName: 'users', updatedAt: false });

const News = sequelize.define('News', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  pdfUrl: { type: DataTypes.STRING, allowNull: false },
  authorId: { type: DataTypes.INTEGER },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
}, { tableName: 'news', updatedAt: false });

const Story = sequelize.define('Story', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  imageUrl: { type: DataTypes.STRING, allowNull: false },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
}, { tableName: 'stories', updatedAt: false });

const Gallery = sequelize.define('Gallery', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type: { type: DataTypes.STRING, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: false },
  caption: { type: DataTypes.STRING },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
}, { tableName: 'galleries', updatedAt: false });

const Donation = sequelize.define('Donation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  paymentId: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
}, { tableName: 'donations', updatedAt: false });

// Associations
User.hasMany(News, { foreignKey: 'authorId', as: 'news' });
News.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

User.hasMany(Donation, { foreignKey: 'userId', as: 'donations' });
Donation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

const ENewspaper = require('./enewspaper.model')(sequelize);

User.hasMany(ENewspaper, { foreignKey: 'userId', as: 'enewspapers' });
ENewspaper.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  News,
  Story,
  Gallery,
  Donation,
  ENewspaper,
};

