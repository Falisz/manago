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
    leader_ids: [],
    manager_ids: [],
};

const TeamEdit = ({ teamId }) => {
    const { loading, error, warning, success, setLoading, fetchTeam } = useTeam();
    const { teams, fetchTeams } = useTeam();
    const { users, fetchUsers } = useUser();
    const { users: managers, fetchUsers: fetchManagers } = useUser();
    const { openModal, setDiscardWarning, refreshData, closeTopModal } = useModals();
    const [ formData, setFormData ] = useState(FORM_CLEAN_STATE);
    const [ mgrSelections, setMgrSelections ] = useState([]);
    const [ leadSelections, setLeadSelections ] = useState([]);

    useEffect(() => {
        fetchUsers().then();
        fetchManagers().then();
        fetchTeams().then();

        if (!teamId) {
            setFormData(FORM_CLEAN_STATE);
            setMgrSelections(['']);
            setLeadSelections(['']);
            setLoading(false);
            return;
        }

        fetchTeam(teamId).then(team => {
            setFormData({
                code_name: team?.code_name || '',
                name: team?.name || '',
                parent_team_id: team?.parent?.id || null,
                leader_ids: team?.leaders?.map((lead) => lead.id) || [],
                manager_ids: team?.managers?.map((mgr) => mgr.id) || [],
            });
            setMgrSelections(team?.managers?.map((mgr) => mgr.id.toString()) || []);
            setLeadSelections(team?.leaders?.map((lead) => lead.id.toString()) || []);
        });

    }, [teamId, setLoading, fetchTeam, fetchUsers, fetchManagers, fetchTeams]);

    useEffect(() => {
        const selectedIds = mgrSelections?.filter(id => id !== '' && id !== 0).map(id => parseInt(id));
        setFormData(prev => ({ ...prev, manager_ids: selectedIds }));
    }, [mgrSelections]);

    useEffect(() => {
        const selectedIds = leadSelections?.filter(id => id !== '' && id !== 0).map(id => parseInt(id));
        setFormData(prev => ({ ...prev, leader_ids: selectedIds }));
    }, [leadSelections]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setDiscardWarning(true);
    };

    const handleLeadChange = (index, value) => {
        setLeadSelections(prev => {
            const newSel = [...prev];
            newSel[index] = value;
            return newSel;
        });
        setDiscardWarning(true);
    };

    const handleAddLead = () => {
        setLeadSelections(prev => [...prev, '']);
        setDiscardWarning(true);
    };

    const handleRemoveLead = (index) => {
        setLeadSelections(prev => prev.filter((_, i) => i !== index));
        setDiscardWarning(true);
    };

    const handleMgrChange = (index, value) => {
        setMgrSelections(prev => {
            const newSel = [...prev];
            newSel[index] = value;
            return newSel;
        });
        setDiscardWarning(true);
    };

    const handleAddMgr = () => {
        setMgrSelections(prev => [...prev, '']);
        setDiscardWarning(true);
    };

    const handleRemoveMgr = (index) => {
        setMgrSelections(prev => prev.filter((_, i) => i !== index));
        setDiscardWarning(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // const savedTeam = await saveTeam(formData, teamId);
        const savedTeam = console.log(formData); // Placeholder until saveTeam is implemented
        if (savedTeam) {
            setDiscardWarning(false);
            setTimeout(() => {
                closeTopModal();
                if (!teamId) {
                    setTimeout(() => {
                        openModal({ content: 'userDetails', contentId: savedTeam.id });
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
        return teams?.filter(t => t.id !== teamId) || [];
    }

    const getAvailableTeamLeaders = (index) => {
        const currentSelected = leadSelections[index];
        return users?.filter(user => {
            const idStr = user.id.toString();
            return idStr === currentSelected || !leadSelections.includes(idStr);
        }) || [];
    };

    const getAvailableManagers = (index) => {
        const currentSelected = mgrSelections[index];
        return managers?.filter(mgr => {
            const idStr = mgr.id.toString();
            return idStr === currentSelected || !mgrSelections.includes(idStr);
        }) || [];
    };

    const showLeadAddButton = leadSelections.filter(id => id !== '').length < (users?.length || 0);
    const showMgrAddButton = mgrSelections.filter(id => id !== '').length < (users?.length || 0);

    if (loading) return <Loader />;

    if (error) return <div className='error-message'>{error}</div>;

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
                            options={getAvailableParentTeams()?.map(team => ({ id: team.id, name: team.name }))||[]}
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
                                {mgrSelections.map((selectedId, index) => (
                                    <div key={index} className='dropdown-item'>
                                        <Dropdown
                                            name={`role_${index}`}
                                            value={selectedId}
                                            options={getAvailableManagers(index).map(manager => ({ id: manager.id.toString(), name: manager.first_name + ' ' + manager.last_name }))}
                                            onChange={(e) => handleMgrChange(index, e.target.value)}
                                            placeholder={'Select a role'}
                                            noneAllowed={true}
                                        />
                                        {index > 0 && (
                                            <Button
                                                className={'remove-button'}
                                                onClick={() => handleRemoveMgr(index)}
                                                icon={'remove_circle_outline'}
                                                transparent={true}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            {showMgrAddButton && (
                                <Button
                                    className={'add-button'}
                                    onClick={handleAddMgr}
                                    icon={'add_circle_outline'}
                                    label={'Add Team Manager'}
                                    transparent={true}
                                />
                            )}
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
                                {leadSelections.map((selectedId, index) => (
                                    <div key={index} className='dropdown-item'>
                                        <Dropdown
                                            name={`role_${index}`}
                                            value={selectedId}
                                            options={getAvailableTeamLeaders(index).map(lead => ({ id: lead.id.toString(), name: lead.first_name + ' ' + lead.last_name }))}
                                            onChange={(e) => handleLeadChange(index, e.target.value)}
                                            placeholder={'Select a role'}
                                            noneAllowed={true}
                                        />
                                        {index > 0 && (
                                            <Button
                                                className={'remove-button'}
                                                onClick={() => handleRemoveLead(index)}
                                                icon={'remove_circle_outline'}
                                                transparent={true}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            {showLeadAddButton && (
                                <Button
                                    className={'add-button'}
                                    onClick={handleAddLead}
                                    icon={'add_circle_outline'}
                                    label={'Add Team Leader'}
                                    transparent={true}
                                />
                            )}
                        </>
                        )}
                </div>
                <div className='form-actions'>
                    <button type='submit' className='action-button submit-button'>
                        <Icon i={'save'} s={true}/>
                        {teamId ? 'Save changes' : 'Create team'}
                    </button>
                    <button type='button' className='action-button discard-button' onClick={() => closeTopModal()}>
                        Cancel
                    </button>
                </div>
            </form>
        </>
    );
}

export default TeamEdit;