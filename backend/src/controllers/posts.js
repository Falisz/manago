//BACKEND/controller/pages.js
import {User, UserDetails} from '../models/user.js';
import Post from '../models/post.js';
import Channel from '../models/channel.js';

/**
 * @typedef {Object} RawPostData
 * @property {Object} User - Sequelize User association
 * @property {Object} Channel - Sequelize Channel association
 * @property {Object} User.UserDetails - Sequelize UserDetails association
 * @property {Object} author - Author
 * @property {function} toJSON - Sequelize toJSON method
 */
/**
 * Cleans up a post object by merging associations and removing redundant fields.
 * @param {RawPostData} post - Raw post data from Sequelize query
 * @returns {Object} Cleaned post object
 */
function postCleanUp(post) {
    let newPost = {
        ...post.toJSON(),
        author: post.User?.toJSON(),
        channel: post.Channel?.toJSON(),
    };
    delete newPost.Channel;
    delete newPost.User;

    if (newPost.author && newPost.author.UserDetails)
        newPost.author = {
            ...newPost.author,
            ...newPost.author.UserDetails,
        }
    delete newPost.author.UserDetails;

    return newPost;
}

export async function getPost(postId) {
    if (!postId)
        return null;

    let post = await Post.findOne({
        where: { id: postId },
        include: [
            {
                model: User,
                attributes: ['id'],
                include: [
                    { model: UserDetails, as: 'UserDetails', attributes: ['first_name', 'last_name'] }
                ]
            },
            { model: Channel, attributes: ['id', 'name'] }
        ]
    });

    return postCleanUp(post);
}

/**
 * Retrieves all posts.
 * @returns {Promise<Object[]|null>} Array of posts, or null
 */
export async function getPosts() {
    const posts = await Post.findAll({
        include: [
            {
                model: User,
                attributes: ['id'],
                include: [
                    { model: UserDetails, as: 'UserDetails', attributes: ['first_name', 'last_name'] }
                ]
            },
            { model: Channel, attributes: ['id', 'name'] }
        ],
        order: [['createdAt', 'DESC']]
    });

    return posts.map(post => (postCleanUp(post)));
}
/**
 * Creates a new post.
 * @param {Object} data - Post data
 * @param {number} data.channel_id - Channel ID
 * @param {number} data.author_id - Author ID
 * @param {string|null} data.title - Post title
 * @param {string} data.content - Post content
 * @returns {Promise<Object|null>} Created post or null if invalid
 */
export async function createPost(data) {
    const channel = await Channel.findOne({ where: { id: data.channel_id } });
    if (!channel) {
        return null;
    }

    const user = await User.findOne({ where: { id: data.author_id } });
    if (!user) {
        return null;
    }

    return await Post.create({
        channel: data.channel_id,
        author: data.author_id,
        title: data.title,
        content: data.content,
        createdAt: new Date(),
        isEdited: false,
        updatedAt: null
    });
}

/**
 * Updates an existing post.
 * @param {number} postId - Post ID
 * @param {Object} data - Post data to update
 * @param {string|null} data.title - Post title
 * @param {string} data.content - Post content
 * @returns {Promise<Object|null>} Updated post or null if not found
 */
export async function updatePost(postId, data) {
    const post = await Post.findOne({ where: { id: postId } });

    if (!post) {
        return null;
    }

    return await post.update({
        title: data.title,
        content: data.content,
        isEdited: true,
        updatedAt: new Date()
    });
}

/**
 * Deletes a post.
 * @param {number} postId - Post ID
 * @returns {Promise<{valid: boolean, status?: number, message?: string}|Object>} Success object or error
 */
export async function deletePost(postId) {
    const post = await Post.findOne({ where: { id: postId } });

    if (!post) {
        return { valid: false, status: 404, message: 'Post not found.' };
    }

    return await post.destroy();
}