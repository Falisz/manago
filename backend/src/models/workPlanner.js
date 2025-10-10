// BACKEND/models/workPlanner.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';
import {User} from "./users.js";

export const Schedule = sequelize.define('Schedule', {
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    author: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    }
}, {
    tableName: 'schedules',
    timestamps: false,
}); 

export const JobPost = sequelize.define('JobPost', {
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
    },
    schedule: {
        type: DataTypes.INTEGER,
        references: { model: Schedule, key: 'id' }
    }
}, {
    tableName: 'shifts',
    timestamps: false,
});

export const Holiday = sequelize.define('Holiday', {
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

export const LeaveType = sequelize.define('LeaveType', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    parent_type: {
        type: DataTypes.INTEGER,
        references: { model: 'leave_types', key: 'id' }
    },
    amount: DataTypes.INTEGER,
    color: DataTypes.STRING
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
        type: DataTypes.INTEGER,
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
        references: { model: User, key: 'id' }
    },
    user_note: DataTypes.TEXT,
    approver_note: DataTypes.TEXT
}, { 
    tableName: 'leaves', 
    timestamps: false 
});

export const HolidayWorking = sequelize.define('HolidayWorking', {
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
        references: { model: User, key: 'id' }
    },
    user_note: DataTypes.TEXT,
    approver_note: DataTypes.TEXT
}, {
    tableName: 'holiday_workings',
    timestamps: false,
    indexes: [{ unique: true, fields: ['holiday', 'user'] }]
});

export const WeekendWorking = sequelize.define('WeekendWorking', {
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
        references: { model: User, key: 'id' }
    },
    user_note: DataTypes.TEXT,
    approver_note: DataTypes.TEXT
}, {
    tableName: 'weekend_workings',
    timestamps: false,
    indexes: [{ unique: true, fields: ['user', 'date'] }]
});

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

//
// Model Associations for workShifts.js
//
//
// User <-> Shift
User.hasMany(Shift, { foreignKey: 'user', sourceKey: 'id' });
Shift.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });
//
// JobPost <-> Shift
JobPost.hasMany(Shift, { foreignKey: 'job_post', sourceKey: 'id' });
Shift.belongsTo(JobPost, { foreignKey: 'job_post', targetKey: 'id' });
//
// JobPost <-> Shift
Schedule.hasMany(Shift, { foreignKey: 'schedule', sourceKey: 'id' });
Shift.belongsTo(Schedule, { foreignKey: 'schedule', targetKey: 'id' });
//
// LeavePool <-> LeaveType
LeaveType.hasMany(LeaveType, { foreignKey: 'parent_type', sourceKey: 'id', as: 'SubType' });
LeaveType.belongsTo(LeaveType, { foreignKey: 'parent_type', targetKey: 'id', as: 'ParentType' });
//
// LeaveType <-> Leave
LeaveType.hasMany(Leave, { foreignKey: 'type', sourceKey: 'id' });
Leave.belongsTo(LeaveType, { foreignKey: 'type', targetKey: 'id' });
//
// User <-> Leave (user)
User.hasMany(Leave, { foreignKey: 'user', sourceKey: 'id' });
Leave.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });
//
// User <-> Leave (approver)
User.hasMany(Leave, { foreignKey: 'approver', sourceKey: 'id', as: 'LeavesApproved' });
Leave.belongsTo(User, { foreignKey: 'approver', targetKey: 'id', as: 'Approver' });
//
// RequestStatus <-> Leave
RequestStatus.hasMany(Leave, { foreignKey: 'status', sourceKey: 'id' });
Leave.belongsTo(RequestStatus, { foreignKey: 'status', targetKey: 'id' });
//
// User <-> HolidayWorking (user)
User.hasMany(HolidayWorking, { foreignKey: 'user', sourceKey: 'id', as: 'HolidayWorkingsRequested' });
HolidayWorking.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'HolidayWorkingUser' });
//
// User <-> HolidayWorking (approver)
User.hasMany(HolidayWorking, { foreignKey: 'approver', sourceKey: 'id', as: 'HolidayWorkingsApproved' });
HolidayWorking.belongsTo(User, { foreignKey: 'approver', targetKey: 'id', as: 'HolidayWorkingApprover' });
//
// Holiday <-> HolidayWorking
Holiday.hasMany(HolidayWorking, { foreignKey: 'holiday', sourceKey: 'id' });
HolidayWorking.belongsTo(Holiday, { foreignKey: 'holiday', targetKey: 'id' });
//
// RequestStatus <-> HolidayWorking
RequestStatus.hasMany(HolidayWorking, { foreignKey: 'status', sourceKey: 'id' });
HolidayWorking.belongsTo(RequestStatus, { foreignKey: 'status', targetKey: 'id' });
//
// User <-> WeekendWorking (user)
User.hasMany(WeekendWorking, { foreignKey: 'user', sourceKey: 'id', as: 'WeekendWorkingsRequested' });
WeekendWorking.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'WeekendWorkingUser' });
//
// User <-> WeekendWorking (approver)
User.hasMany(WeekendWorking, { foreignKey: 'approver', sourceKey: 'id', as: 'WeekendWorkingsApproved' });
WeekendWorking.belongsTo(User, { foreignKey: 'approver', targetKey: 'id', as: 'WeekendWorkingApprover' });
//
// RequestStatus <-> WeekendWorking
RequestStatus.hasMany(WeekendWorking, { foreignKey: 'status', sourceKey: 'id' });
WeekendWorking.belongsTo(RequestStatus, { foreignKey: 'status', targetKey: 'id' });
// 
// User <-> Disposition
User.hasMany(Disposition, { foreignKey: 'user', sourceKey: 'id', as: 'Dispositions' });
Disposition.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'User' });
//
// DispositionPreset <-> Disposition
DispositionPreset.hasMany(Disposition, { foreignKey: 'preset', sourceKey: 'id' });
Disposition.belongsTo(DispositionPreset, { foreignKey: 'preset', targetKey: 'id' });