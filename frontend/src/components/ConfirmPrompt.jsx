// FRONTEND/Components/ConfirmPrompt.jsx
import React from 'react';
import useNav from '../contexts/NavContext';
import Button from './Button';
import '../styles/ConfirmPrompt.css';

const ConfirmPrompt = ({
                    message='',
                    onConfirm=null,
                    onConfirm2=null,
                    confirmLabel = 'Confirm',
                    confirmLabel2 = 'Confirm2',
                    cancelLabel = 'Cancel',
                }) => {
    const { closeTopModal } = useNav();

    const confirmAction = () => {
        closeTopModal();
        setTimeout(() => {onConfirm()}, 350);
    };

    const confirm2Action = () => {
        closeTopModal();
        setTimeout(() => {onConfirm2()}, 350);
    };

    return (
        <div className='confirm-prompt'>
            <p>{message}</p>
            <div className={'confirm-prompt-buttons'}>
                <Button
                    onClick={confirmAction}
                    label={confirmLabel}
                />
                {onConfirm2 && <Button
                    onClick={confirm2Action}
                    label={confirmLabel2}
                />}
                <Button
                    className={'discard'}
                    onClick={closeTopModal}
                    label={cancelLabel}
                />
            </div>
        </div>
    );
}

export default ConfirmPrompt;