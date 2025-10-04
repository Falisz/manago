// BACKEND/api/posts.js
import express from 'express';
import { createPost, deletePost, getPost, updatePost } from '../controllers/posts.js';
import checkAuthHandler from '../utils/checkAuth.js';
import checkResourceIdHandler from "../utils/checkResourceId.js";
import {hasManagerAccess} from "../controllers/users.js";

// API Handlers
/**
 * Fetch all posts.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchPostsHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const posts = await getPost({ id });

        if (req.params.id && !posts)
            return res.status(404).json({ message: 'Post not found.' });

        res.json(posts);

    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Create a new post.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const createPostHandler = async (req, res) => {
    try {
        const { channel, title, content } = req.body;

        if (!channel || !content)
            return res.status(400).json({ message: 'Channel ID and Content are required.' });

        const {id} = await createPost({
            channel_id: parseInt(channel),
            author_id: req.session.user,
            title: title || null,
            content
        });

        const post = await getPost({id});

        res.status(201).json({ message: 'Post created successfully!', post });
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Update an existing post by ID.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const updatePostHandler = async (req, res) => {
    try {
        const { postId } = req.params;
        const { title, content } = req.body;

        if (!postId || isNaN(postId))
            return res.status(400).json({ message: 'Invalid post ID.' });

        if (!content)
            return res.status(400).json({ message: 'Content is required.' });

        const user = req.session.user;
        const post = await getPost(parseInt(postId));

        if (!post)
            return res.status(404).json({ message: 'Post not found.' });

        if (post['author'].id !== user.id)
            return res.status(403).json({ message: 'Forbidden: You are not the author of this post.' });


        const updatedPost = await updatePost(parseInt(postId), { title: title || null, content });

        res.json({ message: 'Post updated successfully!', post: updatedPost });

    } catch (err) {
        console.error('Error updating post:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Delete a specific post by ID.
 * @param {express.Request} req
 * @param {Object} req.session
 * @param {express.Response} res
 */
const deletePostHandler = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id))
            return res.status(400).json({ message: 'Invalid post ID.' });


        const user = req.session.user;
        const post = await getPost(parseInt(id));

        if (!post)
            return res.status(404).json({ message: 'Post not found.' });

        const managerAccess = await hasManagerAccess(user.id);

        if (post['Author'].id !== user.id && managerAccess)
            return res.status(403).json({ message: 'Forbidden: You are not authorized to delete this post.' });

        await deletePost(parseInt(id));

        res.json({ message: 'Post deleted successfully!' });

    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).json({ message: 'Server error.' });

    }
};

// Router definitions
export const router = express.Router();

router.get('/', checkAuthHandler, fetchPostsHandler);
router.get('/:id', checkAuthHandler, checkResourceIdHandler, fetchPostsHandler);
router.post('/new', checkAuthHandler, createPostHandler);
router.put('/:id', checkAuthHandler, checkResourceIdHandler, updatePostHandler);
router.delete('/:id', checkAuthHandler, checkResourceIdHandler, deletePostHandler);

export default router;