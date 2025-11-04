//FRONTEND/Components.js
import UsersIndex, {EmployeesIndex, ManagersIndex} from './components/Users/Index';
import RolesIndex from './components/Roles/Index';
import TeamsIndex from './components/Teams/Index';
import PostsIndex from './components/Posts/Index';
import AppSettings from './components/AppSettings';
import AppModules from './components/AppModules';
import SchedulesDashboard from './components/Schedules/Dashboard';
import ScheduleView from './components/Schedules/View';
import ScheduleEdit from './components/Schedules/Edit';

export const componentMap = {
    UsersIndex,
    EmployeesIndex,
    ManagersIndex,
    RolesIndex,
    TeamsIndex,
    ScheduleDashboard: SchedulesDashboard,
    ScheduleView,
    ScheduleEdit,
    PostsIndex,
    AppSettings,
    AppModules,
};

export default componentMap;