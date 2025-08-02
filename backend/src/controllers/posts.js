//BACKEND/controller/pages.js
const {Post, User, UserDetails, Channel} = require("../db");

async function getPosts(postId = null) {

    const commonConfig = {
        include: [
            {
                model: User,
                attributes: ['ID'],
                include: [
                    { model: UserDetails, as: 'UserDetails', attributes: ['first_name', 'last_name'] }
                ]
            },
            { model: Channel, attributes: ['ID', 'name'] }
        ]
    };

    if (postId) {

        const post = await Post.findOne({
            where: { ID: postId },
            ...commonConfig
        });
        return post ? { ...post.toJSON(), User: post.User ? post.User.toJSON() : null } : null;

    } else {

        const posts = await Post.findAll({
            ...commonConfig,
            order: [['createdAt', 'DESC']]
        });

        return posts.map(post => ({
            ...post.toJSON(),
            User: post?.User ? post.User.toJSON() : null
        }));

    }
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
    getPosts,
    createPost,
    updatePost,
    deletePost
};