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
    post = {
        author: post.User ? post.User.toJSON() : null,
        channel: post.Channel ? post.Channel.toJSON() : null,
        ...post.toJSON(),
    };
    delete post.Channel;
    delete post.User;

    if (post.author && post.author.UserDetails)
        post.author = {
            ...post.author,
            ...post.author.UserDetails,
        }
    delete post.author.UserDetails;

    return post;
}

/**
 * Retrieves one or all posts.
 * @param {number|null} postId - Optional post ID to fetch a specific post
 * @returns {Promise<Object|Object[]|null>} Single post, array of posts, or null
 */
export async function getPosts(postId = null) {

    const commonConfig = {
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
    };

    if (postId) {

        let post = await Post.findOne({
            where: { id: postId },
            ...commonConfig
        });

        if (!post)
            return null;

        return postCleanUp(post);

    } else {

        const posts = await Post.findAll({
            ...commonConfig,
            order: [['createdAt', 'DESC']]
        });

        return posts.map(post => (postCleanUp(post)));
    }
}
/**
 * Creates a new post.
 * @param {Object} data - Post data
 * @param {number} data.channelID - Channel ID
 * @param {number} data.authorID - Author ID
 * @param {string|null} data.title - Post title
 * @param {string} data.content - Post content
 * @returns {Promise<Object|null>} Created post or null if invalid
 */
export async function createPost(data) {
    const channel = await Channel.findOne({ where: { id: data.channelID } });
    if (!channel) {
        return null;
    }

    const user = await User.findOne({ where: { id: data.authorID } });
    if (!user) {
        return null;
    }

    return await Post.create({
        channelid: data.channelID,
        authorid: data.authorID,
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