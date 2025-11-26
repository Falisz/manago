// FRONTEND/components/Roles/Edit.js
import React, { useEffect, useMemo } from 'react';
import {useRoles} from '../../hooks/useResource';
import EditForm from '../EditForm';
import Loader from '../Loader';

const RoleEdit = ({ roleId, modal }) => {
    const { role, loading, setLoading, fetchRole, saveRole } = useRoles();

    useEffect(() => {
        if (roleId)
            fetchRole({roleId}).then();
        else 
            setLoading(false);
        
    }, [roleId, setLoading, fetchRole]);

    const fields = useMemo(() => ({
        name: {
            section: 0,
            type: 'string',
            inputType: 'input',
            label: 'Name',
            required: true,
        },
        icon: {
            section: 0,
            type: 'string',
            inputType: 'input',
            label: 'Icon',
        },
        description: {
            section: 1,
            type: 'string',
            inputType: 'textarea',
            label: 'Description',
        }
    }), []);

    const presetData = useMemo(() => {
        return role ? role : {};
    }, [role]);

    if (loading) 
        return <Loader />;

    return <EditForm 
        header={roleId && role ? `Editing ${role.name}` : 'Creating new Role'} 
        fields={fields}
        onSubmit={async (formData) => await saveRole({roleId, formData})}
        modal={modal}
        presetData={presetData} 
    />;
};

export default RoleEdit;