//BACKEND/db.js
const { Sequelize, DataTypes } = require('sequelize');
const csv = require('csv-parser');
const path = require('path');
require('dotenv').config();

// Initialize Sequelize for PostgreSQL
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

        const userCount = await User.count();
        if (userCount > 0) {
            console.log('Users table is not empty, skipping seeding.');
            return;
        }

        const csvFilePath = path.join(__dirname, 'users.csv');
        const users = [];

        const rows = await new Promise((resolve, reject) => {
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

        for (const row of rows) {
            if (!row.ID || !row.first_name || !row.last_name || !row.email || !row.role || !row.password) {
                console.warn('Skipping invalid row:', row);
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
            return;
        }
        await User.bulkCreate(users);
        console.log(`Seeded ${users.length} users from users.csv`);
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