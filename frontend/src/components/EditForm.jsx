import React, {useState, useEffect, useMemo} from 'react';
import { useModals } from '../contexts/ModalContext';
import Dropdown from './Dropdown';
import Button from './Button';
import MultiDropdown from './MultiDropdown';
import Checkbox from "./Checkbox";
import ComboDropdown from "./ComboDropdown";

const EditForm = ({structure, data, preset, style, className}) => {
    const [ formData, setFormData ] = useState({});
    const { openModal, setDiscardWarning, refreshData, closeTopModal } = useModals();
    
    useEffect(() => {
        if (structure?.inputs) {
            const newFormData = Object.values(structure.inputs).reduce((acc, config) => {
                const fieldName = config.field;
                const fieldType = config.type;

                if (data) {
                    let value = data[fieldName];

                    if (fieldType === 'id-list' && Array.isArray(value)) {
                        value = value.map(item => item.id);
                    }

                    acc[fieldName] = value;
                } else if (preset && Array.isArray(preset)) {
                    const presetValue = preset.find(item => item.field === fieldName);

                    if (presetValue && presetValue.value !== undefined) {
                        acc[fieldName] = presetValue.value;
                    } else {
                        if (fieldType === 'id-list') {
                            acc[fieldName] = [];
                        } else {
                            acc[fieldName] = null;
                        }
                    }
                } else {
                    if (fieldType === 'id-list') {
                        acc[fieldName] = [];
                    } else {
                        acc[fieldName] = null;
                    }
                }

                return acc;
            }, {});

            setFormData(newFormData);
        }
    }, [data, preset, structure]);

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
                    return value || prev[name];
                } else {
                    return type === 'checkbox' ? checked : value;
                }
            })()
        }));

        setDiscardWarning(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const savedItem = await structure.onSubmit.onSave(formData, data?.id || null);
        if (savedItem) {
            setDiscardWarning(false);
            setTimeout(() => {
                closeTopModal();
                if (!data && structure.onSubmit.openIfNew) {
                    setTimeout(() => {
                        openModal({content: structure.onSubmit.openIfNew , contentId: savedItem.id});
                    }, 350);
                }
                if (structure.onSubmit.refreshTriggers) {
                    structure.onSubmit.refreshTriggers.forEach(([type, value]) => refreshData(type, value));
                }
            }, 10);
        }
    };

    const inputSections = useMemo(() => {
        const sections = {};
        Object.entries(structure.inputs).forEach(([key, config]) => {
            const { section } = config;
            if (!sections[section]) {
                sections[section] = {};
            }
            sections[section][key] = {...config };
        });
        if (structure.sections)
        {
            Object.entries(structure.sections).forEach(([key, config]) => {
                if (config.header)
                    sections[key].header = config.header;
                if (config.style)
                    sections[key].style = config.style;
                if (config.className)
                    sections[key].className = config.className;
            })
        }

        return sections;
    }, [structure]);

    console.log(formData);

    return <form 
                className={'app-form' + (className ? ' ' + className : '')}
                onSubmit={handleSubmit}
                style={style}
            >
                { structure.header && structure.header.title &&
                    <h1 className={'app-form-header'}>{structure.header.title}</h1> }

                {Object.values(inputSections).map((section, key) => {
                    return <div
                        key={key}
                        className={'form-section' + (section.className ? ' ' + section.className : '')}
                        style={section.style}
                    >
                        {section.header && <h2>{section.header}</h2>}
                        {Object.entries(section).map(([key, group], index) => {
                            if ( ['header', 'style', 'className'].includes(key) )
                                return null;

                            let input;

                            if (group.inputType === 'input')
                                input = <input
                                    className={'form-input'}
                                    type={'text'}
                                    name={group.field}
                                    value={formData[group.field] || ''}
                                    onChange={handleChange}
                                    placeholder={`${group.placeholder || group.label}`}
                                    required={group.required}
                                />;

                            if (group.inputType === 'textarea')
                                input = <textarea
                                    className={'form-textarea'}
                                    name={group.field}
                                    value={formData[group.field] || ''}
                                    onChange={handleChange}
                                    placeholder={`${group.placeholder || group.label}`}
                                    required={group.required}
                                />;

                            if (group.inputType === 'checkbox')
                                input = <Checkbox
                                    id={group.field}
                                    name={group.field}
                                    checked={formData[group.field] || false}
                                    onChange={handleChange}
                                    label={group.inputLabel}
                                />

                            if (group.inputType === 'dropdown')
                                input = <Dropdown
                                    className={group.className}
                                    placeholder={`${group.inputLabel}`}
                                    name={group.field}
                                    value={formData[group.field]}
                                    options={group.options}
                                    onChange={handleChange}
                                />;

                            if (group.inputType === 'multi-dropdown')
                                input = <MultiDropdown
                                    formData={formData}
                                    dataField={group.field}
                                    onChange={handleChange}
                                    itemSource={group.itemSource}
                                    itemNameField={group.itemNameField}
                                    itemName={group.itemName}
                                    itemExcludedIds={group.itemExcludedIds}
                                />;

                            if (group.inputType === 'combo-dropdown')
                                input = <ComboDropdown
                                    formData={formData}
                                    dataField={group.field}
                                    onChange={handleChange}
                                    itemSource={group.itemSource}
                                    itemNameField={group.itemNameField}
                                    itemName={group.itemName}
                                    modeField={group.modeField}
                                    modeOptions={group.modeOptions}
                                />;

                            return (
                                <div
                                    key={index}
                                    className={'form-group' + (group.className ? ' ' + group.className : '')}
                                    style={group.style}
                                >
                                    {group.label && <h3 className={'form-group-label'}>{group.label}</h3>}
                                    {input}
                                </div>
                            );

                        })}
                    </div>
                })}
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