const DataTypes = require('sequelize');
const sequelize = require('../database');
const Registro = require('./registroModel');
const User = require('./userModel');

const Tiquete = sequelize.define('Tiquete', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    codigo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: Number(process.env.TIQUETE_VALOR_CARRO || 4.00)
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pendente'
    }
});

// Relacionamento com Registro (1 para 1)
Registro.hasOne(Tiquete, { foreignKey: 'registroId', onDelete: 'CASCADE' });
Tiquete.belongsTo(Registro, { foreignKey: 'registroId' });

// Relacionamento com User (Auditoria)
Tiquete.belongsTo(User, { as: 'CriadoPor', foreignKey: 'criadoPorId' });
Tiquete.belongsTo(User, { as: 'ValidadoPor', foreignKey: 'validadoPorId' });

module.exports = Tiquete;
