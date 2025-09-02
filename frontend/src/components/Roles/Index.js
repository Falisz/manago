// FRONTEND/components/Roles/Index.js
import React, { useEffect } from "react";
import { useModals } from "../../contexts/ModalContext";
import useRoles from "../../hooks/useRoles";
import '../../assets/styles/Roles.css';
import Button from "../Button";
import Loader from "../Loader";

// TODO: Add Roles descriptions similarly as for the App Modules.
// TODO: Implement role restriction over the UI.

const RolesList = () => {
    const { openModal, refreshTriggers } = useModals();
    const { roles, loading, fetchRoles } = useRoles();

    useEffect(() => {
        if (!roles) fetchRoles().then();
    }, [fetchRoles, roles]);

    useEffect(() => {
        if (refreshTriggers?.roles) fetchRoles(false).then();
    }, [fetchRoles, refreshTriggers]);

    if (loading) return <Loader />;
    
    return (
        <div className="roles-list">
            {roles === null || roles?.length === 0 ? (
                <p>No roles found.</p>
            ) : (
                roles?.map((role) => (
                    <div
                        className="roles-list-row"
                        key={role.id}
                        onClick={() => openModal({ type: "roleDetails", data: { id: role.id } })}
                    >
                        <div className="role-content">
                            <div className="role-title">{role.name}</div>
                            <div className="role-users">{role.users?.length > 0 ? role.users.length + " users with this role." : <i>No users with this role.</i>}</div>
                        </div>
                        {role.description && <div className="role-description">
                            {role.description}
                        </div>}
                    </div>
                ))
            )}
        </div>
    );
};

const RolesIndex = () => {
    const { openModal } = useModals();

    return (
        <>
            <h1>Security Roles</h1>
            <Button
                className="new-role-button"
                onClick={() => openModal({ type: 'roleNew' })}
                label={'Add Role'}
                icon={'add'}
            />
            <RolesList/>
        </>
    );
};

export default RolesIndex;