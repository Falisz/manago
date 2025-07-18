const {DataTypes} = require("sequelize");
const {sequelize} = require('../db');

const Role = sequelize.define('Role', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    power: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    system_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
}, {
    tableName: 'roles',
    timestamps: false
});
// ROLES:
//      #1 Employee (system default)
//      #2 Specialist
//      #3 Team Leader
//      #11 Manager
//      #12 Project Manager
//      #13 Branch Manager
//      #99 Admin

const User = sequelize.define('User', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        defaultValue: () => Math.floor(Math.random() * 900000) + 100000
    },
    login: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    password: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    removed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'users',
    timestamps: false
});

const UserDetails = sequelize.define('UserDetails', {
    user: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: 'users', key: 'ID' }
    },
    first_name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING(50),
        allowNull: false
    }
}, {
    tableName: 'user_details',
    timestamps: false
});

const UserConfigs = sequelize.define('UserConfigs', {
    user: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: 'users', key: 'ID' }
    },
    manager_view_access: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    manager_view_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    manager_nav_collapsed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'user_configs',
    timestamps: false
});

const Team = sequelize.define('Team', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    project: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    parent_team: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    tableName: 'teams',
    timestamps: false
});

const UserRole = sequelize.define('UserRole', {
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'ID' }
    },
    role: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'roles', key: 'ID' }
    }
}, {
    tableName: 'user_roles',
    timestamps: false,
    indexes: [{ unique: true, fields: ['user', 'role'] }]
});

const UserManager = sequelize.define('UserManager', {
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'ID' }
    },
    manager: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'ID' }
    },
    primary: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'user_managers',
    timestamps: false,
    indexes: [{ unique: true, fields: ['user', 'manager'] }]
});

const TeamUser = sequelize.define('TeamUser', {
    team: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'teams', key: 'ID' }
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'ID' }
    },
    role: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0 // 0 - member, 1 - leader, 2 - manager
    }
}, {
    tableName: 'team_users',
    timestamps: false,
    indexes: [{ unique: true, fields: ['team', 'user'] }]
});

User.hasOne(UserDetails, { foreignKey: 'user', sourceKey: 'ID', as: 'UserDetails' });
UserDetails.belongsTo(User, { foreignKey: 'user', targetKey: 'ID' });

User.hasOne(UserConfigs, { foreignKey: 'user', sourceKey: 'ID', as: 'UserConfigs' });
UserConfigs.belongsTo(User, { foreignKey: 'user', targetKey: 'ID' });

User.hasMany(UserManager, { foreignKey: 'user', sourceKey: 'ID', as: 'ManagedUsers' });
UserManager.belongsTo(User, { foreignKey: 'user', targetKey: 'ID', as: 'User' });
User.hasMany(UserManager, { foreignKey: 'manager', sourceKey: 'ID', as: 'Managers' });
UserManager.belongsTo(User, { foreignKey: 'manager', targetKey: 'ID', as: 'Manager' });

User.hasMany(UserRole, { foreignKey: 'user', sourceKey: 'ID' });
UserRole.belongsTo(User, { foreignKey: 'user', targetKey: 'ID' });
Role.hasMany(UserRole, { foreignKey: 'role', sourceKey: 'ID' });
UserRole.belongsTo(Role, { foreignKey: 'role', targetKey: 'ID' });

Team.hasMany(TeamUser, { foreignKey: 'team', sourceKey: 'ID' });
TeamUser.belongsTo(Team, { foreignKey: 'team', targetKey: 'ID' });
User.hasMany(TeamUser, { foreignKey: 'user', sourceKey: 'ID' });
TeamUser.belongsTo(User, { foreignKey: 'user', targetKey: 'ID' });

module.exports = {
    Role,
    User,
    UserConfigs,
    UserDetails,
    Team,
    UserRole,
    UserManager,
    TeamUser
};