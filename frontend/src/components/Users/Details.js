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
        <>
            <h1>{user?.first_name + ' ' + user?.last_name}</h1>
            <div className="user-detail">
                <div className={"user-detail-label"}>ID</div>
                <div className={"user-detail-data"}>{user.ID}</div>
                <div className={"user-detail-label"}>Name</div>
                <div className={"user-detail-data"}>{user.first_name} {user.last_name}</div>
                <div className={"user-detail-label"}>Login</div>
                <div className={"user-detail-data"}>{user.login}</div>
                <div className={"user-detail-label"}>E-Mail</div>
                <div className={"user-detail-data"}>{user.email}</div>
                <div className={"user-detail-label"}>Active?</div>
                {user.active ? <div className={"user-detail-data true"}><i className="material-symbols-outlined">check</i> Active</div>
                    : <div className={"user-detail-data false"}><i className="material-symbols-outlined">close</i> Not Active</div>}
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
        </>
    );
};

export default UserDetails;