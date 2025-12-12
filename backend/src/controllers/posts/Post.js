//BACKEND/controller/posts/Post.js
import {Post, Channel, User} from '#models';
import randomId from '#utils/randomId.js';

/**
 * Retrieves one Post by its ID or all Posts if an ID is not provided.
 * @param {number|null} id - Post ID (optional)
 * @returns {Promise<Object|Object[]|null>} Single Post object, array of Posts, or null if not found
 **/
export async function getPost({id} = {}) {
    /**
     * Cleans up a Post object by merging associations and removing redundant fields.
     * @param {Object} post - Raw Post data from Sequelize query
     * @param {User} post.Author - Associated author user
     * @param {Channel} post.Channel - Associated channel
     * @param {function} post.toJSON - function to convert a Sequelize object into simple one
     * @returns {Object | Promise<Object[]|null>} Cleaned Post object
     */
    function postCleanUp(post) {
        let newPost = {
            ...post.toJSON(),
            author: post.Author?.toJSON(),
            channel: post.Channel?.toJSON(),
        };
        delete newPost.Channel;
        delete newPost.Author;

        return newPost;
    }

    const include = [
        { model: User, as: 'Author', attributes: ['id', 'first_name', 'last_name'] },
        { model: Channel, attributes: ['id', 'name'] }
    ];

    // Logic if no ID is provided - fetch all Posts
    if (!id) {
        const posts = await Post.findAll({ include, order: [['createdAt', 'DESC']] });
        return posts.map(post => (postCleanUp(post)));
    }

    // Logic if ID is provided - fetch a specific Post
    let post = await Post.findOne({ where: { id }, include });

    return postCleanUp(post);
}

/**
 * Creates a new Post.
 * @param {Object} data - Post data
 * @param {number} data.channel_id - Channel ID
 * @param {number} data.author_id - Author ID
 * @param {string|null} data.title - Post title
 * @param {string} data.content - Post content
 * @returns {Promise<{success: boolean, message: string, id?: number}>} Created Post or null if invalid
 */
export async function createPost(data) {
    const channel = await Channel.findOne({ where: { id: data.channel_id } });
    if (!channel)
        return {
            success: false,
            message: 'The provided Channel does not exist.'
        };

    const user = await User.findOne({ where: { id: data.author_id } });
    if (!user)
        return {
            success: false,
            message: 'The provided User does not exist.'
        };

    const post = await Post.create({
        id: await randomId(Post),
        channel: data.channel_id,
        author: data.author_id,
        title: data.title,
        content: data.content,
        createdAt: new Date(),
        isEdited: false,
        updatedAt: null
    });

    return {
        success: true,
        message: 'Post created successfully.',
        id: post.id
    };
}

/**
 * Updates an existing Post.
 * @param {number} id - Post ID
 * @param {Object} data - Post data to update
 * @param {string|null} data.title - Post title
 * @param {string} data.content - Post content
 * @returns {Promise<{success: boolean, message: string}>} Updated Post or null if not found
 */
export async function updatePost(id, data) {
    const post = await Post.findOne({ where: { id } });

    if (!post) {
        return {
            success: false,
            message: 'Post not found.'
        };
    }

    await post.update(data);

    return {
        success: true,
        message: 'Post updated successfully.'
    }
}

/**
 * Deletes a Post.
 * @param {number} id - Post ID
 * @returns {Promise<{success: boolean, message: string}>} Success object or error
 */
export async function deletePost(id) {
    const post = await Post.findOne({ where: { id } });

    if (!post)
        return {
            success: false,
            message: 'Post not found.'
        };

    await post.destroy();

    return {
        success: true,
        message: 'Post deleted successfully.'
    }
}