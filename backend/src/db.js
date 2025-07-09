//BACKEND/db.js
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

// DATABASE
const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USERNAME || 'appagent',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'staff_portal',
    logging: false
});

// MAIN MODULE
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

// USERS AND MANAGEMENT MODULE
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
    deleted: {
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

//ASSOCIATIONS
AppPage.belongsTo(AppPage, { foreignKey: 'parent', targetKey: 'ID' });
AppPage.belongsTo(AppModule, { foreignKey: 'module', targetKey: 'ID' });
AppModule.hasMany(AppPage, { foreignKey: 'module', sourceKey: 'ID' });

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

Channel.hasMany(Post, { foreignKey: 'channelID', sourceKey: 'ID' });
Post.belongsTo(Channel, { foreignKey: 'channelID', targetKey: 'ID' });

User.hasMany(Post, { foreignKey: 'authorID', sourceKey: 'ID' });
Post.belongsTo(User, { foreignKey: 'authorID', targetKey: 'ID' });

async function seedData() {
    try {
        await AppModule.sync();
        await AppPage.sync();
        await User.sync();
        await UserDetails.sync();
        await UserConfigs.sync();
        await UserManager.sync();
        await Channel.sync();
        await Post.sync();

        const moduleCount = await AppModule.count();
        if (moduleCount > 0) {
            console.log('\tAppModules table is not empty, skipping seeding.');
        } else {
            const appModuleFilePath = path.join(__dirname, '..', 'modules.csv');
            const appModules = [];
            const appModuleRows = await new Promise((resolve, reject) => {
                const results = [];
                require('fs').createReadStream(appModuleFilePath)
                    .pipe(csv({
                        headers: ['ID','title','enabled'],
                        skipLines: 0
                    }))
                    .on('data', (data) => results.push(data))
                    .on('end', () => resolve(results))
                    .on('error', (err) => reject(err));
            });

            for (const row of appModuleRows) {
                if (!row?.ID || !row.title) {
                    console.warn('Skipping invalid App Modules row:', row);
                    continue;
                }
                appModules.push({
                    ID: parseInt(row.ID),
                    title: row.title,
                    enabled: row.enabled || false
                });
            }

            if (appModules.length === 0) {
                console.warn('No valid App Modules to seed from modules.csv');
            } else {
                await AppModule.bulkCreate(appModules);
                console.log(`\tSeeded ${appModules.length} App Modules from modules.csv`);
            }
        }

        const pagesCount = await AppPage.count();
        if (pagesCount > 0) {
            console.log('\tAppPages table is not empty, skipping seeding.');
        } else {
            const appPageFilePath = path.join(__dirname, '..', 'pages.csv');
            const appPages = [];
            const appPageRows = await new Promise((resolve, reject) => {
                const results = [];
                require('fs').createReadStream(appPageFilePath)
                    .pipe(csv({
                        headers: ['ID','view','module','parent','path','title','icon','component','min_power'],
                        skipLines: 0
                    }))
                    .on('data', (data) => results.push(data))
                    .on('end', () => resolve(results))
                    .on('error', (err) => reject(err));
            });

            for (const row of appPageRows) {
                if (!row?.ID || !row.view || !row.module || !row.path || !row.title) {
                    console.warn('Skipping invalid App Pages row:', row);
                    continue;
                }
                appPages.push({
                    ID: parseInt(row.ID),
                    view: parseInt(row.view),
                    module: parseInt(row.module),
                    parent: parseInt(row.parent) || null,
                    path: row.path,
                    title: row.title,
                    icon: row.icon || null,
                    component: row.component || null,
                    min_power: parseInt(row.min_power)
                });
            }


            if (appPages.length === 0) {
                console.warn('\tNo valid Pages to seed from pages.csv');
            } else {
                await AppPage.bulkCreate(appPages);
                console.log(`\tSeeded ${appPages.length} Pages from pages.csv`);
            }
        }

        // Seed users, user_details, and user_configs
        const userCount = await User.count();
        if (userCount > 0) {
            console.log('\tUsers table is not empty, skipping seeding.');
        } else {
            const csvFilePath = path.join(__dirname, '..', 'users.csv');
            const users = [];
            const userDetails = [];
            const userConfigs = [];
            const managerUserIds = [353621, 398285];
            const userRows = await new Promise((resolve, reject) => {
                const results = [];
                require('fs').createReadStream(csvFilePath)
                    .pipe(csv({
                        headers: ['ID', 'first_name', 'last_name', 'email', 'role', 'active', 'manager_view_enabled', 'manager_nav_collapsed', 'password'],
                        skipLines: 0
                    }))
                    .on('data', (data) => results.push(data))
                    .on('end', () => resolve(results))
                    .on('error', (err) => reject(err));
            });

            for (const row of userRows) {
                if (!row?.ID || !row.first_name || !row.last_name || !row.email || !row.role || !row.password) {
                    console.warn('Skipping invalid user row:', row);
                    continue;
                }
                const active = row.active ? (row.active === '1' || row.active.toLowerCase() === 'true') : false;
                const manager_view_enabled = row.manager_view_enabled ? (row.manager_view_enabled === '1' || row.manager_view_enabled.toLowerCase() === 'true') : false;
                const manager_nav_collapsed = row.manager_nav_collapsed ? (row.manager_nav_collapsed === '1' || row.manager_nav_collapsed.toLowerCase() === 'true') : false;

                const userID = parseInt(row.ID) || Math.floor(Math.random() * 900000) + 100000;

                users.push({
                    ID: userID,
                    email: row.email,
                    role: parseInt(row.role),
                    active,
                    password: row.password
                });
                userDetails.push({
                    user: userID,
                    first_name: row.first_name,
                    last_name: row.last_name
                });
                userConfigs.push({
                    user: userID,
                    manager_view_access: managerUserIds.includes(userID),
                    manager_view_enabled: managerUserIds.includes(userID) ? manager_view_enabled : false,
                    manager_nav_collapsed
                });
            }

            if (users.length === 0) {
                console.warn('\tNo valid users to seed from users.csv');
            } else {
                await User.bulkCreate(users);
                await UserDetails.bulkCreate(userDetails);
                await UserConfigs.bulkCreate(userConfigs);
                console.log(`\tSeeded ${users.length} users, ${userDetails.length} user_details, and ${userConfigs.length} user_configs from users.csv`);
            }
        }

        // Seed channels
        const channelCount = await Channel.count();
        if (channelCount > 0) {
            console.log('\tChannels table is not empty, skipping seeding.');
        } else {
            const channels = [
                { name: 'General Discussion' },
                { name: 'Announcements' },
                { name: 'Ideas and Suggestions' }
            ];
            await Channel.bulkCreate(channels);
            console.log(`\tSeeded ${channels.length} channels.`);
        }

        // Seed posts
        const postCount = await Post.count();
        if (postCount > 0) {
            console.log('\tPosts table is not empty, skipping seeding.');
        } else {
            const users = await User.findAll({ attributes: ['ID'] });
            const channels = await Channel.findAll({ attributes: ['ID'] });
            if (users.length === 0 || channels.length === 0) {
                console.warn('No users or channels found, skipping posts seeding.');
            } else {
                const posts = [
                    {
                        channelID: channels[0].ID,
                        authorID: users[0].ID,
                        title: 'Welcome to the Forum',
                        content: 'This is the first post in our new forum. Feel free to share your thoughts!',
                        createdAt: new Date(),
                        isEdited: false
                    },
                    {
                        channelID: channels[1].ID,
                        authorID: users[0].ID,
                        title: 'Company Update',
                        content: 'We have some exciting news to share about upcoming projects!',
                        createdAt: new Date(Date.now() - 86400000), // 1 day ago
                        isEdited: true,
                        updatedAt: new Date()
                    },
                    {
                        channelID: channels[2].ID,
                        authorID: users[1]?.ID || users[0].ID,
                        title: null,
                        content: 'I have an idea for improving our workflow. Let’s discuss!',
                        createdAt: new Date(Date.now() - 172800000), // 2 days ago
                        isEdited: false
                    }
                ];
                await Post.bulkCreate(posts);
                console.log(`\tSeeded ${posts.length} posts.`);
            }
        }
    } catch (err) {
        console.error('\tError seeding data:', err.message, err.stack);
        throw err;
    }
}

module.exports = {
    sequelize,
    seedData,
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