// FRONTEND/components/Teams/Edit.js
import React, {useEffect, useState} from 'react';
import { useModals } from '../../contexts/ModalContext';
import useTeam from '../../hooks/useTeam';
import useUser from '../../hooks/useUser';
import Loader from '../Loader';
import '../../assets/styles/Form.css';
import '../../assets/styles/Teams.css';
import Dropdown from "../Dropdown";
import Icon from "../Icon";
import Button from "../Button";

const FORM_CLEAN_STATE = {
    code_name: '',
    name: '',
    parent_team_id: null,
    leader_ids: [null],
    manager_ids: [null],
};

const TeamEdit = ({ teamId }) => {
    const { team, loading, error, warning, success, setLoading, fetchTeam, saveTeam } = useTeam();
    const { teams, fetchTeams } = useTeam();
    const { users, fetchUsers } = useUser();
    const { users: managers, fetchUsers: fetchManagers } = useUser();
    const { openModal, setDiscardWarning, refreshData, closeTopModal } = useModals();
    const [ formData, setFormData ] = useState(FORM_CLEAN_STATE);

    useEffect(() => {
        fetchUsers().then();
        fetchManagers().then();
        fetchTeams(true, true).then();

        if (!teamId) {
            setFormData(FORM_CLEAN_STATE);
            setLoading(false);
            return;
        }

        fetchTeam(teamId).then(team => {
            setFormData({
                code_name: team?.code_name || '',
                name: team?.name || '',
                parent_team_id: team?.parent?.id || null,
                leader_ids: team?.leaders?.map((lead) => lead.id) || [null],
                manager_ids: team?.managers?.map((mgr) => mgr.id) || [null],
            });
        });

    }, [teamId, setLoading, fetchTeam, fetchUsers, fetchManagers, fetchTeams]);

    const handleChange = (e, index) => {
        const { name, value, type, checked } = e.target;

        if (name === 'manager_ids' || name === 'leader_ids') {
            setFormData(prev => ({
                ...prev,
                [name]: [
                    ...prev[name].slice(0, index),
                    parseInt(value) || null,
                    ...prev[name].slice(index + 1),
                ],
            }));
        } else if (name === 'parent_team_id') {
            setFormData(prev => ({
                ...prev,
                [name]: value === 0 ? null : value
            }));
        } else
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        setDiscardWarning(true);
    };

    const handleAddItem = (field) => {
        if (!['manager_ids', 'leader_ids'].includes(field)) return;

        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], null],
        }))
    }

    const handleRemoveItem = (field, index) => {
        if (!['manager_ids', 'leader_ids'].includes(field)) return;

        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index),
        }));
        setDiscardWarning(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const savedTeam = await saveTeam(formData, teamId);
        if (savedTeam) {
            setDiscardWarning(false);
            setTimeout(() => {
                closeTopModal();
                if (!teamId) {
                    setTimeout(() => {
                        openModal({ content: 'teamDetails', contentId: savedTeam.id, type: 'dialog' });
                    }, 350);
                } else {
                    refreshData('team', teamId);
                }
                refreshData('teams', true);
            }, 10);
            setFormData(FORM_CLEAN_STATE);
        }
    };

    const getAvailableParentTeams = () => {
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
    }

    const getAvailableManagers = (index) => {
        const currentSelected = formData.manager_ids[index];
        return managers?.filter(mgr => {
            return mgr.id === currentSelected || !formData.manager_ids.includes(mgr.id);
        }) || [];
    };

    const getAvailableTeamLeaders = (index) => {
        const currentSelected = formData.leader_ids[index];
        return users?.filter(user => {
            return user.id === currentSelected ||
                (!formData.leader_ids.includes(user.id) && !formData.manager_ids.includes(user.id));
        }) || [];
    };

    const addNewManager = !formData.manager_ids.includes(null) &&
        formData.manager_ids.length < (managers?.length || 0);

    const addNewLeader = !formData.leader_ids.includes(null) &&
        formData.leader_ids.length < (users?.length || 0);


    if (loading) return <Loader />;

    if (error) return <div className='error-message'>{error}</div>;

    console.log(formData);

    return (
        <>
        <h1>{teamId ? 'Edit Team' : `Add New Team`}</h1>
            {warning && <div className='warning-message'>{warning}</div>}
            {success && <div className='success-message'>{success}</div>}
            <form
                className={'app-form team-edit-form'}
                onSubmit={handleSubmit}
            >
                <div className={'form-section'}>
                    <div className='form-group'>
                        <label className={'form-label'}>
                            Codename
                        </label>
                        <input
                            className={'form-input'}
                            type='text'
                            name='code_name'
                            value={formData.code_name}
                            onChange={handleChange}
                            placeholder='Enter codename'
                            required
                        />
                    </div>
                    <div className='form-group'>
                        <label className={'form-label'}>
                            Name
                        </label>
                        <input
                            className={'form-input'}
                            type='text'
                            name='name'
                            value={formData.name}
                            onChange={handleChange}
                            placeholder='Enter display name'
                            required
                        />
                    </div>
                    <div className='form-group'>
                        <label className={'form-label'}>
                            Parent Team
                        </label>
                        <Dropdown
                            name={`parent_team_id`}
                            value={formData?.parent_team_id}
                            options={getAvailableParentTeams()?.map(team => ({
                                id: team.id,
                                name: team.name
                            })) || [] }
                            onChange={(e) => handleChange(e)}
                            placeholder={'Select a parent team'}
                            noneAllowed={true}
                        />
                    </div>
                </div>
                <div className='form-group'>
                    <div className={'form-label'}>
                        Managers
                    </div>
                    {managers?.length === 0 ? (<p>No team managers available.</p>) : (
                        <>
                            <div className={'form-section'}>
                                {formData.manager_ids.map((managerId, index) => (
                                    <div key={index} className='dropdown-item'>
                                        <Dropdown
                                            name={`manager_ids`}
                                            value={managerId}
                                            options={getAvailableManagers(index).map(manager => ({
                                                id: manager.id,
                                                name: manager.first_name + ' ' + manager.last_name
                                            }))}
                                            onChange={(e) => handleChange(e, index)}
                                            placeholder={'Select a team manager'}
                                            noneAllowed={true}
                                        />
                                        {index > 0 && (
                                            <Button
                                                className={'remove-button'}
                                                onClick={() => handleRemoveItem('manager_ids', index)}
                                                icon={'remove_circle_outline'}
                                                transparent={true}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <Button
                                className={'new-dropdown-button'}
                                onClick={() => handleAddItem('manager_ids')}
                                icon={'add_circle_outline'}
                                label={'Add Team Manager'}
                                disabled={!addNewManager}
                                transparent={true}
                            />
                        </>
                    )}
                </div>
                <div className='form-group'>
                    <div className={'form-label'}>
                        Team Leaders
                    </div>
                    {users?.length === 0 ? (<p>No team leaders available.</p>) : (
                        <>
                            <div className={'form-section'}>
                                {formData.leader_ids.map((leaderId, index) => (
                                    <div key={index} className='dropdown-item'>
                                        <Dropdown
                                            name={`leader_ids`}
                                            value={leaderId}
                                            options={getAvailableTeamLeaders(index).map(lead => ({
                                                id: lead.id,
                                                name: lead.first_name + ' ' + lead.last_name
                                            }))}
                                            onChange={(e) => handleChange(e, index)}
                                            placeholder={'Select a team leader'}
                                            noneAllowed={true}
                                        />
                                        {index > 0 && (
                                            <Button
                                                className={'remove-button'}
                                                onClick={() => handleRemoveItem('leader_ids', index)}
                                                icon={'remove_circle_outline'}
                                                transparent={true}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <Button
                                className={'new-dropdown-button'}
                                onClick={() => handleAddItem('leader_ids')}
                                icon={'add_circle_outline'}
                                label={'Add Team Leader'}
                                disabled={!addNewLeader}
                                transparent={true}
                            />
                        </>
                        )}
                </div>
                <div className='form-actions'>
                    <button type='submit' className='action-button submit-button'>
                        <Icon i={'save'} s={true}/>
                        {teamId ? 'Save changes' : 'Create team'}
                    </button>
                    <button
                        type='button'
                        className='action-button discard-button'
                        onClick={() => closeTopModal()}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </>
    );
}

export default TeamEdit;