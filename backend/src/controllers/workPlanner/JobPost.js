// BACKEND/controller/workPlanner/jobPosts.js
import {JobPost, Shift} from '#models';
import isNumberOrNumberArray from '#utils/isNumberOrNumberArray.js';
import randomId from '#utils/randomId.js';
import sequelize from "#utils/database";

/**
 * Retrieves one Job Post by its ID or all Job Posts if an ID is not provided.
 * @param {number|null} id - optional - Job Post ID to fetch a specific Job Post
 * @returns {Promise<Object|Object[]|null>} Single Job Post, array of Job Posts, or null
 */
export async function getJobPost({id} = {}) {

    if (id && !isNaN(id)) {
        const jobPost = await JobPost.findByPk(id, {raw: true});

        if (!jobPost)
            return null;

        return jobPost;
    }

    const jobPosts = await JobPost.findAll({ raw: true });

    if (!jobPosts || jobPosts.length === 0)
        return [];

    return jobPosts;
}

/**
 * Creates a new Job Post.
 * @param {Object} data - Job Post data
 * @param {string} data.name - Job Post name
 * @param {string} data.color - optional - Job Post color
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function createJobPost(data) {
    if (!data.name)
        return { success: false, message: 'Job Post name is required.' };

    if (await JobPost.findOne({ where: { name: data.name } }))
        return { success: false, message: 'There already is a Job Post with provided name. Use different one.' }

    const jobPost = await JobPost.create({
        id: await randomId(JobPost),
        name: data.name || null,
        color: data.color || null
    });

    return { success: true, message: 'Job Post created successfully.', id: jobPost.id };
}

/**
 * Updates an existing Job Post.
 * @param {number} id - Job Post ID
 * @param {Object} data - Job Post data to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateJobPost(id, data) {
    if (!id)
        return { success: false, message: 'Job Post ID not provided.' };

    const jobPost = await JobPost.findOne({ where: { id } });

    if (!jobPost)
        return { success: false, message: 'Job Post not found.' };

    if (data.name && await JobPost.findOne({ where: { name: data.name } }))
        return { success: false, message: 'There already is a Job Post with provided name. Use different one.' };

    await jobPost.update(data);

    return { success: true, message: 'Job Post updated successfully.' };
}

/**
 * Deletes one or multiple Job Post and shifts included - if specified likewise.
 * @param {number|number[]} id - Single Job Post ID or array of Job Post IDs
 * @param {boolean} delete_shifts - optional - Should shifts within this Schedule be deleted. False by default.
 * @returns {Promise<{success: boolean, message: string, deletedCount?: number}>}
 */
export async function deleteJobPost({id, delete_shifts=false} = {}) {
    if (!isNumberOrNumberArray(id))
        return { success: false, message: `Invalid Job Post ID${Array.isArray(id) ? 's' : ''} provided.` };

    const transaction = await sequelize.transaction();

    try {
        const deletedCount = await JobPost.destroy({ where: { id }, transaction });

        if (!deletedCount) {
            await transaction.rollback();
            return {
                success: false,
                message: `No Job Posts found to delete for provided ID${Array.isArray(id) && id.length > 1 ? 's' : ''}:
                 ${Array.isArray(id) ? id.join(', ') : id}`
            };
        }

        if (delete_shifts)
            await Shift.destroy({ where: { job_post: id }, transaction });

        else
            await Shift.update({ job_post: null }, { where: { job_post: id } });

        await transaction.commit();

        return {
            success: true,
            message: `${deletedCount} Job Post${deletedCount > 1 ? 's' : ''} deleted successfully.`,
            deletedCount
        };

    } catch (error) {
        await transaction.rollback();
        throw error;

    }
}