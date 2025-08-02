//BACKEND/controller/pages.js
const {Post, User, UserDetails, Channel} = require("../db");

async function getAllPosts() {
    const posts = await Post.findAll({
        include: [
            { model: User, attributes: ['ID'], include: [
                    { model: UserDetails, as: 'UserDetails', attributes: ['first_name', 'last_name'] }
                ] },
            { model: Channel, attributes: ['ID', 'name'] }
        ],
        order: [['createdAt', 'DESC']]
    });

    return posts.map(post => ({
        ...post.toJSON(),
        User: post?.User ? post.User.toJSON() : null
    }));
}

async function getPostById(postId) {
    const post = await Post.findOne({
        where: { ID: postId },
        include: [
            { model: User, attributes: ['ID'], include: [
                    { model: UserDetails, as: 'UserDetails', attributes: ['first_name', 'last_name'] }
                ] },
            { model: Channel, attributes: ['ID', 'name'] }
        ]
    });

    return post ? { ...post.toJSON(), User: post.User ? post.User.toJSON() : null } : null;
}

async function createPost(data) {
    const channel = await Channel.findOne({ where: { ID: data.channelID } });
    if (!channel) {
        return null;
    }

    const user = await User.findOne({ where: { ID: data.authorID } });
    if (!user) {
        return null;
    }

    return await Post.create({
        channelID: data.channelID,
        authorID: data.authorID,
        title: data.title,
        content: data.content,
        createdAt: new Date(),
        isEdited: false,
        updatedAt: null
    });
}
async function updatePost(postId, data) {
    const post = await Post.findOne({ where: { ID: postId } });

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

async function deletePost(postId) {
    const post = await Post.findOne({ where: { ID: postId } });

    if (!post) {
        return { valid: false, status: 404, message: 'Post not found.' };
    }

    return await post.destroy();
}

module.exports = {
    getAllPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost
};