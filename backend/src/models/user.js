import {DataTypes} from "sequelize";
import sequelize from "../db.js";
import Role from "./role.js";

export const User = sequelize.define('User', {
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
        allowNull: true
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

export const UserDetails = sequelize.define('UserDetails', {
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

export const UserConfigs = sequelize.define('UserConfigs', {
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

export const UserRole = sequelize.define('UserRole', {
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
    indexes: [{ unique: true, fields: ['user', 'role'] }],
    primaryKey: false
});
UserRole.removeAttribute('id');

export const UserManager = sequelize.define('UserManager', {
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

export default User;