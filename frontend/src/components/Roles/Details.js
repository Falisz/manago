// FRONTEND/components/Roles/Details.js
import React, {useEffect} from "react";
import Loader from "../Loader";
import useRole from "../../hooks/useRole";
import { useModals } from "../../contexts/ModalContext";

const RoleDetails = ({ roleId }) => {
    const { role, loading, fetchRole, deleteRole } = useRole();
    const { openModal, closeTopModal } = useModals();

    useEffect(() => {
        if (roleId) {
            fetchRole(roleId).then();
        }
    }, [roleId, fetchRole]);

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this role?')) return;
        deleteRole(roleId).then();
        closeTopModal();
    };

    if (loading) {
        return <Loader />;
    }

    if (!role) {
        return <h1>Role not found!</h1>;
    }

    console.log(role);

    return (
        <div className="role-detail">
            <div className="role-detail-header">
                <div className={"role-id"} title={"Role ID"}>#{role.ID}</div>
                <div className={"role-name"} title={"Role Name"}>{role.name}</div>
            </div>
            <div className="role-detail-group">
                <div className={"role-detail-label"}>Role details</div>
                <div className={"role-login"} title={"Power"}>Power: {role.power}</div>
                {role.system_default ? (
                    <div className="role-system-default">
                        <i className="material-symbols-outlined true">check</i> This is system default role.
                    </div>
                ) : (
                    <div className="role-system-default">
                        <i className="material-symbols-outlined false">close</i> This is not system default role.
                    </div>
                )}
                </div>
            
            <div className="role-detail-group">
                <div className={"role-detail-label"}>Users with this role</div>
                {role.users?.length > 0 ? role.users.map((user) => (
                    <div 
                        className={"user-detail-data link"} 
                        key={user.ID} 
                        onClick={() => openModal({ type: 'userDetails', data: { id: user.ID } })}
                    >
                        {user.first_name} {user.last_name}
                    </div>
                )) :
                <div className={"user-detail-data placeholder"}>No users with this role.</div>}
            </div>
            <button
                type="button"
                className="button"
                onClick={() => openModal({ type: 'roleEdit', data: { id: role.ID } })}
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