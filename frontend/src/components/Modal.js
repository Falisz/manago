import React from 'react';

const Modal = ({ children, onClose, hidden = false, closeButton = true }) => {
    return (
        <>
            <div className={`app-modal-overlay ${hidden ? 'hidden' : ''}`} onClick={onClose} ></div>
            <div className={`app-modal-content ${hidden ? 'hidden' : ''}`} >
                {children}
                {(closeButton &&
                    <button onClick={onClose} className="app-modal-close-button">
                        <i className="material-symbols-outlined">close</i>
                    </button>
                )}
            </div>
        </>
    );
};

export default Modal;