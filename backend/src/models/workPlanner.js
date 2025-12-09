// BACKEND/models/workPlanner.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';
import {User} from './users.js';

export const Schedule = sequelize.define('Schedule', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: DataTypes.TEXT,
    user_scope: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user_scope_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    author: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
}, {
    tableName: 'schedules'
}); 

export const JobPost = sequelize.define('JobPost', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    color: DataTypes.STRING(7)
}, {
    tableName: 'job_posts',
    timestamps: false,
});
// e.g.: Bar, MainFloor, Corridors, Delivery, Gift Preparation, Registers

export const JobLocation = sequelize.define('JobLocation', {
    name: {
        type: DataTypes.STRING, 
        allowNull: false,
        unique: true,
    },
    description: DataTypes.TEXT,
    color: DataTypes.STRING(7)
}, {
    tableName: 'job_locations',
    timestamps: false
});
// e.g: Office, Client's Office, Field, Remotely, Home Office, etc.

export const Shift = sequelize.define('Shift', {
    user: {
        type: DataTypes.INTEGER,
        references: { model: User, key: 'id' }
    },
    date: {
        type: DataTypes.DATEONLY,
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
    job_post: {
        type: DataTypes.INTEGER,
        references: { model: JobPost, key: 'id' }
    },
    job_location: {
        type: DataTypes.INTEGER,
        references: { model: JobLocation, key: 'id' }
    },
    schedule: {
        type: DataTypes.INTEGER,
        references: { model: Schedule, key: 'id' }
    },
    note: DataTypes.TEXT,
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


export const LeaveType = sequelize.define('LeaveType', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    parent_type: {
        type: DataTypes.INTEGER,
        references: { model: 'leave_types', key: 'id' }
    },
    holiday_comp_off: DataTypes.BOOLEAN, // flag if the leave type is holiday comp-off - TO BE MOVED
    weekend_comp_off: DataTypes.BOOLEAN, // flag if the leave type is weekend comp-off - TO BE MOVED
    amount: DataTypes.INTEGER,           // number of days of the leave in one year
    multiple: DataTypes.BOOLEAN,         // flag if more than one day of the leave can be applied on the request
    scaled: DataTypes.BOOLEAN,           // flag if the number should be scaled to the number of months worked in one year
    transferable: DataTypes.BOOLEAN,     // flag if the remaining amount can be transferred to the next year
    ref_required: DataTypes.BOOLEAN,     // flag if the referral number is required
    file_required: DataTypes.BOOLEAN,    // flag if the referral document is required
    color: DataTypes.STRING
}, { 
    tableName: 'leave_types',
    timestamps: false 
});
// e.g., Sick Leave, Annual Leave, Day Off (unpaid), etc.

// Separate it from HolidayCompOffs and WeekendCompOffs to declutter
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
    end_date: DataTypes.DATEONLY,
    days: DataTypes.INTEGER,
    include_weekends: DataTypes.BOOLEAN,
    include_holidays: DataTypes.BOOLEAN,
    day_created: DataTypes.DATE,
    day_requested: DataTypes.DATE,
    day_approved: DataTypes.DATE,
    day_rejected: DataTypes.DATE,
    day_cancelled: DataTypes.DATE,
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
    compensated_holiday: DataTypes.NUMBER,                  // for Holiday comp-offs - TO BE MOVED
    compensated_weekend: DataTypes.DATEONLY,                // for Weekend comp-offs - TO BE MOVED
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
    date: {
        type: DataTypes.DATEONLY,
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
// OFF: 00:00 - 00:00, FULL: 00:00 - 23:59, MS: 06:00 - 15:00, AS: 15:00 - 23:59

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

export const TimeRecord = sequelize.define('TimeRecord', {
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    time: {
        type: DataTypes.NUMBER,
        allowNull: false
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    status: DataTypes.INTEGER,                                  // 0 - Empty, 1 - Submitted, 2 - Accepted, 3 - Rejected
    approver: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' }
    }

}, {
    tableName: 'time_records',
    timestamps: true
})

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
JobLocation.hasMany(Shift, { foreignKey: 'job_location', sourceKey: 'id' });
Shift.belongsTo(JobLocation, { foreignKey: 'job_location', targetKey: 'id' });
//
// Schedule <-> Shift
Schedule.hasMany(Shift, { foreignKey: 'schedule', sourceKey: 'id' });
Shift.belongsTo(Schedule, { foreignKey: 'schedule', targetKey: 'id' });
//
// LeaveType <-> LeaveType
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