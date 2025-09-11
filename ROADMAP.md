Following roadmap and tasks to-do as of 2025-09-10:
### Frontend
- [ ] General app behaviour
  - [ ] Unifying and use of Button component app wide.
  - [ ] Right-Click custom menu.
  - [ ] Implement role and permission based restrictions over the UI.
- [ ] User management
  - [ ] Selection feature in the user lists with actions like delete, assign Role, assign Manager, assign Reporting User etc.
- [ ] Teams
  - [ ] Team edit form (to include: team's code-name, display name, managers and team-leaders selectors.
  - [ ] Create save and delete methods in the useTeam hook.
  - [ ] Team assignment form.
- [ ] Branches
  - [ ] Different logo per branch (?) e.g. if User is from Branch One they have diff logo than the user from Branch Two.
  - [ ] Teams nor Users cannot be assigned to Teams across different branches. Same with Manager reporting system.
  - [ ] Branch-Team assignment - if Team has null for a Branch it is considered as cross-branch Team and can be a parent team of teams across different branches.
- [ ] Projects
- [ ] Timesheets
- [ ] Schedules
- [ ] Leaves
- [ ] Tasks
- [ ] Posts and channels
  - [ ] Post Channels will have scopes to specify whether it is company-wide, branch-wide, region-wide, project-wide or team.
### Backend
- [ ] API endpoints and controllers for create, edit, delete and assign operations on Team resources.
- [ ] API endpoints and controllers for bulk operations User, Role and Team resources.
- [ ] Role and/or Permission based security restrictions to the API endpoints.
- [ ] Making API be more RESTful.