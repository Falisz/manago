// FRONTEND/components/Shifts/Edit.js
import React, { useMemo } from 'react';
import { useUsers, useShifts, useJobPosts } from '../../hooks/useResource';
import EditForm from '../EditForm';
import Loader from '../Loader';

const ShiftEdit = ({ shiftId, modal }) => {
    const { shift, loading, setLoading, fetchShift, saveShift } = useShifts();
    const { users, fetchUsers } = useUsers();
    const { jobPosts, fetchJobPosts } = useJobPosts();
    
    React.useEffect(() => {
        if (shiftId) 
            fetchShift({id: shiftId}).then(); 
        else 
            setLoading(false);

        fetchUsers().then();
        fetchJobPosts().then();

    }, [shiftId, setLoading, fetchShift, fetchUsers, fetchJobPosts]);

    const fieldOptions = useMemo( () => ({
        users: (users?.length && users.map(user => ({id: user.id, name: `${user.first_name} ${user.last_name}`})))
            || [{id: null, name: 'None'}],
        job_posts: (jobPosts?.length && jobPosts.map(post => ({id: post.id, name: post.name}))) 
            || [{id: null, name: 'None'}]
    }), [users, jobPosts]);

    const fields = useMemo(() => ({
        user: {
            section: 0,
            type: 'string',
            inputType: 'dropdown',
            label: 'User',
            options: fieldOptions.users,
            required: true
        },
        date: {
            section: 1,
            type: 'date',
            inputType: 'date',
            label: 'Date',
            required: true
        },
        start_time: {
            section: 1,
            type: 'time',
            inputType: 'time',
            label: 'Start Time',
            required: true
        },
        end_time: {
            section: 1,
            type: 'time',
            inputType: 'time',
            label: 'End Time',
            required: true
        },
        job_post: {
            section: 2,
            type: 'string',
            inputType: 'dropdown',
            label: 'Job Post',
            options: fieldOptions.job_posts,
            required: true
        }
    }), [fieldOptions]);

    const presetData = useMemo(() => (shift ? {
        ...shift, 
        user: shift.user?.id, 
        job_post: shift.job_post?.id
    } : {}) , [shift]);

    if (loading)
        return <Loader/>;

    return <EditForm
        header={'Editting a Shift'}
        fields={fields}
        onSubmit={async (data) => await saveShift({id: shiftId, data})}
        modal={modal}
        presetData={presetData}
    />
};

export default ShiftEdit;