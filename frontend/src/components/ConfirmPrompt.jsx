// FRONTEND/Components/ConfirmPrompt.jsx
import React, {useState} from 'react';
import useNav from '../contexts/NavContext';
import Button from './Button';
import '../styles/ConfirmPrompt.css';

const ConfirmPrompt = ({
                    message='',
                    onConfirm = null,
                    onConfirm2 = null,
                    input = false,
                    confirmLabel = 'Confirm',
                    confirmLabel2 = 'Confirm2',
                    cancelLabel = 'Cancel',
                }) => {
    const { closeTopModal } = useNav();
    const [ note, setNote ] = useState('');

    const confirmAction = (note) => {
        closeTopModal();
        setTimeout(() => {onConfirm(note)}, 350);
    };

    const confirm2Action = (note) => {
        closeTopModal();
        setTimeout(() => {onConfirm2(note)}, 350);
    };

    return (
        <div className='confirm-prompt'>
            <p>{message}</p>
            {input && <textarea
                value={note}
                placeholder={'Leave a note (optional)'}
                onChange={(e) => setNote(e.target.value)}
            />}
            <div className={'confirm-prompt-buttons'}>
                <Button
                    onClick={() => confirmAction(note)}
                    label={confirmLabel}
                />
                {onConfirm2 && <Button
                    onClick={() => confirm2Action(note)}
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