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
import Contract from "./Contract.js";
import ContractType from "./ContractType.js";
import Disposition from './Disposition.js';
import DispositionPreset from './DispositionPreset.js';
import Holiday from './Holiday.js';
import HolidayWorking from './HolidayWorking.js';
import JobPost from './JobPost.js';
import JobLocation from './JobLocation.js';
import AbsenceType from './AbsenceType.js';
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
import TimeRecordStatus from "./TimeRecordStatus.js";
import User from './User.js';
import UserManager from './UserManager.js';
import UserPermission from './UserPermission.js';
import UserRole from './UserRole.js';
import WeekendWorking from './WeekendWorking.js';

AppModule.hasMany(AppConfig, { foreignKey: 'module', sourceKey: 'id', as: 'AuditLogs' });
AppConfig.belongsTo(AppModule, { foreignKey: 'module', targetKey: 'id', as: 'User' });

User.hasMany(AppAuditLog, { foreignKey: 'user', sourceKey: 'id', as: 'AuditLogs' });
AppAuditLog.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'User' });

User.hasMany(AppSecurityLog, { foreignKey: 'user', sourceKey: 'id', as: 'SecurityLogs' });
AppSecurityLog.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'User' });

Branch.hasMany(BranchUser, { foreignKey: 'branch', sourceKey: 'id' });
BranchUser.belongsTo(Branch, { foreignKey: 'branch', targetKey: 'id' });

User.hasMany(BranchUser, { foreignKey: 'user', sourceKey: 'id' });
BranchUser.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });

BranchRole.hasMany(BranchUser, { foreignKey: 'role', sourceKey: 'id' });
BranchUser.belongsTo(BranchRole, { foreignKey: 'role', targetKey: 'id' });

Branch.hasMany(Channel, { foreignKey: 'branch', sourceKey: 'id' });
Channel.belongsTo(Branch, { foreignKey: 'branch', targetKey: 'id' });

Project.hasMany(Channel, { foreignKey: 'project', sourceKey: 'id' });
Channel.belongsTo(Project, { foreignKey: 'project', targetKey: 'id' });

Team.hasMany(Channel, { foreignKey: 'team', sourceKey: 'id' });
Channel.belongsTo(Team, { foreignKey: 'team', targetKey: 'id' });

Role.hasMany(Channel, { foreignKey: 'role', sourceKey: 'id' });
Channel.belongsTo(Role, { foreignKey: 'role', targetKey: 'id' });

Channel.hasMany(Channel, { foreignKey: 'channel', sourceKey: 'id', as: 'ChildChannels' });
Channel.belongsTo(Channel, { foreignKey: 'channel', targetKey: 'id', as: 'ParentChannel' });

User.hasMany(Post, { foreignKey: 'author', sourceKey: 'id', as: 'Posts' });
Post.belongsTo(User, { foreignKey: 'author', targetKey: 'id', as: 'Author' });

Channel.hasMany(Post, { foreignKey: 'channel', sourceKey: 'id' });
Post.belongsTo(Channel, { foreignKey: 'channel', targetKey: 'id' });

User.hasMany(Project, { foreignKey: 'manager', sourceKey: 'id', as: 'ManagedProjects' });
Project.belongsTo(User, { foreignKey: 'manager', targetKey: 'id', as: 'Manager' });

Project.hasMany(ProjectUser, { foreignKey: 'project', sourceKey: 'id' });
ProjectUser.belongsTo(Project, { foreignKey: 'project', targetKey: 'id' });

User.hasMany(ProjectUser, { foreignKey: 'user', sourceKey: 'id' });
ProjectUser.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });

Team.hasMany(Team, { foreignKey: 'parent_team', as: 'ChildTeams' });
Team.belongsTo(Team, { foreignKey: 'parent_team', as: 'ParentTeam' });

Project.hasMany(Team, { foreignKey: 'project', sourceKey: 'id' });
Team.belongsTo(Project, { foreignKey: 'project', targetKey: 'id' });

Branch.hasMany(Team, { foreignKey: 'branch', sourceKey: 'id' });
Team.belongsTo(Branch, { foreignKey: 'branch', targetKey: 'id' });

Team.hasMany(TeamUser, { foreignKey: 'team', sourceKey: 'id' });
TeamUser.belongsTo(Team, { foreignKey: 'team', targetKey: 'id' });

User.hasMany(TeamUser, { foreignKey: 'user', sourceKey: 'id' });
TeamUser.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });

TeamRole.hasMany(TeamUser, { foreignKey: 'role', sourceKey: 'id' });
TeamUser.belongsTo(TeamRole, { foreignKey: 'role', targetKey: 'id' });

User.hasMany(UserManager, { foreignKey: 'user', sourceKey: 'id', as: 'ManagedUsers' });
UserManager.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'User' });

User.hasMany(UserManager, { foreignKey: 'manager', sourceKey: 'id', as: 'Managers' });
UserManager.belongsTo(User, { foreignKey: 'manager', targetKey: 'id', as: 'Manager' });

User.hasMany(UserRole, { foreignKey: 'user', sourceKey: 'id' });
UserRole.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });

Role.hasMany(UserRole, { foreignKey: 'role', sourceKey: 'id' });
UserRole.belongsTo(Role, { foreignKey: 'role', targetKey: 'id' });

User.hasMany(UserPermission, { foreignKey: 'user', sourceKey: 'id' });
UserPermission.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });

Permission.hasMany(UserPermission, { foreignKey: 'permission', sourceKey: 'id' });
UserPermission.belongsTo(Permission, { foreignKey: 'permission', targetKey: 'id' });

Role.hasMany(RolePermission, { foreignKey: 'role', sourceKey: 'id' });
RolePermission.belongsTo(Role, { foreignKey: 'role', targetKey: 'id' });

Permission.hasMany(RolePermission, { foreignKey: 'permission', sourceKey: 'id' });
RolePermission.belongsTo(Permission, { foreignKey: 'permission', targetKey: 'id' });

User.hasMany(Shift, { foreignKey: 'user', sourceKey: 'id' });
Shift.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });

JobPost.hasMany(Shift, { foreignKey: 'job_post', sourceKey: 'id' });
Shift.belongsTo(JobPost, { foreignKey: 'job_post', targetKey: 'id' });

JobLocation.hasMany(Shift, { foreignKey: 'job_location', sourceKey: 'id' });
Shift.belongsTo(JobLocation, { foreignKey: 'job_location', targetKey: 'id' });

Schedule.hasMany(Shift, { foreignKey: 'schedule', sourceKey: 'id' });
Shift.belongsTo(Schedule, { foreignKey: 'schedule', targetKey: 'id' });

AbsenceType.hasMany(AbsenceType, { foreignKey: 'parent_type', sourceKey: 'id', as: 'SubType' });
AbsenceType.belongsTo(AbsenceType, { foreignKey: 'parent_type', targetKey: 'id', as: 'ParentType' });

AbsenceType.hasMany(Absence, { foreignKey: 'type', sourceKey: 'id' });
Absence.belongsTo(AbsenceType, { foreignKey: 'type', targetKey: 'id' });

User.hasMany(Absence, { foreignKey: 'user', sourceKey: 'id', as: 'Absences' });
Absence.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'User' });

User.hasMany(Absence, { foreignKey: 'approver', sourceKey: 'id', as: 'LeavesApproved' });
Absence.belongsTo(User, { foreignKey: 'approver', targetKey: 'id', as: 'Approver' });

RequestStatus.hasMany(Absence, { foreignKey: 'status', sourceKey: 'id' });
Absence.belongsTo(RequestStatus, { foreignKey: 'status', targetKey: 'id' });

User.hasMany(HolidayWorking, { foreignKey: 'user', sourceKey: 'id', as: 'HolidayWorkingsRequested' });
HolidayWorking.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'HolidayWorkingUser' });

User.hasMany(HolidayWorking, { foreignKey: 'approver', sourceKey: 'id', as: 'HolidayWorkingsApproved' });
HolidayWorking.belongsTo(User, { foreignKey: 'approver', targetKey: 'id', as: 'HolidayWorkingApprover' });

Holiday.hasMany(HolidayWorking, { foreignKey: 'holiday', sourceKey: 'id' });
HolidayWorking.belongsTo(Holiday, { foreignKey: 'holiday', targetKey: 'id' });

RequestStatus.hasMany(HolidayWorking, { foreignKey: 'status', sourceKey: 'id' });
HolidayWorking.belongsTo(RequestStatus, { foreignKey: 'status', targetKey: 'id' });

User.hasMany(WeekendWorking, { foreignKey: 'user', sourceKey: 'id', as: 'WeekendWorkingsRequested' });
WeekendWorking.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'WeekendWorkingUser' });

User.hasMany(WeekendWorking, { foreignKey: 'approver', sourceKey: 'id', as: 'WeekendWorkingsApproved' });
WeekendWorking.belongsTo(User, { foreignKey: 'approver', targetKey: 'id', as: 'WeekendWorkingApprover' });

RequestStatus.hasMany(WeekendWorking, { foreignKey: 'status', sourceKey: 'id' });
WeekendWorking.belongsTo(RequestStatus, { foreignKey: 'status', targetKey: 'id' });

User.hasMany(Disposition, { foreignKey: 'user', sourceKey: 'id', as: 'Dispositions' });
Disposition.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'User' });

DispositionPreset.hasMany(Disposition, { foreignKey: 'preset', sourceKey: 'id' });
Disposition.belongsTo(DispositionPreset, { foreignKey: 'preset', targetKey: 'id' });

AbsenceType.hasMany(Absence, { foreignKey: 'type', sourceKey: 'id' });
Absence.belongsTo(AbsenceType, { foreignKey: 'type', targetKey: 'id' });

User.hasMany(Contract, { foreignKey: 'user', sourceKey: 'id' });
Contract.belongsTo(User, { foreignKey: 'user', targetKey: 'id' });

ContractType.hasMany(Contract, { foreignKey: 'type', sourceKey: 'id' });
Contract.belongsTo(ContractType, { foreignKey: 'type', targetKey: 'id' });

User.hasMany(TimeRecord, { foreignKey: 'user', sourceKey: 'id', as: 'TimeRecords' });
TimeRecord.belongsTo(User, { foreignKey: 'user', targetKey: 'id', as: 'User' });

User.hasMany(TimeRecord, { foreignKey: 'approver', sourceKey: 'id', as: 'ApprovedTimeRecords' });
TimeRecord.belongsTo(User, { foreignKey: 'approver', targetKey: 'id', as: 'Approver' });

Project.hasMany(TimeRecord, { foreignKey: 'project', sourceKey: 'id' });
TimeRecord.belongsTo(Project, { foreignKey: 'project', targetKey: 'id' });

TimeRecordStatus.hasMany(TimeRecord, { foreignKey: 'status', sourceKey: 'id' });
TimeRecord.belongsTo(TimeRecordStatus, { foreignKey: 'status', targetKey: 'id' });

export {
    Absence, AbsenceBalance, AppAuditLog, AppConfig, AppModule, AppSecurityLog, AppPage, Branch, BranchRole, BranchUser,
    Channel, Contract, ContractType, Disposition, DispositionPreset, Holiday, HolidayWorking, JobPost, JobLocation,
    AbsenceType, Post, Permission, Project, ProjectUser, RequestStatus, Role, RolePermission, Schedule, Shift, Team,
    TeamRole, TeamUser, TimeRecord, TimeRecordStatus, User, UserManager, UserPermission, UserRole, WeekendWorking
}