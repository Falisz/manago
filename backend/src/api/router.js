// BACKEND/api/router.js
import express from 'express';
import appRoutes from './app.js';
import authRoutes from './auth.js';
import usersRoutes from './users.js';
import rolesRoutes from './roles.js';
import teamsRoutes from './teams.js';
import projectsRoutes from './projects.js';
import branchesRoutes from './branches.js'
import schedulesRoutes from './schedules.js';
import jobPostsRoutes from './job-posts.js';
import shiftRoutes from './shifts.js';
import leaveRoutes from './leaves.js';
import holidaysRoutes from './holidays.js';
import requestStatusRoutes from './request-statuses.js';
import postsRoutes from './posts.js';
import checkAuthHandler from '../utils/checkAuth.js';

const router = express.Router();

const publicPaths = ['/', '/config', '/config-options', '/modules', '/pages', '/auth', '/logout'];

router.use((req, res, next) => {
    if (publicPaths.includes(req.path))
        return next();

    return checkAuthHandler(req, res, next);
});

// Base routes (authentication, app info, etc.)
router.use('/', appRoutes);
router.use('/', authRoutes);

// Resource routes
router.use('/users', usersRoutes);
router.use('/roles', rolesRoutes);
router.use('/teams', teamsRoutes);
router.use('/projects', projectsRoutes);
router.use('/branches', branchesRoutes);
router.use('/schedules', schedulesRoutes);
router.use('/job-posts', jobPostsRoutes);
router.use('/shifts', shiftRoutes);
router.use('/request-statuses', requestStatusRoutes);
router.use('/leaves', leaveRoutes);
router.use('/holidays', holidaysRoutes);
router.use('/posts', postsRoutes);

export default router;
