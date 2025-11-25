// FRONTEND/contexts/NavContext.jsx
import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation, useBlocker } from 'react-router-dom';
import ConfirmPrompt from '../components/ConfirmPrompt';
import InWorks from '../components/InWorks';
import Modal from "../components/Modal";
import PostDetails from '../components/Posts/Details';
import RoleDetails from '../components/Roles/Details';
import RoleEdit from '../components/Roles/Edit';
import ShiftDetails from '../components/Shifts/Details';
import ShiftEdit from '../components/Shifts/Edit';
import TeamDetails from '../components/Teams/Details';
import TeamEdit, {TeamUserAssignment, TeamUserBulkAssignment} from '../components/Teams/Edit';
import UserDetails from '../components/Users/Details';
import UserEdit, {UserAssignment, UserBulkAssignment} from '../components/Users/Edit';

const ANIMATION_DURATION = 300;

const MODALS = {
    default: {
        component: (modal) => <InWorks title={'Missing Modal'} modal={modal.id} />
    },
    userNew: {
        urlParam: 'new',
        urlParamValue: 'user',
        component: (modal) => <UserEdit modal={modal.id}/>
    },
    userDetails: {
        urlParam: 'user',
        component: (modal) => <UserDetails userId={modal.contentId} modal={modal.id}/>,
        type: 'dialog'
    },
    userEdit: {
        urlParam: 'editUser',
        component: (modal) => <UserEdit userId={modal.contentId} modal={modal.id}/>
    },
    managerNew: {
        urlParam: 'new',
        urlParamValue: 'manager',
        component: (modal) => <UserEdit preset={'manager'} modal={modal.id}/>
    },
    employeeNew: {
        urlParam: 'new',
        urlParamValue: 'employee',
        component: (modal) => <UserEdit preset={'employee'} modal={modal.id}/>
    },
    roleNew: {
        urlParam: 'new',
        urlParamValue: 'role',
        component: (modal) => <RoleEdit modal={modal.id}/>
    },
    roleDetails: {
        urlParam: 'role',
        component: (modal) => <RoleDetails roleId={modal.contentId} modal={modal.id}/>,
        type: 'dialog'
    },
    roleEdit: {
        urlParam: 'editRole',
        component: (modal) => <RoleEdit roleId={modal.contentId} modal={modal.id}/>
    },
    teamNew: {
        urlParam: 'new',
        urlParamValue: 'team',
        component: (modal) => <TeamEdit modal={modal.id}/>
    },
    teamDetails: {
        urlParam: 'team',
        component: (modal) => <TeamDetails teamId={modal.contentId} modal={modal.id}/>,
        type: 'dialog'
    },
    teamEdit: {
        urlParam: 'editTeam',
        component: (modal) => <TeamEdit teamId={modal.contentId} modal={modal.id}/>
    },
    shiftNew: {
        urlParam: 'new',
        urlParamValue: 'shift',
        component: (modal) => <ShiftEdit modal={modal.id}/>
    },
    shiftDetails: {
        urlParam: 'shift',
        component: (modal) => <ShiftDetails shiftId={modal.contentId} modal={modal.id}/>,
        type: 'dialog'
    },
    shiftEdit: {
        urlParam: 'editShift',
        component: (modal) => <ShiftEdit shiftId={modal.contentId} modal={modal.id}/>
    },
    postDetails: {
        urlParam: 'post',
        component: (modal) => <PostDetails postId={modal.contentId} modal={modal.id}/>,
        type: 'dialog'
    },
    confirm: {
        component: (modal) => <ConfirmPrompt
                                    message={modal.message}
                                    onConfirm={modal.onConfirm}
                                    onConfirm2={modal.onConfirm2}
                                    confirmLabel={modal.confirmLabel}
                                    confirmLabel2={modal.confirmLabel2}
                                    cancelLabel={modal.cancelLabel}
                                    onCancel={modal.onCancel}
                                    modal={modal.id}
                                />
    },
    component: {
        component: (modal) => React.createElement(modal.component, modal.props)
    },
    userRoleAssignment: {
        component: (modal) => <UserAssignment user={modal.data} resource={'role'} modal={modal.id} />
    },
    userRoleBulkAssignment: {
        component: (modal) => <UserBulkAssignment users={modal.data} resource={'role'} modal={modal.id} />
    },
    userManagerAssignment: {
        component: (modal) => <UserAssignment user={modal.data} resource={'manager'} modal={modal.id} />
    },
    userManagerBulkAssignment: {
        component: (modal) => <UserBulkAssignment users={modal.data} resource={'manager'} modal={modal.id} />        
    },
    teamUserAssignment: {
        component: (modal) => <TeamUserAssignment team={modal.data} modal={modal.id} />
    },
    teamUserBulkAssignment: {
        component: (modal) => <TeamUserBulkAssignment teams={modal.data} modal={modal.id} />
    }
};

const NavContext = createContext();

export const NavProvider = ({ children }) => {
    const [modals, setModals] = useState({});
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const { search } = useLocation();
    const isMounted = useRef(false);
    const nextModalId = useRef(1);
    const modalsRef = useRef({});

    const blocker = useBlocker(unsavedChanges);

    const syncUrlWithModals = useCallback((modalsOverride) => {
        const currentModals = modalsOverride || modalsRef.current || {};

        const newParams = new URLSearchParams(search);
        const modalKeys = ['new', 'user', 'editUser', 'role', 'editRole', 'team', 'editTeam', 'post'];
        modalKeys.forEach((k) => newParams.delete(k));

        Object.values(currentModals).forEach((modal) => {
            const modalConfig = MODALS[modal.content];

            if (modalConfig) {
                const key = modalConfig.urlParam;
                const value = key === 'new' ? modalConfig.urlParamValue : modal.contentId;
                newParams.set(key, value);
            }
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

    const renderModalContent = (modal) => MODALS[modal.content]?.component(modal) || MODALS.default.component(modal);

    const parseUrlParams = useCallback(() => {
        Object.entries(MODALS).forEach(([key, config]) => {
            if (!config.urlParam || config.urlParam === 'new')
                return;
            
            const contentId = searchParams.get(config.urlParam);
            
            if (contentId) 
                openModal({ content: key, contentId, type: config.type || 'pane' });
        });
        
        const newResource = searchParams.get('new');
        if (newResource) {
            const modalConfig = Object.entries(MODALS)
                .find(([_key, config]) => config.urlParam === 'new' && config.urlParamValue === newResource);
            if (modalConfig)
                openModal({ content: modalConfig[0]});
        }
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
        openDialog: (params = {}) => openModal({ ...params, type: 'dialog' }),
        openPane: (params = {}) => openModal({ ...params, type: 'pane' }),
        openPopUp: (params = {}) => openModal({ ...params, type: 'pop-up' }),
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