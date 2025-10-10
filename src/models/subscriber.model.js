const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Subscriber extends Model {}

  Subscriber.init({
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
    otp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    confirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Subscriber',
    tableName: 'subscribers',
    timestamps: true,
  });

  return Subscriber;
};