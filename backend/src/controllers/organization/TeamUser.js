// BACKEND/controller/organization/TeamUser.js
import {Op} from 'sequelize';
import {Team, TeamRole, TeamUser, User} from '#models';
import sequelize from '#utils/database.js';

/**
 * Retrieves members of a Team, optionally filtered by role and can include sub and sup Teams' members.
 * @param {number} team - Team ID
 * @param {number} user - User ID
 * @param {number || null} [role] - Optional - Role filter (0: member, 1: leader, 2: manager)
 * @param include_subteams {boolean} - Optional - Should the result include Subteams.
 * @param include_parent_teams {boolean} - Optional - Should the result include parent Teams.
 * @returns {Promise<TeamUser[] || null>} Array of user objects
 */
export async function getTeamUsers({team, user, role, include_subteams = false, include_parent_teams = false}) {

    let teamIds;

    if (team)
        teamIds = [team];
    else if (user)
        teamIds = (await TeamUser.findAll({where: {user, role}})).map(tu => tu['team']);
    else return [];

    async function getParentIds(teamIds) {

        if (!teamIds || teamIds.length === 0)
            return [];

        const currentTeams = await Team.findAll({
            where: { id: teamIds },
            attributes: ['parent_team'],
            raw: true
        });

        if (currentTeams.length > 0) {
            const parentIds = [];

            const parentTeams = currentTeams.map(t => t.parent_team).filter(t => t != null);
            parentIds.concat(parentTeams);

            if (parentTeams.length > 0) {
                const ancestors = await getParentIds(parentTeams);
                parentIds.concat(ancestors);
            }

            return parentIds;
        }

        return [];
    }

    async function getSubTeamIds(teamIds) {
        let subTeamIds = [];
        const subTeams = await Team.findAll({
            where: { parent_team: teamIds },
            attributes: ['id']
        });
        for (const team of subTeams) {
            subTeamIds.push(team.id);

            const descendants = await getSubTeamIds(team.id);
            subTeamIds = subTeamIds.concat(descendants);
        }

        return subTeamIds;
    }

    if (include_subteams)
        teamIds = teamIds.concat(await getSubTeamIds(teamIds));

    if (include_parent_teams)
        teamIds = teamIds.concat(await getParentIds(teamIds));

    teamIds = [...new Set(teamIds)];

    const where = { team: teamIds };

    if (role)
        where.role = role;

    const teamUsers = await TeamUser.findAll({
        where,
        include: [
            {
                model: Team,
                attributes: ['id', 'name']
            },
            {
                model: User,
                attributes: ['id', 'first_name', 'last_name']
            },
            {
                model: TeamRole,
                attributes: ['id', 'name']
            }
        ]
    });

    if (teamUsers.length === 0)
        return [];

    if (team) {
        let members = teamUsers.map(teamUser => ({
            id: teamUser['User'].id,
            first_name: teamUser['User'].first_name,
            last_name: teamUser['User'].last_name,
            role: { id: teamUser['TeamRole'].id, name: teamUser['TeamRole'].name },
            team: { id: teamUser['Team'].id, name: teamUser['Team'].name },
        }));

        const seenUsers = new Set();
        const filteredMembers = [];

        for (const member of members) {
            const userId = member.id;

            if (!seenUsers.has(userId)) {
                seenUsers.add(userId);
                filteredMembers.push(member);
            }
        }

        return filteredMembers;

    } else if (user) {
        return teamUsers.map(teamUser => ({
            id: teamUser['team'],
            name: teamUser['Team']['name'],
            role: teamUser['TeamRole']['name'],
        }));

    } else
        return [];

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