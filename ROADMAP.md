Following roadmap and tasks to-do as of 2025-10-02:
# MVP
## Users
- [ ] Users have contractual data added - time joined compoany, contract types, start and end-dates.
## Permissions
- [ ] Roles and/or Permission based security restrictions to the API endpoints in the backend. - in progress
- [ ] Implement Roles and/or Permission based restrictions over the UI.
## Work Planner
- [ ] Planning roster and/or shift schedules. (Excel importable - provided downloadable template)
- [ ] Planning annual leaves, holidays, comp-offs, sick leaves, etc.
- [ ] Shifts data model (user, startTime, endTime, post)
- [ ] Schedule available for Users/Teams/Branches/Project.
- [ ] Disposition and Leave requests
- [ ] Job Posts data model (optional - i.e. gastronomy or entertainment staff)
- [ ] Many configs related to it
### DESIGN NOTES
- Two subpages in Work Planner:
  - a Schedule page with currently published schedule
  - a Workings Schedules with all WIP schedules authored or available by a given Manager.
- Edit button in the Schedule page creates a copy of the given schedule scope in the frontend and allows a user to edit it - It's only in the frontend and can be either:
  - Published - instantly sends new revision of the shifts to the server replacing the old ones - for given days;
  - Saved - meaning it is saved as a Working Schedule to be later on access from the backend.
- On the Working Schedules there is an option to create a new empty schedule for a given scope of dates and people or edit any existing ones,
- Editing the Published Schedule can be either saved (to a Working Schedule), discarded or published. (Publishing the Working Schedule to replace edited dates.)
- Working Schedule has a set date range, but this can be altered. If shrinking it and reducing dates that already have shifts planned, those shifts will be removed once Schedule is saved.
- Each Working Schedule can be further saved, deleted or published.
- Publishing essentially means the Working Schedules to be deleted and shift in it being 'freed' from Schedule ID to be treated as published - viewable to respectively targeted users.
- In case of conflict in publishing working schedule because there already are some shifts for the specific day published, there are two options:
  - replace - grabs IDs of already existing shifts from conflicting days in scope, and they get removed. Then the shifts get posted.
  - skip - skips the days that currently have existing shifts.
- Performance limits in place - no larger scope than 31 days and 100 users.
- It will also require a new component - Leave Planner - that will be aside an option from Shift schedules and Dispositions just for scheduling eventual Leaves. Leave requests should have one aditional type "planned" meaning it is not yet pending but already can be seen by manager as a plan for a leave.
- Each Shift can also be opened in a detailed mode - and edited or deleted like any other resource. The shift can be reassigned to another person, moved to a different day or time. It can be also individually published or reverted to the working schedule (if there is any authored).
## Timesheets
- [ ] Recorded efforts.
- [ ] Timesheets, work reporting, late reporting.
- [ ] Attendance marking, possible to map with on-promises badges clocking if using the same user Ids.
- [ ] Clocking-in and out.
- [ ] Breaks tracking.
- [ ] Payroll planning.
- [ ] Task entry.
## Branches
- [ ] Different logo per branch (?) e.g., if a Users is from Branches One, they have a diff logo than the user from Branches Two.
- [ ] Teams nor Users cannot be assigned to Teams across different branches. Same with a Manager reporting system.
- [ ] Branches-Teams assignment— if a Teams has null for a Branches, it is considered as a cross-branch Teams and can be a parent team of teams across different branches.
## Projects
- [ ] Project Roles - different from company-wide user roles.
- [ ] Access to different resources.
## Tasks
- [ ] per Users, Shift, Branches, Project, company-wide.
- [ ] typical tasks, motivation KPI contests for branches/teams/projects/users, etc.

# MVP ENDS HERE
## Posts and channels
- [ ] Posts-Channels will have scopes to specify whether it is company-wide, branch-wide, region-wide, project-wide or team.
## Skills, Trainings and Assesments
## Blogs
## Goals and KPIs
