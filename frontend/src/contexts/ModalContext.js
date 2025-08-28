// FRONTEND/contexts/ModalContext.js
import React, {createContext, useContext, useState, useEffect, useCallback} from 'react';
import { useSearchParams } from 'react-router-dom';
import Modal from '../components/Modal'; // Assuming your existing Modal component is at FRONTEND/components/Modal.js
import UserDetails from '../components/Users/Details';
import UserEdit from '../components/Users/Edit';
import RoleDetails from "../components/Roles/Details";
import RoleEdit from "../components/Roles/Edit";
import PostDetails from "../components/Posts/Details";

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
    const [modalStack, setModalStack] = useState([]);
    const [discardWarning, setDiscardWarning] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    const openModal = (modal) => {
        setModalStack((prev) => {
            const isDuplicate = prev.some(
                (existing) =>
                    existing.type === modal.type &&
                    existing.data?.id === modal.data?.id
            );
            if (isDuplicate) return prev;
            return [...prev, modal];
        });
    };

    const closeTopModal = useCallback(() => {
        if (discardWarning) {
            if (!window.confirm('Changes were made. Are you sure you want to discard them?')) return;
        }
        setModalStack((prev) => prev.slice(0, -1));
        setDiscardWarning(false);
    }, [discardWarning]);

    const closeAllModals = () => {
        setModalStack([]);
    };

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
                return <UserDetails userId={modal.data.id} />;
            case 'userNew':
                return <UserEdit />
            case 'userEdit':
                return <UserEdit userId={modal.data.id} />;
            case 'roleDetails':
                return <RoleDetails roleId={modal.data.id} />;
            case 'roleNew':
                return <RoleEdit/>
            case 'roleEdit':
                return <RoleEdit roleId={modal.data.id} />;
            case 'postDetails':
                return <PostDetails postId={modal.data.id} />;
            default:
                return <div>Unknown modal type</div>;
        }
    };

    return (
        <ModalContext.Provider value={{ openModal, closeTopModal, closeAllModals, setDiscardWarning }}>
            {children}
            {modalStack.map((modal, index) => (
                <Modal
                    key={index}
                    hidden={false}
                    onClose={closeTopModal}
                    zIndex={1000 + index * 10}
                >
                    {renderModalContent(modal)}
                </Modal>
            ))}
        </ModalContext.Provider>
    );
};

export const useModals = () => useContext(ModalContext);