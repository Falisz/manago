// BACKEND/controllers/index.js
import {getConfig, setConfig, getConfigOptions} from './app/AppConfig.js';
import {getModules, setModule} from './app/AppModule.js';
import {getPages} from './app/AppPage.js';
import {getBranch, createBranch, updateBranch, deleteBranch} from './organization/Branch.js';
import {getBranchUsers, updateBranchUsers} from './organization/BranchUser.js';
import {getProject, createProject, updateProject, deleteProject} from './organization/Project.js';
import {getProjectUsers,updateProjectUsers} from './organization/ProjectUser.js';
import {getTeam, createTeam, updateTeam, deleteTeam} from './organization/Team.js';
import {getTeamUsers, updateTeamUsers} from './organization/TeamUser.js';
import {getPost, createPost, updatePost, deletePost} from './posts/Post.js';
import {getContract, createContract, updateContract, deleteContract} from './user/Contract.js';
import {getContractType, createContractType, updateContractType, deleteContractType} from './user/ContractType.js';
import {getPermission, getRolePermissions, getUserPermissions} from './user/Permission.js';
import {getRole, createRole, updateRole, deleteRole} from './user/Role.js';
import {getUser, createUser, updateUser, removeUser, authUser} from './user/User.js';
import {getUserRoles, updateUserRoles} from './user/UserRole.js';
import {getUserManagers, updateUserManagers} from './user/UserManager.js';
import {getAbsence, createAbsence, updateAbsence, deleteAbsence} from './workPlanner/Absence.js';
import {getAbsenceBalance, updateAbsenceBalance} from './workPlanner/AbsenceBalance.js';
import {getAbsenceType, createAbsenceType, updateAbsenceType, deleteAbsenceType} from './workPlanner/AbsenceType.js';
import {getDisposition, createDisposition, updateDisposition, deleteDisposition} from './workPlanner/Disposition.js';
import {getDispositionPreset, createDispositionPreset, updateDispositionPreset, deleteDispositionPreset}
    from "./workPlanner/DispositionPreset.js";
import {getHoliday, createHoliday, updateHoliday, deleteHoliday} from './workPlanner/Holiday.js';
import {getHolidayWorking, createHolidayWorking, updateHolidayWorking, deleteHolidayWorking} from
        './workPlanner/HolidayWorking.js';
import {getJobLocation, createJobLocation, updateJobLocation, deleteJobLocation} from './workPlanner/JobLocation.js';
import {getJobPost, createJobPost, updateJobPost, deleteJobPost} from './workPlanner/JobPost.js';
import {getRequestStatus} from './workPlanner/RequestStatus.js';
import {getShift, createShift, updateShift, deleteShift} from './workPlanner/Shift.js';
import {getWeekendWorking, createWeekendWorking, updateWeekendWorking, deleteWeekendWorking}
    from "./workPlanner/WeekendWorking.js";
import {getSchedule, createSchedule, updateSchedule, deleteSchedule} from "#controllers/workPlanner/Schedule";

export {
    getConfig, setConfig, getConfigOptions, getModules, setModule, getPages,
    getBranch, createBranch, updateBranch, deleteBranch,
    getBranchUsers, updateBranchUsers,
    getProject, createProject, updateProject, deleteProject,
    getProjectUsers, updateProjectUsers,
    getTeam, createTeam, updateTeam, deleteTeam,
    getTeamUsers, updateTeamUsers,
    getPost, createPost, updatePost, deletePost,
    getContract, createContract, updateContract, deleteContract,
    getContractType, createContractType, updateContractType, deleteContractType,
    getPermission, getRolePermissions, getUserPermissions,
    getRole, createRole, updateRole, deleteRole,
    getUser, createUser, updateUser, removeUser, authUser,
    getUserRoles, updateUserRoles,
    getUserManagers, updateUserManagers,
    getAbsence, createAbsence, updateAbsence, deleteAbsence,
    getAbsenceBalance, updateAbsenceBalance,
    getAbsenceType, createAbsenceType, updateAbsenceType, deleteAbsenceType,
    getDisposition, createDisposition, updateDisposition, deleteDisposition,
    getDispositionPreset, createDispositionPreset, updateDispositionPreset, deleteDispositionPreset,
    getHoliday, createHoliday, updateHoliday, deleteHoliday,
    getHolidayWorking, createHolidayWorking, updateHolidayWorking, deleteHolidayWorking,
    getJobLocation, createJobLocation, updateJobLocation, deleteJobLocation,
    getJobPost, createJobPost, updateJobPost, deleteJobPost,
    getRequestStatus,
    getShift, createShift, updateShift, deleteShift,
    getSchedule, createSchedule, updateSchedule, deleteSchedule,
    getWeekendWorking, createWeekendWorking, updateWeekendWorking, deleteWeekendWorking
};