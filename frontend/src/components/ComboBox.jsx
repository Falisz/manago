// FRONTEND/components/ComboBox.jsx
import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';
import '../styles/ComboBox.css';

const ComboBox = ({
                      className = '',
                      placeholder = null,
                      name = '',
                      value = null,
                      options = [],
                      onChange = null,
                      noneAllowed = false,
                      upperCaseNames = false,
                      searchable = true,
                      style = null
                  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const comboBoxRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (comboBoxRef.current && !comboBoxRef.current.contains(event.target)) {
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

    const handleOptionClick = (option) => {
        if (isOpen && onChange !== null) {
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
        <div className={'app-combo-box ' + className} ref={comboBoxRef} style={style}>
            <div
                className='combo-box-selected'
                onClick={() => setIsOpen(!isOpen)}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' ) {
                        setIsOpen(!isOpen);
                    }
                }}
            >
                { searchable ? <input
                    className='combo-box-search-input'
                    ref={inputRef}
                    type='text'
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
                /> : <span className={'combo-box-selected-text'}>{getDisplayText()}</span> }
                <Icon s={true} i={isOpen ? 'arrow_drop_up' : 'arrow_drop_down'} clickable={true}/>
            </div>
            <ul className={`combo-box-options app-scroll ${isOpen ? '' : 'hidden'}`}>
                {noneAllowed &&
                    <li
                        key={0}
                        className={`combo-box-option opt-none`}
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
                            className={`combo-box-option opt-${id}`}
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

export default ComboBox;