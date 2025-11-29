// FRONTEND/components/Roles/Edit.js
import React, { useEffect, useMemo } from 'react';
import {useRoles} from '../../hooks/useResource';
import EditForm from '../EditForm';
import Loader from '../Loader';

const RoleEdit = ({ roleId, modal }) => {
    const { role, loading, setLoading, fetchRole, saveRole } = useRoles();

    useEffect(() => {
        if (roleId)
            fetchRole({id: roleId}).then();
        else 
            setLoading(false);
        
    }, [roleId, setLoading, fetchRole]);

    const sections = useMemo(() => ({
        0: {
            fields: {
                name: {
                    type: 'input',
                    label: 'Name',
                    required: true,
                },
                icon: {
                    type: 'input',
                    label: 'Icon',
                }
            }
        },
        1: {
            fields: {
                description: {
                    type: 'textarea',
                    label: 'Description',
                }
            }
        }
    }), []);

    const presetData = useMemo(() => {
        return role ? role : {};
    }, [role]);

    if (loading) 
        return <Loader />;

    return <EditForm 
        header={roleId && role ? `Editing ${role.name}` : 'Creating new Role'} 
        sections={sections}
        onSubmit={async (data) => await saveRole({id: roleId, data})}
        modal={modal}
        presetData={presetData} 
    />;
};

export default RoleEdit;