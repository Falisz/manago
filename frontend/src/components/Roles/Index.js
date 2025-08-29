// FRONTEND/components/Roles/Index.js
import React, { useEffect } from "react";
import { useModals } from "../../contexts/ModalContext";
import useRoles from "../../hooks/useRoles";
import '../../assets/styles/Roles.css';
import Button from "../Button";
import RolesList from "./List";

const RolesIndex = () => {
    const { openModal } = useModals();
    const { roles, loading: rolesLoading, fetchRoles } = useRoles();

    useEffect(() => {
        if (!roles) {
            fetchRoles().then();
        }
    }, [fetchRoles, roles]);

    return (
        <>
            <h1>Security Roles</h1>
            <Button
                className="new-role-button"
                onClick={() => openModal({ type: 'userNew' })}
                label={'Add Role'}
                icon={'add'}
            />
            <RolesList
                roles={roles}
                loading={rolesLoading}
            />
        </>
    );
};

export default RolesIndex;