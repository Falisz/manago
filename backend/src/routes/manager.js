//BACKEND/manager.js
const express = require('express');
const router = express.Router();

const users = {
    staff: { id: 1, username: 'staff', role: 'staff', password: '123', active: true },
    manager: { id: 2, username: 'manager', role: 'manager', password: '123', active: true },
    test: { id: 3, username: 'test', role: 'test', password: '123', active: true },
    test2: { id: 4, username: 'test2', role: 'manager', password: '123', active: false }
};
const allowedRoles = ['admin', 'manager'];

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users[username];

    if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!user.active) {
        return res.status(403).json({ message: 'User inactive.' });
    }

    if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: 'You do not have permission to log in to this portal.' });
    }

    req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
    };

    return res.json({
        message: 'Login successful!',
        user: req.session.user
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid', { path: '/', sameSite: 'lax', httpOnly: true });
        res.json({ message: 'Logged out' });
    });
});

router.get('/access-check', (req, res) => {
    const user = req.session.user;
    console.log('Manager portal session: ', user);

    if (!user) {
        return res.status(401).json({ message: 'Manager Portal - No user.' });
    }

    if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
            message: 'Access denied.',
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            }
        });
    }

    return res.json({
        message: 'Authorisation successful.',
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
        }
    });
});

module.exports = router;
