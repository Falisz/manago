
// BACKEND/models/leave.js
import sequelize from '../db.js';
import {DataTypes} from 'sequelize';
import User from './user.js';

export const Holiday = sequelize.define('Holiday', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    requestable_working: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'holidays',
    timestamps: false,
});

export const RequestStatus = sequelize.define('RequestStatus', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    tableName: 'request_statuses',
    timestamps: false,
});
// 0: pending, 1: approved, 2: rejected, 3: cancelled

export const LeavePool = sequelize.define('LeavePool', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
    }, 
    parent_pool: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: LeavePool, key: 'id' }
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,   
    },
    comp_holiday: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    comp_weekend: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, { 
    tableName: 'leave_pools',
    timestamps: false
});

export const LeaveType = sequelize.define('LeaveType', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    leave_pool: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: LeavePool, key: 'id' }
    },
    color: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, { 
    tableName: 'leave_types',
    timestamps: false 
});
// e.g., Sick Leave, Annual Leave, Day Off (unpaid), etc.

export const Leave = sequelize.define('Leave', {
    type: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: LeaveType, key: 'id' }
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    days : {
        typeof: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: RequestStatus, key: 'id' }
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    approver: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: User, key: 'id' }
    },
    user_note: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    approver_note: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
}, { 
    tableName: 'leaves', 
    timestamps: false 
});

export const HolidayWorking = sequelize.define('HolidayWorking', {
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    holiday: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Holiday, key: 'id' }
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: RequestStatus, key: 'id' }
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    approver: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: User, key: 'id' }
    },
    user_note: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    approver_note: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
}, {
    tableName: 'holiday_workings',
    timestamps: false,
    indexes: [{ unique: true, fields: ['user', 'date'] }]
});

export const WeekendWorking = sequelize.define('WeekendWorking', {
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: RequestStatus, key: 'id' }
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    approver: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: User, key: 'id' }
    },
    user_note: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    approver_note: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
}, {
    tableName: 'weekend_workings',
    timestamps: false,
    indexes: [{ unique: true, fields: ['user', 'date'] }]
});

// LeavePool <-> LeavePool (self-referential parent-child)
LeavePool.hasMany(LeavePool, { foreignKey: 'parent_pool', as: 'ChildPools' });
LeavePool.belongsTo(LeavePool, { foreignKey: 'parent_pool', as: 'ParentPool' });

// LeavePool <-> LeaveType
LeavePool.hasMany(LeaveType, { foreignKey: 'leave_pool', sourceKey: 'id' });
LeaveType.belongsTo(LeavePool, { foreignKey: 'leave_pool', targetKey: 'id' });

// LeaveType <-> Leave
LeaveType.hasMany(Leave, { foreignKey: 'type', sourceKey: 'id' });
Leave.belongsTo(LeaveType, { foreignKey: 'type', targetKey: 'id' });

// User <-> Leave (user)
User.hasMany(Leave, { foreignKey: 'user', sourceKey: 'id', as: 'LeavesRequested' });
Leave.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'RequestingUser' });

// User <-> Leave (approver)
User.hasMany(Leave, { foreignKey: 'approver', sourceKey: 'id', as: 'LeavesApproved' });
Leave.belongsTo(User, { foreignKey: 'approver', targetKey: 'id', as: 'Approver' });

// RequestStatus <-> Leave
RequestStatus.hasMany(Leave, { foreignKey: 'status', sourceKey: 'id' });
Leave.belongsTo(RequestStatus, { foreignKey: 'status', targetKey: 'id' });

// User <-> HolidayWorking (user)
User.hasMany(HolidayWorking, { foreignKey: 'user', sourceKey: 'id', as: 'HolidayWorkingsRequested' });
HolidayWorking.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'HolidayWorkingUser' });

// User <-> HolidayWorking (approver)
User.hasMany(HolidayWorking, { foreignKey: 'approver', sourceKey: 'id', as: 'HolidayWorkingsApproved' });
HolidayWorking.belongsTo(User, { foreignKey: 'approver', targetKey: 'id', as: 'HolidayWorkingApprover' });

// Holiday <-> HolidayWorking
Holiday.hasMany(HolidayWorking, { foreignKey: 'holiday', sourceKey: 'id' });
HolidayWorking.belongsTo(Holiday, { foreignKey: 'holiday', targetKey: 'id' });

// RequestStatus <-> HolidayWorking
RequestStatus.hasMany(HolidayWorking, { foreignKey: 'status', sourceKey: 'id' });
HolidayWorking.belongsTo(RequestStatus, { foreignKey: 'status', targetKey: 'id' });

// User <-> WeekendWorking (user)
User.hasMany(WeekendWorking, { foreignKey: 'user', sourceKey: 'id', as: 'WeekendWorkingsRequested' });
WeekendWorking.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'WeekendWorkingUser' });

// User <-> WeekendWorking (approver)
User.hasMany(WeekendWorking, { foreignKey: 'approver', sourceKey: 'id', as: 'WeekendWorkingsApproved' });
WeekendWorking.belongsTo(User, { foreignKey: 'approver', targetKey: 'id', as: 'WeekendWorkingApprover' });

// RequestStatus <-> WeekendWorking
RequestStatus.hasMany(WeekendWorking, { foreignKey: 'status', sourceKey: 'id' });
WeekendWorking.belongsTo(RequestStatus, { foreignKey: 'status', targetKey: 'id' });
