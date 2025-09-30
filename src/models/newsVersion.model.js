const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NewsVersion = sequelize.define('NewsVersion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    newsId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pdfUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tags: {
      type: DataTypes.STRING, // Use STRING to store a JSON array
      allowNull: true,
      defaultValue: '[]',
      get() {
        const rawValue = this.getDataValue('tags');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('tags', JSON.stringify(value || []));
      },
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'news_versions',
    timestamps: true,
  });

  return NewsVersion;
};