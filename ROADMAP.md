Following roadmap and tasks to-do as of 2025-09-14:
### Frontend
- [ ] General app behaviour
  - [x] Generalize Details and Edit Form components into templates to be used similarly like Table component.
  - [ ] Use Generalized Edit Form to replace Role Edit, Team Edit, and respective Assignments Edits
  - [ ] Implement role and permission based restrictions over the UI.
- [ ] Users and teams management
  - [ ] Selection feature in the user lists with actions like bulk delete, assign Role and assign Manager
  - [ ] Implement safe lock for Reportees not to be assigned as Managers. 
  - [ ] Assignment form for UserManagers, UserRoles, TeamUsers assignments - both singular and bulk operations.
- [ ] Branches
  - [ ] Different logo per branch (?) e.g., if a User is from Branch One, they have a diff logo than the user from Branch Two.
  - [ ] Teams nor Users cannot be assigned to Teams across different branches. Same with a Manager reporting system.
  - [ ] Branch-Team assignment— if a Team has null for a Branch, it is considered as a cross-branch Team and can be a parent team of teams across different branches.
- [ ] Projects
- [ ] Timesheets
- [ ] Schedules
- [ ] Leaves
- [ ] Tasks
- [ ] Posts and channels
  - [ ] Post-Channels will have scopes to specify whether it is company-wide, branch-wide, region-wide, project-wide or team.
### Backend
- [ ] API endpoints and controllers for create, edit, delete, and assign operations on Team resources.
- [ ] API endpoints and controllers for bulk operations User, Role and Team resources.
- [ ] Role and/or Permission based security restrictions to the API endpoints.
- [ ] Making API endpoint to be more REST-like.