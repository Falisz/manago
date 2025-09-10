import {DataTypes} from "sequelize";
import sequelize from "../db.js";
import Role from "./role.js";

export const User = sequelize.define('User', {
    id: {
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
        references: { model: 'users', key: 'id' }
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
        references: { model: 'users', key: 'id' }
    },
    theme_mode: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
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
        references: { model: 'users', key: 'id' }
    },
    role: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'roles', key: 'id' }
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
        references: { model: 'users', key: 'id' }
    },
    manager: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
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

User.hasOne(UserDetails, { foreignKey: 'user', sourceKey: 'id', as: 'UserDetails' });
UserDetails.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });

User.hasOne(UserConfigs, { foreignKey: 'user', sourceKey: 'id', as: 'UserConfigs' });
UserConfigs.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });

User.hasMany(UserManager, { foreignKey: 'user', sourceKey: 'id', as: 'ManagedUsers' });
UserManager.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'User' });
User.hasMany(UserManager, { foreignKey: 'manager', sourceKey: 'id', as: 'Managers' });
UserManager.belongsTo(User, { foreignKey: 'manager', targetKey: 'id', as: 'Manager' });

User.hasMany(UserRole, { foreignKey: 'user', sourceKey: 'id' });
UserRole.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });
Role.hasMany(UserRole, { foreignKey: 'role', sourceKey: 'id' });
UserRole.belongsTo(Role, { foreignKey: 'role', targetKey: 'id' });

export default User;