const DataTypes = require('sequelize');
const sequelize = require('../database');

module.exports = sequelize.define('Estacionamento', {
    capacidadeTotal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: Number(process.env.ESTACIONAMENTO_CAPACIDADE_TOTAL)
    },
    vagasOcupadas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
});
