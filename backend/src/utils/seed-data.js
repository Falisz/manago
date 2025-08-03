// BACKEND/src/seed-data.js
const path = require('path');
const csv = require('csv-parser');
const {AppModule, AppPage, User, UserDetails, UserConfigs, Channel, Post, Role, sequelize, UserRole} = require('../db')

async function seedData() {
    try {
        await sequelize.sync();

        const moduleCount = await AppModule.count();
        if (moduleCount > 0) {
            console.log('\tAppModules table is not empty, skipping seeding.');
        } else {
            const appModuleFilePath = path.join(__dirname, '..', '..', 'modules.csv');
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
            const appPageFilePath = path.join(__dirname, '..', '..', 'pages.csv');
            const appPages = [];
            const appPageRows = await new Promise((resolve, reject) => {
                const results = [];
                require('fs').createReadStream(appPageFilePath)
                    .pipe(csv({
                        headers: ['ID','view','module','parent','path','title','icon','component','hidden'],
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
                    hidden: row.hidden ? true : null
                });
            }

            if (appPages.length === 0) {
                console.warn('\tNo valid Pages to seed from pages.csv');
            } else {
                await AppPage.bulkCreate(appPages);
                console.log(`\tSeeded ${appPages.length} Pages from pages.csv`);
            }
        }

        const roleCount = await Role.count();
        if (roleCount > 0) {
            console.log('\tRoles table is not empty, skipping seeding.');
        } else {
            await Role.bulkCreate([
                { ID: 1, name: 'Employee', power: 10, system_default: true },
                { ID: 2, name: 'Specialist', power: 20, system_default: false },
                { ID: 3, name: 'Team Leader', power: 30, system_default: false },
                { ID: 11, name: 'Manager', power: 50, system_default: false },
                { ID: 12, name: 'Branch Manager', power: 60, system_default: false },
                { ID: 13, name: 'Project Manager', power: 70, system_default: false },
                { ID: 50, name: 'CEO', power: 90, system_default: false },
                { ID: 99, name: 'Admin', power: 100, system_default: false },
            ]);
            const roleCount = await Role.count();
            console.log(`\tSeeded ${roleCount} Roles to the Roles table.`);
        }

        // Seed users, user_details, and user_configs
        const userCount = await User.count();
        if (userCount > 0) {
            console.log('\tUsers table is not empty, skipping seeding.');
        } else {
            const csvFilePath = path.join(__dirname, '..', '..', 'users.csv');
            const users = [];
            const userDetails = [];
            const userConfigs = [];
            const managerUserIds = [353621, 398285];
            const userRows = await new Promise((resolve, reject) => {
                const results = [];
                require('fs').createReadStream(csvFilePath)
                    .pipe(csv({
                        headers: ['ID', 'first_name', 'last_name', 'login', 'email', 'role',
                            'active', 'manager_view_enabled', 'manager_nav_collapsed', 'password'],
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
                    login: row.login,
                    email: row.email,
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

        const userRolesCount = await UserRole.count();
        if (userRolesCount > 0) {
            console.log('\tUsers Roles assignment table is not empty, skipping seeding.');
        } else {
            await UserRole.bulkCreate([
                {user: 137500, role: 1},
                {user: 475776, role: 1},
                {user: 475776, role: 2},
                {user: 864434, role: 3},
                {user: 353621, role: 11},
                {user: 353621, role: 12},
                {user: 398285, role: 11},
            ]);
            const userRolesCount = await UserRole.count();
            console.log(`\tSeeded ${userRolesCount} User Role assignments to the User Roles table.`);

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

module.exports = {seedData};