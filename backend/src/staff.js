//BACKEND/staff.js
const express = require('express');
const router = express.Router();
const {
    findUser,
    validateUser,
    serializeUser,
    checkAccess,
    logoutUser
} = require('./auth');

const allowedRoles = [1, 2, 3];

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await findUser(username);

        const validation = await validateUser(user, password, allowedRoles);

        if (!validation.valid) {
            return res.status(validation.status).json({ message: validation.message });
        }

        const sessionUser = serializeUser(user);
        req.session.user = sessionUser;

        return res.json({
            message: 'Login successful!',
            user: sessionUser
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Server error.' });
    }
});

router.get('/logout', (req, res) => {
    logoutUser(req, res);
});

router.get('/access-check', async(req, res) => {
    const result = await checkAccess(req, allowedRoles);

    if (!result.access) {
        return res.status(result.status).json({
            message: result.message,
            user: result.user || null
        });
    }

    return res.json({
        message: 'Authorization successful.',
        user: result.user
    });
});

module.exports = router;
