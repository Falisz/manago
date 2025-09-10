import React, { useState, useRef, useEffect } from 'react';
import Icon from "./Icon";

const Dropdown = ({ className='', placeholder=null, name, value, options, onChange, noneAllowed=false, upperCaseNames=false }) => {
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

    const getDisplayText = () => {
        if (!value) return placeholder || 'Select an option';
        const isOptionObject = options.length > 0 && typeof options[0] === 'object';
        if (isOptionObject) {
            const selectedOption = options.find(option => option.id === value);
            return selectedOption ? (upperCaseNames ? selectedOption.name.toUpperCase() : selectedOption.name)  : 'Select an option';
        }
        return (upperCaseNames ? value.toUpperCase() : value);
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
                <span>{getDisplayText()}</span>
                <Icon s={true} i={isOpen ? 'arrow_drop_up' : 'arrow_drop_down'}/>
            </div>
            <ul className={`dropdown-options app-scroll ${isOpen ? '' : 'hidden'}`}>
                {noneAllowed &&
                    <li
                        key={0}
                        className={`dropdown-option opt-none`}
                        onClick={() => handleOptionClick(0, isOpen)}
                        onKeyDown={(e) => handleKeyDown(e, 0)}
                        tabIndex={0}
                    >
                        None
                    </li>
                }
                {options.map((option) => {
                    const isString = typeof option === 'string';
                    const id = isString ? option.toLowerCase() : option.id;
                    const displayText = isString ? option : option.name;

                    return (
                        <li
                            key={id}
                            className={`dropdown-option opt-${id}`}
                            onClick={() => handleOptionClick(id, isOpen)}
                            onKeyDown={(e) => handleKeyDown(e, id)}
                            tabIndex={0}
                        >
                            {upperCaseNames ? displayText.toUpperCase() : displayText}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default Dropdown;