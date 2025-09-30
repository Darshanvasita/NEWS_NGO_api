const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ENewspaper = sequelize.define('ENewspaper', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    publishDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'enewspapers',
    timestamps: true,
  });

  return ENewspaper;
};