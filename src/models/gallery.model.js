const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Gallery = sequelize.define('Gallery', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    type: { type: DataTypes.STRING, allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
    caption: { type: DataTypes.STRING },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
  }, { tableName: 'galleries', updatedAt: false });

  return Gallery;
};