// BACKEND/models/index.js
import Absence from './Absence.js';
import AbsenceBalance from './AbsenceBalance.js';
import AppAuditLog from './AppAuditLog.js';
import AppConfig from './AppConfig.js';
import AppModule from './AppModule.js';
import AppPage from './AppPage.js';
import AppSecurityLog from './AppSecurityLog.js';
import Branch from './Branch.js';
import BranchRole from './BranchRole.js';
import BranchUser from './BranchUser.js';
import Channel from './Channel.js';
import Disposition from './Disposition.js';
import DispositionPreset from './DispositionPreset.js';
import Holiday from './Holiday.js';
import HolidayWorking from './HolidayWorking.js';
import JobPost from './JobPost.js';
import JobLocation from './JobLocation.js';
import LeaveType from './LeaveType.js';
import Post from './Post.js';
import Permission from './Permission.js';
import Project from './Project.js';
import ProjectUser from './ProjectUser.js';
import RequestStatus from './RequestStatus.js';
import Role from './Role.js';
import RolePermission from './RolePermission.js';
import Schedule from './Schedule.js';
import Shift from './Shift.js';
import Team from './Team.js';
import TeamRole from './TeamRole.js';
import TeamUser from './TeamUser.js';
import TimeRecord from './TimeRecord.js';
import User from './User.js';
import UserManager from './UserManager.js';
import UserPermission from './UserPermission.js';
import UserRole from './UserRole.js';
import WeekendWorking from './WeekendWorking.js';

// AppModule <-> AppConfig
AppModule.hasMany(AppConfig, { foreignKey: 'module', sourceKey: 'id', as: 'AuditLogs' });
AppConfig.belongsTo(AppModule, { foreignKey: 'module', targetKey: 'id', as: 'User' });
//
// User <-> AppAuditLog
User.hasMany(AppAuditLog, { foreignKey: 'user', sourceKey: 'id', as: 'AuditLogs' });
AppAuditLog.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'User' });
//
// User <-> AppSecurityLog
User.hasMany(AppSecurityLog, { foreignKey: 'user', sourceKey: 'id', as: 'SecurityLogs' });
AppSecurityLog.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'User' });

// Branch <-> BranchUser
Branch.hasMany(BranchUser, { foreignKey: 'branch', sourceKey: 'id' });
BranchUser.belongsTo(Branch, { foreignKey: 'branch', targetKey: 'id' });
//
// User <-> BranchUser
User.hasMany(BranchUser, { foreignKey: 'user', sourceKey: 'id' });
BranchUser.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });
//
// BranchRole <-> BranchUser
BranchRole.hasMany(BranchUser, { foreignKey: 'role', sourceKey: 'id' });
BranchUser.belongsTo(BranchRole, { foreignKey: 'role', targetKey: 'id' });
//
// Branch <-> Channel
Branch.hasMany(Channel, { foreignKey: 'branch', sourceKey: 'id' });
Channel.belongsTo(Branch, { foreignKey: 'branch', targetKey: 'id' });
//
// Project <-> Channel
Project.hasMany(Channel, { foreignKey: 'project', sourceKey: 'id' });
Channel.belongsTo(Project, { foreignKey: 'project', targetKey: 'id' });
//
// Team <-> Channel
Team.hasMany(Channel, { foreignKey: 'team', sourceKey: 'id' });
Channel.belongsTo(Team, { foreignKey: 'team', targetKey: 'id' });
//
// Role <-> Channel
Role.hasMany(Channel, { foreignKey: 'role', sourceKey: 'id' });
Channel.belongsTo(Role, { foreignKey: 'role', targetKey: 'id' });
//
// Channel <-> Channel (self-referential)
Channel.hasMany(Channel, { foreignKey: 'channel', sourceKey: 'id', as: 'ChildChannels' });
Channel.belongsTo(Channel, { foreignKey: 'channel', targetKey: 'id', as: 'ParentChannel' });
//
// User <-> Post (author)
User.hasMany(Post, { foreignKey: 'author', sourceKey: 'id', as: 'Posts' });
Post.belongsTo(User, { foreignKey: 'author', targetKey: 'id', as: 'Author' });
//
// Channel <-> Post
Channel.hasMany(Post, { foreignKey: 'channel', sourceKey: 'id' });
Post.belongsTo(Channel, { foreignKey: 'channel', targetKey: 'id' });
//
// User <-> Project (manager)
User.hasMany(Project, { foreignKey: 'manager', sourceKey: 'id', as: 'ManagedProjects' });
Project.belongsTo(User, { foreignKey: 'manager', targetKey: 'id', as: 'Manager' });
//
// Project <-> ProjectUser
Project.hasMany(ProjectUser, { foreignKey: 'project', sourceKey: 'id' });
ProjectUser.belongsTo(Project, { foreignKey: 'project', targetKey: 'id' });
//
// User <-> ProjectUser
User.hasMany(ProjectUser, { foreignKey: 'user', sourceKey: 'id' });
ProjectUser.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });
//
// Team <-> Team (optional, self-referential parent-child)
Team.hasMany(Team, { foreignKey: 'parent_team', as: 'ChildTeams' });
Team.belongsTo(Team, { foreignKey: 'parent_team', as: 'ParentTeam' });
//
// Team <-> Project (optional)
Project.hasMany(Team, { foreignKey: 'project', sourceKey: 'id' });
Team.belongsTo(Project, { foreignKey: 'project', targetKey: 'id' });
//
// Team <-> Branch (optional)
Branch.hasMany(Team, { foreignKey: 'branch', sourceKey: 'id' });
Team.belongsTo(Branch, { foreignKey: 'branch', targetKey: 'id' });
//
// Team <-> TeamUser
Team.hasMany(TeamUser, { foreignKey: 'team', sourceKey: 'id' });
TeamUser.belongsTo(Team, { foreignKey: 'team', targetKey: 'id' });
//
// User <-> TeamUser
User.hasMany(TeamUser, { foreignKey: 'user', sourceKey: 'id' });
TeamUser.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });
//
// TeamRole <-> TeamUser
TeamRole.hasMany(TeamUser, { foreignKey: 'role', sourceKey: 'id' });
TeamUser.belongsTo(TeamRole, { foreignKey: 'role', targetKey: 'id' });
//
// User <-> UserManager (as managed user)
User.hasMany(UserManager, { foreignKey: 'user', sourceKey: 'id', as: 'ManagedUsers' });
UserManager.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'User' });
//
// User <-> UserManager (as manager)
User.hasMany(UserManager, { foreignKey: 'manager', sourceKey: 'id', as: 'Managers' });
UserManager.belongsTo(User, { foreignKey: 'manager', targetKey: 'id', as: 'Manager' });
//
// User <-> UserRole
User.hasMany(UserRole, { foreignKey: 'user', sourceKey: 'id' });
UserRole.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });
//
// Role <-> UserRole
Role.hasMany(UserRole, { foreignKey: 'role', sourceKey: 'id' });
UserRole.belongsTo(Role, { foreignKey: 'role', targetKey: 'id' });
//
// User <-> UserPermission
User.hasMany(UserPermission, { foreignKey: 'user', sourceKey: 'id' });
UserPermission.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });
//
// Permission <-> UserPermission
Permission.hasMany(UserPermission, { foreignKey: 'permission', sourceKey: 'id' });
UserPermission.belongsTo(Permission, { foreignKey: 'permission', targetKey: 'id' });
//
// Role <-> RolePermission
Role.hasMany(RolePermission, { foreignKey: 'role', sourceKey: 'id' });
RolePermission.belongsTo(Role, { foreignKey: 'role', targetKey: 'id' });
//
// Permission <-> RolePermission
Permission.hasMany(RolePermission, { foreignKey: 'permission', sourceKey: 'id' });
RolePermission.belongsTo(Permission, { foreignKey: 'permission', targetKey: 'id' });
//
// User <-> Shift
User.hasMany(Shift, { foreignKey: 'user', sourceKey: 'id' });
Shift.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });
//
// JobPost <-> Shift
JobPost.hasMany(Shift, { foreignKey: 'job_post', sourceKey: 'id' });
Shift.belongsTo(JobPost, { foreignKey: 'job_post', targetKey: 'id' });
//
// JobPost <-> Shift
JobLocation.hasMany(Shift, { foreignKey: 'job_location', sourceKey: 'id' });
Shift.belongsTo(JobLocation, { foreignKey: 'job_location', targetKey: 'id' });
//
// Schedule <-> Shift
Schedule.hasMany(Shift, { foreignKey: 'schedule', sourceKey: 'id' });
Shift.belongsTo(Schedule, { foreignKey: 'schedule', targetKey: 'id' });
//
// LeaveType <-> LeaveType
LeaveType.hasMany(LeaveType, { foreignKey: 'parent_type', sourceKey: 'id', as: 'SubType' });
LeaveType.belongsTo(LeaveType, { foreignKey: 'parent_type', targetKey: 'id', as: 'ParentType' });
//
// LeaveType <-> Absence
LeaveType.hasMany(Absence, { foreignKey: 'type', sourceKey: 'id' });
Absence.belongsTo(LeaveType, { foreignKey: 'type', targetKey: 'id' });
//
// User <-> Absence (user)
User.hasMany(Absence, { foreignKey: 'user', sourceKey: 'id' });
Absence.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });
//
// User <-> Absence (approver)
User.hasMany(Absence, { foreignKey: 'approver', sourceKey: 'id', as: 'LeavesApproved' });
Absence.belongsTo(User, { foreignKey: 'approver', targetKey: 'id', as: 'Approver' });
//
// RequestStatus <-> Absence
RequestStatus.hasMany(Absence, { foreignKey: 'status', sourceKey: 'id' });
Absence.belongsTo(RequestStatus, { foreignKey: 'status', targetKey: 'id' });
//
// User <-> HolidayWorking (user)
User.hasMany(HolidayWorking, { foreignKey: 'user', sourceKey: 'id', as: 'HolidayWorkingsRequested' });
HolidayWorking.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'HolidayWorkingUser' });
//
// User <-> HolidayWorking (approver)
User.hasMany(HolidayWorking, { foreignKey: 'approver', sourceKey: 'id', as: 'HolidayWorkingsApproved' });
HolidayWorking.belongsTo(User, { foreignKey: 'approver', targetKey: 'id', as: 'HolidayWorkingApprover' });
//
// Holiday <-> HolidayWorking
Holiday.hasMany(HolidayWorking, { foreignKey: 'holiday', sourceKey: 'id' });
HolidayWorking.belongsTo(Holiday, { foreignKey: 'holiday', targetKey: 'id' });
//
// RequestStatus <-> HolidayWorking
RequestStatus.hasMany(HolidayWorking, { foreignKey: 'status', sourceKey: 'id' });
HolidayWorking.belongsTo(RequestStatus, { foreignKey: 'status', targetKey: 'id' });
//
// User <-> WeekendWorking (user)
User.hasMany(WeekendWorking, { foreignKey: 'user', sourceKey: 'id', as: 'WeekendWorkingsRequested' });
WeekendWorking.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'WeekendWorkingUser' });
//
// User <-> WeekendWorking (approver)
User.hasMany(WeekendWorking, { foreignKey: 'approver', sourceKey: 'id', as: 'WeekendWorkingsApproved' });
WeekendWorking.belongsTo(User, { foreignKey: 'approver', targetKey: 'id', as: 'WeekendWorkingApprover' });
//
// RequestStatus <-> WeekendWorking
RequestStatus.hasMany(WeekendWorking, { foreignKey: 'status', sourceKey: 'id' });
WeekendWorking.belongsTo(RequestStatus, { foreignKey: 'status', targetKey: 'id' });
//
// User <-> Disposition
User.hasMany(Disposition, { foreignKey: 'user', sourceKey: 'id', as: 'Dispositions' });
Disposition.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'User' });
//
// DispositionPreset <-> Disposition
DispositionPreset.hasMany(Disposition, { foreignKey: 'preset', sourceKey: 'id' });
Disposition.belongsTo(DispositionPreset, { foreignKey: 'preset', targetKey: 'id' });
//
// User <-> Absence
User.hasMany(Absence, { foreignKey: 'user', sourceKey: 'id', as: 'User' });
Absence.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'User' });
//
// LeaveType <-> Absence
LeaveType.hasMany(Absence, { foreignKey: 'type', sourceKey: 'id' });
Absence.belongsTo(LeaveType, { foreignKey: 'type', targetKey: 'id' });

export {
    Absence, AbsenceBalance, AppAuditLog, AppConfig, AppModule, AppSecurityLog, AppPage, Branch, BranchRole, BranchUser,
    Channel, Disposition, DispositionPreset, Holiday, HolidayWorking, JobPost, JobLocation, LeaveType, Post,
    Permission, Project, ProjectUser, RequestStatus, Role, RolePermission, Schedule, Shift, Team, TeamRole, TeamUser,
    TimeRecord, User, UserManager, UserPermission, UserRole, WeekendWorking
}