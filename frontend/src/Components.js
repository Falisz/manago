//FRONTEND/Components.js
import UsersIndex, {EmployeesIndex, ManagersIndex} from './components/Users/Index';
import RolesIndex from './components/Roles/Index';
import TeamsIndex from './components/Teams/Index';
import PostsIndex from './components/Posts/Index';
import AppSettings from './components/AppSettings';
import AppModules from './components/AppModules';
import ScheduleIndex from './components/Schedules/Index';

export const componentMap = {
    UsersIndex,
    EmployeesIndex,
    ManagersIndex,
    RolesIndex,
    TeamsIndex,
    ScheduleIndex,
    PostsIndex,
    AppSettings,
    AppModules,
};

export default componentMap;