// FRONTEND/contexts/NavContext.jsx
import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation, useBlocker } from 'react-router-dom';
import ConfirmPrompt from '../components/ConfirmPrompt';
import InWorks from '../components/InWorks';
import Modal from "../components/Modal";
import PostDetails from '../components/Posts/Details';
import RoleDetails from '../components/Roles/Details';
import RoleEdit from '../components/Roles/Edit';
import TeamDetails from '../components/Teams/Details';
import TeamEdit, {TeamUserAssignment, TeamUserBulkAssignment} from '../components/Teams/Edit';
import UserDetails from '../components/Users/Details';
import UserEdit, {
    UserAssignment,
    UserBulkAssignment
} from '../components/Users/Edit';

const ANIMATION_DURATION = 300;

const NavContext = createContext();

export const NavProvider = ({ children }) => {
    const [modals, setModals] = useState({});
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const { search } = useLocation();
    const isMounted = useRef(false);
    const nextModalId = useRef(0);
    const modalsRef = useRef({});

    const blocker = useBlocker(unsavedChanges);

    const syncUrlWithModals = useCallback((modalsOverride) => {
        const currentModals = modalsOverride || modalsRef.current || {};

        const newParams = new URLSearchParams(search);
        const modalKeys = ['new', 'user', 'editUser', 'role', 'editRole', 'team', 'editTeam', 'post'];
        modalKeys.forEach((k) => newParams.delete(k));

        Object.values(currentModals).forEach((modal) => {
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
    }, [search, setSearchParams]);

    const openModal = useCallback((modalConfig) => {

        let id = null;
        let isDuplicate = false;

        setModals((prev) => {
            isDuplicate = Object.values(prev).some(
                (existing) =>
                    existing.content === modalConfig.content &&
                    existing.contentId === modalConfig.contentId
            );

            if (isDuplicate)
                return prev;

            id = nextModalId.current++;

            const next = {
                ...prev,
                [id]: { ...modalConfig, id, props: modalConfig.props || {}, isVisible: false, discardWarning: false }
            };
            // Sync URL with the upcoming state
            if (blocker.state !== 'blocked' &&  modalConfig.content !== 'confirm')
                syncUrlWithModals(next);
            return next;
        });

        if (isDuplicate)
            return id;

        setTimeout(() => {
            setModals((prev) => ({
                ...prev,
                [id]: { ...prev[id], isVisible: true },
            }));
        }, ANIMATION_DURATION);

        return id;
    }, [syncUrlWithModals, blocker.state]);

    const setDiscardWarning = useCallback((id, value) => {
        setModals((prev) => {
            if (!prev[id]) return prev;
            return {
                ...prev,
                [id]: { ...prev[id], discardWarning: value },
            };
        });
    }, []);

    const closeModal = useCallback((id, skipSyncing=false) => {
        setModals((prev) => ({
            ...prev,
            [id]: { ...prev[id], isVisible: false },
        }));

        setTimeout(() => {
            setModals((prev) => {
                const { [id]: _, ...rest } = prev;
                if (!skipSyncing)
                    syncUrlWithModals(rest);
                return rest;
            });
        }, ANIMATION_DURATION);
    }, [syncUrlWithModals]);

    const closeTopModal = useCallback(() => {
        const currentModals = modalsRef.current;
        const ids = Object.keys(currentModals).sort((a, b) => a - b);
        if (ids.length === 0)
            return;

        const topId = ids[ids.length - 1];
        const topModal = currentModals[topId];

        if (topModal?.discardWarning) {
            openModal({
                content: 'confirm',
                type: 'pop-up',
                message: 'Changes were made. Are you sure you want to discard them?',
                onConfirm: () => {
                    setDiscardWarning(topId, false);
                    closeModal(topId);
                },
            });
            return; // Escaping this callback - new pop-up confirmation modal will handle closing from now on.
        }

        const isConfirm = topModal.content === 'confirm';

        closeModal(topId, isConfirm); // Closing the topModal if there is no discardWarning on it.

    }, [closeModal, openModal, setDiscardWarning]);

    const updateModalProps = useCallback((id, newProps) => {
        setModals((prev) => {
            if (!prev[id]) return prev;
            return {
                ...prev,
                [id]: {
                    ...prev[id],
                    props: { ...prev[id].props, ...newProps },
                },
            };
        });
    }, []);

    const renderModalContent = (modal) => {
        switch (modal.content) {
            case 'userDetails':
                return <UserDetails userId={modal.contentId} modal={modal.id} />;
            case 'userEdit':
                return <UserEdit userId={modal.contentId} modal={modal.id} />;
            case 'userRoleAssignment':
                return <UserAssignment user={modal.data} resource={'role'} modal={modal.id} />;
            case 'userRoleBulkAssignment':
                return <UserBulkAssignment users={modal.data} resource={'role'} modal={modal.id} />;
            case 'userManagerAssignment':
                return <UserAssignment user={modal.data} resource={'manager'} modal={modal.id} />;
            case 'userManagerBulkAssignment':
                return <UserBulkAssignment users={modal.data} resource={'manager'} modal={modal.id} />;
            case 'userNew':
                return <UserEdit modal={modal.id} />;
            case 'employeeNew':
                return <UserEdit preset={'employee'} modal={modal.id} />;
            case 'managerNew':
                return <UserEdit preset={'manager'} modal={modal.id} />;
            case 'roleDetails':
                return <RoleDetails roleId={modal.contentId} modal={modal.id} />;
            case 'roleEdit':
                return <RoleEdit roleId={modal.contentId} modal={modal.id} />;
            case 'roleNew':
                return <RoleEdit />;
            case 'teamDetails':
                return <TeamDetails teamId={modal.contentId} modal={modal.id} />;
            case 'teamEdit':
                return <TeamEdit teamId={modal.contentId} modal={modal.id} />;
            case 'TeamUserAssignment':
                return <TeamUserAssignment team={modal.data} modal={modal.id} />;
            case 'teamUserBulkAssignment':
                return <TeamUserBulkAssignment teams={modal.data} modal={modal.id} />;
            case 'teamNew':
                return <TeamEdit />;
            case 'subteamNew':
                return <TeamEdit parentId={modal.parentId} modal={modal.id} />;
            case 'postDetails':
                return <PostDetails postId={modal.contentId} modal={modal.id} />;
            case 'confirm':
                return <ConfirmPrompt
                    message={modal.message}
                    onConfirm={modal.onConfirm}
                    onConfirm2={modal.onConfirm2}
                    confirmLabel={modal.confirmLabel}
                    confirmLabel2={modal.confirmLabel2}
                    cancelLabel={modal.cancelLabel}
                    onCancel={modal.onCancel}
                    modal={modal.id}
                />;
            case 'component':
                return React.createElement(modal.component, modal.props);
            default:
                return <InWorks title={'Unknown Modal'} modal={modal.id} />;
        }
    };

    const parseUrlParams = useCallback(() => {
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
    }, [openModal, searchParams]);

    useEffect(() => {
        if (blocker.state === 'blocked') {
            const shouldProceed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
            if (shouldProceed) {
                setUnsavedChanges(false);
                blocker.proceed();
            } else {
                blocker.reset();
            }
        }
    }, [blocker]);

    useEffect(() => {
        modalsRef.current = modals;

        if (isMounted.current)
            return

        parseUrlParams();
        isMounted.current = true;

    }, [modals, parseUrlParams]);

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (unsavedChanges) {
                event.preventDefault();
                event.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [unsavedChanges]);

    const exportObject = {
        modals,
        unsavedChanges,
        openModal,
        closeModal,
        closeTopModal,
        setDiscardWarning,
        updateModalProps,
        setUnsavedChanges
    };
    const sortedModalIds = Object.keys(modals).sort((a, b) => a - b);

    return (
        <NavContext.Provider value={exportObject}>
            {children}
            {sortedModalIds.map((id, index) => {
                const modal = modals[id];
                return <Modal
                    key={index}
                    type={modal.type}
                    isVisible={modal.isVisible}
                    style={modal.style}
                    zIndex={1000 + index * 10}
                    onClose={closeTopModal}
                >
                    {renderModalContent(modal)}
                </Modal>;
            })}
        </NavContext.Provider>
    );
};

export const useNav = () => useContext(NavContext);
export default useNav;