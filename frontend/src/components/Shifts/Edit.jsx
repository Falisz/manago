// FRONTEND/components/Shifts/Edit.js
import React, { useMemo } from 'react';
import {useUsers, useShifts, useJobPosts, useJobLocations} from '../../hooks/useResource';
import EditForm from '../EditForm';
import Loader from '../Loader';

const ShiftEdit = ({ shiftId, modal }) => {
    const { shift, loading, setLoading, fetchShift, saveShift } = useShifts();
    const { users, fetchUsers } = useUsers();
    const { jobPosts, fetchJobPosts } = useJobPosts();
    const { jobLocations, fetchJobLocations } = useJobLocations();
    
    React.useEffect(() => {
        if (shiftId) 
            fetchShift({id: shiftId}).then(); 
        else 
            setLoading(false);

        fetchUsers().then();
        fetchJobPosts().then();
        fetchJobLocations().then();

    }, [shiftId, setLoading, fetchShift, fetchUsers, fetchJobPosts, fetchJobLocations]);

    const fieldOptions = useMemo( () => ({
        users: (users?.length && users.map(user => ({id: user.id, name: `${user.first_name} ${user.last_name}`})))
            || [{id: null, name: 'None'}],
        job_posts: (jobPosts?.length && jobPosts.map(post => ({id: post.id, name: post.name}))) 
            || [{id: null, name: 'None'}],
        job_locations: (jobLocations?.length && jobLocations.map(location => ({id: location.id, name: location.name})))
            || [{id: null, name: 'None'}]
    }), [users, jobPosts, jobLocations]);

    const sections = useMemo(() => ({
        0: {
            fields: {
                user: {
                    style: {flex: '0 0 auto'},
                    type: 'dropdown',
                    label: 'User',
                    options: fieldOptions.users,
                    required: true
                }
            }
        },
        1: {
            style: {
                flexWrap: 'nowrap'
            },
            fields: {
                date: {
                    style: {flex: '1 1 auto'},
                    type: 'date',
                    label: 'Date',
                    required: true
                },
                start_time: {
                    style: {flex: '1 1 auto'},
                    type: 'time',
                    label: 'Start Time',
                    required: true
                },
                end_time: {
                    style: {flex: '1 1 auto'},
                    type: 'time',
                    label: 'End Time',
                    required: true
                },
            }
        },
        2: {
            fields: {
                job_post: {
                    type: 'dropdown',
                    label: 'Job Post',
                    options: fieldOptions.job_posts
                },
                job_location: {
                    type: 'dropdown',
                    label: 'Job Location',
                    options: fieldOptions.job_locations
                }
            }
        },
        3: {
            fields: {
                note: {
                    type: 'textarea',
                    label: 'Note',
                    placeholder: 'Optional Shift note'
                }
            }
        }
    }), [fieldOptions]);

    const presetData = useMemo(() => (shift ? {
        ...shift, 
        user: shift.user?.id,
        job_post: shift.job_post?.id,
        job_location: shift.job_location?.id
    } : {}), [shift]);

    if (loading)
        return <Loader/>;

    return <EditForm
        header={'Editing a Shift'}
        sections={sections}
        onSubmit={async (data) => await saveShift({id: shiftId, data})}
        modal={modal}
        presetData={presetData}
    />
};

export default ShiftEdit;