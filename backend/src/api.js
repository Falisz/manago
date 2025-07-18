//BACKEND/api.js
const express = require('express');
const router = express.Router();
const {
    authUser,
    serializeUser,
    refreshUser,
    checkUserAccess,
    checkManagerAccess,
    setManagerView,
    setNavCollapsed,
    getPages,
    logoutUser,
    getAllUsers,
    getUserById,
    createUser,
    editUser,
    removeUser,
    getAllPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost
} = require('./utils');

// const { LoremIpsum } = require('lorem-ipsum');
// const lorem = new LoremIpsum({
//     sentencesPerParagraph: { max: 10, min: 3 },
//     wordsPerSentence: { max: 16, min: 4 }
// });

router.get('/ping', async (req, res) => {
    try {
        res.json({ connected: true });
    } catch (err) {
        console.error('Ping error:', err);
        res.status(500).json({ connected: false });
    }
});

router.post('/login', async (req, res) => {

    const { username, password } = req.body;

    try {

        const userAuth = await authUser(username, password);

        if (!userAuth.valid)
            return res.status(userAuth.status).json({ message: userAuth.message });

        const sessionUser = serializeUser(userAuth.user.toJSON());

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

router.get('/access', async (req, res) => {
    try {

        if (!req.session) {

            return res.json({
                access: false,
                manager_access: false,
                message: 'No session found.'
            });

        }

        req.session.user = await refreshUser(req.session.user);

        const user = req.session.user;

        if (!user) {

            return res.json({
                access: false,
                manager_access: false,
                message: 'No user found.'
            });

        }

        const userAccess = await checkUserAccess(user);

        if (!userAccess) {

            return res.json({
                access: false,
                manager_access: false,
                message: 'User not active.',
                user: user,
            });

        }

        const managerAccess = await checkManagerAccess(user);

        if (!managerAccess && user.manager_view) {

            await setManagerView(user, false);

            req.session.user.manager_view = false;

            user.manager_view = false;

        }

        return res.json({
            access: true,
            manager_access: managerAccess,
            message: 'Access checkup successful!',
            user: user,
        });

    } catch(err) {

        console.error('Access checkup error:', err);

        return res.status(500).json({
            access: false,
            manager_access: false,
            message: 'Access checkup error!',
            user: null,
        });

    }
});

router.post('/manager-view', async (req, res) => {
    try {

        const {user, manager_view} = req.body;

        await setManagerView(user, manager_view);

        req.session.user.manager_view = manager_view;

        res.json({ success: true, managerView: manager_view });

    } catch (err) {

        console.error('Error changing manager view state:', err);

        res.status(500).json({ success: false, message: 'Server error.' });

    }
});

router.post('/toggle-nav', async (req, res) => {
    try {

        const {user, nav_collapsed} = req.body;

        await setNavCollapsed(user, nav_collapsed);

        req.session.user.manager_view = nav_collapsed;

        res.json({ success: true, navCollapse: nav_collapsed});

    } catch (err) {

        console.error('Error while toggling nav:', err);

        res.status(500).json({ message: 'Server error.' });

    }
});

router.get('/pages', async (req, res) => {
    try {

        const user = req.session.user;

        const pages = await getPages(user);

        res.json(pages);

    } catch (err) {

        console.error('Error fetching pages:', err);

        res.status(500).json({ message: 'Server error.' });

    }
});

router.get('/users', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const users = await getAllUsers();

        res.json(users);

    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});


router.get('/users/:userId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }
        const { userId } = req.params;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const user = await getUserById(parseInt(userId));

        res.json(user);

    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.post('/users/new', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        console.log(req.body);
        const { login, email, password, first_name, last_name, role, active, manager_view_access } = req.body;

        const result = await createUser({
            login,
            email,
            password,
            first_name,
            last_name,
            role,
            active,
            manager_view_access
        });

        if (!result.success) {
            return res.status(result.status || 400).json({ message: result.message });
        }

        const newUser = await getUserById(result.user);
        res.status(201).json({ message: 'User created successfully!', user: newUser });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.put('/users/:userId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const { userId } = req.params;
        if (!userId || isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const { login, email, password, first_name, last_name, role, active, manager_view_access, manager_view_enabled, manager_nav_collapsed } = req.body;

        const result = await editUser(parseInt(userId), {
            login,
            email,
            password,
            first_name,
            last_name,
            role,
            active,
            manager_view_access,
            manager_view_enabled,
            manager_nav_collapsed
        });

        if (!result.success) {
            return res.status(result.status || 400).json({ message: result.message });
        }

        res.json({ message: 'User updated successfully!', user: result.user });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.delete('/users/:userId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const { userId } = req.params;
        if (!userId || isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const result = await removeUser(parseInt(userId));
        if (!result.success) {
            return res.status(result.status || 400).json({ message: result.message });
        }

        res.json({ message: 'User removed successfully!' });
    } catch (err) {
        console.error('Error removing user:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.get('/posts', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const posts = await getAllPosts();

        res.json(posts);
    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.get('/posts/:postId', async (req, res) => {
    try {
        const { postId } = req.params;

        if (!postId || isNaN(postId)) {
            return res.status(400).json({ message: 'Invalid post ID.' });
        }

        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const post = await getPostById(parseInt(postId));

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        res.json(post);
    } catch (err) {
        console.error('Error fetching post:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.post('/posts', async (req, res) => {
    try {
        const { boardID, title, content } = req.body;

        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        if (!boardID || !content) {
            return res.status(400).json({ message: 'Board ID and content are required.' });
        }

        const post = await createPost({
            boardID: parseInt(boardID),
            authorID: req.session.user.ID,
            title: title || null,
            content
        });

        res.status(201).json({ message: 'Post created successfully!', post });
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.put('/posts/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const { title, content } = req.body;

        if (!postId || isNaN(postId)) {
            return res.status(400).json({ message: 'Invalid post ID.' });
        }

        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        if (!content) {
            return res.status(400).json({ message: 'Content is required.' });
        }

        const user = req.session.user;
        const post = await getPostById(parseInt(postId));

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        if (post.authorID !== user.ID) {
            return res.status(403).json({ message: 'Forbidden: You are not the author of this post.' });
        }

        const updatedPost = await updatePost(parseInt(postId), { title: title || null, content });

        res.json({ message: 'Post updated successfully!', post: updatedPost });
    } catch (err) {
        console.error('Error updating post:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.delete('/posts/:postId', async (req, res) => {
    try {
        const { postId } = req.params;

        if (!postId || isNaN(postId)) {
            return res.status(400).json({ message: 'Invalid post ID.' });
        }

        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const user = req.session.user;
        const post = await getPostById(parseInt(postId));

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        if (post.authorID !== user.ID && user.role !== 10) {
            return res.status(403).json({ message: 'Forbidden: You are not authorized to delete this post.' });
        }

        await deletePost(parseInt(postId));

        res.json({ message: 'Post deleted successfully!' });
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
