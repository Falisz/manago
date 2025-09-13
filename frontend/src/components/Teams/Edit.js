// FRONTEND/components/Teams/Edit.js
import React, {useEffect, useState} from 'react';
import { useModals } from '../../contexts/ModalContext';
import useTeam from '../../hooks/useTeam';
import useUser from '../../hooks/useUser';
import Loader from '../Loader';
import '../../assets/styles/Form.css';
import '../../assets/styles/Teams.css';
import Dropdown from "../Dropdown";
import Button from "../Button";

const FORM_CLEAN_STATE = {
    code_name: '',
    name: '',
    parent_team: null,
    manager_ids: [null],
    leader_ids: [null],
    member_ids: [null],
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
                parent_team: team?.parent?.id || null,
                leader_ids: team?.leaders?.map((lead) => lead.id) || [null],
                manager_ids: team?.managers?.map((mgr) => mgr.id) || [null],
                member_ids: team?.members?.map((member) => member.id) || [null],
            });
        });

    }, [teamId, setLoading, fetchTeam, fetchUsers, fetchManagers, fetchTeams]);

    const handleChange = (e, index) => {
        const { name, value, type, checked } = e.target;

        if (['manager_ids', 'leader_ids', 'member_ids'].includes(name)) {
            setFormData(prev => ({
                ...prev,
                [name]: [
                    ...prev[name].slice(0, index),
                    parseInt(value) || null,
                    ...prev[name].slice(index + 1),
                ],
            }));
        } else if (name === 'parent_team') {
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
        if (!['manager_ids', 'leader_ids', 'member_ids'].includes(field)) return;

        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], null],
        }))
    }

    const handleRemoveItem = (field, index) => {
        if (!['manager_ids', 'leader_ids', 'member_ids'].includes(field)) return;

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

    const getSelectableItems = (index, dropdownName) => {
        if (!['manager_ids', 'leader_ids', 'member_ids'].includes(dropdownName)) {
            console.warn(`Invalid dropdownName: ${dropdownName}`);
            return [];
        }
        const currentSelected = formData[dropdownName] && formData[dropdownName][index];
        const source = dropdownName === 'manager_ids' ? managers : users;
        if (!source) return [];
        return source.filter( user => {
            if (!user || typeof user.id !== 'number') return false;
            return user.id === currentSelected || (
                !formData.member_ids.includes(user.id) &&
                !formData.leader_ids.includes(user.id) &&
                !formData.manager_ids.includes(user.id) );
        }) || [];
    }

    const addNewItem = (dropdownName) => {
        if (!['manager_ids', 'leader_ids', 'member_ids'].includes(dropdownName)) {
            console.warn(`Invalid dropdownName: ${dropdownName}`);
            return false;
        }
        const source = dropdownName === 'manager_ids' ? managers : users;

        if (!source) return false;

        return !formData[dropdownName].includes(null) && formData[dropdownName].length < source.length;
    };

    const MultiDropdownGroup = ({
                                    dropdownName,
                                    item='Team Member',
                                    itemPlural='Team Members',
                                    membersSource,
                                }) => {

        return (
            <div className='form-group'>
                <div className={'form-label'}>
                    {itemPlural}
                </div>
                {membersSource?.length === 0 ? (<p>No {itemPlural.toLowerCase()} available.</p>) : (
                    <>
                        <div className={'form-section'}>
                            {formData[dropdownName].map((userId, index) => (
                                <div key={index} className='dropdown-item'>
                                    <Dropdown
                                        name={dropdownName}
                                        value={userId}
                                        options={getSelectableItems(index, dropdownName).map(user => ({
                                            id: user.id,
                                            name: user.first_name + ' ' + user.last_name
                                        }))}
                                        onChange={(e) => handleChange(e, index)}
                                        placeholder={`Select ${item}`}
                                        noneAllowed={true}
                                    />
                                    {index > 0 && (
                                        <Button
                                            className={'remove-button'}
                                            onClick={() => handleRemoveItem(dropdownName, index)}
                                            icon={'remove_circle_outline'}
                                            transparent={true}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <Button
                            className={'new-dropdown-button'}
                            onClick={() => handleAddItem(dropdownName)}
                            icon={'add_circle_outline'}
                            label={`Add ${item}`}
                            disabled={!(addNewItem(dropdownName))}
                            transparent={true}
                        />
                    </>
                )}
            </div>
        );
    }

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
                    <h2 className='form-header'>Details</h2>
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
                            name={`parent_team`}
                            value={formData?.parent_team}
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
                <div className='form-section vertical'>
                    <h2 className='form-header'>Members</h2>
                    <MultiDropdownGroup
                        dropdownName={'manager_ids'}
                        item={'Team Manager'}
                        itemPlural={'Team Managers'}
                        membersSource={managers}
                    />
                    <MultiDropdownGroup
                        dropdownName={'leader_ids'}
                        item={'Team Leader'}
                        itemPlural={'Team Leaders'}
                        membersSource={users}
                    />
                    <MultiDropdownGroup
                        dropdownName={'member_ids'}
                        item={'Team Member'}
                        itemPlural={'Team Members'}
                        membersSource={users}
                    />
                </div>
                <div className='form-section align-center'>
                    <Button
                        className={'save-button'}
                        type={'submit'}
                        label={teamId ? 'Save changes' : 'Create team'}
                        icon={'save'}
                    />
                    <Button
                        className={'discard-button'}
                        type={'button'}
                        label={'Discard'}
                        icon={'close'}
                        onClick={closeTopModal}
                    />
                </div>
            </form>
        </>
    );
}

export default TeamEdit;