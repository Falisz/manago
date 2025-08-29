//FRONTEND/Components.js
import InWorks from './components/InWorks';

import PostsIndex from './components/Posts/Index';
import UsersIndex from './components/Users/Index';
import UserEdit from './components/Users/Edit';
import RolesIndex from './components/Roles/Index';

const Dashboard = () => <InWorks title={'Dashboard'} icon={'dashboard'}/>;
const Schedule = () => <InWorks title={'Schedule'} icon={'schedule'}/>;
const Trainings = () => <InWorks title={'Trainings'} icon={'school'} />;
const Dispositions = () => <InWorks title={'Dispositions Dispositions'} icon={'punch_clock'} />;
const ManagerDashboard = () => <InWorks title={'Manager Dashboard'} icon={'dashboard'} />;
const TeamsIndex = () => <InWorks 
    title={'Teams'}
    icon={'groups'}
    description={"There will be a table of teams with following collumns: team names, codename, managers and teamleaders. If the branch and projects modules are enabled they are also gonna be present there."} 
/>;
const BranchIndex = () => <InWorks title={'Branches'} icon={'graph_3'} />;
const ProjectIndex = () => <InWorks title={'Projects'} icon={'fact_check'} />;
const ScheduleShow = () => <InWorks title={'Work schedule'} icon={'schedule'} />;
const SchedulePast = () => <InWorks title={'Work schedule archive'} icon={'archive'} />;
const PostsArchive = () => <InWorks title={'Posts archive'} icon={'archive'}/>;

export const componentMap = {
    Dashboard,
    Schedule,
    Trainings,
    Dispositions,
    ManagerDashboard,
    RolesIndex,
    TeamsIndex,
    BranchIndex,
    ProjectIndex,
    ScheduleShow,
    SchedulePast,
    PostsIndex,
    PostsArchive,
    UsersIndex,
    UserEdit,
};

export default componentMap;