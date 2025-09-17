// BACKEND/utils/seed-data.js
import bcrypt from 'bcrypt';
import sequelize from '../db.js';
import AppModule from "../models/app-module.js";
import Role from '../models/role.js';
import User, {UserDetails, UserConfigs, UserRole, UserManager} from '../models/user.js';
import Team, {TeamRole, TeamUser} from '../models/team.js';
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
                { id: 1, name: 'Employee', system_default: true, icon: 'account_circle',
                    description: "Default role assigned to all users. Allows access to basic features and self-service options." },
                { id: 2, name: 'Specialist', system_default: false, icon: 'account_circle',
                    description: "Role for specialized users with access to advanced features." },
                { id: 3, name: 'Team Leader', system_default: true, icon: 'account_box',
                    description: "Role for team leaders with access to team management features." },
                { id: 11, name: 'Manager', system_default: true, icon: 'verified_user',
                    description: "Role for managers with access to management features." },
                { id: 12, name: 'Branch Manager', system_default: true, icon: 'verified_user',
                    description: "Role for branch managers with access to branch management features." },
                { id: 13, name: 'Project Manager', system_default: true, icon: 'verified_user',
                    description: "Role for project managers with access to project management features." },
                { id: 25, name: 'HR Rep', system_default: true, icon: 'article_person',
                    description: "Role for HR representatives with access to employee management features." },
                { id: 50, name: 'CEO', system_default: true, icon: 'crown',
                    description: "Role for the CEO with access to all features." },
                { id: 99, name: 'Admin', system_default: true, icon: 'admin_panel_settings',
                    description: "Role for administrators with full access to the system." },
            ];
        await seedModel(Role, 'roles', roles, 'roles');
        await sequelize.query(`
            SELECT setval(
                pg_get_serial_sequence('roles', 'id'),
                COALESCE((SELECT MAX(id) FROM roles), 1)
            );
        `);

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
                {id: 100001, first_name: 'John', last_name: 'Doe', login: 'ceo',
                    email: 'ceo@com.com', active: true, mv_acc: true, mv_en: true, mv_nav: false},
                {id: 100002, first_name: 'Alice', last_name: 'Smith', login: 'mid1',
                    email: 'mid1@com.com', active: true, mv_acc: true, mv_en: true, mv_nav: false},
                {id: 100003, first_name: 'Bob', last_name: 'Johnson', login: 'mid2',
                    email: 'mid2@com.com', active: true, mv_acc: true, mv_en: true, mv_nav: false},
                {id: 100004, first_name: 'Charlie', last_name: 'Brown', login: 'low1',
                    email: 'low1@com.com', active: true, mv_acc: true, mv_en: true, mv_nav: false},
                {id: 100005, first_name: 'David', last_name: 'Wilson', login: 'low2',
                    email: 'low2@com.com', active: true, mv_acc: true, mv_en: true, mv_nav: false},
                {id: 100006, first_name: 'Eve', last_name: 'Davis', login: 'low3',
                    email: 'low3@com.com', active: true, mv_acc: true, mv_en: true, mv_nav: false},
                {id: 100007, first_name: 'Frank', last_name: 'Green', login: 'leader1',
                    email: 'leader1@com.com', active: true, mv_acc: true, mv_en: true, mv_nav: false},
                {id: 100008, first_name: 'Grace', last_name: 'Harris', login: 'leader2',
                    email: 'leader2@com.com', active: true, mv_acc: true, mv_en: true, mv_nav: false},
                {id: 100009, first_name: 'Henry', last_name: 'Clark', login: 'leader3',
                    email: 'leader3@com.com', active: true, mv_acc: true, mv_en: true, mv_nav: false},
                {id: 100010, first_name: 'Ivy', last_name: 'Lewis', login: 'leader4',
                    email: 'leader4@com.com', active: true, mv_acc: true, mv_en: true, mv_nav: false},
                {id: 100011, first_name: 'Jack', last_name: 'Walker', login: 'leader5',
                    email: 'leader5@com.com', active: true, mv_acc: true, mv_en: true, mv_nav: false},
                {id: 100012, first_name: 'Kathy', last_name: 'Hall', login: 'leader6',
                    email: 'leader6@com.com', active: true, mv_acc: true, mv_en: true, mv_nav: false},
                {id: 100013, first_name: 'Employee', last_name: 'One', login: 'emp1',
                    email: 'emp1@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100014, first_name: 'Employee', last_name: 'Two', login: 'emp2',
                    email: 'emp2@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100015, first_name: 'Employee', last_name: 'Three', login: 'emp3',
                    email: 'emp3@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100016, first_name: 'Employee', last_name: 'Four', login: 'emp4',
                    email: 'emp4@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100017, first_name: 'Employee', last_name: 'Five', login: 'emp5',
                    email: 'emp5@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100018, first_name: 'Employee', last_name: 'Six', login: 'emp6',
                    email: 'emp6@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100019, first_name: 'Employee', last_name: 'Seven', login: 'emp7',
                    email: 'emp7@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100020, first_name: 'Employee', last_name: 'Eight', login: 'emp8',
                    email: 'emp8@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100021, first_name: 'Employee', last_name: 'Nine', login: 'emp9',
                    email: 'emp9@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100022, first_name: 'Employee', last_name: 'Ten', login: 'emp10',
                    email: 'emp10@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100023, first_name: 'Employee', last_name: 'Eleven', login: 'emp11',
                    email: 'emp11@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100024, first_name: 'Employee', last_name: 'Twelve', login: 'emp12',
                    email: 'emp12@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100025, first_name: 'Employee', last_name: 'Thirteen', login: 'emp13',
                    email: 'emp13@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100026, first_name: 'Employee', last_name: 'Fourteen', login: 'emp14',
                    email: 'emp14@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100027, first_name: 'Employee', last_name: 'Fifteen', login: 'emp15',
                    email: 'emp15@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100028, first_name: 'Employee', last_name: 'Sixteen', login: 'emp16',
                    email: 'emp16@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100029, first_name: 'Employee', last_name: 'Seventeen', login: 'emp17',
                    email: 'emp17@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100030, first_name: 'Employee', last_name: 'Eighteen', login: 'emp18',
                    email: 'emp18@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100031, first_name: 'Employee', last_name: 'Nineteen', login: 'emp19',
                    email: 'emp19@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100032, first_name: 'Employee', last_name: 'Twenty', login: 'emp20',
                    email: 'emp20@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100033, first_name: 'Employee', last_name: 'TwentyOne', login: 'emp21',
                    email: 'emp21@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100034, first_name: 'Employee', last_name: 'TwentyTwo', login: 'emp22',
                    email: 'emp22@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100035, first_name: 'Employee', last_name: 'TwentyThree', login: 'emp23',
                    email: 'emp23@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100036, first_name: 'Employee', last_name: 'TwentyFour', login: 'emp24',
                    email: 'emp24@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100037, first_name: 'Employee', last_name: 'TwentyFive', login: 'emp25',
                    email: 'emp25@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100038, first_name: 'Employee', last_name: 'TwentySix', login: 'emp26',
                    email: 'emp26@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100039, first_name: 'Employee', last_name: 'TwentySeven', login: 'emp27',
                    email: 'emp27@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100040, first_name: 'Employee', last_name: 'TwentyEight', login: 'emp28',
                    email: 'emp28@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100041, first_name: 'Employee', last_name: 'TwentyNine', login: 'emp29',
                    email: 'emp29@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
                {id: 100042, first_name: 'Employee', last_name: 'Thirty', login: 'emp30',
                    email: 'emp30@com.com', active: true, mv_acc: false, mv_en: false, mv_nav: false},
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
                {user: 100001, role: 50},
                {user: 100002, role: 12},
                {user: 100003, role: 12},
                {user: 100004, role: 11},
                {user: 100005, role: 11},
                {user: 100006, role: 11},
                {user: 100007, role: 3},
                {user: 100008, role: 3},
                {user: 100009, role: 3},
                {user: 100010, role: 3},
                {user: 100011, role: 3},
                {user: 100012, role: 3},
                {user: 100013, role: 1},
                {user: 100014, role: 1},
                {user: 100015, role: 1},
                {user: 100016, role: 1},
                {user: 100017, role: 1},
                {user: 100018, role: 1},
                {user: 100019, role: 1},
                {user: 100020, role: 1},
                {user: 100021, role: 1},
                {user: 100022, role: 1},
                {user: 100023, role: 1},
                {user: 100024, role: 1},
                {user: 100025, role: 1},
                {user: 100026, role: 1},
                {user: 100027, role: 1},
                {user: 100028, role: 1},
                {user: 100029, role: 1},
                {user: 100030, role: 1},
                {user: 100031, role: 1},
                {user: 100032, role: 1},
                {user: 100033, role: 1},
                {user: 100034, role: 1},
                {user: 100035, role: 1},
                {user: 100036, role: 1},
                {user: 100037, role: 1},
                {user: 100038, role: 1},
                {user: 100039, role: 1},
                {user: 100040, role: 1},
                {user: 100041, role: 1},
                {user: 100042, role: 1},
            ];
        await seedModel(UserRole, 'user_roles', userRoles, 'user roles assignments');

        const teams = [
            {id: 1, code_name: 'TEAM-01', name: 'Team 1'},
            {id: 2, code_name: 'TEAM-02', name: 'Team 2'},
            {id: 3, code_name: 'TEAM-03', name: 'Team 3'},
            {id: 4, code_name: '01-LA', name: 'Los Angeles', parent_team: 1},
            {id: 5, code_name: '01-WA', name: 'Washington', parent_team: 1},
            {id: 6, code_name: '02-NY', name: 'New York', parent_team: 2},
            {id: 7, code_name: '02-LV', name: 'Las Vegas', parent_team: 2},
            {id: 8, code_name: '03-AT', name: 'Atlanta', parent_team: 3},
            {id: 9, code_name: '03-PH', name: 'Philadelphia', parent_team: 3},
        ]
        await seedModel(Team, 'teams', teams, 'teams');

        const teamRoles = [
            {id: 0, name: 'Member'},
            {id: 1, name: 'Team Leader'},
            {id: 2, name: 'Team Manager'},
        ]
        await seedModel(TeamRole, 'team_roles', teamRoles, 'team roles');

        const teamUsers = [
            // Parent team managers (role 2)
            {team: 1, user: 100004, role: 2},
            {team: 2, user: 100005, role: 2},
            {team: 3, user: 100006, role: 2},
            // Subteam leaders (role 1)
            {team: 4, user: 100007, role: 1},
            {team: 5, user: 100008, role: 1},
            {team: 6, user: 100009, role: 1},
            {team: 7, user: 100010, role: 1},
            {team: 8, user: 100011, role: 1},
            {team: 9, user: 100012, role: 1},
            // Subteam employees (role 0)
            // Sub 1.1
            {team: 4, user: 100013, role: 0},
            {team: 4, user: 100014, role: 0},
            {team: 4, user: 100015, role: 0},
            {team: 4, user: 100016, role: 0},
            {team: 4, user: 100017, role: 0},
            // Sub 1.2
            {team: 5, user: 100018, role: 0},
            {team: 5, user: 100019, role: 0},
            {team: 5, user: 100020, role: 0},
            {team: 5, user: 100021, role: 0},
            {team: 5, user: 100022, role: 0},
            // Sub 2.1
            {team: 6, user: 100023, role: 0},
            {team: 6, user: 100024, role: 0},
            {team: 6, user: 100025, role: 0},
            {team: 6, user: 100026, role: 0},
            {team: 6, user: 100027, role: 0},
            // Sub 2.2
            {team: 7, user: 100028, role: 0},
            {team: 7, user: 100029, role: 0},
            {team: 7, user: 100030, role: 0},
            {team: 7, user: 100031, role: 0},
            {team: 7, user: 100032, role: 0},
            // Sub 3.1
            {team: 8, user: 100033, role: 0},
            {team: 8, user: 100034, role: 0},
            {team: 8, user: 100035, role: 0},
            {team: 8, user: 100036, role: 0},
            {team: 8, user: 100037, role: 0},
            // Sub 3.2
            {team: 9, user: 100038, role: 0},
            {team: 9, user: 100039, role: 0},
            {team: 9, user: 100040, role: 0},
            {team: 9, user: 100041, role: 0},
            {team: 9, user: 100042, role: 0},
        ];
        await seedModel(TeamUser, 'team_users', teamUsers, 'team user assignments');

        const userManagers = [
            // Employees report to their team leaders
            // Sub 1.1 employees to leader1
            {user: 100013, manager: 100007, primary: true},
            {user: 100014, manager: 100007, primary: true},
            {user: 100015, manager: 100007, primary: true},
            {user: 100016, manager: 100007, primary: true},
            {user: 100017, manager: 100007, primary: true},
            // Sub 1.2 to leader2
            {user: 100018, manager: 100008, primary: true},
            {user: 100019, manager: 100008, primary: true},
            {user: 100020, manager: 100008, primary: true},
            {user: 100021, manager: 100008, primary: true},
            {user: 100022, manager: 100008, primary: true},
            // Sub 2.1 to leader3
            {user: 100023, manager: 100009, primary: true},
            {user: 100024, manager: 100009, primary: true},
            {user: 100025, manager: 100009, primary: true},
            {user: 100026, manager: 100009, primary: true},
            {user: 100027, manager: 100009, primary: true},
            // Sub 2.2 to leader4
            {user: 100028, manager: 100010, primary: true},
            {user: 100029, manager: 100010, primary: true},
            {user: 100030, manager: 100010, primary: true},
            {user: 100031, manager: 100010, primary: true},
            {user: 100032, manager: 100010, primary: true},
            // Sub 3.1 to leader5
            {user: 100033, manager: 100011, primary: true},
            {user: 100034, manager: 100011, primary: true},
            {user: 100035, manager: 100011, primary: true},
            {user: 100036, manager: 100011, primary: true},
            {user: 100037, manager: 100011, primary: true},
            // Sub 3.2 to leader6
            {user: 100038, manager: 100012, primary: true},
            {user: 100039, manager: 100012, primary: true},
            {user: 100040, manager: 100012, primary: true},
            {user: 100041, manager: 100012, primary: true},
            {user: 100042, manager: 100012, primary: true},
            // Team leaders report to low-managers
            // Leaders 1 and 2 (Parent1) to low1
            {user: 100007, manager: 100004, primary: true},
            {user: 100008, manager: 100004, primary: true},
            // Leaders 3 and 4 (Parent2) to low2
            {user: 100009, manager: 100005, primary: true},
            {user: 100010, manager: 100005, primary: true},
            // Leaders 5 and 6 (Parent3) to low3
            {user: 100011, manager: 100006, primary: true},
            {user: 100012, manager: 100006, primary: true},
            // Low-managers report to mid-managers
            // Low1 and Low2 to Mid1
            {user: 100004, manager: 100002, primary: true},
            {user: 100005, manager: 100002, primary: true},
            // Low3 to Mid2
            {user: 100006, manager: 100003, primary: true},
            // Mid-managers report to CEO
            {user: 100002, manager: 100001, primary: true},
            {user: 100003, manager: 100001, primary: true},
        ];
        await seedModel(UserManager, 'user_managers', userManagers, 'user manager assignments');

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

import { fileURLToPath } from "url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
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