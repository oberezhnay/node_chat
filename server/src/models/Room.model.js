'use strict';

const { sequelize } = require('../db.js');
const { DataTypes } = require('sequelize');

const Room = sequelize.define(
  'Room',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // users: {
    //   type: DataTypes.ARRAY(DataTypes.INTEGER),
    //   allowNull: false,
    //   defaultValue: [],
    // }
  },
  {
    tableName: 'rooms',
    timestamps: true,
  },
);

module.exports = {
  Room,
};
