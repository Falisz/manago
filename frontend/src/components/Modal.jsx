// FRONTEND/components/Modal.jsx
import React, {useEffect, useRef} from 'react';
import Button from './Button';
import '../styles/Modal.css';

const Modal = ({ children, type='pane', isVisible = false, onClose, closeButton = true, zIndex = 1000, style={} }) => {
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
                className={`modal-overlay${!isVisible ? ' hidden' : ''}`}
                style={{ zIndex }}
                onClick={() => onClose()}
                role='presentation'
            />
            <div
                className={`modal ${type}${!isVisible ? ' hidden' : ''}`}
                style={{ ...style, zIndex: zIndex + 1 }}
                tabIndex='-1'
                ref={modalRef}
            >
                {children}
                {closeButton && <Button
                    className={'modal-close-button'}
                    icon={'close'}
                    onClick={onClose}
                    transparent={true}
                />}
            </div>
        </>
    );
};

export default Modal;