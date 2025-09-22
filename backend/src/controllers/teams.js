// BACKEND/controller/teams.js
import Team, { TeamUser } from '../models/team.js';
import User, { UserDetails } from '../models/user.js';
import {Op} from "sequelize";
import sequelize from "../db.js";
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
            members: await getTeamMembers(team.id, 1, true),
            leaders: await getTeamMembers(team.id, 2, true),
            managers: await getTeamMembers(team.id, 3, true, true),
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
                members: await getTeamMembers(team.id, 0, true),
                leaders: await getTeamMembers(team.id, 1),
                managers: await getTeamMembers(team.id, 2),
            }
        return teamData;
    }));

    return teams || null;
}
/**
 * Alias for getAllTeams(0) function that gets all Teams including the subteams.
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
 * Deletes team and its assignments.
 * @param {number} id - Team ID
 * @param {boolean} cascade - optional - Should subteams be deleted too. If false, they get orphaned.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteTeam(id, cascade=false) {
    if (!id) {
        return {success: false, message: 'Team ID not provided.'};
    }

    const transaction = await sequelize.transaction();

    const team = await Team.findOne({
        where: { id },
        transaction
    });

    if (!team) {
        await transaction.rollback();
        return { success: false, message: 'Team not found or already removed.' };
    }

    const subTeams = await Team.findAll({
        where: { parent_team: id },
        transaction
    });

    if (cascade) {
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
            { where: { parent_team: id }, transaction }
        );
    }

    await TeamUser.destroy({
        where: { team: id },
        transaction
    });

    await team.destroy({ transaction });

    await transaction.commit();

    return { success: true, message: 'Team removed successfully.' };
}

/**
 * Retrieves members of a team, optionally filtered by role and can include sub and sup teams' members.
 * @param {number} teamId - Team ID
 * @param {number || null} [role] - Optional - Role filter (0: member, 1: leader, 2: manager)
 * @param include_subteams {boolean} - Optional - Should the result include subteams.
 * @param include_parent_teams {boolean} - Optional - Should the result include parent teams.
 * @returns {Promise<TeamUser[] || null>} Array of user objects
 */
export async function getTeamMembers(teamId, role = null, include_subteams = false, include_parent_teams = false) {
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
 * Updates the members of a team by synchronizing with the provided list of users to the specified role.
 * Depending on the mode it can append, set or remove current users.
 * @param {number} teamId - Team ID.
 * @param {number[]} userIds - Array of user Ids.
 * @param {number} roleId - A role to set for provided users in append and overwrite modes.
 * @param {string} mode - optional - A flag to specify the mode of the function.
 * @returns {Promise<Array>||null} Array of updated user objects or null if teamId is invalid.
 */
export async function updateTeamMembers(teamId, userIds, roleId=0, mode = 'append') {
    if (!teamId || !userIds || !Array.isArray(userIds)) return null;

    if (mode === 'remove') {
        await TeamUser.destroy({
            where: { team: teamId, user: userIds }
        });
        return;
    }

    /** @type {TeamUser[]} */
    const teamUsers = await TeamUser.findAll({
        where: { team: teamId },
        attributes: ['user', 'role'],
    });

    const currentUsers = new Map(teamUsers.map(tu => [tu.user, tu.role]));

    const usersToAdd = [];
    const usersToUpdate = [];

    userIds.forEach(userId => {
        if (!currentUsers.has(userId)) {
            usersToAdd.push({ team: teamId, user: userId, role: roleId });
        } else if (currentUsers.get(userId) !== roleId) {
            usersToUpdate.push(userId);
        }
    });

    const promises = [];

    if (usersToAdd.length > 0) {
        promises.push(
            TeamUser.bulkCreate(usersToAdd)
        );
    }

    if (usersToUpdate.length > 0) {
        promises.push(
            TeamUser.update(
                { role: roleId },
                { where: { team: teamId, user: usersToUpdate } }
            )
        );
    }

    if (mode === 'append') {
        if (promises.length > 0) {
            await Promise.all(promises);
        }
        return await getTeamMembers(teamId);
    }

    const usersToRemove = teamUsers
        .filter(tu => !userIds.includes(tu.user) && tu.role === roleId)
        .map(tu => tu.user);

    if (usersToRemove.length > 0) {
        promises.push(
            TeamUser.destroy({
                where: { team: teamId, user: usersToRemove }
            })
        );
    }

    if (promises.length > 0) {
        await Promise.all(promises);
    }

    return await getTeamMembers(teamId);
}

/**
* Sets or updates a single team member's role.
* @param {number} teamId - Team ID
* @param {number} userId - User ID
* @param {number} [roleType=0] - Role type (0: member, 1: leader, 2: manager)
* @returns {Promise<Object|null>} Updated user object or null if invalid input
*/
export async function setTeamMember(teamId, userId, roleType = 0) {
    if (!teamId || !userId) return null;

    const user = await User.findOne({ where: { id: userId } });
    if (!user) return null;

    const team = await Team.findOne({ where: { id: teamId } });
    if (!team) return null;

    const teamUser = await TeamUser.findOne({
        where: { team: teamId, user: userId }
    });

    if (teamUser) {
        if (teamUser.role !== roleType) {
            await TeamUser.update(
                { role: roleType },
                { where: { team: teamId, user: userId } }
            );
        }
    } else {
        await TeamUser.create({
            team: teamId,
            user: userId,
            role: roleType
        });
    }

    const updatedTeamUsers = await getTeamMembers(teamId);
    return updatedTeamUsers.find(tu => tu.id === userId) || null;
}

/**
 * Removes a single team member.
 * @param {number} team - Team ID
 * @param {number} user - User ID
 * @returns {Promise<boolean>} True if removal was successful, false otherwise
 */
export async function removeTeamMember(team, user) {
    if (!team || !user) return false;

    const teamUser = await TeamUser.findOne({
        where: { team, user }
    });

    if (!teamUser) return false;

    await teamUser.destroy();

    return true;
}