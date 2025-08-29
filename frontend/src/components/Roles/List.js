// FRONTEND/components/Roles/List.js
import React from "react";
import { useModals } from "../../contexts/ModalContext";
import Loader from "../Loader";

const RolesList = ({ roles, loading }) => {
    const { openModal } = useModals();

    if (loading) {
        return <Loader />;
    }
    
    return (
        <div className="roles-list">
            {roles.length === 0 ? (
                <p>No roles found.</p>
            ) : (
                roles.map((role) => (
                    <div
                        className="roles-list-item"
                        key={role.ID}
                        onClick={() => openModal({ type: 'roleDetails', data: { id: role.ID } })}
                    >
                        <div>{role.name}</div>
                        <div>{role.users?.length > 0 ? role.users.length + " users with this role." : <i>No users with this role.</i>}</div>
                    </div>
                ))
            )}
        </div>
    );
};

export default RolesList;