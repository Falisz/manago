// FRONTEND\components\Users\Index.js
import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate, useParams} from "react-router-dom";
import '../../assets/styles/Users.css';
import UserEdit from "./Edit";
import Modal from "../Modal";
import useUsers from "../../hooks/useUsers";
import useUser from "../../hooks/useUser";
import UserDetails from "./Details";
import UsersTable from "./Table";

const UsersIndex = () => {
    const { userId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { users, loading: usersLoading, fetchUsers } = useUsers();
    const { user, loading: userLoading, fetchUser, deleteUser } = useUser();
    const [ showDetailModal, setShowDetailModal] = useState(false);
    const [ showEditModal, setShowEditModal] = useState(false);
    const [ discardEditWarning, setDiscardEditWarning] = useState(false);

    useEffect(() => {
        if (!users) {
            fetchUsers().then();
        }
    }, [fetchUsers, users]);

    useEffect(() => {
        const isEditMode = location.pathname.includes('/new') || location.pathname.includes('/edit');

        setShowDetailModal(!!userId);

        setShowEditModal(isEditMode);

        if (userId) {
            fetchUser(userId).then();
        }
    }, [userId, location.pathname, fetchUser]);

    const handleSave = (newUserId) => {
        fetchUsers(false).then();
        if (newUserId) {
            fetchUser(newUserId).then();
            setShowEditModal(false);
            navigate(`/employees/${newUserId}`);
        } else {
            fetchUser(userId, true).then();
            setShowEditModal(false);
            navigate(`/employees/${userId}`);
        }
    };

    const setDiscardWarning = () => {
        setDiscardEditWarning(true);
    }

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        deleteUser(userId).then();
        fetchUsers(false).then();
        navigate('/employees');
    };

    const closeDetailsModal = () => {
        setShowDetailModal(false);
        navigate('/employees/');
    };

    const closeEditModal = () => {
        if (discardEditWarning) {
            if (!window.confirm('Changes were made. Are you sure you want to discard them?')) return;
        }
        setDiscardEditWarning(false);
        setShowEditModal(false);
        if (userId) {
            navigate(`/employees/${userId}`);
        } else {
            navigate('/employees/');
        }
    };

    return (
        <>
            <h1>Employees of Zyrah</h1>
            <button className="new-user-button" onClick={() => navigate('/employees/new')}>
                + Add Employee
            </button>

            <UsersTable
                users={users}
                loading={usersLoading}
            />

            <Modal
                hidden={!showDetailModal}
                onClose={closeDetailsModal}
                key={'detail'}
            >
                {userId &&
                    <UserDetails
                        user={user}
                        loading={userLoading}
                        handleDelete={handleDelete}
                    />}
            </Modal>

            <Modal
                hidden={!showEditModal}
                onClose={closeEditModal}
                key={'edit-form'}>
                { (location.pathname.includes('/new') || location.pathname.includes('/edit')) && <UserEdit
                    userId={userId}
                    onSave={handleSave}
                    enableDiscardWarning={setDiscardWarning}
                />}
            </Modal>
        </>
    );
};

export default UsersIndex;