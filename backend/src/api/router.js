// BACKEND/api/router.js
import express from 'express';
import appRoutes from './app.js';
import usersRoutes from './users.js';
import rolesRoutes from './roles.js';
import teamsRoutes from './teams.js';
import projectsRoutes from './projects.js';
import branchesRoutes from './branches.js'
import schedulesRoutes from './schedules.js';
import jobPostsRoutes from './jobPosts.js';
import shiftRoutes from './shifts.js';
import leaveRoutes from './leaves.js';
import leaveTypesRoutes from './leaveTypes.js';
import holidaysRoutes from './holidays.js';
import holidayWorkingsRoutes from './holidayWorkings.js';
import weekendWorkingsRoutes from "./weekendWorkings.js";
import requestStatusRoutes from './requestStatuses.js';
import postsRoutes from './posts.js';
import checkJwtHandler from './checkJwt.js';

const router = express.Router();

const publicRules = [
    { path: '/', methods: ['GET'] },
    { path: '/config', methods: ['GET'] },
    { path: '/modules', methods: ['GET'] },
    { path: '/pages', methods: ['GET'] },
    { path: '/auth', methods: ['GET', 'POST'] }
];


router.use((req, res, next) => {
    const isPublic = publicRules.some(rule =>
        rule.path === req.path &&
        rule.methods.includes(req.method)
    );

    if (isPublic)
        return next();

    return checkJwtHandler(req, res, next);
});


// Base routes (authentication, app info, etc.)
router.use('/', appRoutes);

// Resource routes
router.use('/users', usersRoutes);
// TODO: Add Contracts API routes.
router.use('/roles', rolesRoutes);
router.use('/teams', teamsRoutes);
router.use('/projects', projectsRoutes);
router.use('/branches', branchesRoutes);
router.use('/schedules', schedulesRoutes);
router.use('/job-posts', jobPostsRoutes);
router.use('/shifts', shiftRoutes);
router.use('/leave-types', leaveTypesRoutes);
router.use('/request-statuses', requestStatusRoutes);
router.use('/leaves', leaveRoutes);
router.use('/holidays', holidaysRoutes);
router.use('/holiday-workings', holidayWorkingsRoutes);
router.use('/weekend-workings', weekendWorkingsRoutes);
router.use('/posts', postsRoutes);

export default router;