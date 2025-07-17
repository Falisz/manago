import React from 'react';

const Modal = ({ children, onClose, closeButton = false }) => {
    return (
        <>
            <div className="app-modal-overlay" onClick={onClose}></div>
            <div className="app-modal-content">
                {children}
                {(closeButton && <button onClick={onClose} className="app-modal-close-button">
                    <i className="material-symbols-outlined">close</i>
                </button>)}
            </div>
        </>
    );
};

export default Modal;