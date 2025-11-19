// FRONTEND/components/Teams/Edit.js
import React, {useCallback, useEffect, useMemo} from 'react';
import useTeams from '../../hooks/useTeams';
import useUsers from '../../hooks/useUsers';
import EditForm from '../EditForm';
import Loader from '../Loader';

export const TeamUserAssignment = ({team, modal}) => {
    const {saveTeamAssignment} = useTeams();
    const {users, loading, fetchUsers} = useUsers();
    const {users: managers, loading: managersLoading, fetchUsers: fetchManagers} = useUsers();

    useEffect(() => {
        fetchUsers().then();
        fetchManagers({group: 'managers'}).then();
    }, [fetchUsers, fetchManagers]);

    const fields = useMemo(() => ({
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
    }), [managers, users]);

    const onSubmit = (data) => {
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
    };

    if (loading || managersLoading) 
        return <Loader/>;

    return <EditForm 
        header={`Editing Members of ${team?.name}`}
        fields={fields}
        onSubmit={onSubmit}
        modal={modal}
        presetData={team} 
    />;
}

export const TeamUserBulkAssignment = ({teams, modal}) => {
    const {users, usersLoading: loading, fetchUsers} = useUsers();
    const { saveTeamAssignment } = useTeams();

    useEffect(() => {
        fetchUsers().then();
    }, [fetchUsers]);

    const headerModes = {
        add: ['Adding', 'to'],
        set: ['Setting', 'to'],
        del: ['Removing', 'from'],
    };
    const headerVariants = {1: 'Member', 2: 'Leader', 3: 'Manager'};

    const header = (data) => {
        const tokens = headerModes[data['mode']];
        let title = `%m %v %m ${teams.length} Team${teams.length > 1 ? 's' : ''}`;
        title = title.replace('%m', tokens[0], 0);
        title = title.replace('%m', tokens[1], 1);
        title = title.replace('%v', headerVariants[data['role']]);
        return title;
    };

    const fields = useMemo(() => ({
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
    }), [users]);

    const sections = {
        2: {style: {flexDirection: 'row'}}
    };

    const onSubmit = useCallback(async (data) => await saveTeamAssignment({
        teamIds: teams.map(team => team.id),
        resource: data.role === 3 ? 'manager' : data.role === 2 ? 'leader' : 'member',
        resourceIds: [data.user],
        mode: data.mode
    }), [teams, saveTeamAssignment]);

    const presetData = useMemo(() => ({mode: 'add', teams, role: 2}), [teams]);

    if (loading) 
        return <Loader/>;

    return <EditForm 
        header={header}
        fields={fields}
        sections={sections}
        onSubmit={onSubmit}
        modal={modal}
        presetData={presetData} 
    />;
}

const TeamEdit = ({ teamId, parentId, modal }) => {
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

    const fields = useMemo(() => ({
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
    }), [getAvailableParentTeams, managers, users]);

    const presetData = useMemo(() => {
        const baseData = team ? team : {};
        return {
            ...baseData,
            ...(parentId ? { parent_team: parentId } : {})
        };
    }, [team, parentId]);

    if (loading) 
        return <Loader/>;

    return <EditForm
        header={teamId ? `Editing ${team?.name}` : `Creating new ${parentId ? 'SubTeam' : 'Team'}`}
        fields={fields}
        onSubmit={async (formData) => await saveTeam({teamId, formData})}
        modal={modal}
        presetData={presetData} 
    />;
}

export default TeamEdit;