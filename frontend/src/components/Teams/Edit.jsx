// FRONTEND/components/Teams/Edit.js
import React, {useCallback, useEffect, useMemo} from 'react';
import {useTeams, useUsers} from '../../hooks/useResource';
import EditForm from '../EditForm';
import Loader from '../Loader';

export const TeamAssignment = ({team, modal}) => {
    const {saveTeamAssignment} = useTeams();
    const {users, loading, fetchUsers} = useUsers();
    const {users: managers, loading: managersLoading, fetchUsers: fetchManagers} = useUsers();

    useEffect(() => {
        fetchUsers().then();
        fetchManagers({group: 'managers'}).then();
    }, [fetchUsers, fetchManagers]);

    const header = useCallback((data) => {
        const batchMode = Array.isArray(team);

        if (batchMode) {
            if (!data || !data['mode'])
                return `Bulk Assignment`;

            const headerModes = {
                add: ['Adding', 'to'],
                set: ['Setting', 'to'],
                del: ['Removing', 'from'],
            };
            const headerVariants = {1: 'Member', 2: 'Leader', 3: 'Manager'};

            const tokens = headerModes[data['mode']];
            let title = `%m1 %v %m2 ${team.length} Team${team.length > 1 ? 's' : ''}`;
            title = title.replace('%m1', tokens[0]);
            title = title.replace('%m2', tokens[1]);
            title = title.replace('%v', headerVariants[data['role']]);
            return title;
        } else {
            return `Editing Members of ${team?.name}`;
        }
    }, [team]);

    const sections = useMemo(() => {
        const batchMode = Array.isArray(team);

        if (batchMode)
            return {
                0: {
                    fields: {
                        teams: {
                            label: 'Selected Teams',
                            nameField: 'name',
                            type: 'listing'
                        }
                    }
                },
                1: {
                    fields: {
                        mode: {
                            type: 'dropdown',
                            label: 'Mode',
                            options: [{id: 'set', name: 'Set'}, {id: 'add', name: 'Add'}, {id: 'del', name: 'Remove'}],
                            searchable: false
                        },
                    }

                },
                2: {
                    style: {flexDirection: 'row'},
                    fields: {
                        user: {
                            type: 'dropdown',
                            label: 'User',
                            options: users?.map((user) => ({id: user.id, name: user.first_name + ' ' + user.last_name}))
                        },
                        role: {
                            type: 'dropdown',
                            label: 'Role',
                            options: [{id: 1, name: 'Member'}, {id: 2, name: 'Leader'}, {id: 3, name: 'Manager'}],
                            searchable: false
                        }
                    }
                }
            }
        else
            return {
                0: {
                    fields: {
                        managers: {
                            type: 'multi-dropdown',
                            array: true,
                            teamCompliance: true,
                            label: 'Team Managers',
                            itemSource: managers,
                            itemNameField: ['first_name', 'last_name'],
                            itemExcludedIds: {formData: ['leaders', 'members']}
                        }
                    }
                },
                1: {
                    fields: {
                        leaders: {
                            type: 'multi-dropdown',
                            array: true,
                            teamCompliance: true,
                            label: 'Team Leaders',
                            itemSource: users,
                            itemNameField: ['first_name', 'last_name'],
                            itemExcludedIds: {formData: ['managers', 'members']}
                        }
                    }
                },
                2: {
                    fields: {
                        members: {
                            type: 'multi-dropdown',
                            array: true,
                            teamCompliance: true,
                            label: 'Team Members',
                            itemSource: users,
                            itemNameField: ['first_name', 'last_name'],
                            itemExcludedIds: {formData: ['leaders', 'managers']}
                        }
                    }
                }
            }
    }, [team, users, managers]);

    const onSubmit = useCallback(async (data) => {

        const batchMode = Array.isArray(team);

        if (batchMode) {
            return await saveTeamAssignment({
                teamIds: team.map(team => team.id),
                resource: data.role === 3 ? 'manager' : data.role === 2 ? 'leader' : 'member',
                resourceIds: [data.user],
                mode: data.mode
            });
        } else {
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
        }

    }, [team, saveTeamAssignment]);

    const presetData = useMemo(() => (Array.isArray(team) ? {mode: 'add', teams: team, role: 2} : team), [team]);

    if (loading || managersLoading)
        return <Loader/>;

    return <EditForm
        header={header}
        sections={sections}
        onSubmit={onSubmit}
        modal={modal}
        presetData={presetData}
    />;
};

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
            fetchTeam({id: teamId}).then();
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

    const sections = useMemo(() => ({
        0: {
            fields: {
                name: {
                    type: 'string',
                    label: 'Name',
                    required: true,
                },
                code_name: {
                    type: 'string',
                    label: 'Codename',
                    required: true,
                }
            }
        },
        1: {
            fields: {
                parent_team: {
                    type: 'dropdown',
                    label: 'Parent Team',
                    options: getAvailableParentTeams(),
                    noneAllowed: true
                }
            }
        },
        2: {
            fields: {
                managers: {
                    type: 'multi-dropdown',
                    array: true,
                    teamCompliance: true,
                    label: 'Team Managers',
                    itemSource: managers,
                    itemNameField: ['first_name', 'last_name'],
                    itemExcludedIds: { formData: ['leaders', 'members'] }
                }
            }
        },
        3: {
            fields: {
                leaders: {
                    type: 'multi-dropdown',
                    array: true,
                    teamCompliance: true,
                    label: 'Team Leaders',
                    itemSource: users,
                    itemNameField: ['first_name', 'last_name'],
                    itemExcludedIds: { formData: ['managers', 'members'] }
                }
            }
        },
        4: {
            fields: {
                members: {
                    type: 'multi-dropdown',
                    array: true,
                    teamCompliance: true,
                    label: 'Team Members',
                    itemSource: users,
                    itemNameField: ['first_name', 'last_name'],
                    itemExcludedIds: { formData: ['leaders', 'managers'] }
                }
            }
        },
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
        sections={sections}
        onSubmit={async (data) => await saveTeam({id: teamId, data})}
        modal={modal}
        presetData={presetData} 
    />;
}

export default TeamEdit;