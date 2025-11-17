// FRONTEND/components/EditForm.jsx
import React, {useState, useEffect, useMemo, useRef} from 'react';
import useNav from '../contexts/NavContext';
import Button from './Button';
import CheckBox from './CheckBox';
import ComboBox from './ComboBox';
import Icon from "./Icon";
import MultiComboBox from './MultiComboBox';
import '../styles/EditForm.css';

// TODO: Replace "structure" prop with header, fields, sections, onChange, onSubmit, onCancel, modal and buttons props.
// TODO: Move RefreshTriggers to the respective save functions in custom hooks
// TODO: Move OpenIfNew to the save functions as well - but instead of opening a new it should just open a pop up that can be clicked to open details modal.
const EditForm = ({ structure, presetData, source = null, setSource = null, style, className }) => {
    const [ formData, setFormData ] = useState({});
    const [ errors, setErrors ] = useState({});
    const { openModal, setDiscardWarning, refreshData, closeTopModal, setUnsavedChanges } = useNav();
    const initialSource = useRef(null);
    
    useEffect(() => {
        if (source && initialSource.current == null)
            initialSource.current = JSON.parse(JSON.stringify(source));
            
        if (initialSource.current != null)
            return;

        // Initialization of localized data into formData, if the mounting is not yet done and there is structure inputs.
        if (structure?.fields) {
            const newFormData = Object.entries(structure.fields).reduce((acc, [name, config]) => {
                if (!name)
                    return acc;

                const fieldType = config.type;
                const teamCompliance = config.teamCompliance;
                let value = presetData[name];

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
                    acc[name] = value;
                } else {
                    if (fieldType.includes('list')) {
                        acc[name] = [null];
                    } else {
                        acc[name] = null;
                    }
                }

                return acc;
            }, {});
            setFormData(newFormData);
        }
    }, [structure, presetData, source]);

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

        if (structure.onChange && typeof structure.onChange === 'function')
            structure.onChange();

        setUnsavedChanges(true);

        if (setSource) {
            setSource(prev => setter(prev));
        } else {
            setFormData(prev => setter(prev));
            structure?.modal && setDiscardWarning(structure.modal, true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = source || formData;
        const newErrors = {};

        setErrors(newErrors);

        Object.entries(structure.fields).forEach(([name, config]) => {
            if (!name || !config.inputType)
                return;

            const invalid = validateField(name, data[name], config, data);
            
            if (invalid)
                newErrors[name] = true;
        });

        setErrors(newErrors);

        const savedItem = await structure.onSubmit.onSave(formData, presetData?.id || null);
        if (savedItem) {
            structure?.modal && setDiscardWarning(structure.modal, false);
            setUnsavedChanges(false);
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
            structure?.modal && setDiscardWarning(structure.modal, false);
            closeTopModal();
        }

        setUnsavedChanges(false);
    };

    const formSections = useMemo(() => {
        const sections = structuredClone(structure.sections || {});
        Object.entries(structure.fields).forEach(([name, config]) => {
            const { section, ...field } = config;

            if (!sections[section])
                sections[section] = { fields: {} };

            else if (!sections[section].fields)
                sections[section].fields = {};

            sections[section].fields[name] = { ...field };
        });
        Object.keys(sections).forEach(key => {
            if (!sections[key].fields || Object.keys(sections[key].fields).length === 0)
                delete sections[key];
        });
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

    const getInputClassName = (baseClass, name) => {
        return `${baseClass}${errors[name] ? ' error' : ''}`;
    };

    const getComponentClassName = (name, group) => {
        return `${group.className || ''}${errors[name] ? ' error' : ''}`;
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
                        {Object.entries(section.fields).map(([name, group], index) => {

                            const type = typeof group.type === 'function' ? group.type(formData) : group.type;

                            if ( type === 'hidden')
                                return null;

                            let groupContent;

                            if (group.type === 'content')
                                groupContent = group.content;

                            if (group.inputType === 'input' || group.inputType === 'text')
                                groupContent = <input
                                    className={getInputClassName('form-input', name)}
                                    type={'text'}
                                    name={name}
                                    value={source?.[name] || formData?.[name] || ''}
                                    onChange={(e) => {handleChange(e); group.onChange && group.onChange(e, formData);}}
                                    placeholder={`${group.placeholder || group.label}`}
                                    required={group.required}
                                    disabled={group.disabled}
                                />;

                            if (group.inputType === 'date')
                                groupContent = <input
                                    className={getInputClassName('form-input', name)}
                                    type={'date'}
                                    name={name}
                                    value={source?.[name] || formData?.[name] || ''}
                                    min={typeof group.min === 'function' ? group.min(formData) : group.min }
                                    max={typeof group.max === 'function' ? group.max(formData) : group.max }
                                    onChange={(e) => {handleChange(e); group.onChange && group.onChange(e, formData);}}
                                    placeholder={`${group.placeholder || group.label}`}
                                    required={group.required}
                                    disabled={group.disabled}
                                />;

                            if (group.inputType === 'textarea')
                                groupContent = <textarea
                                    className={getInputClassName('form-textarea', name)}
                                    name={name}
                                    value={source?.[name] || formData?.[name] || ''}
                                    onChange={(e) => {handleChange(e); group.onChange && group.onChange(e, formData);}}
                                    placeholder={`${group.placeholder || group.label}`}
                                    required={group.required}
                                    disabled={group.disabled}
                                />;

                            if (group.inputType === 'checkbox')
                                groupContent = <CheckBox
                                    className={getComponentClassName(name, group)}
                                    id={name}
                                    name={name}
                                    checked={source?.[name] || formData?.[name] || false}
                                    onChange={(e) => {handleChange(e); group.onChange && group.onChange(e, formData);}}
                                    label={group.inputLabel}
                                />;

                            if (group.inputType === 'radio'){
                                groupContent = <div
                                    className={'form-radio-group'
                                        + (group.className ? ' ' + group.className : '')
                                        + (group.disabled ? ' disabled' : '')}
                                    style={group.style}
                                >
                                    {group.options.map((option, index) => (
                                        <label key={index} className={'radio-label'}>
                                            <input
                                                type='radio'
                                                name={name}
                                                value={option.id}
                                                checked={(source?.[name] || formData?.[name]) === option.id}
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

                                </div>;
                            }

                            if (['dropdown', 'combobox'].includes(group.inputType))
                                groupContent = <ComboBox
                                    className={getComponentClassName(name, group)}
                                    style={group.inputStyle}
                                    selectedStyle={group.selectedStyle}
                                    optionsStyle={group.optionsStyle}
                                    placeholder={`${group.placeholder || 'Select ' + group.label}`}
                                    name={name}
                                    value={source?.[name] || formData?.[name] || group.default || null}
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
                                    dataField={name}
                                    onChange={handleChange}
                                    itemSource={group.itemSource}
                                    itemNameField={group.itemNameField}
                                    itemName={group.itemName}
                                    itemExcludedIds={itemExcludedIds}
                                />;
                            }

                            if (group.type === 'listing')
                                groupContent = <div>{
                                    formData[name]?.map((item) => {
                                        let name = item[group.nameField];
                                        if (Array.isArray(group.nameField)) {
                                            name = group.nameField.map(field => item[field]).join(' ');
                                        }
                                        return name;
                                    }).join(', ')
                                }</div>;

                            return (
                                <div
                                    key={index}
                                    className={'form-group' +
                                        (group.className ? ' ' + group.className : '') +
                                        (group.disabled ? ' disabled' : '')
                                    }
                                    style={group.style}
                                >
                                    {group.label && <h3 className={'form-group-label'} style={group.labelStyle}>
                                        {group.icon && <Icon i={group.icon} s={true} style={group.iconStyle}/>}
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
                        label={structure.onSubmit?.label || 'Save changes'}
                        icon={'save'}
                    />}
                    {!structure.onCancel?.hidden && <Button
                        className={'discard-button'}
                        type={'button'}
                        label={structure.onCancel?.label || 'Discard'}
                        icon={'close'}
                        onClick={handleCancel}
                    />}
                </div>
            </form>
};

export default EditForm;