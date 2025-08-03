//FRONTEND:components/Roles/List.js
import {useNavigate} from "react-router-dom";
import Loader from "../Loader";
import React from "react";

const RolesList = ({ roles, loading }) => {

    const navigate = useNavigate();

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
                        onClick={() => navigate('/employees/roles/' + role.ID)}
                    >
                        <div>{role.name}</div>
                        <div>{role.power}</div>
                    </div>
                ))
            )}
        </div>
    );
};

export default RolesList;