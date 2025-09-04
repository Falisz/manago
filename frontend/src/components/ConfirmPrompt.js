// FRONTEND/components/ConfirmPrompt.js
import React from 'react';
import { useModals } from '../contexts/ModalContext';

const ConfirmPrompt = ({ message='', onConfirm=null }) => {
    const { closeTopModal } = useModals();

    const confirmAction = () => {
        closeTopModal();
        setTimeout(() => {onConfirm()}, 350);
    };

    return (
        <div className="confirm-prompt">
            <p>{message}</p>
            <button className={'action-button'} onClick={confirmAction}>Confirm</button>
            <button className={'action-button discard'} onClick={closeTopModal}>Cancel</button>
        </div>
    );
}

export default ConfirmPrompt;