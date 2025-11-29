// FRONTEND/components/EditForm.jsx
import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import useNav from '../contexts/NavContext';
import Button from './Button';
import CheckBox from './CheckBox';
import ComboBox from './ComboBox';
import Icon from "./Icon";
import MultiComboBox from './MultiComboBox';
import '../styles/EditForm.css';

const EditForm = ({ 
    className,
    style,
    header,
    headerStyle,
    sections,
    fields,
    onChange,
    onSubmit,
    submitLabel,
    submitStyle,
    hideSubmit,
    onCancel,
    cancelLabel,
    cancelStyle,
    hideCancel,
    modal,
    keepOpen,
    keepOpenOnSubmit,
    keepOpenOnCancel,
    presetData = {},
    validate = true,
    source = null,
    setSource = null 
}) => {
    const [ formData, setFormData ] = useState({});
    const [ errors, setErrors ] = useState({});
    const { closeModal, setDiscardWarning, setUnsavedChanges } = useNav();
    const initialSource = useRef(null);
    
    useEffect(() => {
        if (source && initialSource.current == null)
            initialSource.current = structuredClone(source);

        if (initialSource.current != null)
            return;

        // Initialization of localized data into formData, if the mounting is not yet done and there is structure inputs.
        if (fields) {
            const newFormData = Object.entries(fields).reduce((acc, [name, config]) => {
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
    }, [source, fields, presetData]);

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

        typeof onChange === 'function' && onChange(formData);

        setUnsavedChanges(true);

        if (source && setSource) {
            setSource(prev => setter(prev));
        } else {
            setFormData(prev => setter(prev));
            modal && setDiscardWarning(modal, true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validate) {
            const data = source || formData;
            const errors = {};

            setErrors(errors);

            Object.entries(fields).forEach(([name, config]) => {
                if (!name || !config.inputType)
                    return;

                const invalid = validateField(name, data[name], config, data);
                
                if (invalid)
                    errors[name] = true;
            });

            setErrors(errors);
        }

        let success = null;

        if (typeof onSubmit === 'function') {
            if (onSubmit.constructor === (async () => {}).constructor)
                success = await onSubmit(formData);
            else
                success = onSubmit(formData);
        }

        if (success) {
            setUnsavedChanges(false);
            if (modal) {
                setDiscardWarning(modal, false);
                (!keepOpen || !keepOpenOnSubmit) && closeModal(modal);
            }
        }
    };

    const handleCancel = async (e) => {
        e.preventDefault();

        if (typeof onCancel === 'function') {
            if (onCancel.constructor === (async () => {}).constructor)
                await onCancel();
            else
                onCancel();
        }
        
        setUnsavedChanges(false);

        if (modal) {
            setDiscardWarning(modal, false);
            (!keepOpen || !keepOpenOnCancel) && closeModal(modal);
        }
    };

    const formSections = useMemo(() => {
        const formSections = structuredClone(sections || {});

        Object.entries(fields).forEach(([name, config]) => {
            const { section, ...field } = config;

            if (!formSections[section])
                formSections[section] = { fields: {} };

            else if (!formSections[section].fields)
                formSections[section].fields = {};

            formSections[section].fields[name] = { ...field };
        });

        Object.keys(formSections).forEach(key => {
            if (!formSections[key].fields || Object.keys(formSections[key].fields).length === 0)
                delete formSections[key];
        });

        return formSections;
    }, [sections, fields]);

    const getHeader = useCallback(() => {
        if (typeof header === 'function')
            return header(formData);

        return header;
    }, [header, formData]);

    const getInputClassName = (baseClass, name) => {
        return `${baseClass}${errors[name] ? ' error' : ''}`;
    };

    const getComponentClassName = (name, group) => {
        return `${group.className || ''}${errors[name] ? ' error' : ''}`;
    };

    // TODO: Separate form from header akin to Details and Table component. Set calculated max-height to the component
    //  of form itself "form-content" and set overflow-y: auto so it can be scrollable, but header stays fixed.
    //

    // <div className={'form'}>
    //     <header className={'form-header'}>
    //         ...
    //     </header>
    //     <form className={'form-content app-scroll'}>
    //         ...
    //     </form>
    // </div>

    // TODO: Like with Table and Details, split the form component into smaller components for Header, Sections and Fields.

    // TODO: Buttons to be displayed with flex, but in reverse-order, so the save button is on the very right side of the form!

    return <form
                className={'app-form' + (className ? ' ' + className : '')}
                onSubmit={handleSubmit}
                style={style}
            >
                {header && <h1 className={'app-form-header'} style={headerStyle}>{getHeader()}</h1>}

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
                                groupContent = typeof group.content === 'function' ?
                                    group.content(formData) : group.content;

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

                            if (group.inputType === 'time')
                                groupContent = <input
                                    className={getInputClassName('form-input', name)}
                                    type={'time'}
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
                    {!hideSubmit && <Button
                        className={'save-button'}
                        style={submitStyle}
                        type={'submit'}
                        label={submitLabel || 'Save changes'}
                        icon={'save'}
                    />}
                    {!hideCancel && <Button
                        className={'discard-button'}
                        style={cancelStyle}
                        type={'button'}
                        label={cancelLabel || 'Discard'}
                        icon={'close'}
                        onClick={handleCancel}
                    />}
                </div>
            </form>
};

export default EditForm;