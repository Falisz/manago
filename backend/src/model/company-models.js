const {DataTypes} = require("sequelize");
const {sequelize} = require('../db');

const Branch = sequelize.define('Branch', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    tableName: 'branches',
    timestamps: false
});

const Project = sequelize.define('Project', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    project_head: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    tableName: 'projects',
    timestamps: false
});

module.exports = {Branch, Project};