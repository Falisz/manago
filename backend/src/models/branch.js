import {DataTypes} from "sequelize";
import sequelize from "../db.js";

export const Branch = sequelize.define('Branch', {
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

export default Branch;