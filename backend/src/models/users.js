// BACKEND/models/users.js
import sequelize from '../utils/database.js';
import {DataTypes} from 'sequelize';

export const User = sequelize.define('User', {
    login: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    address: DataTypes.STRING,
    city: DataTypes.STRING,
    postal_code: DataTypes.STRING,
    country: DataTypes.STRING,
    phone: DataTypes.STRING,
    avatar: DataTypes.STRING,
    password: {
        type: DataTypes.STRING,
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
    },
    locale: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'en'
    },
    theme_mode: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'dark'
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
    tableName: 'users',
    timestamps: false
});

export const UserManager = sequelize.define('UserManager', {
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    manager: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    }
}, {
    tableName: 'user_managers',
    timestamps: false,
    indexes: [{ unique: true, fields: ['user', 'manager'] }],
    noPrimaryKey: true
});

export const Role = sequelize.define('Role', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    icon: DataTypes.STRING,
    description: DataTypes.TEXT,
    system_default: DataTypes.BOOLEAN
}, {
    tableName: 'roles',
    timestamps: false
});

export const UserRole = sequelize.define('UserRole', {
    user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    role: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Role, key: 'id' }
    }
}, {
    tableName: 'user_roles',
    timestamps: false,
    indexes: [{ unique: true, fields: ['user', 'role'] }],
    noPrimaryKey: true
});

//
// Model Associations for users.js
//
// User <-> UserManager (as managed user)
User.hasMany(UserManager, { foreignKey: 'user', sourceKey: 'id', as: 'ManagedUsers' });
UserManager.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'User' });
//
// User <-> UserManager (as manager)
User.hasMany(UserManager, { foreignKey: 'manager', sourceKey: 'id', as: 'Managers' });
UserManager.belongsTo(User, { foreignKey: 'manager', targetKey: 'id', as: 'Manager' });
//
// User <-> UserRole
User.hasMany(UserRole, { foreignKey: 'user', sourceKey: 'id' });
UserRole.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });
//
// Role <-> UserRole
Role.hasMany(UserRole, { foreignKey: 'role', sourceKey: 'id' });
UserRole.belongsTo(Role, { foreignKey: 'role', targetKey: 'id' });