const DataTypes = require('sequelize');
const sequelize = require('../database');

module.exports = sequelize.define('Estacionamento', {
    capacidadeCarros: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: Number(process.env.ESTACIONAMENTO_CAPACIDADE_CARROS || 100)
    },
    vagasOcupadasCarros: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    capacidadeMotos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: Number(process.env.ESTACIONAMENTO_CAPACIDADE_MOTOS || 50)
    },
    vagasOcupadasMotos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
});
