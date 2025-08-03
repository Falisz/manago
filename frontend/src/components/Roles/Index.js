import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useParams } from "react-router-dom";
import '../../assets/styles/Roles.css';
import Modal from "../Modal";
import Loader from "../Loader";
import RoleEdit from "./Edit";

const RoleDetail = ({ roleId, handleDelete }) => {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRole = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`/roles/${roleId}`, { withCredentials: true });
                if (res.data) {
                    setRole(res.data);
                } else {
                    setError('Role not found!');
                }
            } catch (err) {
                console.error('Error fetching role:', err);
                setError('Role not found!');
            } finally {
                setLoading(false);
            }
        };
        if (roleId && !isNaN(roleId)) {
            fetchRole().then();
        } else {
            setError('Invalid role ID');
            setLoading(false);
        }
    }, [roleId]);

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return <h1>{error}</h1>;
    }

    return (
        <>
            <h1>{role?.name}</h1>
            {error && <div className="error-message">{error}</div>}
            <div className="user-detail">
                <pre>
                    {JSON.stringify(role, null, 2)}
                </pre>
                <button
                    type="button"
                    className="button"
                    onClick={() => navigate('/employees/roles/edit/' + role.ID)}
                >
                    <i className={'material-symbols-outlined'}>edit</i> Edit Role
                </button>
                <button type="button" className="delete-button" onClick={handleDelete}>
                    <i className={'material-symbols-outlined'}>delete</i> Delete Role
                </button>
            </div>
        </>
    );
};

const RolesList = ({roles, loading}) => {
    const navigate = useNavigate();

    if (loading)
        return <Loader />;
    return (
        <div className="roles-list">
            {roles.length === 0 ? (<p>No roles found.</p>) : (roles.map(role => (
                <div
                    className="roles-list-item"
                    key={role.ID}
                    onClick={() => navigate('/employees/roles/' + role.ID)}
                >
                    <div>{role.name}</div>
                    <div>{role.power}</div>
                </div>
            )))}
        </div>
    )
}

const RolesIndex = () => {
    const { roleId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const refreshRoles = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('/roles', { withCredentials: true });
            setRoles(response.data);
        } catch (err) {
            console.error('Error fetching roles:', err);
            setError('Failed to load roles. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const isEditMode = location.pathname.includes('/new') || location.pathname.includes('/edit');
        if (roleId) {
            setSelectedRoleId(roleId);
            setShowDetailModal(true);
        } else {
            setSelectedRoleId(null);
            setShowDetailModal(false);
        }
        setShowEditModal(isEditMode);
    }, [roleId, location.pathname]);

    useEffect(() => {
        refreshRoles().then();
    }, [refreshRoles]);

    const goBack = (roleId) => {
        if (showEditModal && roleId) {
            setShowEditModal(false);
            navigate('/employees/roles/' + roleId);
        } else {
            setShowEditModal(false);
            setShowDetailModal(false);
            navigate('/employees/roles');
        }
    };

    const handleDelete = async (roleId) => {
        if (!window.confirm('Are you sure you want to delete this role?')) return;
        try {
            await axios.delete(`/roles/${roleId}`, { withCredentials: true });
        } catch (err) {
            console.error('Error deleting role:', err);
        } finally {
            refreshRoles().then();
            goBack();
        }
    };

    return (
        <>
            <h1>Roles in Zyrah</h1>
            <button className="new-role-button" onClick={() => navigate('/employees/roles/new')}>
                + Add Role
            </button>

            <RolesList roles={roles} loading={loading} />

            <Modal
                hidden={!showDetailModal}
                onClose={() => goBack(selectedRoleId)}
                closeButton={true}
                key={'detail'}
            >
                {selectedRoleId && <RoleDetail
                    roleId={selectedRoleId}
                    handleDelete={() => handleDelete(selectedRoleId).then()}
                />}
            </Modal>
            <Modal
                hidden={!showEditModal}
                onClose={() => goBack(selectedRoleId)}
                closeButton={true}
                key={'edit-form'}
            >
                <RoleEdit
                    roleId={selectedRoleId}
                    onSave={refreshRoles}
                />
            </Modal>
        </>
    );
};

export default RolesIndex;