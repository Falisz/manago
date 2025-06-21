//BACKEND/utils.js
const { sequelize, User, PagesStaff, PagesManager, ManagerViewAccess } = require('./db');
const bcrypt = require('bcrypt');

async function authUser(login, password) {
    try {
        const isInteger = Number.isInteger(Number(login));

        const user = await User.findOne({
            where: isInteger ? { ID: login } : { email: login }
        });

        if (!user) {
            return { valid: false, status: 401, message: 'Invalid credentials!' };
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return { valid: false, status: 401, message: 'Invalid credentials, wrong password!' };
        }

        if (!user.active) {
            return { valid: false, status: 403, message: 'User inactive.' };
        }

        return { valid: true, user: user.toJSON() };
    } catch (err) {
        console.error('Error authenticating user:', err);
        return { valid: false, status: 500, message: 'Server error' };
    }
}

function serializeUser(user) {
    return {
        id: user.ID,
        first_name: user.first_name,
        last_name: user.last_name,
        active: user.active,
        role: user.role,
        manager_nav_collapsed: user.manager_nav_collapsed,
        manager_view: user.manager_view_enabled,
    };
}

async function refreshUser(user) {
    try {
        const refreshedUser = await User.findOne({
            where: { ID: user.id }
        });

        if (refreshedUser) {
            return serializeUser(refreshedUser.toJSON());
        }

        return null;
    } catch (err) {
        console.error('Error refreshing user:', err);
        return null;
    }
}

async function checkUserAccess(user) {
    try {
        const result = await User.findOne({
            attributes: ['active'],
            where: { ID: user.id }
        });

        return result ? result.active : false;
    } catch (err) {
        console.error('Error checking user access:', err);
        return false;
    }
}

async function checkManagerAccess(user) {
    try {
        const result = await ManagerViewAccess.findOne({
            where: { userID: user.id }
        });

        return !!result;
    } catch (err) {
        console.error(`Error checking Manager Access for userID: ${user.id}`, err);
        return false;
    }
}

async function setManagerView(user, value) {
    try {
        const [updated] = await User.update(
            { manager_view_enabled: value },
            { where: { ID: user.id } }
        );

        return updated === 1;
    } catch (err) {
        console.error(`Error updating manager view for userID: ${user.id}`, err);
        return false;
    }
}

async function setNavCollapsed(user, value) {
    try {
        const [updated] = await User.update(
            { manager_nav_collapsed: value },
            { where: { ID: user.id } }
        );

        return updated === 1;
    } catch (err) {
        console.error(`Error updating nav collapsed for userID: ${user.id}`, err);
        return false;
    }
}

async function getPages(user) {
    try {
        const isManagerView = user?.manager_view || false;
        const Model = isManagerView ? PagesManager : PagesStaff;

        const rows = await Model.findAll({
            order: [
                sequelize.literal('CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END'),
                ['parent_id', 'ASC'],
                ['id', 'ASC']
            ]
        });

        const pages = [];
        const pageMap = new Map();

        for (const row of rows) {
            const page = {
                path: row.path,
                title: row.title,
                icon: row.icon,
                minRole: row.min_role,
                ...(row.component ? { component: row.component } : {}),
                ...(row.parent_id ? {} : { subpages: [] })
            };

            if (!row.parent_id) {
                pageMap.set(row.id, page);
                pages.push(page);
            } else {
                const parent = pageMap.get(row.parent_id);
                if (parent) {
                    parent.subpages.push({
                        path: row.path,
                        title: row.title,
                        minRole: row.min_role,
                        component: row.component
                    });
                }
            }
        }

        return pages;
    } catch (err) {
        console.error(`Error getting pages: ${err}`, err);
        return [];
    }
}

function logoutUser(req, res) {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }

        res.clearCookie('connect.sid', { path: '/', sameSite: 'lax', httpOnly: true });
        res.json({ message: 'Logged out' });
    });
}

module.exports = {
    authUser,
    serializeUser,
    refreshUser,
    checkUserAccess,
    checkManagerAccess,
    setManagerView,
    setNavCollapsed,
    getPages,
    logoutUser
};