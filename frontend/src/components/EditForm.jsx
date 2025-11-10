// FRONTEND/components/EditForm.jsx
import React, {useState, useEffect, useMemo, useRef} from 'react';
import { useModals } from '../contexts/ModalContext';
import ComboBox from './ComboBox';
import Button from './Button';
import MultiComboBox from './MultiComboBox';
import CheckBox from './CheckBox';
import '../styles/EditForm.css';

//TODO: Rewrite the logic to either work on formData nad presetData, or solely on source and setSource if provided as props.
// SO THE STATE IS NOT LOCALIZED
const EditForm = ({ structure, presetData, style, className }) => {
    const [ formData, setFormData ] = useState({});
    const { openModal, setDiscardWarning, refreshData, closeTopModal } = useModals();
    const [asyncContents, setAsyncContents] = useState({});
    const isMounted = useRef(false);
    const prevFormData = useRef({});

    useEffect(() => {

        const loadAsyncContents = async () => {
            for (const [key, config] of Object.entries(structure.inputs)) {
                if (config.type !== 'content' || !config.async_content)
                    continue;

                const contentKey = `${config.section}-${config.field}`;
                const deps = config.async_content_deps || [];

                const shouldLoad = config.async_content_should_load?.(formData) ?? true;

                if (!shouldLoad) {
                    setAsyncContents(prev => ({ ...prev, [contentKey]: null }));
                    continue;
                }

                const shouldReload = deps.length === 0 || deps.some(dep =>
                    prevFormData.current[dep] !== formData[dep]
                );

                if (!shouldReload)
                    continue;

                try {
                    const content = await config.async_content(formData);
                    setAsyncContents(prev => ({ ...prev, [contentKey]: content }));
                } catch (err) {
                    console.error(`Async content error [${key}]:`, err);
                    setAsyncContents(prev => ({
                        ...prev,
                        [contentKey]: <div style={{color: 'red'}}>Error loading content</div>
                    }));
                }
            }
        };

        loadAsyncContents().then();
    }, [formData, structure.inputs]);

    useEffect(() => {
        prevFormData.current = formData;
    }, [formData]);
    
    useEffect(() => {
        if (!isMounted.current && structure?.inputs) {
            const newFormData = Object.values(structure.inputs).reduce((acc, config) => {
                const fieldName = config.field;
                const fieldType = config.conditional_type ? config.conditional_type(formData) : config.type;
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

            setFormData(newFormData);
            isMounted.current = true;
        }
    }, [presetData, structure, formData, isMounted]);

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
                    if (value === undefined) {
                        return prev[name];
                    }
                    return value;
                } else {
                    return type === 'checkbox' ? checked : value;
                }
            })()
        }));

        setDiscardWarning(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const savedItem = await structure.onSubmit.onSave(formData, presetData?.id || null);
        if (savedItem) {
            setDiscardWarning(false);
            setTimeout(() => {
                closeTopModal();
                if (!presetData && structure.onSubmit.openIfNew) {
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
            sections[section][key] = { ...config };
            if (config.type === 'content') {
                const contentKey = `${section}-${config.field}`;
                sections[section][key].content = asyncContents[contentKey] || null;
            }
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
    }, [structure, asyncContents]);

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

    return <form
                className={'app-form' + (className ? ' ' + className : '')}
                onSubmit={handleSubmit}
                style={style}
            >
                {header && <h1 className={'app-form-header'}>{header}</h1>}

                {Object.values(inputSections).map((section, key) => {
                    return <div
                        key={key}
                        className={'form-section' + (section.className ? ' ' + section.className : '')}
                        style={section.style}
                    >
                        {section.header && <h2>{section.header}</h2>}
                        {Object.entries(section).map(([key, group], index) => {
                            if ( ['header', 'style', 'className'].includes(key) || group.type === 'hidden' ||
                             (group.conditional_type && group.conditional_type(formData) === 'hidden'))
                                return null;

                            let groupContent;

                            if (group.type === 'content')
                                groupContent = group.content;

                            if (group.inputType === 'input' || group.inputType === 'text')
                                groupContent = <input
                                    className={'form-input'}
                                    type={'text'}
                                    name={group.field}
                                    value={formData[group.field] || ''}
                                    onChange={handleChange}
                                    placeholder={`${group.placeholder || group.label}`}
                                    required={group.required}
                                    disabled={group.disabled}
                                />;

                            if (group.inputType === 'date')
                                groupContent = <input
                                    className={'form-input'}
                                    type={'date'}
                                    name={group.field}
                                    value={formData[group.field] || ''}
                                    min={group.conditional_min ? group.conditional_min(formData) : group.min }
                                    max={group.conditional_max ? group.conditional_max(formData) : group.max }
                                    onChange={handleChange}
                                    placeholder={`${group.placeholder || group.label}`}
                                    required={group.required}
                                    disabled={group.disabled}
                                />;

                            if (group.inputType === 'textarea')
                                groupContent = <textarea
                                    className={'form-textarea'}
                                    name={group.field}
                                    value={formData[group.field] || ''}
                                    onChange={handleChange}
                                    placeholder={`${group.placeholder || group.label}`}
                                    required={group.required}
                                    disabled={group.disabled}
                                />;

                            if (group.inputType === 'checkbox')
                                groupContent = <CheckBox
                                    id={group.field}
                                    name={group.field}
                                    checked={formData[group.field] || false}
                                    onChange={handleChange}
                                    label={group.inputLabel}
                                />;

                            if (group.inputType === 'dropdown')
                                groupContent = <ComboBox
                                    className={group.className}
                                    placeholder={`${group.placeholder || 'Select ' + group.label}`}
                                    name={group.field}
                                    value={formData[group.field] || group.default || null}
                                    options={group.conditional_options ? group.conditional_options(formData) : group.options || []}
                                    onChange={handleChange}
                                    searchable={group.searchable}
                                    noneAllowed={group.noneAllowed}
                                    disabled={group.disabled}
                                    required={group.conditional_required ? group.conditional_required(formData) : group.required}
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
                                    {group.label && <h3 className={'form-group-label'}>{group.label}</h3>}
                                    {groupContent}
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