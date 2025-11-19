Following roadmap and tasks to-do as of 2025-10-02:
# MVP
### General
- Test out popups for saveResource callbacks.
- Refactor Details, EditForm and Table to be handling each structure field as a prop for more consistency and modularity:
-- destructured and refactored EditForm, double check if it works properly
-- Details and Table to be done
### Work Planner
- Leave Planner - separate component from Schedules Editor and Dispositions Editor, just for scheduling eventual Leaves. Leave requests should have one additional type "planned" meaning it is not yet pending but already can be seen by manager as a plan for a leave. From the Schedule planner those Leaves can be also already marked requested for approval. Need to make and refine eave requests, comp-offs and sick leaves here.
- Dispo Planner - yet separate editor.
- Holidays
- Job Posts and Job Locations separate models (both optionals - i.e. gastronomy or entertainment staff)
- App Settings with configs like enabling job locations and job posts.
- Each Shift to be also opened in a Detailed mode, when clicked in Schedule Viewer. It can be edited or deleted like any other resource. The shift can be reassigned to another person, moved to a different day or time. It can be also individually published or reverted to the working schedule (if there is any authored). Separate useShifts for this.
### Timesheets
- Recorded efforts and labor - to help bill the projects.
- Timesheets - kinds of labor reported with date, start and end time, a comment, user and a type (regulars, on-calls, on-stand-by, overtime, etc.)
- Attendance marking, possible to map with on-promises badges clocking if using the same user Ids.
- Clocking-in and out, and breaks tracking,  work reporting, tardiness reporting.
- Payroll planning.
- Timesheet approval and rejection.
- Option for both employees and managers to autofill the timesheet based on published schedule.
### Projects
- Project Roles - different from company-wide user roles.
- Access to different resources.
### Users
- Users have contractual data added - time joined company, contract types, start and end-dates.
### Permissions
- Roles and/or Permission based security restrictions to the API endpoints in the backend. - in progress
- Implement Roles and/or Permission based restrictions over the UI.
### Branches
- Different logo per branch (?) e.g., if a Users is from Branches One, they have a diff logo than the user from Branches Two.
- Teams nor Users cannot be assigned to Teams across different branches. Same with a Manager reporting system.
- Branches-Teams assignment— if a Teams has null for a Branches, it is considered as a cross-branch Teams and can be a parent team of teams across different branches.
# MVP ENDS HERE
### Work Planner
- Shift Templates - for example, a shift template for a full-time employee.
- Schedule exporting and importing to Excel
- AutoSaving in the Schedule Editor
- Shifts Palette in the Schedule Editor
- If shrinking date range in currently defined schedule draft with shifts planned, those shifts will be removed once Schedule is saved. Respective warning in UI.
- When Publishing schedule two verifications check, first for the labor law, define in module's config and the second for existing shifts for the given users and dates in scope. Only then the option with "overwriting" to show up.
- Performance limits in place - no larger scope than 31 days and 100 users.
### Tasks
- per Users, Shift, Branches, Project, company-wide.
- typical tasks, motivation KPI contests for branches/teams/projects/users, etc.
### Posts and channels
- Posts-Channels will have scopes to specify whether it is company-wide, branch-wide, region-wide, project-wide or team.
### Skills, Trainings and Assessments
### Blogs
### Goals and KPIs
