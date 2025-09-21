// FRONTEND/components/Teams/Edit.js
import React, {useCallback, useEffect, useMemo} from 'react';
import useTeam from '../../hooks/useTeam';
import useUser from '../../hooks/useUser';
import Loader from '../Loader';
import '../../assets/styles/Form.css';
import EditForm from "../EditForm";

const TeamEdit = ({ teamId, parentId }) => {
    const { team, loading, error, setLoading, fetchTeam, saveTeam } = useTeam();
    const { teams, fetchTeams } = useTeam();
    const { users, fetchUsers } = useUser();
    const { users: managers, fetchUsers: fetchManagers } = useUser();

    useEffect(() => {
        fetchUsers().then();
        fetchManagers('managers').then();
        fetchTeams(true, true).then();

        if (teamId) {
            fetchTeam(teamId).then();
        } else {
            setLoading(false);
        }

    }, [teamId, setLoading, fetchTeam, fetchUsers, fetchManagers, fetchTeams]);

    const getAvailableParentTeams = useCallback(() => {
        const getAllSubTeams = (currentTeam) => {
            if (!currentTeam) return [];
            const result = [currentTeam];
            if (currentTeam.sub_teams && Array.isArray(currentTeam.sub_teams)) {
                currentTeam.sub_teams.forEach(subteam => {
                    result.push(...getAllSubTeams(subteam));
                });
            }
            return result;
        };
        const nonAvailableParentTeams = new Set();
        if (teamId !== undefined && teamId !== null) {
            const parsedTeamId = parseInt(teamId, 10);
            if (!isNaN(parsedTeamId)) {
                nonAvailableParentTeams.add(parsedTeamId);
            }
        }
        getAllSubTeams(team)
            .forEach(t => nonAvailableParentTeams.add(t.id));

        if (!Array.isArray(teams)) return [];
        return teams.filter(t => t && typeof t.id === 'number' && !nonAvailableParentTeams.has(t.id));
    }, [teamId, team, teams]);

    const formStructure = useMemo(() => ({
        header: {
            title: teamId ? `Editing ${team?.name}` : `Creating new ${parentId ? 'SubTeam' : 'Team'}`,
        },
        inputs: {
            name: {
                section: 0,
                field: 'name',
                type: 'string',
                inputType: 'input',
                label: 'Name',
                required: true,
            },
            codename: {
                section: 0,
                field: 'code_name',
                type: 'string',
                inputType: 'input',
                label: 'Codename',
                required: true,
            },
            parentTeam: {
                section: 1,
                field: 'parent_team',
                type: 'item',
                inputType: 'dropdown',
                label: 'Parent Team',
                options: getAvailableParentTeams(),
                noneAllowed: true
            },
            managers: {
                section: 2,
                field: 'managers',
                type: 'id-list',
                teamCompliance: true,
                inputType: 'multi-dropdown',
                label: 'Team Managers',
                itemSource: managers,
                itemNameField: ['first_name', 'last_name'],
                itemExcludedIds: { formData: ['leaders', 'members'] }
            },
            leaders: {
                section: 3,
                field: 'leaders',
                type: 'id-list',
                teamCompliance: true,
                inputType: 'multi-dropdown',
                label: 'Team Leaders',
                itemSource: users,
                itemNameField: ['first_name', 'last_name'],
                itemExcludedIds: { formData: ['managers', 'members'] }
            },
            members: {
                section: 4,
                field: 'members',
                type: 'id-list',
                teamCompliance: true,
                inputType: 'multi-dropdown',
                label: 'Team Members',
                itemSource: users,
                itemNameField: ['first_name', 'last_name'],
                itemExcludedIds: { formData: ['leaders', 'managers'] }
            }
        },
        onSubmit: {
            onSave: (data, id) => saveTeam(data, id),
            refreshTriggers: [['teams', true], ...(team ? [['team', team.id]] : [])],
            openIfNew: 'userDetails'
        },
    }), [saveTeam, team, teamId, getAvailableParentTeams, managers, users]);

    const teamData = useMemo(() => {
        const baseData = team ? team : {};
        return {
            ...baseData,
            ...(parentId ? { parent_team: parentId } : {})
        };
    }, [team, parentId]);

    if (loading) return <Loader />;

    if (error) return <div className='error-message'>{error}</div>;

    return (
        <EditForm
            structure={formStructure}
            presetData={teamData}
        />
    );
}

export default TeamEdit;