// FRONTEND/components/Roles/Edit.js
import React, { useEffect, useMemo } from 'react';
import useRole from '../../hooks/useRole';
import Loader from '../Loader';
import '../../assets/styles/Form.css';
import EditForm from '../EditForm';

const RoleEdit = ({ roleId }) => {
    const { role, loading, setLoading, fetchRole, saveRole } = useRole();

    useEffect(() => {
        if (roleId) {
            fetchRole(roleId).then();
        } else {
            setLoading(false);
        }
    }, [roleId, setLoading, fetchRole]);

    const formStructure = useMemo(() => ({
        header: {
            title: roleId ? `Editing ${role?.name}` : 'Creating new Role',
        },
        inputs: {
            name: {
                section: 0,
                field: 'name',
                type: 'string',
                inputType: 'input',
                label: 'Name',
                required: true,
            },
            description: {
                section: 1,
                field: 'description',
                type: 'string',
                inputType: 'textarea',
                label: 'Description',
            }
        },
        onSubmit: {
            onSave: (data, id) => saveRole(data, id),
            refreshTriggers: [['roles', true], ...(role ? [['role', role.id]] : [])],
            openIfNew: 'userDetails'
        },
    }), [saveRole, role, roleId]);

    const roleData = useMemo(() => {
        return role ? role : {};
    }, [role]);

    if (loading) return <Loader />;

    return (
        <EditForm
            structure={formStructure}
            presetData={roleData}
        />
    );
};

export default RoleEdit;