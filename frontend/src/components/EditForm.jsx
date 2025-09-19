import React, { useState, useEffect } from 'react';
import { useModals } from '../contexts/ModalContext';
import Dropdown from './Dropdown';
import Button from './Button';
import MultiDropdown from './MultiDropdown';

const EditForm = ({structure, data}) => {
    const [ formData, setFormData ] = useState({});
    const { openModal, setDiscardWarning, refreshData, closeTopModal } = useModals();
    
    useEffect(() => {
        if (data && structure?.dataStructure) {
            const newFormData = Object.values(structure.dataStructure).reduce((acc, config) => {
                const fieldName = config.field;
                const fieldType = config.type;

                let value = data[fieldName];

                if (fieldType === 'id-list' && Array.isArray(value)) {
                    value = value.map(item => item.id);
                }

                acc[fieldName] = value;
                return acc;
            }, {});

            setFormData(newFormData);
        }
    }, [data, structure]);

    const handleChange = (e, mode='set', index) => {
        const {name, value, type, checked} = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: (() => {
                if (type === 'dropdown') {
                    if (index !== null && index !== undefined) {
                        switch (mode) {
                            case 'set':
                                return [
                                    ...prev[name].slice(0, index),
                                    value || null,
                                    ...prev[name].slice(index + 1),
                                ];
                            case 'del':
                                if (index === 0) {
                                    return [null, ...prev[name].slice(1)];
                                }
                                return prev[name].filter((_, i) => i !== index);
                            default:
                                return prev[name];
                        }
                    }
                    if (mode === 'add') {
                        return [...prev[name], null];
                    }
                    return prev[name];
                } else {
                    return type === 'checkbox' ? checked : value;
                }
            })()
        }));

        setDiscardWarning(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const savedItem = await structure.onSave.saveItem(formData, data.id);
        if (savedItem) {
            setDiscardWarning(false);
            setTimeout(() => {
                closeTopModal();
                if (!data) {
                    setTimeout(() => {
                        openModal({content: structure.onSave.openNew , contentId: savedItem.id});
                    }, 350);
                } else {
                    refreshData('user', data.id);
                }
                refreshData('users', true);
            }, 10);
        }
    };

    return <form 
                className={'app-form'}
                onSubmit={handleSubmit}
            >
                {Object.values(structure).map(section => {
                        if (section.type === 'header')
                            return <h1>{section.title}</h1>
                        else if (section.type === 'section') {
                            return <div className='form-section'>
                                {
                                    Object.values(section).map((group, index) => {
                                        if (typeof group === 'string') return null;

                                        let input;
                                        const className = 'form-group' + (group.className ? ' ' + group.className : '');
                                        
                                        if (group.type === 'input')
                                            input = <input
                                                        className={'form-input'}
                                                        type='text'
                                                        name={group.dataField}
                                                        value={formData[group.dataField]}
                                                        onChange={handleChange}
                                                        placeholder={`${group.label}`}
                                                        required={group.required}
                                                    />;

                                        if (group.type === 'textbox')
                                            input = <textbox/>; 

                                        if (group.type === 'checkbox')
                                            input = <input type={'checkbox'}/>; 

                                        if (group.type === 'dropdown')
                                            input = <Dropdown 
                                                        onChange={handleChange}
                                                    />; 

                                        if (group.type === 'multi-dropdown')
                                            input = <MultiDropdown
                                                        formData={formData}
                                                        dataField={group.dataField}
                                                        onChange={handleChange}
                                                        itemSource={group.itemSource}
                                                        itemNameField={group.itemNameField}
                                                    />;
                                                    
                                        return (
                                            <div key={index} className={className} style={group.style}>
                                                {group.label && <label>{group.label}</label>}
                                                {input}
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        } else
                            return null;
                    })
                }
                <div className='form-section align-center'>
                    <Button
                        className={'save-button'}
                        type={'submit'}
                        label={'Save changes'}
                        icon={'save'}
                    />
                    <Button
                        className={'discard-button'}
                        type={'button'}
                        label={'Discard'}
                        icon={'close'}
                        onClick={closeTopModal}
                    />
                </div>
            </form>
};

export default EditForm;