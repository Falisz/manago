// FRONTEND/components/Teams/Edit.js
import React, {useCallback, useEffect, useMemo} from 'react';
import useTeams from '../../hooks/useTeams';
import useUsers from '../../hooks/useUsers';
import EditForm from '../EditForm';
import Loader from '../Loader';

export const TeamUserAssignment = ({team}) => {
    const {saveTeamAssignment} = useTeams();
    const {users, loading, fetchUsers} = useUsers();
    const {users: managers, loading: managersLoading, fetchUsers: fetchManagers} = useUsers();

    useEffect(() => {
        fetchUsers().then();
        fetchManagers({group: 'managers'}).then();
    }, [fetchUsers, fetchManagers]);

    const formStructure = useMemo(() => ({
        header: {
            title: `Editing Members of ${team?.name}`,
        },
        fields: {
            managers: {
                section: 0,
                type: 'id-list',
                teamCompliance: true,
                inputType: 'multi-dropdown',
                label: 'Team Managers',
                itemSource: managers,
                itemNameField: ['first_name', 'last_name'],
                itemExcludedIds: { formData: ['leaders', 'members'] }
            },
            leaders: {
                section: 1,
                type: 'id-list',
                teamCompliance: true,
                inputType: 'multi-dropdown',
                label: 'Team Leaders',
                itemSource: users,
                itemNameField: ['first_name', 'last_name'],
                itemExcludedIds: { formData: ['managers', 'members'] }
            },
            members: {
                section: 2,
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
            onSave: (data) => {
                saveTeamAssignment({
                    teamIds: [team.id],
                    resource: 'member',
                    resourceIds: data['members']
                }).then();
                saveTeamAssignment({
                    teamIds: [team.id],
                    resource: 'leader',
                    resourceIds: data['leaders']
                }).then();
                saveTeamAssignment({
                    teamIds: [team.id],
                    resource: 'manager',
                    resourceIds: data['managers']
                }).then();
                return true;
            },
            refreshTriggers: [['teams', true], ['team', team.id]]
        }
    }), [team, users, managers, saveTeamAssignment]);

    if (loading || managersLoading) 
        return <Loader/>;

    return <EditForm structure={formStructure} presetData={team} />;
}

export const TeamUserBulkAssignment = ({teams}) => {
    const {users, usersLoading: loading, fetchUsers} = useUsers();
    const { saveTeamAssignment } = useTeams();

    useEffect(() => {
        fetchUsers().then();
    }, [fetchUsers]);

    const formStructure = useMemo(() => ({
        header: {
            title: `%m %v %m ${teams.length} Team${teams.length > 1 ? 's' : ''}`,
            modes: true,
            variantField: 'role',
            variantOptions: {1: 'Member', 2: 'Leader', 3: 'Manager'}
        },
        fields: {
            teams: {
                section: 0,
                label: 'Selected Teams',
                nameField: 'name',
                type: 'listing'
            },
            mode: {
                section: 1,
                label: 'Mode',
                type: 'string',
                inputType: 'dropdown',
                options: [{id: 'set', name: 'Set'}, {id: 'add', name: 'Add'}, {id: 'del', name: 'Remove'}],
                searchable: false
            },
            user: {
                section: 2,
                label: 'User',
                type: 'number',
                inputType: 'dropdown',
                options: users?.map((user) => ({id: user.id, name: user.first_name + ' ' + user.last_name}))
            },
            role: {
                section: 2,
                label: 'Role',
                type: 'number',
                inputType: 'dropdown',
                options: [{id: 1, name: 'Member'}, {id: 2, name: 'Leader'}, {id: 3, name: 'Manager'}],
                searchable: false
            }
        },
        sections: {
          2: {style: {flexDirection: 'row'}}
        },
        onSubmit: {
            onSave: (data) => saveTeamAssignment({
                teamIds: teams.map(team => team.id),
                resource: data.role === 3 ? 'manager' : data.role === 2 ? 'leader' : 'member',
                resourceIds: [data.user],
                mode: data.mode
            }),
            refreshTriggers: [['teams', true]]
        }
    }), [teams, users, saveTeamAssignment]);

    const presetData = useMemo(() => ({mode: 'add', teams, role: 2}), [teams]);

    if (loading) 
        return <Loader/>;

    return <EditForm structure={formStructure} presetData={presetData} />;
}

const TeamEdit = ({ teamId, parentId }) => {
    const { team, loading, setLoading, fetchTeam, saveTeam } = useTeams();
    const { teams, fetchTeams } = useTeams();
    const { users, fetchUsers } = useUsers();
    const { users: managers, fetchUsers: fetchManagers } = useUsers();

    useEffect(() => {
        fetchUsers().then();
        fetchManagers({group: 'managers'}).then();
        fetchTeams({all: true, loading: true}).then();

        if (teamId)
            fetchTeam({teamId}).then();
        else
            setLoading(false);
        
    }, [teamId, setLoading, fetchTeam, fetchUsers, fetchManagers, fetchTeams]);

    const getAvailableParentTeams = useCallback(() => {
        const getAllSubTeams = (currentTeam) => {
            if (!currentTeam) 
                return [];
            
            const result = [currentTeam];
            
            if (currentTeam.sub_teams && Array.isArray(currentTeam.sub_teams))
                currentTeam.sub_teams.forEach(subteam => {
                    result.push(...getAllSubTeams(subteam));
                });
            
            return result;
        };

        const nonAvailableParentTeams = new Set();

        if (teamId != null && !isNaN(teamId)) 
            nonAvailableParentTeams.add(teamId);

        getAllSubTeams(team).forEach(t => nonAvailableParentTeams.add(t.id));

        if (!Array.isArray(teams)) 
            return [];
        
        return teams.filter(t => t && typeof t.id === 'number' && !nonAvailableParentTeams.has(t.id));
    }, [teamId, team, teams]);

    const formStructure = useMemo(() => ({
        header: {
            title: teamId ? `Editing ${team?.name}` : `Creating new ${parentId ? 'SubTeam' : 'Team'}`,
        },
        fields: {
            name: {
                section: 0,
                type: 'string',
                inputType: 'input',
                label: 'Name',
                required: true,
            },
            code_name: {
                section: 0,
                type: 'string',
                inputType: 'input',
                label: 'Codename',
                required: true,
            },
            parent_team: {
                section: 1,
                type: 'item',
                inputType: 'dropdown',
                label: 'Parent Team',
                options: getAvailableParentTeams(),
                noneAllowed: true
            },
            managers: {
                section: 2,
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
            onSave: (formData, id) => saveTeam({teamId: id, formData}),
            refreshTriggers: [['teams', true], ...(team ? [['team', team.id]] : [])],
            openIfNew: 'userDetails'
        },
    }), [saveTeam, team, teamId, parentId, getAvailableParentTeams, managers, users]);

    const teamData = useMemo(() => {
        const baseData = team ? team : {};
        return {
            ...baseData,
            ...(parentId ? { parent_team: parentId } : {})
        };
    }, [team, parentId]);

    if (loading) 
        return <Loader/>;

    return <EditForm structure={formStructure} presetData={teamData} />;
}

export default TeamEdit;