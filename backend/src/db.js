//BACKEND/db.js
const { Sequelize, DataTypes} = require('sequelize');
require('dotenv').config();

//
// SEQUELIZE
//
const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USERNAME || 'appagent',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'staff_portal',
    logging: false
});

//
// APP MODELS
//
const AppModule = sequelize.define('Modules', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        defaultValue: 0
    },
    title: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: ''
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'app_modules',
    timestamps: false
});

const AppPage = sequelize.define('Pages', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    view: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    module: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    parent: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    },
    path: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: ''
    },
    icon: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: ''
    },
    component: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: ''
    },
    min_power: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 10
    }
}, {
    tableName: 'app_pages',
    timestamps: false
});

const AppAuditLogs = sequelize.define('AuditLogs', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    timestamp: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: ''
    },
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    action: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: ''
    },
    old_value: {
        type: DataTypes.STRING(150),
        allowNull: false,
        defaultValue: ''
    },
    new_value: {
        type: DataTypes.STRING(150),
        allowNull: false,
        defaultValue: ''
    },
}, {
    tableName: 'app_audit_logs',
    timestamps: false
});

AppPage.belongsTo(AppPage, { foreignKey: 'parent', targetKey: 'ID' });
AppPage.belongsTo(AppModule, { foreignKey: 'module', targetKey: 'ID' });
AppModule.hasMany(AppPage, { foreignKey: 'module', sourceKey: 'ID' });

//
// USER MODELS
//

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

//
// COMPANY MODELS
//
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

//
// POST MODELS
//
const Channel = sequelize.define('Channel', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    tableName: 'channels',
    timestamps: false
});

const Post = sequelize.define('Post', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    channelID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    authorID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    isEdited: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'posts',
    timestamps: false
});

Channel.hasMany(Post, { foreignKey: 'channelID', sourceKey: 'ID' });
Post.belongsTo(Channel, { foreignKey: 'channelID', targetKey: 'ID' });

User.hasMany(Post, { foreignKey: 'authorID', sourceKey: 'ID' });
Post.belongsTo(User, { foreignKey: 'authorID', targetKey: 'ID' });

//
// EXPORTS
//
module.exports = {
    sequelize,
    AppModule,
    AppPage,
    AppAuditLogs,
    Role,
    User,
    UserConfigs,
    UserDetails,
    Team,
    UserRole,
    UserManager,
    TeamUser,
    Branch,
    Project,
    Post,
    Channel
};