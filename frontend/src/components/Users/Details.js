//FRONTEND:components/Users/Details.js
import React from "react";
import {useNavigate} from "react-router-dom";
import Loader from "../Loader";

const UserDetails = ({ user, loading, handleDelete }) => {
    const navigate = useNavigate();

    if (loading) {
        return <Loader />;
    }

    if (!user) {
        return <h1>User not found!</h1>;
    }

    return (
        <div className="user-detail">
            <div className="user-detail-group user-detail-header">
                <div className={"user-id"} title={"Employee ID"}>#{user.ID}</div>
                <div className={"user-name"} title={"Full Name"}>{user.first_name} {user.last_name}</div>
            </div>
            <div className="user-detail-group">
                <div className={"user-detail-label"}>Login details</div>
                <div className={"user-login"} title={"Login ID"}>Login ID: {user.ID}</div>
                <div className={"user-login"} title={"Login alias"}>Login alias: {user.login}</div>
                <div className={"user-login"} title={"Login e-mail"}>Login e-mail: {user.email}</div>
            </div>
            <div className={"user-detail-label"}>Status</div>
            {user.active ? <div className={"user-detail-data true"}><i className="material-symbols-outlined">check</i> Employee's account is active</div>
                : <div className={"user-detail-data false"}><i className="material-symbols-outlined">close</i> Employee's account is not active</div>}
            {user.manager_view_access ? <div className={"user-detail-data true"}><i className="material-symbols-outlined">check</i> Employee has access to Manager View</div>
                : <div className={"user-detail-data false"}><i className="material-symbols-outlined">close</i> Employee does not have access to Manager View </div>}
            <div className={"user-detail-label"}>Report to</div>
            {user.managers.length > 0 ? user.managers.map((manager) => (
                <div className={"user-detail-data"} key={manager.ID} onClick={() => navigate('/employees/' + manager.ID)}>{manager.first_name} {manager.last_name}</div>
            )):<div className={"user-detail-data placeholder"}>No manager assigned.</div>}
            <div className={"user-detail-label"}>Roles</div>
            {user.roles.length > 0 ? user.roles.map((role) => (
                <div className={"user-detail-data"} key={role.ID}>{role.name}</div>
            )):<div className={"user-detail-data placeholder"}>Na roles assigned.</div>}
            <button type="button" className="button" onClick={() => navigate('/employees/edit/' + user.user)}>
                <i className={'material-symbols-outlined'}>edit</i> Edit Employee
            </button>
            <button type="button" className="delete-button" onClick={handleDelete}>
                <i className={'material-symbols-outlined'}>delete</i>  Delete Employee
            </button>
        </div>
    );
};

export default UserDetails;