//BACKEND/db.js
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'staff_portal',
    logging: false
});

const User = sequelize.define('User', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        defaultValue: () => Math.floor(Math.random() * 900000) + 100000
    },
    first_name: {
        type: DataTypes.STRING(50), // varchar(50)
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING(50), // varchar(50)
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100), // varchar(100)
        allowNull: false
    },
    role: {
        type: DataTypes.INTEGER, // integer
        allowNull: false
    },
    active: {
        type: DataTypes.BOOLEAN, // boolean
        allowNull: false,
        defaultValue: true
    },
    manager_view_enabled: {
        type: DataTypes.BOOLEAN, // boolean
        allowNull: false,
        defaultValue: false
    },
    manager_nav_collapsed: {
        type: DataTypes.BOOLEAN, // boolean
        allowNull: false,
        defaultValue: false
    },
    password: {
        type: DataTypes.STRING(200), // varchar(200)
        allowNull: false
    }
}, {
    tableName: 'users',
    timestamps: false
});

const PagesStaff = sequelize.define('PagesStaff', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    path: {
        type: DataTypes.STRING(100), // varchar(100)
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(100), // varchar(100)
        allowNull: false
    },
    min_role: {
        type: DataTypes.INTEGER, // integer
        allowNull: false
    },
    component: {
        type: DataTypes.STRING(100), // varchar(100)
        allowNull: true
    },
    icon: {
        type: DataTypes.STRING(50), // varchar(50)
        allowNull: true
    }
}, {
    tableName: 'pages_staff',
    timestamps: false
});

const PagesManager = sequelize.define('PagesManager', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    path: {
        type: DataTypes.STRING(100), // varchar(100)
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(100), // varchar(100)
        allowNull: false
    },
    min_role: {
        type: DataTypes.INTEGER, // integer
        allowNull: false
    },
    component: {
        type: DataTypes.STRING(100), // varchar(100)
        allowNull: true
    },
    icon: {
        type: DataTypes.STRING(50), // varchar(50)
        allowNull: true
    }
}, {
    tableName: 'pages_manager',
    timestamps: false
});

const ManagerViewAccess = sequelize.define('ManagerViewAccess', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userID: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'manager_view_access',
    timestamps: false
});

User.hasMany(ManagerViewAccess, { foreignKey: 'userID', sourceKey: 'ID' });
ManagerViewAccess.belongsTo(User, { foreignKey: 'userID', targetKey: 'ID' });
PagesStaff.belongsTo(PagesStaff, { foreignKey: 'parent_id', targetKey: 'id' });
PagesManager.belongsTo(PagesManager, { foreignKey: 'parent_id', targetKey: 'id' });

async function seedData() {
    try {
        await User.sync();
        await PagesStaff.sync();
        await PagesManager.sync();
        await ManagerViewAccess.sync();

        // Seed users
        const userCount = await User.count();
        if (userCount > 0) {
            console.log('Users table is not empty, skipping seeding.');
        } else {
            const csvFilePath = path.join(__dirname, '..', 'users.csv');
            const users = [];
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
                if (!row.ID || !row.first_name || !row.last_name || !row.email || !row.role || !row.password) {
                    console.warn('Skipping invalid user row:', row);
                    continue;
                }
                const active = row.active ? (row.active === '1' || row.active.toLowerCase() === 'true') : false;
                const manager_view_enabled = row.manager_view_enabled ? (row.manager_view_enabled === '1' || row.manager_view_enabled.toLowerCase() === 'true') : false;
                const manager_nav_collapsed = row.manager_nav_collapsed ? (row.manager_nav_collapsed === '1' || row.manager_nav_collapsed.toLowerCase() === 'true') : false;

                users.push({
                    ID: parseInt(row.ID) || Math.floor(Math.random() * 900000) + 100000,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    email: row.email,
                    role: parseInt(row.role),
                    active,
                    manager_view_enabled,
                    manager_nav_collapsed,
                    password: row.password
                });
            }

            if (users.length === 0) {
                console.warn('No valid users to seed from users.csv');
            } else {
                await User.bulkCreate(users);
                console.log(`Seeded ${users.length} users from users.csv`);
            }
        }

        // Seed pages_staff
        const pagesStaffCount = await PagesStaff.count();
        if (pagesStaffCount > 0) {
            console.log('PagesStaff table is not empty, skipping seeding.');
        } else {
            const pagesStaffFilePath = path.join(__dirname, '..', 'pages_staff.csv');
            const pagesStaff = [];
            const pagesStaffRows = await new Promise((resolve, reject) => {
                const results = [];
                require('fs').createReadStream(pagesStaffFilePath)
                    .pipe(csv({
                        headers: ['id', 'parent_id', 'path', 'title', 'min_role', 'component', 'icon'],
                        skipLines: 0
                    }))
                    .on('data', (data) => results.push(data))
                    .on('end', () => resolve(results))
                    .on('error', (err) => reject(err));
            });

            for (const row of pagesStaffRows) {
                if (!row.id || !row.title || !row.min_role) {
                    console.warn('Skipping invalid pages_staff row:', row);
                    continue;
                }
                pagesStaff.push({
                    id: parseInt(row.id),
                    parent_id: row.parent_id ? parseInt(row.parent_id) : null,
                    path: row.path,
                    title: row.title,
                    min_role: parseInt(row.min_role),
                    component: row.component || null,
                    icon: row.icon || null
                });
            }

            if (pagesStaff.length === 0) {
                console.warn('No valid pages_staff to seed from pages_staff.csv');
            } else {
                await PagesStaff.bulkCreate(pagesStaff);
                console.log(`Seeded ${pagesStaff.length} pages_staff from pages_staff.csv`);
            }
        }

        // Seed pages_manager
        const pagesManagerCount = await PagesManager.count();
        if (pagesManagerCount > 0) {
            console.log('PagesManager table is not empty, skipping seeding.');
        } else {
            const pagesManagerFilePath = path.join(__dirname, '..', 'pages_manager.csv');
            const pagesManager = [];
            const pagesManagerRows = await new Promise((resolve, reject) => {
                const results = [];
                require('fs').createReadStream(pagesManagerFilePath)
                    .pipe(csv({
                        headers: ['id', 'parent_id', 'path', 'title', 'min_role', 'component', 'icon'],
                        skipLines: 0
                    }))
                    .on('data', (data) => results.push(data))
                    .on('end', () => resolve(results))
                    .on('error', (err) => reject(err));
            });

            for (const row of pagesManagerRows) {
                if (!row.id || !row.title || !row.min_role) {
                    console.warn('Skipping invalid pages_manager row:', row);
                    continue;
                }
                pagesManager.push({
                    id: parseInt(row.id),
                    parent_id: row.parent_id ? parseInt(row.parent_id) : null,
                    path: row.path,
                    title: row.title,
                    min_role: parseInt(row.min_role),
                    component: row.component || null,
                    icon: row.icon || null
                });
            }

            if (pagesManager.length === 0) {
                console.warn('No valid pages_manager to seed from pages_manager.csv');
            } else {
                await PagesManager.bulkCreate(pagesManager);
                console.log(`Seeded ${pagesManager.length} pages_manager from pages_manager.csv`);
            }
        }

        // Seed manager_view_access
        const managerAccessCount = await ManagerViewAccess.count();
        if (managerAccessCount > 0) {
            console.log('ManagerViewAccess table is not empty, skipping seeding.');
        } else {
            const managerUserIds = [353621, 398285]; // Manager and test1
            const managerAccess = [];
            for (const userId of managerUserIds) {
                const exists = await User.findOne({ where: { ID: userId } });
                if (exists) {
                    managerAccess.push({ userID: userId });
                } else {
                    console.warn(`User ID ${userId} not found, skipping manager_view_access entry.`);
                }
            }

            if (managerAccess.length === 0) {
                console.warn('No valid manager_view_access entries to seed.');
            } else {
                await ManagerViewAccess.bulkCreate(managerAccess);
                console.log(`Seeded ${managerAccess.length} manager_view_access entries.`);
            }
        }
    } catch (err) {
        console.error('Error seeding data:', err.message, err.stack);
        throw err;
    }
}

module.exports = {
    sequelize,
    User,
    PagesStaff,
    PagesManager,
    ManagerViewAccess,
    seedData
};