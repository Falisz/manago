// FRONTEND/components/Teams/Edit.js
import React, {useCallback, useEffect, useMemo} from 'react';
import useTeams from '../../hooks/useTeams';
import useUsers from '../../hooks/useUsers';
import Loader from '../Loader';
import EditForm from '../EditForm';

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
        inputs: {
            managers: {
                section: 0,
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
                section: 1,
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
                section: 2,
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
            onSave: (data) => {
                saveTeamAssignment('user', data['members'], [team.id], 1).then();
                saveTeamAssignment('user', data['leaders'], [team.id], 2).then();
                saveTeamAssignment('user', data['managers'], [team.id], 3).then();
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
        inputs: {
            selectedUsers: {
                section: 0,
                label: 'Selected Teams',
                field: 'teams',
                nameField: 'name',
                type: 'listing'
            },
            mode: {
                section: 1,
                label: 'Mode',
                field: 'mode',
                type: 'string',
                inputType: 'dropdown',
                options: [{id: 'set', name: 'Set'}, {id: 'add', name: 'Add'}, {id: 'del', name: 'Remove'}],
                searchable: false
            },
            teamUser: {
                section: 2,
                label: 'User',
                field: 'user',
                type: 'number',
                inputType: 'dropdown',
                options: users?.map((user) => ({id: user.id, name: user.first_name + ' ' + user.last_name}))
            },
            teamRole: {
                section: 2,
                label: 'Role',
                field: 'role',
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
            onSave: (data) => saveTeamAssignment(
                'user',
                [data.user],
                teams.map(team => team.id),
                data.role,
                data.mode
            ),
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
        fetchManagers('managers').then();
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