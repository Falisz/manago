// FRONTEND/components/Details.jsx
import React from 'react';
import Button from './Button';
import Icon from './Icon';
import '../styles/Details.css';

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
            className={'details-header' + (className ? ' ' + className : '')}
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

            {typeof title === 'string' && <div
                key={'title'}
                className={'details-title'}
                title={title}
            >
                {title}
            </div>}

            {typeof title === 'object' && <div
                key={'title'}
                className={'details-title' + (title.className ? ' ' + title.className : '')}
                title={title.title}
                style={title.style}
            >
                {title.content ? title.content : getData(data, title.dataField, title.placeholder)}
            </div>}

            {suffix && <div
                key={'title-prefix'}
                className={'details-title-suffix' + (suffix.className ? ' ' + suffix.className : '')}
                title={suffix.title}
                style={suffix.style}
            >
                {getData(data, suffix.dataField, suffix.placeholder)}
            </div>}

            {buttons && Object.values(buttons).map((button, key) =>
                <Button key={key} {...{transparent: true, ...button}} />
            )}
        </div>
    );
};

const SectionHeader = ({ header }) => {

    let text, button, style = {};

    if (typeof header === 'object')
        ({ text, button, style } = header);
    else
        text = header;

    return <div key={'section-header'} className='section-header' style={style}>
        {text}
        {button && <Button
            {...button}
            transparent={button.transparent ?? true}
            icon={button.icon ?? 'edit'}
        />}
    </div>;
};

const SectionField = ({ field, data }) => {

    const { className, style, title, label, dataType, dataField, placeholder, format, button, hideEmpty } = field;

    let content = placeholder;
    let isEmpty = true;

    if (dataType === 'boolean') {
        const val = data[dataField];
        if (val != null)
            isEmpty = false;

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

        const { idField = 'id', dataField: itemDataField, text: itemText, onClick, style = {} } = field.item;

        const itemId = item[idField];

        isEmpty = false;

        let itemName;
        if (Array.isArray(itemDataField)) {
            itemName = itemDataField.map(field => item[field] ?? '').join(' ')
        } else if (typeof field.dataField === 'string') {
            itemName = item[itemDataField];
        } else {
            itemName = itemText || '';
        }
        content = <div
            key={itemId}
            className={'data-group'}
        >
            <span
                className={onClick ? 'app-clickable' : ''}
                onClick={onClick ? () => onClick(itemId) : null}
                style={style}
            >
                {itemName}
            </span>
        </div>

    } else if (dataType === 'list') {

        const items = data[dataField];

        if (items && items.length > 0) {
            isEmpty = false;
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
        content = data[dataField];
        if (content != null)
            isEmpty = false;

        if (format && !isEmpty) {
            if (typeof format === 'function') content = format(content);
            else if (typeof format === 'string') content = format.replace('%v', content);
        }
        
    }

    if (hideEmpty && isEmpty)
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
    const { style, className, header, fields, hideEmpty } = section;

    const isEmpty = Object.values(fields).every(field => data[field.dataField] == null ||
        (Array.isArray(data[field.dataField]) && data[field.dataField].length === 0));

    if (hideEmpty && isEmpty)
        return null;

    return (
        <div
            className={'details-section' + (className ? ' ' + className : '')}
            style={style}
        >
            {header && <SectionHeader header={header}/>}
            {Object.values(fields).map((field, key) => <SectionField key={key} field={field} data={data}/>)}
        </div>
    );
}

const Details = ({className, style, header, sections, data}) => {
    if (!data || !sections)
        return null;

    return (
        <div className={'details-page' + (className ? ' ' + className : '')}  style={style}>
            {header && <Header header={header} data={data}/>}
            <div className={'details-content app-scroll'}>
                {Object.values(sections).map((section, index) => <Section key={index} section={section} data={data}/>)}
            </div>
        </div>
    );
};

export default Details;