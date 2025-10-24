//FRONTEND/Components.js
import UsersIndex, {EmployeesIndex, ManagersIndex} from './components/Users/Index';
import RolesIndex from './components/Roles/Index';
import TeamsIndex from './components/Teams/Index';
import PostsIndex from './components/Posts/Index';
import AppSettings from './components/AppSettings';
import AppModules from './components/AppModules';
import WorkPlanner from './components/WorkPlanner/WorkPlanner';
import Schedule from './components/WorkPlanner/Schedule';
import ScheduleEditor from './components/WorkPlanner/ScheduleEditor';

export const componentMap = {
    UsersIndex,
    EmployeesIndex,
    ManagersIndex,
    RolesIndex,
    TeamsIndex,
    WorkPlanner,
    Schedule,
    ScheduleEditor,
    PostsIndex,
    AppSettings,
    AppModules,
};

export default componentMap;