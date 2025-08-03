//FRONTEND:components/Roles/Details.js
import React from 'react';
import {useNavigate} from "react-router-dom";
import Loader from "../Loader";

const RoleDetails = ({ role, loading, handleDelete }) => {
    const navigate = useNavigate();

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
                    onClick={() => navigate('/employees/roles/edit/' + role.ID)}
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