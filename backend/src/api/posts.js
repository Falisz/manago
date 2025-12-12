// BACKEND/api/posts.js
import express from 'express';
import { createPost, deletePost, getPost, updatePost } from '#controllers';
import checkResourceIdHandler from '#middleware/checkResourceId.js';
import deleteResource from '#utils/deleteResource.js';

// API Handlers
/**
 * Fetch all posts.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const fetchHandler = async (req, res) => {
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
 * @param {number} req.user
 * @param {express.Response} res
 */
const createHandler = async (req, res) => {
    try {
        const { channel, title, content } = req.body;

        if (!channel || !content)
            return res.status(400).json({ message: 'Channel ID and Content are required.' });

        const {id} = await createPost({
            channel_id: parseInt(channel),
            author_id: req.user,
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
 * @param {number} req.user
 * @param {express.Response} res
 */
const updateHandler = async (req, res) => {
    try {
        const { postId } = req.params;
        const { title, content } = req.body;

        if (!postId || isNaN(postId))
            return res.status(400).json({ message: 'Invalid post ID.' });

        if (!content)
            return res.status(400).json({ message: 'Content is required.' });

        const user = req.user;
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
 * @param {number} req.user
 * @param {express.Response} res
 */
const deleteHandler = async (req, res) =>
    deleteResource(req, res, 'Post', deletePost);

// Router definitions
export const router = express.Router();

router.get('/{:id}', fetchHandler);
router.post('/', createHandler);
router.put('/:id', checkResourceIdHandler, updateHandler);
router.delete('/{:id}', deleteHandler);

export default router;