const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ENewspaper = sequelize.define('ENewspaper', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pdfPath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    publishDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    publishTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'enewspapers',
    timestamps: true,
  });

  return ENewspaper;
};