// FRONTEND/components/Modal.js
import React, {useEffect, useRef} from 'react';
import '../assets/styles/Modal.css';

const Modal = ({ children, isVisible = false, onClose, closeButton = true, zIndex = 1000 }) => {
    const modalRef = useRef(null);

    useEffect(() => {
        if (isVisible && modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    onClose();
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
    }, [isVisible, onClose]);

    return (
        <>
            <div
                className={`app-modal-overlay ${!isVisible ? 'hidden' : ''}`}
                style={{ zIndex }}
                onClick={() => onClose()}
                role="presentation"
            />
            <div
                className={`app-modal-content ${!isVisible ? 'hidden' : ''}`}
                style={{ zIndex: zIndex + 1 }}
                tabIndex="-1"
                ref={modalRef}
            >
                {children}
                {closeButton && (
                    <button
                        onClick={() => onClose()}
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