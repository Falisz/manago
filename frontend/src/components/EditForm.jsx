// FRONTEND/components/EditForm.jsx
import React, {useState, useEffect, useRef, useMemo} from 'react';
import useNav from '../contexts/NavContext';
import Button from './Button';
import CheckBox from './CheckBox';
import ComboBox from './ComboBox';
import Icon from "./Icon";
import MultiComboBox from './MultiComboBox';
import '../styles/EditForm.css';

const Header = ({header, data}) => {
    if (!header)
        return null;

    if (typeof header === 'string')
        return <h1 className={'form-header'}>{header}</h1>;

    if (typeof header === 'function')
        return <h1 className={'form-header'}>{header(data)}</h1>;

    if (typeof header === 'object') {
        const {className, style, title} = header;

        return (
            <h1 className={'form-header' + (className ? ` ${className}` : '')} style={style}>{title}</h1>
        );
    }
};

const Field = ({name, field, formData, source, errors, handleChange}) => {


    const getInputClassName = (baseClass, name) => {
        return `${baseClass}${errors[name] ? ' error' : ''}`;
    };

    const getComponentClassName = (name, field) => {
        return `${field.className || ''}${errors[name] ? ' error' : ''}`;
    };

    const { className, style, label, labelStyle, icon, iconStyle, disabled } = field;
    const type = typeof field.type === 'function' ? field.type(formData) : field.type;

    if ( type === 'hidden')
        return null;

    let content;

    if (type === 'content')
        content = typeof field.content === 'function' ? field.content(formData) : field.content;

    if (['input', 'text', 'string'].includes(type))
        content = <input
            className={getInputClassName('form-input', name)}
            type={'text'}
            name={name}
            value={source?.[name] || formData?.[name] || ''}
            onChange={(e) => {handleChange(e); field.onChange && field.onChange(e, formData);}}
            placeholder={`${field.placeholder || field.label}`}
            required={field.required}
            disabled={field.disabled}
        />;

    if (type === 'date')
        content = <input
            className={getInputClassName('form-input', name)}
            type={'date'}
            name={name}
            value={source?.[name] || formData?.[name] || ''}
            min={typeof field.min === 'function' ? field.min(formData) : field.min }
            max={typeof field.max === 'function' ? field.max(formData) : field.max }
            onChange={(e) => {handleChange(e); field.onChange && field.onChange(e, formData);}}
            placeholder={`${field.placeholder || field.label}`}
            required={field.required}
            disabled={field.disabled}
        />;

    if (type === 'time')
        content = <input
            className={getInputClassName('form-input', name)}
            type={'time'}
            name={name}
            value={source?.[name] || formData?.[name] || ''}
            min={typeof field.min === 'function' ? field.min(formData) : field.min }
            max={typeof field.max === 'function' ? field.max(formData) : field.max }
            onChange={(e) => {handleChange(e); field.onChange && field.onChange(e, formData);}}
            placeholder={`${field.placeholder || field.label}`}
            required={field.required}
            disabled={field.disabled}
        />;

    if (type === 'textarea')
        content = <textarea
            className={getInputClassName('form-textarea', name)}
            name={name}
            value={source?.[name] || formData?.[name] || ''}
            onChange={(e) => {handleChange(e); field.onChange && field.onChange(e, formData);}}
            placeholder={`${field.placeholder || field.label}`}
            required={field.required}
            disabled={field.disabled}
        />;

    if (type === 'checkbox')
        content = <CheckBox
            className={getComponentClassName(name, field)}
            id={name}
            name={name}
            checked={source?.[name] || formData?.[name] || false}
            onChange={(e) => {handleChange(e); field.onChange && field.onChange(e, formData);}}
            label={field.inputLabel}
        />;

    if (type === 'radio') {
        content = <div
            className={'form-radio-group'
                + (field.className ? ' ' + field.className : '')
                + (field.disabled ? ' disabled' : '')}
            style={field.style}
        >
            {field.options.map((option, index) => (
                <label key={index} className={'radio-label'}>
                    <input
                        type='radio'
                        name={name}
                        value={option.id}
                        checked={(source?.[name] || formData?.[name]) === option.id}
                        onChange={handleChange}
                        disabled={typeof field.disabled === 'function' ? field.disabled(formData) : field.disabled}
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

    if (['dropdown', 'combobox'].includes(type))
        content = <ComboBox
            className={getComponentClassName(name, field)}
            style={field.inputStyle}
            selectedStyle={field.selectedStyle}
            optionsStyle={field.optionsStyle}
            placeholder={`${field.placeholder || 'Select ' + field.label}`}
            name={name}
            value={source?.[name] || formData?.[name] || field.default || null}
            options={typeof field.options === 'function' ? field.options(source || formData) :
                field.options || [{id: null, name: 'None'}]}
            onChange={(e) => {handleChange(e); field.onChange && field.onChange(e, formData);}}
            searchable={field.searchable}
            noneAllowed={field.noneAllowed}
            disabled={field.disabled}
            required={typeof field.required === 'function' ? field.required(formData) : field.required}
        />;

    if (type === 'multi-dropdown') {

        let itemExcludedIds = [];

        if (field.itemExcludedIds) {
            if (field.itemExcludedIds.data)
                itemExcludedIds.push(...field.itemExcludedIds.data);

            if (field.itemExcludedIds.formData)
                field.itemExcludedIds.formData.forEach(field => {
                    if (Array.isArray(formData[field]) && formData[field].length)
                        itemExcludedIds.push(...formData[field]);
                    else
                        itemExcludedIds.push(formData[field]);
                });
        }
        content = <MultiComboBox
            formData={formData}
            dataField={name}
            onChange={handleChange}
            itemSource={field.itemSource}
            itemNameField={field.itemNameField}
            itemName={field.itemName}
            itemExcludedIds={itemExcludedIds}
        />;
    }

    if (type === 'listing')
        content = <div>{
            formData[name]?.map((item) => {
                let name = item[field.nameField];
                if (Array.isArray(field.nameField)) {
                    name = field.nameField.map(field => item[field]).join(' ');
                }
                return name;
            }).join(', ')
        }</div>;

    return (
        <div
            className={'form-group' + (className ? ' ' + className : '') + (disabled ? ' disabled' : '')}
            style={style}
        >
            {label &&
                <h3 className={'form-group-label'} style={labelStyle}>
                    {icon && <Icon i={icon} s={true} style={iconStyle}/>}
                    {label}
                </h3>
            }
            {content}
        </div>
    );

}

const Section = ({section, formData, source, errors, handleChange}) => {

    const { className, style, header, fields } = section;

    return (
        <div
            className={'form-section' + (className ? ' ' + className : '')}
            style={style}
        >
            {header && <h2 className={'form-section-header'}>{header}</h2>}
            {Object.entries(fields).map(([name, field], index) => <Field
                key={index}
                name={name}
                field={field}
                formData={formData}
                source={source}
                errors={errors}
                handleChange={handleChange}
            />)}
        </div>
    );
};

const EditForm = ({ 
    className,
    style,
    header,
    sections,
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

    const fields = useMemo(() =>
            Object.values(sections).reduce((acc, section) => ({...acc, ...section.fields}), {}),
    [sections]);

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
                let value = presetData[name];

                if (presetData && value !== undefined) {
                    if (config.array && Array.isArray(value)) {
                        if (config.teamCompliance)
                            value = value.filter(item => item?.team?.id === presetData.id);

                        value = value.map(item => {
                            if (typeof item === 'object')
                                return item.id;

                            return item;
                        });
                    }
                    acc[name] = value;
                } else {
                    if (config.array)
                        acc[name] = [null];
                    else
                        acc[name] = null;
                }

                return acc;
            }, {});
            setFormData(newFormData);
        }
    }, [source, fields, presetData]);

    const validateField = (field, value, config, data) => {
        const required = typeof config.required === 'function' ? config.required(data) : config.required;
        const type = typeof config.type === 'function' ? config.type(data) : config.type;

        if (!required)
            return false; // Not invalid if not required

        let invalid;

        if (type === 'multi-dropdown') {
            if (Array.isArray(value)) {
               invalid = value.filter(v => v != null).length === 0;
            } else {
               invalid = value == null;
            }
        } else if (type === 'checkbox') {
            invalid = !value;
        } else if (config.array) {
            invalid = !Array.isArray(value);
        } else {
            invalid = value == null || value === '' || (Array.isArray(value) && value.length === 0);
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
                if (!name || !config.type)
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


    // TODO: Buttons to be displayed with flex, but in reverse-order, so the save button is on the very right side of the form!

    return (
        <div
            className={'form-page' + (className ? ' ' + className : '')}
            style={style}
        >
            <Header header={header} data={formData}/>
            <form className={'form-content app-scroll'} onSubmit={handleSubmit}>
                {Object.values(sections).map((section, key) => <Section
                    key={key}
                    section={section}
                    formData={formData}
                    source={source}
                    errors={errors}
                    handleChange={handleChange}
                />)}
                <div className='form-section form-buttons'>
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
        </div>
    );
};

export default EditForm;