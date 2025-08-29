// FRONTEND/components/Roles/Details.js
import React, {useEffect} from "react";
import Loader from "../Loader";
import useRole from "../../hooks/useRole";
import {useModals} from "../../contexts/ModalContext";

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

    return (
        <>
            <h1>{role.name}</h1>
            <div className="role-detail">
                <div className="role-detail-label">ID</div>
                <div className="role-detail-data">{role.ID}</div>
                <div className="role-detail-label">Name</div>
                <div className="role-detail-data">{role.name}</div>
                <div className="role-detail-label">Power</div>
                <div className="role-detail-data">{role.power}</div>
                <div className="role-detail-label">System Default?</div>
                {role.system_default ? (
                    <div className="role-detail-data true">
                        <i className="material-symbols-outlined">check</i> Yes
                    </div>
                ) : (
                    <div className="role-detail-data false">
                        <i className="material-symbols-outlined">close</i> No
                    </div>
                )}
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
        </>
    );
};

export default RoleDetails;