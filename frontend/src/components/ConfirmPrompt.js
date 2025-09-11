// FRONTEND/components/ConfirmPrompt.js
import React from 'react';
import { useModals } from '../contexts/ModalContext';

const ConfirmPrompt = ({
                    message='',
                    onConfirm=null,
                    onConfirm2=null,
                    confirmLabel = 'Confirm',
                    confirmLabel2 = 'Confirm2',
                    cancelLabel = 'Cancel',
                }) => {
    const { closeTopModal } = useModals();

    const confirmAction = () => {
        closeTopModal();
        setTimeout(() => {onConfirm()}, 350);
    };

    const confirm2Action = () => {
        closeTopModal();
        setTimeout(() => {onConfirm2()}, 350);
    };

    return (
        <div className="confirm-prompt">
            <p>{message}</p>
            <button className={'action-button'} onClick={confirmAction}>{confirmLabel}</button>
            {onConfirm2 && <button className={'action-button'} onClick={confirm2Action}>{confirmLabel2}</button>}
            <button className={'action-button discard'} onClick={closeTopModal}>{cancelLabel}</button>
        </div>
    );
}

export default ConfirmPrompt;