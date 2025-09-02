// FRONTEND/components/Roles/Details.js
import React, {useEffect} from "react";
import Loader from "../Loader";
import useRole from "../../hooks/useRole";
import { useModals } from "../../contexts/ModalContext";

const RoleDetails = ({ roleId }) => {
    const { role, loading, fetchRole, deleteRole } = useRole();
    const { openModal, closeTopModal, refreshData, refreshTriggers } = useModals();

    useEffect(() => {
        if (roleId) {
            fetchRole(roleId).then();
        }
    }, [roleId, fetchRole]);

    useEffect(() => {
        if (refreshTriggers?.role?.data === parseInt(roleId)) {
            fetchRole(roleId, true).then();
        }
    }, [roleId, fetchRole, refreshTriggers]);

    const handleDelete = async () => {
        openModal({
            type: 'confirm',
            isPopUp: true,
            message: 'Are you sure you want to delete this role? This action cannot be undone.',
            onConfirm: () => {
                closeTopModal();
                setTimeout(() => {
                    deleteRole(roleId).then();
                    refreshData('roles', true);
                    closeTopModal();
                }, 300);
            },
        });
    };

    if (loading) {
        return <Loader />;
    }

    if (!role) {
        return <h1>Role not found!</h1>;
    }

    return (
        <div className="role-detail">
            <div className="role-detail-header">
                <div className={"role-id"} title={"Role ID"}>#{role.id}</div>
                <div className={"role-name"} title={"Role Name"}>{role.name}</div>
            </div>
            <div className="role-detail-group">
                <div className={"role-detail-label"}>Role details</div>
                <div className={"role-description"} title={"Role description"}> {role.description}</div>
                {role.system_default ? (
                    <div className="role-system-default">
                        <i className="material-symbols-outlined true">check</i> This is system default role. You cannot edit nor delete it.
                    </div>
                ) : (null)}
                </div>
            
            <div className="role-detail-group">
                <div className={"role-detail-label"}>Users with this role</div>
                {role.users?.length > 0 ? role.users.map((user) => (
                    <div 
                        className={"user-detail-data link"} 
                        key={user.id} 
                        onClick={() => openModal({ type: 'userDetails', data: { id: user.id } })}
                    >
                        {user.first_name} {user.last_name}
                    </div>
                )) :
                <div className={"user-detail-data placeholder"}>No users with this role.</div>}
            </div>
            <button
                type="button"
                className="button"
                onClick={() => openModal({ type: 'roleEdit', data: { id: role.id } })}
            >
                <i className="material-symbols-outlined">edit</i> Edit Role
            </button>
            <button type="button" className="delete-button" onClick={handleDelete}>
                <i className="material-symbols-outlined">delete</i> Delete Role
            </button>
        </div>
    );
};

export default RoleDetails;