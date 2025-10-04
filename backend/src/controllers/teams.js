// BACKEND/controller/teams.js
import { Team, TeamUser } from '../models/teams.js';
import { User } from '../models/users.js';
import { Op } from 'sequelize';
import sequelize from '../utils/database.js';
import randomId from '../utils/randomId.js';
import isNumberOrNumberArray from "../utils/isNumberOrNumberArray.js";

/**
 * Retrieves one Team by its ID or all Team if ID is not provided.
 * @param {number} id - optional - Team ID to fetch a specific user
 * @param {boolean} all - optional - Should all Teams be returned - regardless of top-parent structure.
 * @param {number|null} parent_team - optional - ID of the parent Team.
 * @param {boolean} get_subteams - optional - Should be Subteams fetched for the found Teams?
 * @param {boolean} get_members - optional - Should be members fetched for the found Teams?
 * @returns {Promise<Object|null>} Single Team or null
 */
export async function getTeam({id, all=false, parent_team=null,
                                  get_subteams=true, get_members=true} = {}) {

    async function expandTeam(team) {
        if (get_subteams) {
            team.subteams = await getTeam({ parent_team: team.id });
        }

        if (get_members) {
            team.members = await getTeamUsers(team.id, 1, true);
            team.leaders = await getTeamUsers(team.id, 2, true);
            team.managers = await getTeamUsers(team.id, 3, true, true);
        }

        return team;
    }

    // Logic if no ID is provided - fetch all Teams
    if (!id || isNaN(id)) {
        const teams = await Team.findAll({ 
            where: all ? {} : { parent_team}, 
            order: [['id', 'ASC']],
            raw: true
        });

        if (!teams || teams.length === 0)
            return [];

        return await Promise.all(teams.map(team => expandTeam(team) ));

    }

    // Logic if the ID is provided - fetch a specific Team
    const team = await Team.findOne({ where: { id }, raw: true });

    if (!team)
        return null;

    if (team.parent_team)
        team.parent= await getTeam({
            id: team.parent_team,
            get_subteams: false,
            get_members: false
        });
    
    return await expandTeam(team);
}

/**
 * Creates a new Team.
 * @param {Object} data - Team data
 * @param {string} data.code_name - Team code name
 * @param {string|null} data.name - optional - Team name
 * @param {string|null} data.parent_team - optional - Parent Team's ID
 * @returns {Promise<{success: boolean, message: string, id?: number}>}
 */
export async function createTeam(data) {

    if (!data.code_name)
        return {
            success: false, 
            message: 'Mandatory data not provided.'
        };

    if (await Team.findOne({where: {code_name: data.code_name}}))
        return {
            success: false,
            message: 'The team with this exact code name already exists.'
        };

    const team = await Team.create({
        id: await randomId(Team),
        name: data.name,
        code_name: data.code_name,
        parent_team: data.parent_team || null,
    });

    return {
        success: true,
        message: 'Team created successfully.',
        id: team.id
    };
}

/**
 * Updates an existing Team.
 * @param {number} id - Team ID
 * @param {Object} data - Team data to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateTeam(id, data) {
    if (!id)
        return {
            success: false,
            message: 'Team ID not provided.'
        };

    const team = await Team.findOne({ where: { id } });

    if (!team)
        return {
            success: false,
            message: 'Team not found.'
        };

    if (data.code_name && 
        await Team.findOne({where: {id: { [Op.ne]: id }, code_name: data.code_name}}))
            return {
                success: false,
                message: 'The team with this exact code name already exists.'
            };
        
    await team.update(data);

    return {
        success: true,
        message: 'Team updated successfully.',
    };
}

/**
 * Deletes one or multiple Teams and their assignments.
 * @param {number|number[]} id - Team ID or array of Team IDs
 * @param {boolean} cascade - optional - Should Subteams be deleted too. If false, they get orphaned.
 * @returns {Promise<{success: boolean, message: string, deletedCount?: number}>}
 */
export async function deleteTeam(id, cascade=false) {

    if (!isNumberOrNumberArray(id))
        return { 
            success: false, 
            message: `Invalid Role ID${Array.isArray(id) ? 's' : ''} provided.` 
        };

    const transaction = await sequelize.transaction();

    try {

        if (cascade) {
            const subTeams = await Team.findAll({
                where: { parent_team: id }
            });

            const subTeamIds = subTeams.map(t => t.id);
            
            if (subTeamIds.length > 0) {
                const result = await deleteTeam(subTeamIds, true);

                if (!result.success) {
                    await transaction.rollback();
                    return result;
                }
            }
        } else {
            await Team.update({ parent_team: null }, { where: { parent_team: id } });
        }

        const deletedTeams = await Team.destroy({ where: { id }, transaction });
        
        if (!deletedTeams) {
            await transaction.rollback();
            return { 
                success: false, 
                message: `No Teams found to delete for provided ID${Array.isArray(id) && id.length > 1 ? 's' : ''}:
                    ${Array.isArray(id) ? id.join(', ') : id}` 
            };
        }

        await TeamUser.destroy({ where: { team: id }, transaction });

        await transaction.commit();
        
        return { 
            success: true, 
            message: `${deletedTeams} Team${deletedTeams > 1 ? 's' : ''} deleted successfully.`,
            deletedCount: deletedTeams 
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

/**
 * Retrieves members of a Team, optionally filtered by role and can include sub and sup Teams' members.
 * @param {number} teamId - Team ID
 * @param {number || null} [role] - Optional - Role filter (0: member, 1: leader, 2: manager)
 * @param include_subteams {boolean} - Optional - Should the result include Subteams.
 * @param include_parent_teams {boolean} - Optional - Should the result include parent Teams.
 * @returns {Promise<TeamUser[] || null>} Array of user objects
 */
export async function getTeamUsers(teamId, role = null, include_subteams = false,
                                   include_parent_teams = false) {
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

    if (role !== undefined && role !== null)
        where.role = role;

    let teamMembers = await TeamUser.findAll({
        where,
        include: [
            {
                model: Team,
                attributes: ['id', 'name'],
            },
            {
                model: User,
                attributes: ['id', 'first_name', 'last_name']
            },
        ],
    });


    let members = teamMembers.map(teamUser => ({
        id: teamUser['User'].id,
        first_name: teamUser['User'].first_name,
        last_name: teamUser['User'].last_name,
        team: { id: teamUser['Team'].id, name: teamUser['Team'].name },
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
 * - 'add': Appends members to Teams if they don't exist yet
 * - 'set': Sets provided members to Teams and removes any other manager assignments
 * - 'del': Removes provided members from Teams if they have them
 * @param {Array<{number}>} teamIds - Array of Team IDs for whom Members would be updated
 * @param {Array<{number}>} userIds - Array of User IDs to be assigned/removed.
 * @param {number} roleId - A role to set for provided users in 'add' and 'set' modes.
 * @param {string} mode - Update mode
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateTeamUsers(teamIds, userIds, roleId=1, mode = 'add') {

    if (!Array.isArray(teamIds) || !Array.isArray(userIds))
        return { success: false, message: 'Invalid Team or User IDs provided.', status: 400 };

    if (!['add', 'set', 'del'].includes(mode))
        return { success: false, message: 'Invalid mode. Must be "add", "set", or "del".', status: 400 };

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

            if (newAssignments.length > 0)
                await TeamUser.bulkCreate(newAssignments, { transaction });

            await transaction.commit();

            return {
                success: true,
                message: `Team Members assigned successfully. ${newAssignments.length} new assignments created.`
            };

        } else if (mode === 'set') {
            await TeamUser.destroy({
                where: { [Op.or]: [{team: teamIds, role: roleId}, {team: teamIds, user: userIds}] },
                transaction
            });

            for (const teamId of teamIds) {
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
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}