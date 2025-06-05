const express = require('express');
const router = express.Router();

const users = {
    staff: { id: 1, username: 'staff', role: 'staff', password: 'password', active: true },
    manager: { id: 2, username: 'manager', role: 'manager', password: 'password', active: true },
    test: { id: 3, username: 'test', role: 'test', password: 'test', active: true },
    test2: { id: 4, username: 'test2', role: 'manager', password: 'test', active: false }
};

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', { username });
    const user = users[username];
    if (user && password === user.password) {
        if (!user.active) {
            console.log('Login attempt with inactive user:', username);
            return res.status(403).json({ message: 'Your account is not active.' });
        }
        req.session.user = { id: user.id, username: user.username, role: user.role };
        console.log('Login session set:', req.session.user);
        res.json({ message: 'Login successful', role: user.role, user: req.session.user });
    } else {
        console.log('Invalid credentials');
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

router.get('/logout', (req, res) => {
    console.log('Logging out user:', req.session.user);
    req.session.destroy(err => {
        if (err) {
            console.error('Session destroy error:', err);
            return res.status(500).json({ message: 'Logout failed' });
        }
        console.log('Session destroyed successfully');
        res.clearCookie('connect.sid', { path: '/', sameSite: 'lax', httpOnly: true });
        res.json({ message: 'Logged out' });
    });
});

router.get('/check', (req, res) => {
    console.log('Checking session for ID:', req.sessionID, 'User:', req.session.user);
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.status(401).json({ authenticated: false, message: 'Not authenticated' });
    }
});

module.exports = router;
