// FRONTEND/components/Roles/Edit.js
import React, { useEffect, useMemo } from 'react';
import useRoles from '../../hooks/useRoles';
import EditForm from '../EditForm';
import Loader from '../Loader';

const RoleEdit = ({ roleId }) => {
    const { role, loading, setLoading, fetchRole, saveRole } = useRoles();

    useEffect(() => {
        if (roleId)
            fetchRole({roleId}).then();
        else 
            setLoading(false);
        
    }, [roleId, setLoading, fetchRole]);

    const formStructure = useMemo(() => ({
        header: {
            title: roleId ? `Editing ${role?.name}` : 'Creating new Role',
        },
        fields: {
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
        },
        onSubmit: {
            onSave: (formData, roleId) => saveRole({roleId, formData}),
            refreshTriggers: [['roles', true], ...(role ? [['role', role.id]] : [])],
            openIfNew: 'userDetails'
        },
    }), [saveRole, role, roleId]);

    const roleData = useMemo(() => {
        return role ? role : {};
    }, [role]);

    if (loading) 
        return <Loader />;

    return <EditForm structure={formStructure} presetData={roleData} />;
};

export default RoleEdit;