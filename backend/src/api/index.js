// BACKEND/api/index.js
import express from 'express';
import appRoutes from './app.js';
import contractRoutes from './contracts.js';
import contractTypeRoutes from './contractTypes.js';
import userRoutes from './users.js';
import roleRoutes from './roles.js';
import teamRoutes from './teams.js';
import projectRoutes from './projects.js';
import brancheRoutes from './branches.js'
import scheduleRoutes from './schedules.js';
import jobPostRoutes from './jobPosts.js';
import jobLocationRoutes from './jobLocations.js';
import shiftRoutes from './shifts.js';
import leaveRoutes from './leaves.js';
import leaveTypeRoutes from './leaveTypes.js';
import holidayRoutes from './holidays.js';
import holidayWorkingRoutes from './holidayWorkings.js';
import weekendWorkingRoutes from "./weekendWorkings.js";
import requestStatusRoutes from './requestStatuses.js';
import postRoutes from './posts.js';
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
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/teams', teamRoutes);
router.use('/projects', projectRoutes);
router.use('/branches', brancheRoutes);
router.use('/contracts', contractRoutes);
router.use('/contract-types', contractTypeRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/job-posts', jobPostRoutes);
router.use('/job-locations', jobLocationRoutes);
router.use('/shifts', shiftRoutes);
router.use('/leave-types', leaveTypeRoutes);
router.use('/request-statuses', requestStatusRoutes);
router.use('/leaves', leaveRoutes);
router.use('/holidays', holidayRoutes);
router.use('/holiday-workings', holidayWorkingRoutes);
router.use('/weekend-workings', weekendWorkingRoutes);
router.use('/posts', postRoutes);

export default router;