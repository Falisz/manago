// BACKEND/utils/seed-data.js
import bcrypt from 'bcrypt';
import sequelize from '../utils/database.js';
import {AppConfig, AppModule, AppPage} from '../models/app.js';
import {User, UserManager, Role, UserRole} from '../models/users.js';
import {Team, TeamRole, TeamUser} from '../models/teams.js';
import {Post, Channel} from '../models/posts.js';

// Data to seed
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
    {id: 4, title: 'Time Management', icon: 'calendar_month', enabled: true,
        description: "This is powerful tool for schedule planning, timesheets, job posts, payroll, leaves and time offs."},
    {id: 5, title: 'Tasks', icon: 'task_alt', enabled: false,
        description: "This module allows to-do and Kanban tasks and plans management."},
    {id: 6, title: 'Trainings', icon: 'school', enabled: false,
        description: "This module allows for centralised employee training experience, assessments and progress tracking."},
    {id: 7, title: 'Posts', icon: 'forum', enabled: true,
        description: "This module allows post threads and channels (general, teams, projects and/or branch related ones"},
    {id: 8, title: 'Blogs', icon: 'newsmode', enabled: false,
        description: "Use this module for edited articles, like news or blogposts."}
];

const appConfigs = [
    {
        configName: 'style',
        selectedOption: 'fluent',
        module: 0,
        options: ['fluent', 'flat']
    },
    {
        configName: 'theme',
        selectedOption: 'dark',
        module: 0,
        options: ['dark', 'light', 'system']
    },
    {
        configName: 'color',
        selectedOption: 'orange',
        module: 0,
        options: ['mono', 'red', 'blue', 'green', 'cyan', 'magenta', 'yellow', 'pink', 'lime', 'orange']
    },
    {
        configName: 'background',
        selectedOption: 'blur-1',
        module: 0,
        options: ['cloudy', 'blue-galaxy', 'violet-haze', 'raspberry-peach', 'blur-1', 'blur-2', 'blur-3', 'blur-4']
    }
];

const appPages = [
    {
        view: 'staff_view',
        pages: [
            {
                "path": "/",
                "title": "Home",
                "module": 0,
                "icon": "home",
                "component": "Dashboard",
                "subpages": []
            },
            {
                "path": "schedule",
                "title": "Schedule",
                "module": 4,
                "icon": "calendar_month",
                "component": "Schedule",
                "subpages": [
                    {
                        "path": "dispositions",
                        "title": "Dispositions",
                        "icon": "",
                        "component": "Dispositions",
                        "subpages": []
                    }
                ]
            },
            {
                "path": "trainings",
                "title": "Trainings",
                "module": 6,
                "icon": "school",
                "component": "Trainings",
                "subpages": []
            },
            {
                "path": "posts",
                "title": "Posts",
                "module": 7,
                "icon": "forum",
                "component": "PostsIndex",
                "subpages": []
            }
        ]
    },
    {
        view: 'manager_view',
        pages: [
            {
                "path": "/",
                "title": "Home",
                "module": 0,
                "icon": "home",
                "component": "ManagerDashboard",
                "subpages": []
            },
                {
                    "path": "employees",
                    "title": "Employees",
                    "module": 0,
                    "icon": "people",
                    "component": "EmployeesIndex",
                    "subpages": [
                        {
                            "path": "managers",
                            "title": "Managers",
                            "icon": "",
                            "component": "ManagersIndex"
                        },
                        {
                            "path": "all-users",
                            "title": "All Users",
                            "icon": "",
                            "component": "UsersIndex"
                        },
                        {
                            "path": "teams",
                            "title": "Teams",
                            "module": 1,
                            "icon": "groups",
                            "component": "TeamsIndex"
                        },
                        {
                            "path": "roles",
                            "title": "Security Roles",
                            "icon": "",
                            "component": "RolesIndex"
                        }
                    ]
                },
                {
                    "path": "projects",
                    "title": "Projects",
                    "module": 2,
                    "icon": "fact_check",
                    "component": "ProjectIndex",
                    "subpages": []
                },
                {
                    "path": "branches",
                    "title": "Branches",
                    "module": 3,
                    "icon": "hub",
                    "component": "BranchIndex",
                    "subpages": []
                },
                {
                    "path": "planner",
                    "title": "Work Planner",
                    "module": 4,
                    "icon": "edit_calendar",
                    "component": "WorkPlanner",
                    "subpages": [
                        {
                            "path": "schedules",
                            "title": "Schedules",
                            "icon": "",
                            "component": "ScheduleIndex"
                        }, {
                            "path": "leaves",
                            "title": "Leaves and Holidays",
                            "icon": "",
                            "component": "LeavesIndex"
                        }, {
                            "path": "job-posts",
                            "title": "Job Posts",
                            "icon": "",
                            "component": "JobPostsIndex"
                        }
                    ]
                },
                {
                    "path": "timesheets",
                    "title": "timesheets",
                    "module": 4,
                    "icon": "calendar_month",
                    "component": "TimesheetIndex"
                },
                {
                    "path": "Tasks",
                    "title": "Tasks",
                    "module": 5,
                    "icon": "task",
                    "component": "TasksDashboard"
                },
                {
                    "path": "Trainings",
                    "title": "Trainings",
                    "module": 6,
                    "icon": "school",
                    "component": "TrainingsDashboard"
                },
                {
                    "path": "posts",
                    "title": "Posts",
                    "module": 7,
                    "icon": "forum",
                    "component": "PostsIndex",
                    "subpages": [
                        {
                            "path": "archive",
                            "title": "Posts Archive",
                            "icon": "",
                            "component": "PostsArchive",
                            "subpages": []
                        }
                    ]
                },
                {
                    "path": "Blogs",
                    "title": "Blogs",
                    "module": 8,
                    "icon": "feed",
                    "component": "Blogs"
                },
                {
                    "path": "app-settings",
                    "title": "App Settings",
                    "module": 0,
                    "icon": "settings",
                    "component": "AppSettings"
                }
            ]
    }
];

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

const defaultPassword = await bcrypt.hash('1234', 10);
const users = [
    {id: 137500, first_name: 'Staff', last_name: 'Joe', login: 'staff', 
        email: 'staff.joe@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 353621, first_name: 'Manager', last_name: 'Smith', login: 'manager', 
        email: 'manager.smith@com.com', password: defaultPassword, active: true,
        manager_view_access: true, manager_view_enabled: true, manager_nav_collapsed: false},
    {id: 398285, first_name: 'Test', last_name: '1', login: 'test1', 
        email: 'test1@com.com', password: defaultPassword, active: true,
        manager_view_access: true, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 475776, first_name: 'Test', last_name: '2', login: 'test2', 
        email: 'test2@com.com', password: defaultPassword, active: false,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 864434, first_name: 'Test', last_name: '3', login: 'test3', 
        email: 'test3@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100001, first_name: 'John', last_name: 'Doe', login: 'ceo',
        email: 'ceo@com.com', password: defaultPassword, active: true,
        manager_view_access: true, manager_view_enabled: true, manager_nav_collapsed: false},
    {id: 100002, first_name: 'Alice', last_name: 'Smith', login: 'mid1',
        email: 'mid1@com.com', password: defaultPassword, active: true,
        manager_view_access: true, manager_view_enabled: true, manager_nav_collapsed: false},
    {id: 100003, first_name: 'Bob', last_name: 'Johnson', login: 'mid2',
        email: 'mid2@com.com', password: defaultPassword, active: true,
        manager_view_access: true, manager_view_enabled: true, manager_nav_collapsed: false},
    {id: 100004, first_name: 'Charlie', last_name: 'Brown', login: 'low1',
        email: 'low1@com.com', password: defaultPassword, active: true,
        manager_view_access: true, manager_view_enabled: true, manager_nav_collapsed: false},
    {id: 100005, first_name: 'David', last_name: 'Wilson', login: 'low2',
        email: 'low2@com.com', password: defaultPassword, active: true,
        manager_view_access: true, manager_view_enabled: true, manager_nav_collapsed: false},
    {id: 100006, first_name: 'Eve', last_name: 'Davis', login: 'low3',
        email: 'low3@com.com', password: defaultPassword, active: true,
        manager_view_access: true, manager_view_enabled: true, manager_nav_collapsed: false},
    {id: 100007, first_name: 'Frank', last_name: 'Green', login: 'leader1',
        email: 'leader1@com.com', password: defaultPassword, active: true,
        manager_view_access: true, manager_view_enabled: true, manager_nav_collapsed: false},
    {id: 100008, first_name: 'Grace', last_name: 'Harris', login: 'leader2',
        email: 'leader2@com.com', password: defaultPassword, active: true,
        manager_view_access: true, manager_view_enabled: true, manager_nav_collapsed: false},
    {id: 100009, first_name: 'Henry', last_name: 'Clark', login: 'leader3',
        email: 'leader3@com.com', password: defaultPassword, active: true,
        manager_view_access: true, manager_view_enabled: true, manager_nav_collapsed: false},
    {id: 100010, first_name: 'Ivy', last_name: 'Lewis', login: 'leader4',
        email: 'leader4@com.com', password: defaultPassword, active: true,
        manager_view_access: true, manager_view_enabled: true, manager_nav_collapsed: false},
    {id: 100011, first_name: 'Jack', last_name: 'Walker', login: 'leader5',
        email: 'leader5@com.com', password: defaultPassword, active: true,
        manager_view_access: true, manager_view_enabled: true, manager_nav_collapsed: false},
    {id: 100012, first_name: 'Kathy', last_name: 'Hall', login: 'leader6',
        email: 'leader6@com.com', password: defaultPassword, active: true,
        manager_view_access: true, manager_view_enabled: true, manager_nav_collapsed: false},
    {id: 100013, first_name: 'Employee', last_name: 'One', login: 'emp1',
        email: 'emp1@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100014, first_name: 'Employee', last_name: 'Two', login: 'emp2',
        email: 'emp2@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100015, first_name: 'Employee', last_name: 'Three', login: 'emp3',
        email: 'emp3@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100016, first_name: 'Employee', last_name: 'Four', login: 'emp4',
        email: 'emp4@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100017, first_name: 'Employee', last_name: 'Five', login: 'emp5',
        email: 'emp5@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100018, first_name: 'Employee', last_name: 'Six', login: 'emp6',
        email: 'emp6@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100019, first_name: 'Employee', last_name: 'Seven', login: 'emp7',
        email: 'emp7@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100020, first_name: 'Employee', last_name: 'Eight', login: 'emp8',
        email: 'emp8@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100021, first_name: 'Employee', last_name: 'Nine', login: 'emp9',
        email: 'emp9@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100022, first_name: 'Employee', last_name: 'Ten', login: 'emp10',
        email: 'emp10@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100023, first_name: 'Employee', last_name: 'Eleven', login: 'emp11',
        email: 'emp11@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100024, first_name: 'Employee', last_name: 'Twelve', login: 'emp12',
        email: 'emp12@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100025, first_name: 'Employee', last_name: 'Thirteen', login: 'emp13',
        email: 'emp13@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100026, first_name: 'Employee', last_name: 'Fourteen', login: 'emp14',
        email: 'emp14@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100027, first_name: 'Employee', last_name: 'Fifteen', login: 'emp15',
        email: 'emp15@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100028, first_name: 'Employee', last_name: 'Sixteen', login: 'emp16',
        email: 'emp16@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100029, first_name: 'Employee', last_name: 'Seventeen', login: 'emp17',
        email: 'emp17@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100030, first_name: 'Employee', last_name: 'Eighteen', login: 'emp18',
        email: 'emp18@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100031, first_name: 'Employee', last_name: 'Nineteen', login: 'emp19',
        email: 'emp19@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100032, first_name: 'Employee', last_name: 'Twenty', login: 'emp20',
        email: 'emp20@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100033, first_name: 'Employee', last_name: 'TwentyOne', login: 'emp21',
        email: 'emp21@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100034, first_name: 'Employee', last_name: 'TwentyTwo', login: 'emp22',
        email: 'emp22@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100035, first_name: 'Employee', last_name: 'TwentyThree', login: 'emp23',
        email: 'emp23@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100036, first_name: 'Employee', last_name: 'TwentyFour', login: 'emp24',
        email: 'emp24@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100037, first_name: 'Employee', last_name: 'TwentyFive', login: 'emp25',
        email: 'emp25@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100038, first_name: 'Employee', last_name: 'TwentySix', login: 'emp26',
        email: 'emp26@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100039, first_name: 'Employee', last_name: 'TwentySeven', login: 'emp27',
        email: 'emp27@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100040, first_name: 'Employee', last_name: 'TwentyEight', login: 'emp28',
        email: 'emp28@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100041, first_name: 'Employee', last_name: 'TwentyNine', login: 'emp29',
        email: 'emp29@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
    {id: 100042, first_name: 'Employee', last_name: 'Thirty', login: 'emp30',
        email: 'emp30@com.com', password: defaultPassword, active: true,
        manager_view_access: false, manager_view_enabled: false, manager_nav_collapsed: false},
];

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
];

const teamRoles = [
    {id: 1, name: 'Member'},
    {id: 2, name: 'Team Leader'},
    {id: 3, name: 'Team Manager'},
];

const teamUsers = [
    // Parent team managers (role 2)
    {team: 1, user: 100004, role: 3},
    {team: 2, user: 100005, role: 3},
    {team: 3, user: 100006, role: 3},
    // Subteam leaders (role 1)
    {team: 4, user: 100007, role: 2},
    {team: 5, user: 100008, role: 2},
    {team: 6, user: 100009, role: 2},
    {team: 7, user: 100010, role: 2},
    {team: 8, user: 100011, role: 2},
    {team: 9, user: 100012, role: 2},
    // Subteam employees (role 0)
    // Sub 1.1
    {team: 4, user: 100013, role: 1},
    {team: 4, user: 100014, role: 1},
    {team: 4, user: 100015, role: 1},
    {team: 4, user: 100016, role: 1},
    {team: 4, user: 100017, role: 1},
    // Sub 1.2
    {team: 5, user: 100018, role: 1},
    {team: 5, user: 100019, role: 1},
    {team: 5, user: 100020, role: 1},
    {team: 5, user: 100021, role: 1},
    {team: 5, user: 100022, role: 1},
    // Sub 2.1
    {team: 6, user: 100023, role: 1},
    {team: 6, user: 100024, role: 1},
    {team: 6, user: 100025, role: 1},
    {team: 6, user: 100026, role: 1},
    {team: 6, user: 100027, role: 1},
    // Sub 2.2
    {team: 7, user: 100028, role: 1},
    {team: 7, user: 100029, role: 1},
    {team: 7, user: 100030, role: 1},
    {team: 7, user: 100031, role: 1},
    {team: 7, user: 100032, role: 1},
    // Sub 3.1
    {team: 8, user: 100033, role: 1},
    {team: 8, user: 100034, role: 1},
    {team: 8, user: 100035, role: 1},
    {team: 8, user: 100036, role: 1},
    {team: 8, user: 100037, role: 1},
    // Sub 3.2
    {team: 9, user: 100038, role: 1},
    {team: 9, user: 100039, role: 1},
    {team: 9, user: 100040, role: 1},
    {team: 9, user: 100041, role: 1},
    {team: 9, user: 100042, role: 1},
];

const userManagers = [
    // Employees report to their team leaders
    // Sub 1.1 employees to leader1
    {user: 100013, manager: 100007},
    {user: 100014, manager: 100007},
    {user: 100015, manager: 100007},
    {user: 100016, manager: 100007},
    {user: 100017, manager: 100007},
    // Sub 1.2 to leader2
    {user: 100018, manager: 100008},
    {user: 100019, manager: 100008},
    {user: 100020, manager: 100008},
    {user: 100021, manager: 100008},
    {user: 100022, manager: 100008},
    // Sub 2.1 to leader3
    {user: 100023, manager: 100009},
    {user: 100024, manager: 100009},
    {user: 100025, manager: 100009},
    {user: 100026, manager: 100009},
    {user: 100027, manager: 100009},
    // Sub 2.2 to leader4
    {user: 100028, manager: 100010},
    {user: 100029, manager: 100010},
    {user: 100030, manager: 100010},
    {user: 100031, manager: 100010},
    {user: 100032, manager: 100010},
    // Sub 3.1 to leader5
    {user: 100033, manager: 100011},
    {user: 100034, manager: 100011},
    {user: 100035, manager: 100011},
    {user: 100036, manager: 100011},
    {user: 100037, manager: 100011},
    // Sub 3.2 to leader6
    {user: 100038, manager: 100012},
    {user: 100039, manager: 100012},
    {user: 100040, manager: 100012},
    {user: 100041, manager: 100012},
    {user: 100042, manager: 100012},
    // Team leaders report to low-managers
    // Leaders 1 and 2 (Parent1) to low1
    {user: 100007, manager: 100004},
    {user: 100008, manager: 100004},
    // Leaders 3 and 4 (Parent2) to low2
    {user: 100009, manager: 100005},
    {user: 100010, manager: 100005},
    // Leaders 5 and 6 (Parent3) to low3
    {user: 100011, manager: 100006},
    {user: 100012, manager: 100006},
    // Low-managers report to mid-managers
    // Low1 and Low2 to Mid1
    {user: 100004, manager: 100002},
    {user: 100005, manager: 100002},
    // Low3 to Mid2
    {user: 100006, manager: 100003},
    // Mid-managers report to CEO
    {user: 100002, manager: 100001},
    {user: 100003, manager: 100001},
];

const channels = [
    { id:1, name: 'General Discussion' },
    { id:2, name: 'Announcements' },
    { id:3, name: 'Ideas and Suggestions' }
];

const posts = [
    {
        channel: 1,
        author: 100001,
        title: 'Welcome to the Forum',
        content: 'This is the first post in our new forum. Feel free to share your thoughts!',
        createdAt: new Date()
    },
    {
        channel: 2,
        author: 100002,
        title: 'Company Update',
        content: 'We have some exciting news to share about upcoming projects!',
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        updatedAt: new Date()
    },
    {
        channel: 3,
        author: 100010,
        title: null,
        content: 'I have an idea for improving our workflow. Let’s discuss!',
        createdAt: new Date(Date.now() - 172800000) // 2 days ago
    }
];

// The structure for seeding
const seedStructure = [
    { model: AppModule, tableName: 'app_modules', data: appModules, itemsName: 'modules' },
    { model: AppConfig, tableName: 'app_configs', data: appConfigs, itemsName: 'configs' },
    { model: AppPage, tableName: 'app_pages', data: appPages, itemsName: 'pages' },
    { model: Role, tableName: 'roles', data: roles, itemsName: 'roles' },
    { model: User, tableName: 'users', data: users, itemsName: 'users' },
    { model: UserRole, tableName: 'user_roles', data: userRoles, itemsName: 'user roles assignments' },
    { model: Team, tableName: 'teams', data: teams, itemsName: 'teams' },
    { model: TeamRole, tableName: 'team_roles', data: teamRoles, itemsName: 'team roles' },
    { model: TeamUser, tableName: 'team_users', data: teamUsers, itemsName: 'team user assignments' },
    { model: UserManager, tableName: 'user_managers', data: userManagers, itemsName: 'user manager assignments' },
    { model: Channel, tableName: 'channels', data: channels, itemsName: 'channels' },
    { model: Post, tableName: 'posts', data: posts, itemsName: 'posts' },
];

/**
 * Seeds data to a models if the given tables are empty or it is forced with the param.
 * @param {boolean} force - If true, existing data will be deleted and reseeded
 * @returns {Promise<void>}
 */
export async function seedData(force = false) {
    try {
        console.log('\n[INFO] Starting data ' + (force ? 'reseeding' : 'seeding') + '...');
        await sequelize.sync({ [force ? 'force' : 'alter']: true });

        for (const entry of seedStructure) {
            let rowCount = await entry.model.count();
            if (rowCount > 0) {
                console.log(`\t${rowCount} ${entry.itemsName} found in '${entry.tableName}' table. Seeding skipped.`);
            } else {
                await entry.model.bulkCreate(entry.data);
                rowCount = await entry.model.count();
                console.log(`\t${rowCount} ${entry.itemsName} ${force ? 'reseeded' : 'seeded'} to '${entry.tableName}' table.`);
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
    const isForce = process.argv[2] === 'force';
    seedData(isForce)
        .then(() => {
            console.log('[INFO] Seeding finished successfully.');
            process.exit(0);
        })
        .catch(err => {
            console.error('[ERROR] Seeding failed:', err);
            process.exit(1);
        });
}