// BACKEND/models/workShifts.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';
import {User} from "./users.js";

export const DispositionPreset = sequelize.define('DispositionPreset', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    start_time: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    end_time: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    color: DataTypes.STRING(7)
}, {
    tableName: 'disposition_presets',
    timestamps: false,
});
// OFF: 00:00 - 00:00, FULL: 00:00 - 23:59, MS: 08:00 - 16:00, AS: 16:00 - 23:59

export const Disposition = sequelize.define('Disposition', {
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    start_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    end_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    preset: {
        type: DataTypes.INTEGER,
        references: { model: DispositionPreset, key: 'id' }
    },
    notes: DataTypes.TEXT
}, {
    tableName: 'dispositions',
    timestamps: false,
});

export const JobPost = sequelize.define('JobPost', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    color: DataTypes.STRING(7)
}, {
    tableName: 'job_posts',
    timestamps: false,
});

export const Shift = sequelize.define('Shift', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user: {
        type: DataTypes.INTEGER,
        references: { model: User, key: 'id' }
    },
    start_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    end_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    job_post: {
        type: DataTypes.INTEGER,
        references: { model: JobPost, key: 'id' }
    }
}, {
    tableName: 'shifts',
    timestamps: false,
});

//
// Model Associations for workShifts.js
//
// User <-> Disposition
User.hasMany(Disposition, { foreignKey: 'user', sourceKey: 'id', as: 'Dispositions' });
Disposition.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'User' });
//
// DispositionPreset <-> Disposition
DispositionPreset.hasMany(Disposition, { foreignKey: 'preset', sourceKey: 'id' });
Disposition.belongsTo(DispositionPreset, { foreignKey: 'preset', targetKey: 'id' });
//
// User <-> Shift
User.hasMany(Shift, { foreignKey: 'user', sourceKey: 'id', as: 'Shifts' });
Shift.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'User' });
//
// JobPost <-> Shift
JobPost.hasMany(Shift, { foreignKey: 'job_post', sourceKey: 'id' });
Shift.belongsTo(JobPost, { foreignKey: 'job_post', targetKey: 'id' });