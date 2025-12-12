// BACKEND/controller/organization/Team.js
import {Op} from 'sequelize';
import {getTeamUsers} from '#controllers';
import {Team, TeamUser} from '#models';
import sequelize from '#utils/database.js';
import randomId from '#utils/randomId.js';
import isNumberOrNumberArray from '#utils/isNumberOrNumberArray.js';

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
            team.members = await getTeamUsers({
                team: team.id, role: 1, include_subteams: true
            });
            team.leaders = await getTeamUsers({
                team: team.id, role: 2, include_subteams: true
            });
            team.managers = await getTeamUsers({
                team: team.id, role: 3, include_subteams: true, include_parent_teams: true
            });
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
