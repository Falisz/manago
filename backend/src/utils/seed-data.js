// BACKEND/utils/seed-data.js
import bcrypt from 'bcrypt';
import sequelize from '../db.js';
import AppModule from "../models/app-module.js";
import AppPage from "../models/app-page.js";
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
        await sequelize.sync();

        // TODO: Add Teams as a module - teams are not required - may not be applicalbe in some smaller businesses.
        const appModules = [
                {ID: 0, title: 'Main', enabled: true},
                {ID: 1, title: 'Projects', enabled: true},
                {ID: 2, title: 'Branches', enabled: true},
                {ID: 3, title: 'Timesheets', enabled: true},
                {ID: 4, title: 'Tasks', enabled: true},
                {ID: 5, title: 'Trainings', enabled: true},
                {ID: 6, title: 'Posts', enabled: true},
                {ID: 7, title: 'Blogs', enabled: true}
            ];
        await seedModel(AppModule, 'app_modules', appModules, 'modules');

        const appPages = [
                {ID: 0, view: 1, module: 0, parent: null, path: '/', title: 'Home', icon: 'home', component: 'ManagerDashboard'},
                {ID: 1, view: 1, module: 0, parent: null, path: 'employees', title: 'Employees', icon: 'people', component: 'UsersIndex'},
                {ID: 14, view: 1, module: 0, parent: 1, path: 'roles', title: 'Security Roles', icon: '', component: 'RolesIndex'},
                {ID: 2, view: 1, module: 0, parent: null, path: 'teams', title: 'Teams', icon: 'groups', component: 'TeamsIndex'},
                {ID: 3, view: 1, module: 1, parent: null, path: 'branches', title: 'Branches', icon: 'hub', component: 'BranchIndex'},
                {ID: 4, view: 1, module: 2, parent: null, path: 'projects', title: 'Projects', icon: 'fact_check', component: 'ProjectIndex'},
                {ID: 5, view: 1, module: 3, parent: null, path: 'schedule', title: 'Schedule', icon: 'calendar_month', component: 'ScheduleShow'},
                {ID: 50, view: 1, module: 3, parent: 5, path: 'past', title: 'Past Schedules', icon: '', component: 'SchedulePast'},
                {ID: 6, view: 1, module: 6, parent: null, path: 'posts', title: 'Posts', icon: 'forum', component: 'PostsIndex'},
                {ID: 63, view: 1, module: 6, parent: 6, path: 'archive', title: 'Posts Archive', icon: '', component: 'PostsArchive'},
                {ID: 100, view: 0, module: 0, parent: null, path: '/', title: 'Home', icon: 'home', component: 'Dashboard'},
                {ID: 101, view: 0, module: 3, parent: null, path: 'schedule', title: 'Schedule', icon: 'calendar_month', component: 'Schedule'},
                {ID: 110, view: 0, module: 3, parent: 101, path: 'dispositions', title: 'Dispositions', icon: '', component: 'Dispositions'},
                {ID: 102, view: 0, module: 5, parent: null, path: 'trainings', title: 'Trainings', icon: 'school', component: 'Trainings'},
                {ID: 103, view: 0, module: 6, parent: null, path: 'posts', title: 'Posts', icon: 'forum', component: 'PostsIndex'},
            ];
        await seedModel(AppPage, 'app_pages', appPages, 'pages');

        const roles = [
                { ID: 1, name: 'Employee', power: 10, system_default: true },
                { ID: 2, name: 'Specialist', power: 20, system_default: false },
                { ID: 3, name: 'Team Leader', power: 30, system_default: false },
                { ID: 11, name: 'Manager', power: 50, system_default: false },
                { ID: 12, name: 'Branch Manager', power: 60, system_default: false },
                { ID: 13, name: 'Project Manager', power: 70, system_default: false },
                { ID: 50, name: 'CEO', power: 90, system_default: false },
                { ID: 99, name: 'Admin', power: 100, system_default: false },
            ];
        await seedModel(Role, 'roles', roles, 'roles')

        let userCount = await User.count();
        if (userCount > 0) {
            console.log(`\t${userCount} users found in \'users\' table. Seeding skipped.`);
        } else {
            const userRecords = [
                {ID: 137500, first_name: 'Staff', last_name: 'Joe', login: 'staff', 
                    email: 'staff.joe@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {ID: 353621, first_name: 'Manager', last_name: 'Smith', login: 'manager', 
                    email: 'manager.smith@com.com', active: true, mv_acc: true, mv_en: true, mv_nav: false},
                {ID: 398285, first_name: 'Test', last_name: '1', login: 'test1', 
                    email: 'test1@com.com', active: true, mv_acc: true, mv_en: false, mv_nav: false},
                {ID: 475776, first_name: 'Test', last_name: '2', login: 'test2', 
                    email: 'test2@com.com', active: false, mv_acc: false, mv_en: false, mv_nav: false},
                {ID: 864434, first_name: 'Test', last_name: '3', login: 'test3', 
                    email: 'test3@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
            ];
            const defaultPassword = await bcrypt.hash('1234', 10);
            const users = [];
            const userDetails = [];
            const userConfigs = [];

            for (const user of userRecords) {
                users.push({
                    ID: user.ID,
                    login: user.login,
                    email: user.email,
                    active: user.active,
                    password: defaultPassword
                });
                userDetails.push({
                    user: user.ID,
                    first_name: user.first_name,
                    last_name: user.last_name
                });
                userConfigs.push({
                    user: user.ID,
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
            {ID: 0, code_name: 'MS-PL-01'},
            {ID: 1, code_name: 'MS-PL-02'},
        ]
        await seedModel(Team, 'teams', teams, 'teams');

        const channels = [
                { name: 'General Discussion' },
                { name: 'Announcements' },
                { name: 'Ideas and Suggestions' }
            ];
        await seedModel(Channel, 'channels', channels, 'channels');

        let postCount = await Post.count();
        if (postCount > 0) {
            console.log(`\t${postCount} posts found in \'posts\' table. Seeding skipped.`);
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