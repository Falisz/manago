// FRONTEND/components/Modal.js
import React, {useCallback, useEffect, useRef, useState} from 'react';
import '../assets/styles/Modal.css';

const Modal = ({ children, onClose, hidden = false, closeButton = true, zIndex = 1000 }) => {
    const modalRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    const handleClose = useCallback(() => {
        setIsVisible(false);
        const timeout = setTimeout(() => {
            onClose();
        }, 300);
        return () => clearTimeout(timeout);
    }, [onClose]);

    useEffect(() => {
        if (!hidden) {
            setIsVisible(true);
        }
    }, [hidden]);

    useEffect(() => {
        if (isVisible && modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    handleClose();
                    return;
                }
                if (e.key === 'Tab') {
                    if (e.shiftKey && document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    } else if (!e.shiftKey && document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            };

            modalRef.current.focus();
            document.addEventListener('keydown', handleKeyDown);

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isVisible, handleClose]);

    return (
        <>
            <div
                className={`app-modal-overlay ${!isVisible ? 'hidden' : ''}`}
                style={{ zIndex }}
                onClick={() => handleClose()}
                role="presentation"
            />
            <div
                className={`app-modal-content ${!isVisible ? 'hidden' : ''}`}
                style={{ zIndex: zIndex + 1 }}
                role="dialog"
                tabIndex="-1"
                ref={modalRef}
            >
                {children}
                {closeButton && (
                    <button
                        onClick={() => handleClose()}
                        className="app-modal-close-button"
                        aria-label="Close modal"
                    >
                        <i className="material-symbols-outlined">close</i>
                    </button>
                )}
            </div>
        </>
    );
};

export default Modal;