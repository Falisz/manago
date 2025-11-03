//FRONTEND/Components.js
import UsersIndex, {EmployeesIndex, ManagersIndex} from './components/Users/Index';
import RolesIndex from './components/Roles/Index';
import TeamsIndex from './components/Teams/Index';
import PostsIndex from './components/Posts/Index';
import AppSettings from './components/AppSettings';
import AppModules from './components/AppModules';
import WorkPlanner from './components/WorkPlanner/WorkPlanner';
import ScheduleViewer from './components/WorkPlanner/ScheduleViewer';
import ScheduleEditor from './components/WorkPlanner/ScheduleEditor';

export const componentMap = {
    UsersIndex,
    EmployeesIndex,
    ManagersIndex,
    RolesIndex,
    TeamsIndex,
    WorkPlanner,
    ScheduleViewer,
    ScheduleEditor,
    PostsIndex,
    AppSettings,
    AppModules,
};

export default componentMap;