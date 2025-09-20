import React, { useState, useRef, useEffect } from 'react';
import Icon from "./Icon";

const Dropdown = ({
                      className = '',
                      placeholder = null,
                      name,
                      value,
                      options,
                      onChange,
                      noneAllowed = false,
                      upperCaseNames = false,
                      searchable = true,
                      style = null
                  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleOptionClick = (option, isOpen) => {
        if (isOpen) {
            const syntheticEvent = {
                target: { name, type: 'dropdown', value: option },
                // eslint-disable-next-line
                persist: () => {}, // For React event pooling compatibility
            };
            onChange(syntheticEvent);
            setIsOpen(false);
            setTimeout(() => setSearchTerm(''), 400);
        }
    };

    const handleKeyDown = (e, option) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOptionClick(option);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const getDisplayText = () => {
        if (!value) return placeholder || 'Select an option';
        const isOptionObject = options.length > 0 && typeof options[0] === 'object';
        if (isOptionObject) {
            const selectedOption = options.find(option => option.id === value);
            return selectedOption ?
                (upperCaseNames ? selectedOption.name.toUpperCase() : selectedOption.name)  :
                'Select an option';
        }
        return (upperCaseNames ? value.toUpperCase() : value);
    };

    const filteredOptions = options.filter((option) => {
        const displayText = typeof option === 'string' ? option : option.name;
        return displayText.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className={"app-dropdown " + className} ref={dropdownRef} style={style}>
            <div
                className="dropdown-selected"
                onClick={() => setIsOpen(!isOpen)}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' ) {
                        setIsOpen(!isOpen);
                    }
                }}
            >
                { searchable ? <input
                    className="dropdown-search-input"
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder={getDisplayText()}
                    onClick={(e) => {setIsOpen(!isOpen); e.stopPropagation()}}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape')
                            setIsOpen(false)
                        else
                            setIsOpen(true)
                    }}
                /> : <span className={'dropdown-selected-text'}>{getDisplayText()}</span> }
                <Icon s={true} i={isOpen ? 'arrow_drop_up' : 'arrow_drop_down'} clickable={true}/>
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
                {filteredOptions.map((option) => {
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