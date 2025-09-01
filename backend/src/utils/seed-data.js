// BACKEND/utils/seed-data.js
import bcrypt from 'bcrypt';
import sequelize from '../db.js';
import AppModule from "../models/app-module.js";
import Role from '../models/role.js';
import User, {UserDetails, UserConfigs, UserRole} from '../models/user.js';
import Team from '../models/team.js';
import Channel from "../models/channel.js";
import Post from "../models/post.js";

/**
 * Seeds data to a model if the table is empty.
 * @param {Object} model - Sequelize model
 * @param {string} tableName - Table name
 * @param {Object[]} data - Data to seed
 * @param {string} [itemsName="records"] - Name for logging (e.g., "records", "modules")
 * @returns {Promise<void>}
 */
async function seedModel(model, tableName, data, itemsName = "records") {
    let rowCount = await model.count();
    if (rowCount > 0) {
        console.log(`\t${rowCount} ${itemsName} found in \'${tableName}\' table. Seeding skipped.`);
    } else {
        await model.bulkCreate(data);
        rowCount = await model.count();
        console.log(`\t${rowCount} ${itemsName} seeded to \'${tableName}\' table.`);
    }
}

/**
 * Seeds initial data to the database.
 * @returns {Promise<void>}
 */
export async function seedData() {
    try {
        console.log('\n[INFO] Starting data seeding...');
        await sequelize.sync({ alter: true });

        const appModules = [
                {id: 0, title: 'Main', icon: 'dashboard', enabled: true,
                    description: "This module is responsible for basic logics in the App including user authorisation" +
                        "and employee management. It cannot be turned off."},
                {id: 1, title: 'Teams', icon: 'groups', enabled: true,
                    description: "This module is responsible for teams assignment and management."},
                {id: 2, title: 'Projects', icon: 'fact_check', enabled: true,
                    description: "It can be used for project-related management allowing major logical divisions within the company."},
                {id: 3, title: 'Branches', icon: 'graph_3', enabled: false,
                    description: "Similarly to the projects, but it allows for major physical divisions for the company."},
                {id: 4, title: 'Timesheets', icon: 'calendar_month', enabled: false,
                    description: "This is powerful tool for timesheets, payroll and schedule planning, leaves and time offs."},
                {id: 5, title: 'Tasks', icon: 'task_alt', enabled: false,
                    description: "This module allows to-do and Kanban tasks and plans management."},
                {id: 6, title: 'Trainings', icon: 'school', enabled: false,
                    description: "This module allows for centralised employee training experience, assessments and progress tracking."},
                {id: 7, title: 'Posts', icon: 'forum', enabled: false,
                    description: "This module allows post threads and channels (general, teams, projects and/or branch related ones"},
                {id: 8, title: 'Blogs', icon: 'newsmode', enabled: false,
                    description: "Use this module for edited articles, like news or blogposts."}
            ];
        await seedModel(AppModule, 'app_modules', appModules, 'modules');

        const roles = [
                { id: 1, name: 'Employee', power: 10, system_default: true,
                    description: "Default role assigned to all users. Allows access to basic features and self-service options." },
                { id: 2, name: 'Specialist', power: 20, system_default: false,
                    description: "Role for specialized users with access to advanced features." },
                { id: 3, name: 'Team Leader', power: 30, system_default: false,
                    description: "Role for team leaders with access to team management features." },
                { id: 11, name: 'Manager', power: 50, system_default: false,
                    description: "Role for managers with access to management features." },
                { id: 12, name: 'Branch Manager', power: 60, system_default: false,
                    description: "Role for branch managers with access to branch management features." },
                { id: 13, name: 'Project Manager', power: 70, system_default: false,
                    description: "Role for project managers with access to project management features." },
                { id: 25, name: 'HR Rep', power: 80, system_default: false,
                    description: "Role for HR representatives with access to employee management features." },
                { id: 50, name: 'CEO', power: 90, system_default: false,
                    description: "Role for the CEO with access to all features." },
                { id: 99, name: 'Admin', power: 100, system_default: false,
                    description: "Role for administrators with full access to the system." },
            ];
        await seedModel(Role, 'roles', roles, 'roles')

        let userCount = await User.count();
        if (userCount > 0) {
            console.log(`\t${userCount} users found in \'users\' table. Seeding skipped.`);
        } else {
            const userRecords = [
                {id: 137500, first_name: 'Staff', last_name: 'Joe', login: 'staff', 
                    email: 'staff.joe@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 353621, first_name: 'Manager', last_name: 'Smith', login: 'manager', 
                    email: 'manager.smith@com.com', active: true, mv_acc: true, mv_en: true, mv_nav: false},
                {id: 398285, first_name: 'Test', last_name: '1', login: 'test1', 
                    email: 'test1@com.com', active: true, mv_acc: true, mv_en: false, mv_nav: false},
                {id: 475776, first_name: 'Test', last_name: '2', login: 'test2', 
                    email: 'test2@com.com', active: false, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 864434, first_name: 'Test', last_name: '3', login: 'test3', 
                    email: 'test3@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
            ];
            const defaultPassword = await bcrypt.hash('1234', 10);
            const users = [];
            const userDetails = [];
            const userConfigs = [];

            for (const user of userRecords) {
                users.push({
                    id: user.id,
                    login: user.login,
                    email: user.email,
                    active: user.active,
                    password: defaultPassword
                });
                userDetails.push({
                    user: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name
                });
                userConfigs.push({
                    user: user.id,
                    manager_view_access: user.mv_acc,
                    manager_view_enabled: user.mv_en,
                    manager_nav_collapsed: user.mv_en
                });
            }

            await User.bulkCreate(users);
            await UserDetails.bulkCreate(userDetails);
            await UserConfigs.bulkCreate(userConfigs);
            userCount = await User.count();
            console.log(`\t${userCount} users seeded to \'users\' table and associated tables.`);
        }
        
        const userRoles = [
                {user: 137500, role: 1},
                {user: 475776, role: 1},
                {user: 475776, role: 2},
                {user: 864434, role: 3},
                {user: 353621, role: 11},
                {user: 353621, role: 12},
                {user: 398285, role: 11},
            ];
        await seedModel(UserRole, 'user_roles', userRoles, 'user roles assignments');

        const teams = [
            {id: 0, code_name: 'MS-PL-01'},
            {id: 1, code_name: 'MS-PL-02'},
        ]
        await seedModel(Team, 'teams', teams, 'teams');

        const channels = [
                { id:0, name: 'General Discussion' },
                { id:1, name: 'Announcements' },
                { id:2, name: 'Ideas and Suggestions' }
            ];
        await seedModel(Channel, 'channels', channels, 'channels');

        let postCount = await Post.count();
        if (postCount > 0) {
            console.log(`\t${postCount} posts found in \'posts\' table. Seeding skipped.`);
        } else {
            const users = await User.findAll({ attributes: ['id'] });
            const channels = await Channel.findAll({ attributes: ['id'] });
            if (users.length === 0 || channels.length === 0) {
                console.warn('No users or channels found, skipping posts seeding.');
            } else {
                const posts = [
                    {
                        channel: channels[0].id,
                        author: users[0].id,
                        title: 'Welcome to the Forum',
                        content: 'This is the first post in our new forum. Feel free to share your thoughts!',
                        createdAt: new Date(),
                        isEdited: false
                    },
                    {
                        channel: channels[1].id,
                        author: users[0].id,
                        title: 'Company Update',
                        content: 'We have some exciting news to share about upcoming projects!',
                        createdAt: new Date(Date.now() - 86400000), // 1 day ago
                        isEdited: true,
                        updatedAt: new Date()
                    },
                    {
                        channel: channels[2].id,
                        author: users[1]?.id || users[0].id,
                        title: null,
                        content: 'I have an idea for improving our workflow. Let’s discuss!',
                        createdAt: new Date(Date.now() - 172800000), // 2 days ago
                        isEdited: false
                    }
                ];
                await Post.bulkCreate(posts);
                postCount = await Post.count();
                console.log(`\t${postCount} posts seeded to \'posts\' table.`);
            }
        }
    } catch (err) {
        console.error('\t[ERROR] Error occurred while seeding data:', err.message, err.stack);
        throw err;
    } finally { 
        console.log('[INFO] Data seeding completed');
    }
}

export default seedData;

if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('[INFO] Running data seeding...');
    seedData()
        .then(() => {
            console.log('[INFO] Seeding finished successfully.');
            process.exit(0);
        })
        .catch(err => {
            console.error('[ERROR] Seeding failed:', err);
            process.exit(1);
        });
}