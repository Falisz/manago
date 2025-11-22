// FRONTEND/components/Details.jsx
import React, {useRef} from 'react';
import Button from './Button';
import Icon from './Icon';
import '../styles/Details.css';

// new structure

// header = {
//     className: {},
//     style: {},
//     prefix: {},
//     title: {},
//     suffix: {},
//     buttons: {}
// }

// sections = {
//     section1: {
//         className: {},
//         style: {},
//         header: {},
//         fields: {},
//     },
//     section2: {
//         className: {},
//         style: {},
//         header: {},
//         fields: {},
//     }
// }

const Header = ({ header, data }) => {

    const { className, style, prefix, title, suffix, buttons } = header;

    const getData = (data, field, placeholder) => {
        if (Array.isArray(field))
            return field.map(f => data[f] ?? '').join(' ');
        else
            return data[field] ?? placeholder;
    }

    return (
        <div
            className={'app-details-header' + (className ? ' ' + className : '')}
            style={style}
        >
            {prefix && <div
                key={'title-prefix'}
                className={'details-title-prefix' + (prefix.className ? ' ' + prefix.className : '')}
                title={prefix.title}
                style={prefix.style}
            >
                {getData(data, prefix.dataField, prefix.placeholder)}
            </div>}

            {title && <div
                key={'title'}
                className={'details-title' + (title.className ? ' ' + title.className : '')}
                title={title.title}
                style={title.style}
            >
                {getData(data, title.dataField, title.placeholder)}
            </div>}

            {suffix && <div
                key={'title-prefix'}
                className={'details-title-suffix' + (suffix.className ? ' ' + suffix.className : '')}
                title={suffix.title}
                style={suffix.style}
            >
                {getData(data, suffix.dataField, suffix.placeholder)}
            </div>}

            {buttons && Object.values(buttons).map((button, key) => <Button key={key} {...button} />)}
        </div>
    );
};

const SectionHeader = ({ header }) => {

    let text, button;

    if (typeof header === 'object')
        ({ text, button } = header);
    else
        text = header;

    return <div key={'section-header'} className='section-header'>
        {text}
        {button && <Button
            {...button}
            transparent={button.transparent ?? true}
            icon={button.icon ?? 'edit'}
        />}
    </div>;
};

const SectionField = ({ field, data, isSectionEmpty }) => {

    const { className, style, title, label, dataType, dataField, placeholder, button, hideEmpty } = field;

    let content = placeholder;
    let isGroupEmpty = true;

    if (['string', 'number', 'value'].includes(dataType)) {
        content = data[dataField].toString();
        if (content != null)
            isGroupEmpty = false;

    } else if (dataType === 'boolean') {
        const val = data[dataField];
        if (val != null)
            isGroupEmpty = false;

        content = <div className={'data-group linear'}>
            {val ?
                field.trueIcon && <Icon className={'true'} i={field.trueIcon} /> :
                field.falseIcon && <Icon className={'false'} i={field.falseIcon} /> }
            {val ? field.trueValue : field.falseValue}
        </div>;

    } else if (dataType === 'item') {

        const item = data[dataField];

        if (!item)
            return null;

        const itemStruct = field.item;
        const itemId = item[itemStruct.idField];

        isGroupEmpty = false;

        let itemName;
        if (Array.isArray(itemStruct.dataField)) {
            itemName = itemStruct.dataField.map(field => item[field] ?? '').join(' ')
        } else if (typeof field.dataField === 'string') {
            itemName = item[itemStruct.dataField];
        } else {
            itemName = itemStruct.text || '';
        }
        content = <div
            key={itemId}
            className={'data-group'}
        >
            <span
                className={itemStruct.onClick ? 'app-clickable' : ''}
                onClick={() => itemStruct.onClick(itemId)}
            >
                {itemName}
            </span>
        </div>

    } else if (dataType === 'list') {

        const items = data[dataField];

        if (items && items.length > 0) {
            isGroupEmpty = false;
            content = Object.values(items).map((item, index) => {
                const itemStruct = field.items;
                if (!itemStruct)
                    return null;

                const itemId = itemStruct.idField ? item[itemStruct.idField] : item['id'];

                let name;
                if (Array.isArray(itemStruct.dataField)) {
                    name = itemStruct.dataField.map(field => item[field] ?? '').join(' ')
                } else if (typeof field.dataField === 'string') {
                    name = item[itemStruct.dataField];
                } else {
                    name = itemStruct.text || '';
                }

                let suffix = null;
                if (itemStruct.suffix) {
                    const subItem = item[itemStruct.suffix.dataField];
                    const subItemId = subItem[itemStruct.suffix.idField];
                    const subItemName = subItem[itemStruct.suffix.nameField];

                    if ((itemStruct.suffix.condition === 'neq' && subItemId !== data['id']) ||
                        (itemStruct.suffix.condition === 'eq' && subItemId === data['id']) ||
                        !itemStruct.suffix.condition
                    )
                        suffix = <span
                            className={itemStruct.onClick ? 'app-clickable' : ''}
                            onClick={() => itemStruct.suffix.onClick(subItemId)}
                        >
                            {subItemName}
                        </span>;
                }

                return <div
                    key={index}
                    className={'data-group linear'}
                    style={suffix && {alignItems: 'baseline', gap: '5px'}}
                >
                    <span
                        className={itemStruct.onClick ? 'app-clickable' : ''}
                        onClick={() => itemStruct.onClick(itemId)}
                    >
                        {name}
                    </span>
                    {suffix && <small>({suffix})</small>}
                </div>
            });
        }
    } else {
        return null;
    }

    // TODO: Make this work.
    if (!isGroupEmpty)
        isSectionEmpty.current = false;

    if (hideEmpty && isGroupEmpty)
        return null;

    return <div
        className={'data-group' + (field.linear ? ' linear' : '') + (className ? ' ' + className : '')}
        style={style}
        title={title}
    >
        { label && <label>{label}</label>}
        { content }
        { button && <Button
            {...button}
            transparent={button.transparent ?? true}
            icon={button.icon ?? 'add_circle'}
        />}
    </div>;
}

const Section = ({section, data}) => {
    const isEmpty = useRef(true);
    const { style, className, header, fields, hideEmpty } = section;

    const content = (
        <div
            className={'app-details-section' + (className ? ' ' + className : '')}
            style={style}
        >
            {header && <SectionHeader header={header}/>}
            {Object.values(fields).map((field, key) =>
                <SectionField key={key} field={field} data={data} isSectionEmpty={isEmpty}/>
            )}
        </div>
    );

    if (hideEmpty && isEmpty.current)
        return null;

    return content;
}

const Details = ({className, style, header, sections, data}) => {
    if (!data || !sections)
        return null;

    return <div className={'app-details' + (className ? ' ' + className : '')} style={style}>
        {header && <Header header={header} data={data}/>}
        {Object.values(sections).map((section, index) => <Section key={index} section={section} data={data}/>)}
    </div>;
};

export default Details;