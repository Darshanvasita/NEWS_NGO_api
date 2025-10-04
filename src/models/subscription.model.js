const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Subscription extends Model {}

  Subscription.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
  }, {
    sequelize,
    modelName: 'Subscription',
    tableName: 'subscriptions',
    timestamps: true,
  });

  return Subscription;
};