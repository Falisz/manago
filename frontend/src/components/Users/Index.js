// FRONTEND/components/Users/Index.js
import React, { useEffect } from "react";
import { useModals } from "../../contexts/ModalContext";
import useUsers from "../../hooks/useUsers";
import '../../assets/styles/Users.css';
import Button from "../Button";
import UsersTable from "./Table";

// TODO: Make page division into Employees, Managers and AllUsers
// TODO: Add Teams as sub-page of Employees - make the index page "Teams & Employees" with Add new... button for both Employees and Teams
// TODO: Add table fields - Employees will have Managers field, while Manager will also have Reporting Users field
// TODO: List selections with actions like delete, assign Role, assign Manager, assign Reporting User etc.
const UsersIndex = () => {
    const { openModal } = useModals();
    const { users, loading: usersLoading, fetchUsers } = useUsers();

    useEffect(() => {
        if (!users) {
            fetchUsers().then();
        }
    }, [fetchUsers, users]);

    return (
        <>
            <h1>Employees of Zyrah</h1>
            <Button
                className="new-user-button"
                onClick={() => openModal({ type: 'userNew' })}
                label={'Add Employee'}
                icon={'add'}
            />
            <UsersTable
                users={users}
                loading={usersLoading}
            />
        </>
    );
};

export default UsersIndex;