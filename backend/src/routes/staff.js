const express = require('express');
const router = express.Router();

router.get('/dashboard', (req, res) => {
    const user = req.session.user;
    console.log('Staff dashboard session:', user);

    if (!user) {
        return res.status(401).json({ message: 'Unauthorized - no session' });
    }

    const allowedRoles = ['staff', 'manager'];
    if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: 'Forbidden - invalid role' });
    }

    return res.json({
        message: 'Welcome to Staff Portal',
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
        }
    });
});

module.exports = router;
