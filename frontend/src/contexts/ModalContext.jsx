// FRONTEND/contexts/ModalContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import Modal from '../components/Modal';
import UserDetails from '../components/Users/Details';
import UserEdit, {
    UserRoleAssignment,
    UserManagerAssignment,
    UserRoleBulkAssignment,
    UserManagerBulkAssignment
} from '../components/Users/Edit';
import RoleDetails from '../components/Roles/Details';
import RoleEdit from '../components/Roles/Edit';
import TeamDetails from '../components/Teams/Details';
import TeamEdit, {TeamUserAssignment, TeamUserBulkAssignment} from '../components/Teams/Edit';
import PostDetails from '../components/Posts/Details';
import InWorks from '../components/InWorks';
import ConfirmPrompt from '../components/ConfirmPrompt';

const ModalContext = createContext();

const ANIMATION_DURATION = 300;

export const ModalProvider = ({ children }) => {
    const [modalStack, setModalStack] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [refreshTriggers, setRefreshTriggers] = useState({});
    const modalStackRef = useRef([]);

    useEffect(() => {
        modalStackRef.current = modalStack;
    }, [modalStack]);

    const openModal = useCallback((modal) => {
        setModalStack((prev) => {
            const isDuplicate = prev.some(
                (existing) =>
                    existing.content === modal.content &&
                    existing.contentId === modal.contentId
            );
            if (isDuplicate) {
                return prev;
            }
            return [...prev, { ...modal, isVisible: false }];
        });

        setTimeout(() => {
            setModalStack((prev) => {
                const newStack = [...prev];
                if (newStack.length > 0) {
                    newStack[newStack.length - 1] = {
                        ...newStack[newStack.length - 1],
                        isVisible: true,
                    };
                }
                return newStack;
            });
        }, ANIMATION_DURATION);
    }, []);

    const setDiscardWarning = useCallback((value) => {
        setModalStack((prev) => {
            if (prev.length === 0) return prev;
            const top = prev[prev.length - 1];
            if (top.discardWarning === value) return prev;
            const newStack = [...prev];
            newStack[newStack.length - 1] = {
                ...newStack[newStack.length - 1],
                discardWarning: value,
            };
            return newStack;
        });
    }, []);

    const closeModal = useCallback(() => {
        setModalStack((prev) => {
            const newStack = [...prev];

            newStack[newStack.length - 1] = {
                ...newStack[newStack.length - 1],
                isVisible: false,
            };

            return newStack;
        });

        setTimeout(() => {
            setModalStack((prev) => prev.slice(0, -1));
        }, ANIMATION_DURATION);
    }, []);

    const closeTopModal = useCallback(() => {
        const currentStack = modalStackRef.current;
        if (currentStack.length === 0) {
            return;
        }
        const topModal = currentStack[currentStack.length - 1];

        if (topModal?.discardWarning) {
            openModal({
                content: 'confirm',
                type: 'pop-up',
                message: 'Changes were made. Are you sure you want to discard them?',
                onConfirm: () => {
                    setDiscardWarning(false);
                    closeModal();
                },
            });
            return; // Escaping this callback - new pop-up confirmation modal will handle closing from now on.
        }

        closeModal(); // Closing the topModal if there is no discardWarning on it.

    }, [closeModal, openModal, setDiscardWarning]);

    const refreshData = useCallback((content, data) => {
        setRefreshTriggers((prev) => ({
            ...prev,
            [content]: { data, timestamp: Date.now() },
        }));
    }, []);

    const renderModalContent = (modal) => {
        switch (modal.content) {
            case 'userDetails':
                return <UserDetails userId={modal.contentId} />;
            case 'userEdit':
                return <UserEdit userId={modal.contentId} />;
            case 'userRoleAssignment':
                return <UserRoleAssignment user={modal.data} />;
            case 'userRoleBulkAssignment':
                return <UserRoleBulkAssignment users={modal.data} />;
            case 'userManagerAssignment':
                return <UserManagerAssignment user={modal.data} />;
            case 'userManagerBulkAssignment':
                return <UserManagerBulkAssignment users={modal.data} />;
            case 'userNew':
                return <UserEdit />;
            case 'employeeNew':
                return <UserEdit preset={'employee'} />;
            case 'managerNew':
                return <UserEdit preset={'manager'} />;
            case 'roleDetails':
                return <RoleDetails roleId={modal.contentId} />;
            case 'roleEdit':
                return <RoleEdit roleId={modal.contentId} />;
            case 'roleNew':
                return <RoleEdit/>;
            case 'teamDetails':
                return <TeamDetails teamId={modal.contentId} />;
            case 'teamEdit':
                return <TeamEdit teamId={modal.contentId} />;
            case 'TeamUserAssignment':
                return <TeamUserAssignment team={modal.data} />;
            case 'teamUserBulkAssignment':
                return <TeamUserBulkAssignment teams={modal.data} />;
            case 'teamNew':
                return <TeamEdit />;
            case 'subteamNew':
                return <TeamEdit parentId={modal.parentId} />;
            case 'postDetails':
                return <PostDetails postId={modal.contentId} />;
            case 'confirm':
                return <ConfirmPrompt
                    message={modal.message}
                    onConfirm={modal.onConfirm}
                    onConfirm2={modal.onConfirm2}
                    confirmLabel={modal.confirmLabel}
                    confirmLabel2={modal.confirmLabel2}
                    cancelLabel={modal.cancelLabel}
                />;
            default:
                return <InWorks title={'Unknown Modal'} modal={true} />;
        }
    };

    useEffect(() => {
        const newResource = searchParams.get('new');
        if (newResource === 'manager')
            openModal({ content: 'managerNew' });
        else if (newResource === 'employee')
            openModal({ content: 'employeeNew' });
        else if (newResource === 'user')
            openModal({ content: 'userNew' });
        else if (newResource === 'role')
            openModal({ content: 'roleNew' });
        else if (newResource === 'team')
            openModal({ content: 'teamNew' });
        else if (newResource === 'branch')
            openModal({ content: 'branchNew' });
        else if (newResource === 'project')
            openModal({ content: 'projectNew' });
        else if (newResource === 'post')
            openModal({ content: 'postNew' });
        else if (newResource === 'test')
            openModal({ content: 'test' });

        const userDetails = searchParams.get('user');
        if (userDetails) openModal({ content: 'userDetails', contentId: userDetails, type: 'dialog' });
        const editUser = searchParams.get('editUser');
        if (editUser) openModal({ content: 'userEdit', contentId: editUser });

        const roleDetails = searchParams.get('role');
        if (roleDetails) openModal({ content: 'roleDetails', contentId: roleDetails, type: 'dialog' });
        const editRole = searchParams.get('editRole');
        if (editRole) openModal({ content: 'roleEdit', contentId: editRole });

        const teamDetails = searchParams.get('team');
        if (teamDetails) openModal({ content: 'teamDetails', contentId: teamDetails, type: 'dialog' });
        const editTeam = searchParams.get('editTeam');
        if (editTeam) openModal({ content: 'teamEdit', contentId: editTeam });

        const postDetails = searchParams.get('post');
        if (postDetails) openModal({ content: 'postDetails', contentId: postDetails, type: 'dialog' });

        // eslint-disable-next-line
    }, []);

    const { search } = useLocation();
    useEffect(() => {
        const newParams = new URLSearchParams(search);
        modalStack.forEach((modal) => {
            if (modal.content === 'userNew') newParams.set('new', 'user');
            if (modal.content === 'managerNew') newParams.set('new', 'manager');
            if (modal.content === 'employeeNew') newParams.set('new', 'employee');
            if (modal.content === 'roleNew') newParams.set('new', 'role');
            if (modal.content === 'teamNew') newParams.set('new', 'team');
            if (modal.content === 'test') newParams.set('new', 'test');
            if (modal.content === 'userDetails') newParams.set('user', modal.contentId);
            if (modal.content === 'userEdit') newParams.set('editUser', modal.contentId);
            if (modal.content === 'roleDetails') newParams.set('role', modal.contentId);
            if (modal.content === 'roleEdit') newParams.set('editRole', modal.contentId);
            if (modal.content === 'teamDetails') newParams.set('team', modal.contentId);
            if (modal.content === 'teamEdit') newParams.set('editTeam', modal.contentId);
            if (modal.content === 'postDetails') newParams.set('post', modal.contentId);
        });
        setSearchParams(newParams, { replace: true });
    }, [modalStack, setSearchParams, search]);

    return (
        <ModalContext.Provider value={{ openModal, setDiscardWarning, closeTopModal, refreshData, refreshTriggers }}>
            {children}
            {modalStack.map((modal, index) => (
                <Modal
                    key={index}
                    type={modal.type}
                    isVisible={modal.isVisible}
                    style={modal.style}
                    zIndex={1000 + index * 10}
                    onClose={closeTopModal}
                >
                    {renderModalContent(modal)}
                </Modal>
            ))}
        </ModalContext.Provider>
    );
};

export const useModals = () => useContext(ModalContext);