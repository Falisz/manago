import React, { useState, useRef, useEffect } from 'react';

const Dropdown = ({ className='', name, value, options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOptionClick = (option, isOpen) => {
        if (isOpen) {
            const syntheticEvent = {
                target: { name, value: option },
                // eslint-disable-next-line
                persist: () => {}, // For React event pooling compatibility
            };
            onChange(syntheticEvent);
            setIsOpen(false);
        }
    };

    const handleKeyDown = (e, option) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOptionClick(option);
        }
    };

    return (
        <div className={"app-dropdown " + className} ref={dropdownRef}>
            <div
                className="dropdown-selected"
                onClick={() => setIsOpen(!isOpen)}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen(!isOpen);
                    }
                }}
            >
                <span>{value ? value.toUpperCase() : 'Select an option'}</span>
                <i className="material-symbols-outlined">
                    {isOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                </i>
            </div>
            <ul className={`dropdown-options app-scroll ${isOpen ? '' : 'hidden'}`}>
                {options.map((option) => (
                    <li
                        key={option}
                        className={`dropdown-option opt-${option.toLowerCase()}`}
                        onClick={() => handleOptionClick(option, isOpen)}
                        onKeyDown={(e) => handleKeyDown(e, option)}
                        tabIndex={0}
                    >
                        {option.toUpperCase()}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Dropdown;