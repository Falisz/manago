import Team from '../models/team.js';

export async function getTeams(id) {
    try {
        if (id) {
            const team = await Team.findOne({ where: { id } });
            return team;
        }
        const teams = await Team.findAll();
        return teams;
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
};