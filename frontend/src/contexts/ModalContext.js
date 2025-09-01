// FRONTEND/contexts/ModalContext.js
import React, {createContext, useContext, useState, useEffect, useCallback, useRef} from 'react';
import { useSearchParams } from 'react-router-dom';
import Modal from '../components/Modal';
import UserDetails from '../components/Users/Details';
import UserEdit from '../components/Users/Edit';
import RoleDetails from "../components/Roles/Details";
import RoleEdit from "../components/Roles/Edit";
import PostDetails from "../components/Posts/Details";
import InWorks from "../components/InWorks";

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
                    existing.type === modal.type &&
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
                type: 'confirm',
                isPopUp: true,
                message: 'Changes were made. Are you sure you want to discard them?',
                onConfirm: () => {
                    closeModal(); // Closing-self (pop-up confirmation modal)
                    setTimeout(() => {
                        setDiscardWarning(false); // Resetting discard warning from the topModal
                        closeModal(); // Closing the topModal.
                    }, ANIMATION_DURATION);
                },
            });
            return; // Escaping this callback - new pop-up confirmation modal will handle closing from now on.
        }

        closeModal(); // Closing the topModal if there is no discardWarning on it.

    }, [closeModal, openModal, setDiscardWarning]);

    const refreshData = useCallback((type, data) => {
        setRefreshTriggers((prev) => ({
            ...prev,
            [type]: { data, timestamp: Date.now() },
        }));
    }, []);

    useEffect(() => {
        const userDetails = searchParams.get('user');
        if (userDetails) openModal({ type: 'userDetails', data: { id: userDetails } });
        const editUser = searchParams.get('editUser');
        if (editUser) openModal({ type: 'userEdit', data: { id: editUser } });
        const newUser = searchParams.get('newUser');
        if (newUser !== null) openModal({ type: 'newUser' });

        const roleDetails = searchParams.get('role');
        if (roleDetails) openModal({ type: 'roleDetails', data: { id: roleDetails } });
        const editRole = searchParams.get('editRole');
        if (editRole) openModal({ type: 'roleEdit', data: { id: editRole } });
        const newRole = searchParams.get('newRole');
        if (newRole !== null) openModal({ type: 'newRole' });

        const postDetails = searchParams.get('post');
        if (postDetails) openModal({ type: 'postDetails', data: { id: postDetails } });
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        const newParams = new URLSearchParams();
        modalStack.forEach((modal) => {
            if (modal.type === 'userDetails') newParams.set('user', modal.data.id);
            if (modal.type === 'userEdit') newParams.set('editUser', modal.data.id);
            if (modal.type === 'userNew') newParams.set('newUser', '');
            if (modal.type === 'roleDetails') newParams.set('role', modal.data.id);
            if (modal.type === 'roleEdit') newParams.set('editRole', modal.data.id);
            if (modal.type === 'roleNew') newParams.set('newRole', '');
            if (modal.type === 'postDetails') newParams.set('post', modal.data.id);
        });
        setSearchParams(newParams, { replace: true });
    }, [modalStack, setSearchParams]);

    const renderModalContent = (modal) => {
        switch (modal.type) {
            case 'userDetails':
                return <UserDetails userId={modal.data.id} refreshData={refreshData} />;
            case 'userNew':
                return <UserEdit refreshData={refreshData} />;
            case 'userEdit':
                return <UserEdit userId={modal.data.id} refreshData={refreshData} />;
            case 'roleDetails':
                return <RoleDetails roleId={modal.data.id} />;
            case 'roleNew':
                return <RoleEdit/>
            case 'roleEdit':
                return <RoleEdit roleId={modal.data.id} />;
            case 'postDetails':
                return <PostDetails postId={modal.data.id} />;
            case 'teamDetails':
                return <InWorks
                    title={'Teams'}
                    icon={'info'}
                    description={"There will be a new team details window here."}
                />;
            case 'teamNew':
                return <InWorks
                    title={'Teams'}
                    icon={'add'}
                    description={"There will be a new team edit form here. Depending on enabled modules it may have project and/or branch fields."}
                />;
            case 'confirm':
                return (
                    <div>
                        <p>{modal.message}</p>
                        <button className={'action-button'} onClick={modal.onConfirm}>Confirm</button>
                        <button className={'action-button discard'} onClick={closeTopModal}>Cancel</button>
                    </div>
                );
            default:
                return <div>Unknown modal type</div>;
        }
    };

    return (
        <ModalContext.Provider value={{ openModal, setDiscardWarning, closeTopModal, refreshData, refreshTriggers }}>
            {children}
            {modalStack.map((modal, index) => (
                <Modal
                    key={index}
                    onClose={closeTopModal}
                    isPopUp={modal.isPopUp}
                    isVisible={modal.isVisible}
                    zIndex={1000 + index * 10}
                >
                    {renderModalContent(modal)}
                </Modal>
            ))}
        </ModalContext.Provider>
    );
};

export const useModals = () => useContext(ModalContext);