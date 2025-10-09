const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'cancelled'),
      defaultValue: 'active',
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    endDate: {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'subscriptions',
    timestamps: true,
  });

  return Subscription;
};