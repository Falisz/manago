// BACKEND/models/shift.js
import sequelize from '../db.js';
import {DataTypes} from 'sequelize';

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
    color: {
        type: DataTypes.STRING(7),
        allowNull: true,
    }
}, {
    tableName: 'disposition_presets',
    timestamps: false,
});

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
        allowNull: true,
        references: { model: DispositionPreset, key: 'id' }
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
}, {
    tableName: 'dispositions',
    timestamps: false,
});

Disposition.hasOne(DispositionPreset, { foreignKey: 'preset', sourceKey: 'id' });
DispositionPreset.belongsTo(Disposition, { foreignKey: 'preset', targetKey: 'id' });

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
    color: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    tableName: 'job_posts',
    timestamps: false,
});

const Shift = sequelize.define('Shift', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    start_time: {
        type: DataTypes.TIME,
        allowNull: true,
    },
    end_time: {
        type: DataTypes.TIME,
        allowNull: true,
    },
    job_post: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: JobPost, key: 'id' }
    }
}, {
    tableName: 'shifts',
    timestamps: false,
});

Shift.hasOne(JobPost, { foreignKey: 'job_post', sourceKey: 'id' });
JobPost.belongsTo(Shift, { foreignKey: 'job_post', targetKey: 'id' });

export default Shift;