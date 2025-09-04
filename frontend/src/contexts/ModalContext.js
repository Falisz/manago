// FRONTEND/contexts/ModalContext.js
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Modal from '../components/Modal';
import UserDetails from '../components/Users/Details';
import UserEdit from '../components/Users/Edit';
import RoleDetails from '../components/Roles/Details';
import RoleEdit from '../components/Roles/Edit';
import PostDetails from '../components/Posts/Details';
import TeamDetails from '../components/Teams/Details';
import InWorks from '../components/InWorks';
import ConfirmPrompt from "../components/ConfirmPrompt";

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
                    existing.data?.id === modal.data?.id
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
        switch (modal) {
            case 'userDetails':
                return <UserDetails userId={modal.data.id} />;
            case 'userEdit':
                return <UserEdit userId={modal.data.id} />;
            case 'userNew':
                return <UserEdit />;
            case 'roleDetails':
                return <RoleDetails roleId={modal.data.id} />;
            case 'roleEdit':
                return <RoleEdit roleId={modal.data.id} />;
            case 'roleNew':
                return <RoleEdit/>;
            case 'teamDetails':
                return <TeamDetails teamId={modal.data.id} />;
            case 'teamEdit':
                return <InWorks
                    title={'Teams'} icon={'info'} modal={true}
                    description={'There will be a new team edit window here.'}
                />;
            case 'teamNew':
                return <InWorks
                    title={'Teams'} icon={'add'} modal={true}
                    description={'There will be a new team edit form here.' +
                        'Depending on enabled modules it may have project and/or branch fields.'}
                />;
            case 'postDetails':
                return <PostDetails postId={modal.data.id} />;
            case 'confirm':
                return <ConfirmPrompt message={modal.message} onConfirm={modal.onConfirm} />;
            default:
                return <InWorks title={'Unknown modal.'} modal={true} />;
        }
    };

    useEffect(() => {
        const userDetails = searchParams.get('user');
        if (userDetails) openModal({ content: 'userDetails', data: { id: userDetails } });
        const editUser = searchParams.get('editUser');
        if (editUser) openModal({ content: 'userEdit', data: { id: editUser } });
        const newUser = searchParams.get('newUser');
        if (newUser) openModal({ content: 'userNew' });

        const roleDetails = searchParams.get('role');
        if (roleDetails) openModal({ content: 'roleDetails', data: { id: roleDetails } });
        const editRole = searchParams.get('editRole');
        if (editRole) openModal({ content: 'roleEdit', data: { id: editRole } });
        const newRole = searchParams.get('newRole');
        if (newRole) openModal({ content: 'roleNew' });

        const teamDetails = searchParams.get('team');
        if (teamDetails) openModal({ content: 'teamDetails', data: { id: teamDetails } });
        const editTeam = searchParams.get('editTeam');
        if (editTeam) openModal({ content: 'teamEdit', data: { id: editTeam } });
        const newTeam = searchParams.get('newTeam');
        if (newTeam) openModal({ content: 'teamNew' });

        const postDetails = searchParams.get('post');
        if (postDetails) openModal({ content: 'postDetails', data: { id: postDetails } });

        const test = searchParams.get('test');
        if (test) openModal({ content: 'test' });
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        const newParams = new URLSearchParams();
        modalStack.forEach((modal) => {
            if (modal.content === 'userDetails') newParams.set('user', modal.data.id);
            if (modal.content === 'userEdit') newParams.set('editUser', modal.data.id);
            if (modal.content === 'userNew') newParams.set('newUser', '');
            if (modal.content === 'roleDetails') newParams.set('role', modal.data.id);
            if (modal.content === 'roleEdit') newParams.set('editRole', modal.data.id);
            if (modal.content === 'roleNew') newParams.set('newRole', '');
            if (modal.content === 'teamDetails') newParams.set('team', modal.data.id);
            if (modal.content === 'teamEdit') newParams.set('editTeam', modal.data.id);
            if (modal.content === 'teamNew') newParams.set('newTeam', '');
            if (modal.content === 'postDetails') newParams.set('post', modal.data.id);
            if (modal.content === 'test') newParams.set('test', '');
        });
        setSearchParams(newParams, { replace: true });
    }, [modalStack, setSearchParams]);

    return (
        <ModalContext.Provider value={{ openModal, setDiscardWarning, closeTopModal, refreshData, refreshTriggers }}>
            {children}
            {modalStack.map((modal, index) => (
                <Modal
                    key={index}
                    type={modal.type}
                    isVisible={modal.isVisible}
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