// FRONTEND/components/EditForm.jsx
import React, {useState, useEffect, useMemo, useRef} from 'react';
import { useModals } from '../contexts/ModalContext';
import ComboBox from './ComboBox';
import Button from './Button';
import MultiComboBox from './MultiComboBox';
import CheckBox from './CheckBox';
import '../styles/EditForm.css';
import Icon from "./Icon";

// TODO: Add support for background picker.
// TODO: Change structure.inputs into structure.fields.

const EditForm = ({ structure, presetData, source = null, setSource = null, style, className }) => {
    const [ formData, setFormData ] = useState({});
    const [ errors, setErrors ] = useState({});
    const { openModal, setDiscardWarning, refreshData, closeTopModal } = useModals();
    const initialSource = useRef(null);
    const isMounted = useRef(false);
    
    useEffect(() => {
        if (source) {
            initialSource.current = JSON.parse(JSON.stringify(source));
            isMounted.current = true;
        }

        // Initialization of localized data into formData, if the mounting is not yet done and there is structure inputs.
        if (!isMounted.current && structure?.inputs) {
            const newFormData = Object.values(structure.inputs).reduce((acc, config) => {
                const fieldName = config.field;
                if (!fieldName)
                    return acc;

                const fieldType = typeof config.type === 'function' ? config.type(formData) : config.type;
                const teamCompliance = config.teamCompliance;
                let value = presetData[fieldName];

                if (presetData && value !== undefined) {
                    if (fieldType === 'id-list' && Array.isArray(value)) {
                        if (teamCompliance)
                            value = value.filter(item => item.team.id === presetData.id);

                        value = value.map(item => {
                            if (['string', 'number', 'boolean'].includes(typeof item))
                                return item;

                            return item.id;
                        });
                    }
                    acc[fieldName] = value;
                } else {
                    if (fieldType.includes('list')) {
                        acc[fieldName] = [null];
                    } else {
                        acc[fieldName] = null;
                    }
                }

                return acc;
            }, {});

            isMounted.current = true;
            setFormData(newFormData);
        }
    }, [structure, presetData, source, formData, isMounted]);

    const validateField = (field, value, config, data) => {
        const required = typeof config.required === 'function' ? config.required(data) : config.required;
        if (!required)
            return false; // Not invalid if not required

        let invalid;

        if (['input', 'text', 'date', 'textarea'].includes(config.inputType)) {
            invalid = value == null || value === '';
        } else if (config.inputType === 'checkbox') {
            invalid = !value;
        } else if (['dropdown', 'multi-dropdown'].includes(config.inputType)) {
            if (Array.isArray(value)) {
                invalid = value.filter(v => v != null).length === 0;
            } else {
                invalid = value == null;
            }
        } else {
            invalid = value == null || (Array.isArray(value) && value.length === 0);
        }

        return invalid;
    };

    const handleChange = (e, mode='set', index) => {
        const {name, value, type, checked} = e.target;

        const setter = (prev) => ({
            ...prev,
            [name]: (() => {
                if (type === 'dropdown') {
                    if (index !== null && index !== undefined) {
                        switch (mode) {
                            case 'set':
                                return [...prev[name].slice(0, index), value || null, ...prev[name].slice(index + 1)];

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
                    if (value === undefined) {
                        return prev[name];
                    }
                    return value;
                } else {
                    return type === 'checkbox' ? checked : value;
                }
            })()
        });

        if (setSource) {
            setSource(prev => setter(prev));
        } else {
            setFormData(prev => setter(prev));
            setDiscardWarning(true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = source || formData;
        const newErrors = {};

        setErrors(newErrors);

        Object.values(structure.inputs).forEach(config => {
            const field = config.field;
            if (!field || !config.inputType)
                return;

            const invalid = validateField(field, data[field], config, data);
            if (invalid) {
                newErrors[field] = true;
            }
        });

        setErrors(newErrors);

        const savedItem = await structure.onSubmit.onSave(formData, presetData?.id || null);
        if (savedItem) {
            setDiscardWarning(false);
            setTimeout(() => {
                closeTopModal();
                if (!presetData?.id && structure.onSubmit.openIfNew) {
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

    const handleCancel = async (e) => {
        e.preventDefault();
        const onCancel = structure.onCancel?.handler;
        if (typeof onCancel === 'function') {
            if (onCancel.constructor === (async () => {}).constructor)
                await onCancel();
            else
                onCancel();
        }

        const closeModal = !structure.onCancel?.keepOpen;
        if (closeModal) {
            setDiscardWarning(false);
            closeTopModal();
        }
    };

    const formSections = useMemo(() => {
        const sections = {};
        Object.entries(structure.inputs).forEach(([key, config]) => {
            const { section } = config;
            if (!sections[section]) {
                sections[section] = {};
            }
            sections[section][key] = { ...config };
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

    const header = useMemo(() => {
        const headerModes = {
            add: ['Adding', 'to'],
            set: ['Setting', 'to'],
            del: ['Removing', 'from'],
        };

        if (!structure.header || !structure.header.title) {
            return '';
        }

        let header = structure.header.title;

        if (structure.header.modes) {
            header = header.replace('%m', headerModes[formData['mode']]?.[0], 0);
            header = header.replace('%m', headerModes[formData['mode']]?.[1], 1);
        }
        if (structure.header.variantField) {
            header = header.replace('%v',
                structure.header.variantOptions[formData[structure.header.variantField]]);
        }

        return header;
    }, [structure, formData]);

    const getInputClassName = (baseClass, group) => {
        return `${baseClass}${errors[group.field] ? ' error' : ''}`;
    };

    const getComponentClassName = (group) => {
        return `${group.className || ''}${errors[group.field] ? ' error' : ''}`;
    };

    return <form
                className={'app-form' + (className ? ' ' + className : '')}
                onSubmit={handleSubmit}
                style={style}
            >
                {header && <h1 className={'app-form-header'}>{header}</h1>}

                {Object.values(formSections).map((section, key) => {
                    return <div
                        key={key}
                        className={'form-section' + (section.className ? ' ' + section.className : '')}
                        style={section.style}
                    >
                        {section.header && <h2>{section.header}</h2>}
                        {Object.entries(section).map(([key, group], index) => {

                            const type = typeof group.type === 'function' ? group.type(formData) : group.type;

                            if ( ['header', 'style', 'className'].includes(key) || type === 'hidden')
                                return null;

                            let groupContent;

                            if (group.type === 'content')
                                groupContent = group.content;

                            if (group.inputType === 'input' || group.inputType === 'text')
                                groupContent = <input
                                    className={getInputClassName('form-input', group)}
                                    type={'text'}
                                    name={group.field}
                                    value={source[group.field] || formData[group.field] || ''}
                                    onChange={(e) => {handleChange(e); group.onChange && group.onChange(e, formData);}}
                                    placeholder={`${group.placeholder || group.label}`}
                                    required={group.required}
                                    disabled={group.disabled}
                                />;

                            if (group.inputType === 'date')
                                groupContent = <input
                                    className={getInputClassName('form-input', group)}
                                    type={'date'}
                                    name={group.field}
                                    value={source[group.field] || formData[group.field] || ''}
                                    min={typeof group.min === 'function' ? group.min(formData) : group.min }
                                    max={typeof group.max === 'function' ? group.max(formData) : group.max }
                                    onChange={(e) => {handleChange(e); group.onChange && group.onChange(e, formData);}}
                                    placeholder={`${group.placeholder || group.label}`}
                                    required={group.required}
                                    disabled={group.disabled}
                                />;

                            if (group.inputType === 'textarea')
                                groupContent = <textarea
                                    className={getInputClassName('form-textarea', group)}
                                    name={group.field}
                                    value={source[group.field] || formData[group.field] || ''}
                                    onChange={(e) => {handleChange(e); group.onChange && group.onChange(e, formData);}}
                                    placeholder={`${group.placeholder || group.label}`}
                                    required={group.required}
                                    disabled={group.disabled}
                                />;

                            if (group.inputType === 'checkbox')
                                groupContent = <CheckBox
                                    className={getComponentClassName(group)}
                                    id={group.field}
                                    name={group.field}
                                    checked={source[group.field] || formData[group.field] || false}
                                    onChange={(e) => {handleChange(e); group.onChange && group.onChange(e, formData);}}
                                    label={group.inputLabel}
                                />;

                            if (group.inputType === 'radio')
                                groupContent = <div
                                    className={'form-radio-group' + (group.className ? ' ' + group.className : '')}
                                    style={group.style}
                                >
                                    {group.options.map((option, index) => (
                                        <label key={index} className={'radio-label'}>
                                            <input
                                                type='radio'
                                                name={group.field}
                                                value={option}
                                                checked={(source[group.field] || formData[group.field]) === option.id}
                                                onChange={handleChange}
                                                disabled={typeof group.disabled === 'function' ? group.disabled(formData) : group.disabled}
                                            />
                                            {option.label &&
                                                <span className={'radio-label-text'}>{option.label}</span>
                                            }
                                            {option.image &&
                                                <img
                                                    className={'radio-label-image'}
                                                    src={option.image}
                                                    alt={option.id}
                                                />
                                            }
                                        </label>
                                    ))}

                                </div>

                            if (group.inputType === 'dropdown')
                                groupContent = <ComboBox
                                    className={getComponentClassName(group)}
                                    placeholder={`${group.placeholder || 'Select ' + group.label}`}
                                    name={group.field}
                                    value={source[group.field] || formData[group.field] || group.default || null}
                                    options={typeof group.options === 'function' ? group.options(source || formData) :
                                        group.options || [{id: null, name: 'None'}]}
                                    onChange={(e) => {handleChange(e); group.onChange && group.onChange(e, formData);}}
                                    searchable={group.searchable}
                                    noneAllowed={group.noneAllowed}
                                    disabled={group.disabled}
                                    required={typeof group.required === 'function' ? group.required(formData) : group.required}
                                />;

                            if (group.inputType === 'multi-dropdown') {

                                let itemExcludedIds = [];

                                if (group.itemExcludedIds) {
                                    if (group.itemExcludedIds.data)
                                        itemExcludedIds.push(...group.itemExcludedIds.data);

                                    if (group.itemExcludedIds.formData)
                                        group.itemExcludedIds.formData.forEach(field => {
                                            if (Array.isArray(formData[field]) && formData[field].length)
                                                itemExcludedIds.push(...formData[field]);
                                            else
                                                itemExcludedIds.push(formData[field]);
                                        });
                                }

                                groupContent = <MultiComboBox
                                    formData={formData}
                                    dataField={group.field}
                                    onChange={handleChange}
                                    itemSource={group.itemSource}
                                    itemNameField={group.itemNameField}
                                    itemName={group.itemName}
                                    itemExcludedIds={itemExcludedIds}
                                />;
                            }

                            if (group.type === 'listing')
                                groupContent = <div>{
                                    formData[group.field]?.map((item, index) => {
                                        let name = item[group.nameField];
                                        if (Array.isArray(group.nameField)) {
                                            name = group.nameField.map(field => item[field]).join(' ');
                                        }
                                        return <span key={index}>{name}{index !== (formData[group.field].length - 1) && ', ' }</span>
                                    })
                                }</div>;

                            return (
                                <div
                                    key={index}
                                    className={'form-group' + (group.className ? ' ' + group.className : '')}
                                    style={group.style}
                                >
                                    {group.label && <h3 className={'form-group-label'}>
                                        {group.icon && <Icon i={group.icon} s={true}/>}
                                        {group.label}
                                    </h3>}
                                    {groupContent}
                                </div>
                            );

                        })}
                    </div>
                })}
                <div className='form-section align-center'>
                    {!structure.onSubmit?.hidden && <Button
                        className={'save-button'}
                        type={'submit'}
                        label={structure.onSubmit.label || 'Save changes'}
                        icon={'save'}
                    />}
                    {!structure.onCancel?.hidden && <Button
                        className={'discard-button'}
                        type={'button'}
                        label={structure.onCancel.label || 'Discard'}
                        icon={'close'}
                        onClick={handleCancel}
                    />}
                </div>
            </form>
};

export default EditForm;