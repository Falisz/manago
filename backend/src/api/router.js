// BACKEND/api/router.js
import express from 'express';
import appRoutes from './app.js';
import authRoutes from './auth.js';
import usersRoutes from './users.js';
import rolesRoutes from './roles.js';
import teamsRoutes from './teams.js';
import holidaysRoutes from './holidays.js';
import postsRoutes from './posts.js';

const router = express.Router();

// Base routes (authentication, app info, etc.)
router.use('/', appRoutes);
router.use('/', authRoutes);

// Resource routes
router.use('/users', usersRoutes);
router.use('/roles', rolesRoutes);
router.use('/teams', teamsRoutes);
router.use('/holidays', holidaysRoutes);
router.use('/posts', postsRoutes);

export default router;
