const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING },
    role: { type: DataTypes.ENUM('admin', 'editor', 'reporter', 'user'), defaultValue: 'user', allowNull: false },
    userType: { type: DataTypes.ENUM('NEWS', 'NGO') },
    invitedBy: { type: DataTypes.INTEGER },
    status: { type: DataTypes.STRING, defaultValue: 'pending', allowNull: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
  }, { tableName: 'users', updatedAt: false });

  return User;
};