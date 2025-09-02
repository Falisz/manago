import Team, { TeamUser } from '../models/team.js';
import User, { UserDetails } from '../models/user.js';


export async function getTeam(id) {
    if (!id) return null;

    const team = await Team.findOne({ where: { id } });
    if (!team) return null;

    return {
        ...team.toJSON(),
        members: await getTeamMembers(team.id),
        team_leaders: await getTeamMembers(team.id, 1),
        managers: await getTeamMembers(team.id, 2)
    };
}

export async function getTeams(parentId = null) {
    let teams = await Team.findAll({ where: { parent_team: parentId }});

    if (!teams)
        return null;

    teams = await Promise.all(teams.map(async team => {
        return {
            ...team.toJSON(),
            members: await getTeamMembers(team.id, 0, true),
            team_leaders: await getTeamMembers(team.id, 1),
            managers: await getTeamMembers(team.id, 2),
            subteams: await getTeams(team.id)
        };
    }));

    return teams || null;
};

/**
 * Retrieves members of a team, optionally filtered by role.
 * @param {number} teamId - Team ID
 * @param {number} [role] - Optional role filter (0: member, 1: leader, 2: manager)
 * @returns {Promise<Array>} Array of user objects
 */
export async function getTeamMembers(teamId, role = 0, include_subteams = false) {
    if (!teamId) return [];
    let teamIds = [teamId];

    if (include_subteams) {
        const subTeams = await Team.findAll({ where: { parent_team: teamId }, attributes: ['id'] });
        if (subTeams.length > 0) {
            teamIds = subTeams.map(team => team.id);
            teamIds.push(teamId);
        }
    } 

    let teamUsers = await TeamUser.findAll({
        where: { team: teamIds, role: role },
        include: [
            {
                model: User,
                attributes: ['id'],
                include: [{ model: UserDetails, as: 'UserDetails', attributes: ['first_name', 'last_name'] }]
            }
        ]
    });

    teamUsers = teamUsers.map(tu => ({
        id: tu.User.id,
        first_name: tu.User.UserDetails?.first_name,
        last_name: tu.User.UserDetails?.last_name
    }));

    return teamUsers; 
}