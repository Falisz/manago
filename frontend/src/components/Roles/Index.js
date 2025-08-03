//FRONTEND:components/Roles/Index.js
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from "react-router-dom";
import '../../assets/styles/Roles.css';
import Modal from "../Modal";
import useRoles from "../../hooks/useRoles";
import useRole from "../../hooks/useRole";
import RolesList from "./List";
import RoleDetails from "./Details";
import RoleEdit from "./Edit";
import Button from "../Button";

const RolesIndex = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { roles, loading: rolesLoading, fetchRoles } = useRoles();
    const { role, loading: roleLoading, fetchRole, deleteRole } = useRole();
    const {roleId} = useParams();
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        if (!roles) {
            fetchRoles().then();
        }
    }, [fetchRoles, roles]);

    useEffect(() => {
        const isEditMode = location.pathname.includes('/new') || location.pathname.includes('/edit');

        setShowDetailModal(!!roleId);

        setShowEditModal(isEditMode);

        if (roleId) {
            fetchRole(roleId).then();
        }
    }, [roleId, location.pathname, fetchRole]);

    const handleDelete = () => {
        if (!window.confirm('Are you sure you want to delete this role?')) return;
        deleteRole(roleId).then();
        fetchRoles().then();
        navigate('/employees/roles');
    };

    const handleSave = (newRoleId) => {
        fetchRoles().then();
        if (newRoleId) {
            fetchRole(newRoleId).then();
            setShowEditModal(false);
            navigate(`/employees/roles/${newRoleId}`);
        } else {
            fetchRole(roleId).then();
            setShowEditModal(false);
            navigate(`/employees/roles/${roleId}`);
        }
    };

    const closeDetailsModal = () => {
        setShowDetailModal(false);
        navigate('/employees/roles');
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        if (roleId) {
            navigate(`/employees/roles/${roleId}`);
        } else {
            navigate('/employees/roles');
        }
    };

    return (
        <>
            <h1>Security Roles</h1>

            <Button
                className="new-role-button"
                onClick={() => navigate('/employees/roles/new')}
                label={'Add Role'}
                icon={'add'}
            />

            <RolesList
                roles={roles}
                loading={rolesLoading}
            />

            <Modal
                hidden={!showDetailModal}
                onClose={closeDetailsModal}
                key="detail"
            >
                {roleId && (
                    <RoleDetails
                        role={role}
                        loading={roleLoading}
                        handleDelete={handleDelete}
                    />
                )}
            </Modal>
            <Modal
                hidden={!showEditModal}
                onClose={closeEditModal}
                key="edit-form"
            >
                <RoleEdit
                    roleId={roleId}
                    onSave={handleSave}
                />
            </Modal>
        </>
    );
};

export default RolesIndex;