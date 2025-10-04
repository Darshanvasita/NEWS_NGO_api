const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class SubscriptionTemp extends Model {}

  SubscriptionTemp.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'SubscriptionTemp',
    tableName: 'subscriptions_temp',
    timestamps: false, // No createdAt/updatedAt for this temporary table
  });

  return SubscriptionTemp;
};