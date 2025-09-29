// BACKEND/controller/teams.js
import { Team, TeamUser } from '../models/teams.js';
import { User, UserDetails } from '../models/users.js';
import { Op } from 'sequelize';
import sequelize from '../utils/database.js';

/**
 * @typedef {Object} Team
 * @property {number} id - The team ID
 * @property {string} name - The team name
 */

/**
 * @typedef {Object} UserDetails
 * @property {string} first_name - The user's first name
 * @property {string} last_name - The user's last name
 */

/**
 * @typedef {Object} User
 * @property {number} id - The user ID
 * @property {UserDetails} [UserDetails] - The user's details
 */

/**
 * @typedef {Object} TeamUser
 * @property {number} team - The team ID
 * @property {number} user - The user ID
 * @property {number} role - The role type (0: member, 1: leader, 2: manager)
 * @property {Team} Team - The associated team
 * @property {User} User - The associated user
 */

/**
 * Retrieves one team by its ID.
 * @param {number} id - Team ID to fetch a specific user
 * @param {boolean} getMembers - optional - fetchAllMembers
 * @returns {Promise<Object|null>} Single team or null
 */
export async function getTeam(id, getMembers=true) {
    if (!id || isNaN(id))
        return null;

    let team = await Team.findOne({ where: { id } });

    if (!team)
        return null;

    team = {
        ...team.toJSON(),
        sub_teams: await getTeams(id, false),
    };

    if (team.parent_team) {
        team = {
            ...team,
            parent: await getTeam(team.parent_team, false),
        }
    }

    if (getMembers)
        team = {
            ...team,
            members: await getTeamUsers(team.id, 1, true),
            leaders: await getTeamUsers(team.id, 2, true),
            managers: await getTeamUsers(team.id, 3, true, true),
        }

    return team;
}

/**
 * Retrieves all teams and its subteams recursively.
 * @param {number || null} parent_team - Optional - ID of the parent team.
 * If left empty, only get a whole Team tree excluding subteams from the root teams.
 * If 0 used - it gets all Teams including subteams.
 * @param {boolean} getMembers - Optional - Should be members fetched with the Teams?
 * @returns {Promise<Object[]|null>} Array of teams or null
 */
export async function getTeams(parent_team = null, getMembers=true) {
    let teams;
    if (parent_team === 0)
        teams = await Team.findAll();
    else
        teams = await Team.findAll({ where: { parent_team }});

    if (!teams)
        return null;

    teams = await Promise.all(teams.map(async team => {
        let teamData = {
            ...team.toJSON(),
            subteams: await getTeams(team.id)
        };
        if (getMembers)
            teamData = {
                ...teamData,
                members: await getTeamUsers(team.id, 1, true),
                leaders: await getTeamUsers(team.id, 2),
                managers: await getTeamUsers(team.id, 3),
            }
        return teamData;
    }));

    return teams || null;
}
/**
 * Alias for getTeams(0) function that gets all Teams including the subteams.
 * @param {boolean} getMembers - Optional - Should be members fetched with the Teams?
 * @returns {Promise<Object[]|null>} Array of teams or null
 */
export async function getAllTeams(getMembers=true) {
    return getTeams(0, getMembers);
}

/**
 * Creates a new team.
 * @param {Object} data - Team data
 * @param {string} data.code_name - Team code name
 * @param {string|null} data.name - optional - Team name
 * @param {string|null} data.parent_team - optional - Parent Team's ID
 * @returns {Promise<{success: boolean, message: string, team?: Team}>}
 */
export async function createTeam(data) {
    if (!data.code_name) {
        return {success: false, message: 'Mandatory data not provided.'};
    }

    await Team.sync();
    await sequelize.query(
        "SELECT setval('teams_id_seq', (SELECT MAX(id) + 1 FROM teams), false);"
    );

    if (await Team.findOne({where: {code_name: data.code_name}})) {
        return {success: false, message: 'The team with this exact code name already exists.'};
    }

    const team = await Team.create({
        code_name: data.code_name,
        name: data.name || null,
        parent_team: data.parent_team || null,
    });

    return {success: true, message: 'Team created successfully.', team: team.toJSON()};
}

/**
 * Updates an existing team.
 * @param {number} id - Team ID
 * @param {Object} data - Team data to update
 * @returns {Promise<{success: boolean, message: string, team?: Team}>}
 */
export async function updateTeam(id, data) {
    if (!id) {
        return {success: false, message: 'Team ID not provided.'};
    }

    const team = await Team.findOne({
        where: { id },
    });

    if (!team) {
        return {success: false, message: 'Team not found.'};
    }

    const teamUpdate = {};

    if (data.code_name) {
        if (await Team.findOne({where: {id: { [Op.ne]: id }, code_name: data.code_name}})) {
            return {success: false, message: 'The team with this exact code name already exists.'};
        }
        teamUpdate.code_name = data.code_name;
    }

    if (data.name) teamUpdate.name = data.name;

    if (data.parent_team !== undefined) teamUpdate.parent_team = data.parent_team;

    const updatedTeam = await team.update(teamUpdate);

    return {success: true, message: 'Team updated successfully.', team: updatedTeam.toJSON()};
}

/**
 * Deletes team(s) and their assignments.
 * @param {number|number[]} id - Team ID or array of Team IDs
 * @param {boolean} cascade - optional - Should subteams be deleted too. If false, they get orphaned.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteTeam(id, cascade = false) {
    if (!id || (Array.isArray(id) && id.length === 0)) {
        return { success: false, message: 'Team ID(s) not provided.' };
    }

    const transaction = await sequelize.transaction();

    try {
        const teamIds = Array.isArray(id) ? id : [id];

        for (const teamId of teamIds) {
            if (!Number.isInteger(teamId)) {
                await transaction.rollback();
                return { success: false, message: `Invalid team ID: ${teamId}` };
            }
        }

        const teams = await Team.findAll({
            where: { id: teamIds },
            transaction
        });

        if (teams.length === 0) {
            await transaction.rollback();
            return { success: false, message: 'No teams found or already removed.' };
        }

        if (teams.length !== teamIds.length) {
            await transaction.rollback();
            return { success: false, message: 'Some teams were not found.' };
        }

        for (const team of teams) {
            if (cascade) {
                const subTeams = await Team.findAll({
                    where: { parent_team: team.id },
                    transaction
                });

                await Promise.all(subTeams.map(async (subTeam) => {
                    await TeamUser.destroy({
                        where: { team: subTeam.id },
                        transaction
                    });
                    await subTeam.destroy({ transaction });
                }));
            } else {
                await Team.update(
                    { parent_team: null },
                    { where: { parent_team: team.id }, transaction }
                );
            }

            await TeamUser.destroy({
                where: { team: team.id },
                transaction
            });

            await team.destroy({ transaction });
        }

        await transaction.commit();
        return { success: true, message: `Team${teamIds.length > 1 ? 's' : ''} removed successfully.` };
    } catch (error) {
        await transaction.rollback();
        return { success: false, message: `Error deleting team(s): ${error.message}` };
    }
}

/**
 * Retrieves members of a team, optionally filtered by role and can include sub and sup teams' members.
 * @param {number} teamId - Team ID
 * @param {number || null} [role] - Optional - Role filter (0: member, 1: leader, 2: manager)
 * @param include_subteams {boolean} - Optional - Should the result include subteams.
 * @param include_parent_teams {boolean} - Optional - Should the result include parent teams.
 * @returns {Promise<TeamUser[] || null>} Array of user objects
 */
export async function getTeamUsers(teamId, role = null, include_subteams = false, include_parent_teams = false) {
    if (!teamId) return [];

    async function getParentIds(teamId) {
        const parentIds = [];

        const thisTeam = await Team.findOne({
            where: { id: teamId },
            attributes: ['parent_team']
        });

        if (thisTeam && thisTeam.parent_team) {
            parentIds.push(thisTeam.parent_team);
            const ancestors = await getParentIds(thisTeam.parent_team);
            return parentIds.concat(ancestors);
        }

        return parentIds;
    }

    async function getSubTeamIds(teamId) {
        let subTeamIds = [];
        const subTeams = await Team.findAll({
            where: { parent_team: teamId },
            attributes: ['id']
        });
        for (const team of subTeams) {
            subTeamIds.push(team.id);

            const descendants = await getSubTeamIds(team.id);
            subTeamIds = subTeamIds.concat(descendants);
        }

        return subTeamIds;
    }

    let teamIds = [teamId];
    if (include_subteams)
        teamIds = teamIds.concat(await getSubTeamIds(teamId));
    if (include_parent_teams)
        teamIds = teamIds.concat(await getParentIds(teamId));

    teamIds = [...new Set(teamIds)];

    const where = { team: teamIds };
    if (role !== undefined && role !== null) {
        where.role = role;
    }

    /** @type {TeamUser[]} **/
    let teamMembers = await TeamUser.findAll({
        where,
        include: [
            {
                model: Team,
                attributes: ['id', 'name'],
            },
            {
                model: User,
                attributes: ['id'],
                include: [{
                    model: UserDetails,
                    as: 'UserDetails',
                    attributes: ['first_name', 'last_name']
                }]
            },
        ],
    });


    let members = teamMembers.map(tu => ({
        id: tu.User.id,
        first_name: tu.User.UserDetails?.first_name,
        last_name: tu.User.UserDetails?.last_name,
        team: { id: tu.Team.id, name: tu.Team.name },
    }));

    const seenUsers = new Map();
    const filteredMembers = [];

    for (const member of members) {
        const userId = member.id;

        if (!seenUsers.has(userId)) {
            seenUsers.set(userId, member.team.id);
            filteredMembers.push(member);
        } else if (member.team.id === teamId) {
            const prevTeamId = seenUsers.get(userId);
            filteredMembers.splice(
                filteredMembers.findIndex(m => m.id === userId && m.team.id === prevTeamId),
                1,
                member
            );
            seenUsers.set(userId, teamId);
        }
    }

    return filteredMembers;
}

/**
 * Updates Team Members assigned to a Team based on mode.
 * - 'add': Appends members to teams if they don't exist yet
 * - 'set': Sets provided members to teams and removes any other manager assignments
 * - 'del': Removes provided members from teams if they have them
 * @param {Array<{number}>} teamIds - Array of Team IDs for whom Members would be updated
 * @param {Array<{number}>} userIds - Array of User IDs to be assigned/removed.
 * @param {number} roleId - A role to set for provided users in append and overwrite modes.
 * @param {string} mode - Update mode
 * @returns {Promise<{success: boolean, message: string, status?: number}>}
 */
export async function updateTeamUsers(teamIds, userIds, roleId=1, mode = 'add') {

    if (!Array.isArray(teamIds) || !Array.isArray(userIds)) {
        return { success: false, message: 'Invalid Team or User IDs provided.', status: 400 };
    }
    if (!['add', 'set', 'del'].includes(mode)) {
        return { success: false, message: 'Invalid mode. Must be "add", "set", or "del".', status: 400 };
    }

    const transaction = await sequelize.transaction();

    try {
        if (mode === 'add') {
            const currentAssignments = await TeamUser.findAll({
                where: {
                    team: teamIds,
                    user: userIds
                },
                transaction
            });

            const existingPairs = new Set(currentAssignments.map(tu => `${tu.team}-${tu.user}`));
            const newAssignments = [];

            for (const teamId of teamIds) {
                for (const userId of userIds) {
                    if (!existingPairs.has(`${teamId}-${userId}`)) {
                        newAssignments.push({ team: teamId, user: userId, role: roleId });
                    }
                }
            }

            if (newAssignments.length > 0) {
                await TeamUser.bulkCreate(newAssignments, { transaction });
            }

            await transaction.commit();

            return {
                success: true,
                message: `Team Members assigned successfully. ${newAssignments.length} new assignments created.`
            };

        } else if (mode === 'set') {
            for (const teamId of teamIds) {
                await TeamUser.destroy({
                    where: { user: teamId },
                    transaction
                });

                const newAssignments = userIds.map(userId => ({
                    team: teamId,
                    user: userId,
                    role: roleId
                }));

                await TeamUser.bulkCreate(newAssignments, { transaction });
            }

            await transaction.commit();
            return {
                success: true,
                message: 'Team Members set successfully.'
            };

        } else if (mode === 'del') {
            const deletedCount = await TeamUser.destroy({
                where: { team: teamIds, user: userIds },
                transaction
            });

            await transaction.commit();
            return {
                success: true,
                message: `Team Members removed successfully. ${deletedCount} assignments removed.`
            };
        }
    } catch (err) {
        await transaction.rollback();
        return { success: false, message: `Failed to ${mode} Team Members: ${err.message}` };
    }
}