// FRONTEND/contexts/NavContext.jsx
import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation, useBlocker } from 'react-router-dom';
import ConfirmPrompt from '../components/ConfirmPrompt';
import InWorks from '../components/InWorks';
import Modal from "../components/Modal";
import LeaveDetails from '../components/Leaves/Details';
import LeavesPlanner from '../components/Leaves/Planner';
import PostDetails from '../components/Posts/Details';
import RoleDetails from '../components/Roles/Details';
import RoleEdit from '../components/Roles/Edit';
import ShiftDetails from '../components/Shifts/Details';
import ShiftEdit from '../components/Shifts/Edit';
import TeamDetails from '../components/Teams/Details';
import TeamEdit, {TeamAssignment} from '../components/Teams/Edit';
import UserDetails from '../components/Users/Details';
import UserEdit, {UserAssignment} from '../components/Users/Edit';
import DateDetails from '../components/Schedules/DateDetails';
import {HolidayWorking, WeekendWorking} from "../components/SpecialWorkings/Details";

const ANIMATION_DURATION = 300;

const MODALS = {
    default: {
        component: (modal) => <InWorks title={'Missing'} modal={modal.id} />
    },
    userNew: {
        urlParam: 'new',
        urlParamValue: 'user',
        component: (modal) => <UserEdit modal={modal.id}/>
    },
    userDetails: {
        urlParam: 'user',
        component: (modal) => <UserDetails id={modal.contentId} modal={modal.id}/>,
        type: 'dialog',
        closeButton: false
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
        component: (modal) => <RoleDetails id={modal.contentId} modal={modal.id}/>,
        type: 'dialog',
        closeButton: false
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
        component: (modal) => <TeamDetails id={modal.contentId} modal={modal.id}/>,
        type: 'dialog',
        closeButton: false
    },
    teamEdit: {
        urlParam: 'editTeam',
        component: (modal) => <TeamEdit teamId={modal.contentId} modal={modal.id}/>
    },
    subteamNew: {
        component: (modal) => <TeamEdit parentId={modal.parentId} modal={modal.id}/>
    },
    shiftNew: {
        urlParam: 'new',
        urlParamValue: 'shift',
        component: (modal) => <ShiftEdit modal={modal.id}/>
    },
    shiftDetails: {
        urlParam: 'shift',
        component: (modal) => <ShiftDetails id={modal.contentId} modal={modal.id}/>,
        type: 'dialog',
        closeButton: false
    },
    shiftEdit: {
        urlParam: 'editShift',
        component: (modal) => <ShiftEdit shiftId={modal.contentId} modal={modal.id}/>
    },
    leaveNew: {
        urlParam: 'new',
        urlParamValue: 'leave',
        component: (modal) => <LeavesPlanner modal={modal.id}/>,
        type: 'dialog',
        style: {width: 'calc(100% - 200px)'}
    },
    leaveDetails: {
        urlParam: 'leave',
        component: (modal) => <LeaveDetails id={modal.contentId} modal={modal.id}/>,
        type: 'dialog',
        closeButton: false
    },
    holidayDetails: {
        urlParam: 'holiday',
        component: (modal) => <DateDetails holidayId={modal.contentId} modal={modal.id}/>,
        type: 'dialog',
        closeButton: false
    },
    dateDetails: {
        urlParam: 'date',
        component: (modal) => <DateDetails date={modal.contentId} modal={modal.id} />,
        type: 'dialog',
        closeButton: false
    },
    weekendDetails: {
        urlParam: 'weekend',
        component: (modal) => <DateDetails date={modal.contentId} modal={modal.id} />,
        type: 'dialog',
        closeButton: false
    },
    holidayWorking: {
        urlParam: 'holidayWorking',
        component: (modal) => <HolidayWorking id={modal.contentId} modal={modal.id}/>,
        type: 'dialog',
        closeButton: false
    },
    weekendWorking: {
        urlParam: 'weekendWorking',
        component: (modal) => <WeekendWorking id={modal.contentId} modal={modal.id}/>,
        type: 'dialog',
        closeButton: false
    },
    postDetails: {
        urlParam: 'post',
        component: (modal) => <PostDetails id={modal.contentId} modal={modal.id}/>,
        type: 'dialog'
    },
    confirm: {
        component: (modal) => <ConfirmPrompt
                                    message={modal.message}
                                    input={modal.input}
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
    userManagerAssignment: {
        component: (modal) => <UserAssignment user={modal.data} resource={'manager'} modal={modal.id} />
    },
    teamUserAssignment: {
        component: (modal) => <TeamAssignment team={modal.data} modal={modal.id} />
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
        Object.values(MODALS).map((config) => config.urlParam).forEach((key) => newParams.delete(key));

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

    const openModal = useCallback((modalConfig, skipUrlSyncing = false) => {
        const currentModals = modalsRef.current;
        const isDuplicate = Object.values(currentModals).some(
            (existing) =>
                existing.content === modalConfig.content &&
                existing.contentId === modalConfig.contentId
        );

        if (isDuplicate)
            return null;

        const id = nextModalId.current++;
        const newModal = { ...modalConfig, id, props: modalConfig.props || {}, isVisible: false, discardWarning: false };
        const next = { ...currentModals, [id]: newModal };

        skipUrlSyncing = skipUrlSyncing || blocker.state === 'blocked'
            || modalConfig.content === 'confirm' || modalConfig.content === 'component';

        if (!skipUrlSyncing)
            syncUrlWithModals(next);

        setModals(next);

        setTimeout(() => {
            setModals((prev) => ({
                ...prev,
                [id]: { ...prev[id], isVisible: true },
            }));
        }, ANIMATION_DURATION);

        return id;
    }, [syncUrlWithModals, blocker.state]);

    const closeModal = useCallback((id, skipSyncing = false) => {
        if (id == null) return;

        setModals((prev) => ({
            ...prev,
            [id]: { ...prev[id], isVisible: false },
        }));

        const current = modalsRef.current;
        const next = { ...current };
        delete next[id];

        if (!skipSyncing) {
            syncUrlWithModals(next);
        }

        setTimeout(() => {
            setModals((prev) => {
                const { [id]: _, ...rest } = prev;
                return rest;
            });
        }, ANIMATION_DURATION);
    }, [syncUrlWithModals]);

    const setDiscardWarning = useCallback((id, value) => {
        setModals((prev) => {
            if (!prev[id]) return prev;
            return {
                ...prev,
                [id]: { ...prev[id], discardWarning: value },
            };
        });
    }, []);

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
                    setUnsavedChanges(false);
                    setDiscardWarning(topId, false);
                    closeModal(topId);
                },
            });
            return; // Escaping this callback - new pop-up confirmation modal will handle closing from now on.
        }

        const isConfirm = topModal.content === 'confirm';

        closeModal(topId, isConfirm); // Closing the topModal if there is no discardWarning on it.

    }, [closeModal, openModal, setDiscardWarning, setUnsavedChanges]);

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
                openModal(
                    {
                        content: key,
                        contentId,
                        style: config.style || {},
                        type: config.type || 'pane',
                        closeButton: config.closeButton
                    },
                    true
                );
        });
        
        const newResource = searchParams.get('new');
        if (newResource) {
            const modalConfig = Object.entries(MODALS)
                .find(([_key, config]) => config.urlParam === 'new' && config.urlParamValue === newResource);
            if (modalConfig)
                openModal(
                    {
                        content: modalConfig[0],
                        style: modalConfig[1]['style'] || {},
                        type: modalConfig[1]['type'] || 'pane',
                        closeButton: modalConfig[1]['closeButton'],
                    },
                    true
                );
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
                    closeButton={modal.closeButton}
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