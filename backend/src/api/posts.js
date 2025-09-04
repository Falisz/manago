// BACKEND/api/posts.js
import express from 'express';
import { createPost, deletePost, getPost, getPosts, updatePost } from '../controllers/posts.js';
export const router = express.Router();

// Get All Posts
router.get('/', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const posts = await getPosts();

        res.json(posts);
    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get Post by its ID
router.get('/:postId', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const { postId } = req.params;

        if (!postId || isNaN(postId)) {
            return res.status(400).json({ message: 'Invalid post ID.' });
        }

        const post = await getPost(parseInt(postId));

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        res.json(post);
    } catch (err) {
        console.error('Error fetching post:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Create a new Post
router.post('/new', async (req, res) => {
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
            authorID: req.session.user.id,
            title: title || null,
            content
        });

        res.status(201).json({ message: 'Post created successfully!', post });
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update an existing Post by its ID
router.put('/:postId', async (req, res) => {
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
        const post = await getPost(parseInt(postId));

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        if (post.author.id !== user.id) {
            return res.status(403).json({ message: 'Forbidden: You are not the author of this post.' });
        }

        const updatedPost = await updatePost(parseInt(postId), { title: title || null, content });

        res.json({ message: 'Post updated successfully!', post: updatedPost });
    } catch (err) {
        console.error('Error updating post:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Delete existing post by its ID
router.delete('/:postId', async (req, res) => {
    try {
        const { postId } = req.params;

        if (!postId || isNaN(postId)) {
            return res.status(400).json({ message: 'Invalid post ID.' });
        }

        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please log in.' });
        }

        const user = req.session.user;
        const post = await getPost(parseInt(postId));

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        if (post?.author.id !== user.id && user.role !== 10) {
            return res.status(403).json({ message: 'Forbidden: You are not authorized to delete this post.' });
        }

        await deletePost(parseInt(postId));

        res.json({ message: 'Post deleted successfully!' });
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

export default router;