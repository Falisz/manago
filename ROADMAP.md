Following roadmap and tasks to-do.
# MVP
### Optimization
- Fewer Requests: Upon auth, fetch all the UI data like leaveTypes, jobPosts as well as logged-in related user data such as: Teams, Reportees, Managers,
### Permissions
- Roles and/or Permission based security restrictions to the API endpoints in the backend. - in progress
- Implement Roles and/or Permission based restrictions over the UI.
### UI
- Fix Styling
- Organization dashboard: add proper listings, add managers/team-leaders listings, att button styled Go to buttons
- Change Timesheet and Leave Dashboards main style from grid to flex with columns
- Staff and Manager Home Dashboards: shortcuts and all


# MVP ENDS HERE
### TimeSheets and Labor
- Timesheets preview interface. To help count and bill the projects and summarize labor of a user.
- Separate views for Project Timesheets and User Timesheets.
### Branches and Regions
- Different logo per branch (?) e.g., if a Users is from Branches One, they have a diff logo than the user from Branches Two.
- Teams nor Users cannot be assigned to Teams across different branches. Same with a Manager reporting system.
- Branches-Teams assignment — if a Teams has null for a Branches, it is considered as a cross-branch Teams and can be a parent team of teams across different branches.
- Regions for different LeaveTypes, Contracts, Etc. Region to be a large physical grouping (larger than branches)
- If a LeaveType, Contract or Holiday does not have specified Region field it means that the said option is available globally.
- Regions is a separate app-module that shares the tab with branches in the front UI.
### Employee Contracts
- Frontend and Backend implementation for Contracts, Contract Types and User-Contract assignments.
### Work Planner
- Jobs and Months Schedules.
- Dispo Planner - yet separate editor.
- Dispositions and DispoPresets.
- App Settings with configs like enabling job locations and job posts.
- Shift Templates - for example, a shift template for a full-time employee.
- Schedule exporting and importing to Excel
- AutoSaving in the Schedule Editor
- Shifts Palette in the Schedule Editor
- If shrinking date range in currently defined schedule draft with shifts planned, those shifts will be removed once Schedule is saved. Respective warning in UI.
- When Publishing schedule two verifications check, first for the labor law, define in module's config and the second for existing shifts for the given users and dates in scope. Only then the option with "overwriting" to show up.
- Performance limits in place - no larger scope than 31 days and 100 users.
### TimeSheets and Labor
- Attendance marking, possible to map with on-promises badges clocking if using the same user Ids. Clocking-in and out, and breaks tracking, work reporting, tardiness reporting. Capping timesheet time with attendance filled.
- Monthly time reports for employees and projects.
- Option for both employees and managers to autofill the timesheet based on published schedule.
### Tasks
- per Users, Shift, Branches, Project, company-wide.
- typical tasks, motivation KPI contests for branches/teams/projects/users, etc.
### Posts and channels
- Posts-Channels will have scopes to specify whether it is company-wide, branch-wide, region-wide, project-wide or team.
### Skills, Trainings and Assessments
- TBD
### Files and Policies
- TBD
### Blogs
- TBD
### Goals and KPIs
- TBD
