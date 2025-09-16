// FRONTEND/components/Teams/Index.js
import React, {useEffect, useState, useCallback} from 'react';
import { useModals } from '../../contexts/ModalContext';
import useTeam from '../../hooks/useTeam';
import Button from '../Button';
import Loader from '../Loader';
import Table from '../Table';

const TeamsIndex = () => {
    const { openModal, refreshData, refreshTriggers, closeTopModal } = useModals();
    const { teams, teamsLoading: loading, fetchTeams, deleteTeam } = useTeam();
    const [ selectedTeams, setSelectedTeams ] = useState(new Set());

    useEffect(() => {
        if (!teams) {
            fetchTeams().then();
        }
    }, [fetchTeams, teams]);

    useEffect(() => {
        if (refreshTriggers?.teams) {
            fetchTeams().then();
        }
    }, [refreshTriggers, fetchTeams]);

    const collectAllTeamIds = useCallback((teamList) => {
        let ids = [];
        teamList.forEach(team => {
            ids.push(team.id);
            if (team.subteams && team.subteams.length > 0) {
                ids = [...ids, ...collectAllTeamIds(team.subteams)];
            }
        });
        return ids;
    }, []);

    const selectionMode = selectedTeams?.size > 0;

    const fields = {
        name: {
            title: 'Name',
            display: true,
            sortable: true,
            filterable: true,
            type: 'string',
            openModal: 'teamDetails'
        },
        managers: {
            title: 'Managers',
            display: true,
            sortable: true,
            filterable: true,
            type: 'list',
            openModal: 'userDetails'
        },
        leaders: {
            title: 'Leaders',
            display: true,
            sortable: true,
            filterable: true,
            type: 'list',
            openModal: 'userDetails'
        },
        members_count: {
            title: 'Members',
            display: true,
            sortable: true,
            filterable: true,
            type: 'number',
            style: {maxWidth: 100+'px'},
            computeValue: (data) => data.members?.length || 0
        }
    }

    const contextMenuItems = [
        { id: 'select', label: 'Select Team', selectionMode: false },
        { id: 'edit', label: 'Edit Team', selectionMode: false },
        { id: 'delete', label: 'Delete Team', selectionMode: false },
        { id: 'select-all', label: 'Select All', selectionMode: true },
        { id: 'select-all-main', label: 'Select Main Teams', selectionMode: true },
        { id: 'clear-selection', label: 'Clear Selection', selectionMode: true }
    ];

    if (loading) return <Loader />;

    const handleContextMenuClick = ({ id, props }) => {
        const team = props;
        switch (id) {
            case 'select':
                setSelectedTeams(prev => {
                    const newSelected = new Set(Array.from(prev));
                    if (newSelected.has(team.id)) {
                        newSelected.delete(team.id);
                    } else {
                        newSelected.add(team.id);
                    }
                    return newSelected;
                });
                break;
            case 'edit':
                openModal({ content: 'teamEdit', contentId: team.id });
                break;
            case 'delete':
                let message = `Are you sure you want to delete this team? This action cannot be undone.`;
                const teamId = team.id;
                const users = team.members ? team.members.length : 0;
                const subteams = team.subteams ? team.subteams.length : 0;

                if (users > 0) {
                    message += ` There are currently ${users === 1 ? 'a' : users} user${users > 1 ? 's' : ''} assigned to this team.`;
                }
                if (subteams > 0) {
                    message += ` This team has currently ${subteams === 1 ? 'a' : subteams} subteam${subteams > 1 ? 's' : ''}. Do you want to delete all of its subteams too, or only the main team - keeping other subteams orphaned.`;
                }
                openModal({
                    content: 'confirm',
                    type: 'pop-up',
                    message: message,
                    onConfirm: () => {
                        deleteTeam(teamId).then();
                        refreshData('teams', true);
                        closeTopModal();
                    },
                    onConfirm2: subteams > 0 ? () => {
                        deleteTeam(teamId, true).then();
                        refreshData('teams', true);
                        closeTopModal();
                    } : null,
                    confirmLabel: subteams > 0 ? 'Delete only this team' : 'Delete the team',
                    confirmLabel2: subteams > 0 ? 'Delete team and subteams' : undefined,
                });
                break;
            case 'select-all':
                setSelectedTeams(new Set(collectAllTeamIds(teams)));
                break;
            case 'select-all-main':
                setSelectedTeams(new Set(teams.map(team => team.id)));
                break;
            case 'clear-selection':
                setSelectedTeams(new Set());
                break;
            default:
                console.info(`${id} option to be implemented.`);
                break;
        }
    };

    return (
        <>
            <div className='page-header'>
                <h1 className={'page-title'}> Teams in Zyrah </h1>
                {
                    selectionMode &&
                    <div className='selected-items'>
                        <p className='seethrough'>
                            {selectedTeams.size} team{selectedTeams.size !== 1 ? 's' : ''} selected.
                        </p>
                        <Button
                            onClick={() => setSelectedTeams(new Set())}
                            label={'Clear selection'}
                        />
                        <Button
                            onClick={() => setSelectedTeams(new Set(teams.map(team => team.id)))}
                            label={'Select all'}
                        />
                    </div>
                }
                <Button
                    className='new-team'
                    onClick={() => openModal({ content: 'teamNew' })}
                    label={'Add team'}
                    icon={'add'}
                />
            </div>

            <Table
                dataSource={teams}
                fields={fields}
                hasHeader={true}
                hasContextMenu={true}
                contextMenuItems={contextMenuItems}
                handleContextMenuClick={handleContextMenuClick}
                hasSelectableRows={true}
                selectedItems={selectedTeams}
                setSelectedItems={setSelectedTeams}
                dataPlaceholder={'No teams found.'}
                subRows={true}
                subRowField={'subteams'}
            />
        </>
    );
};

export default TeamsIndex;