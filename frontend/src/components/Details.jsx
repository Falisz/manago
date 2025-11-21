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

const Header = ({ header, data }) =>
    <div className='app-details-header'>
        {Object.entries(structure).map(([key, value]) => {
            if (key==='type' || !value)
                return null;

            let content;

            if (Array.isArray(value.dataField)) {
                content = value.dataField.map(field => data[field] ?? '').join(' ')
            } else if (typeof value.dataField === 'string') {
                content = data[value.dataField] ?? value.text;
            } else {
                content = value.text;
            }

            if (key==='titlePrefix') {
                return <div
                    key={'title-prefix'}
                    className={'details-title-prefix' + (value.className ? ' ' + value.className : '')}
                    title={value.title}
                    style={value.style}
                > 
                    #{content}
                </div>
            } else if (key==='title')
                return <div
                    key={'title'}
                    className={'details-title' + (value.className ? ' ' + value.className : '')}
                    title={value.title}
                    style={value.style}
                >
                    {content}
                </div>
            else if (key==='buttons') {
                return Object.values(value).map((button, index) =>
                    <Button
                        key={index}
                        className={button.className}
                        onClick={button.onClick}
                        title={button.title}
                        icon={button.icon}
                        transparent={button.transparent ?? true}
                    />
                )
            } else
                return null;
        })}
    </div>

const SectionHeader = ({ header, data }) => (
    <div key={'section-header'} className='section-header'>
        {header.text}
        {header.editButton && <Button
            onClick={() => header.editButton.onClick(data)}
            label={header.editButton.label}
            transparent={header.editButton.transparent ?? true}
            icon={header.editButton.icon ?? 'edit'}
        />}
    </div>;
);

const Section = ({section, data}) => {
    const isEmpty = useRef(true);
    const { style, className, header, fields, hideEmpty } = section;

    const content = (
        <div
            className={'app-details-section' + (className ? ' ' + className : '')}
            style={style}
        >
            {header && <SectionHeader header={header} data={data}/>}
            {Object.values(fields).map((field, index) => {

                    let content = field.placeholder;
                    let isGroupEmpty = true;

                    if (field.dataType === 'string') {
                        content = data[field.dataField];
                        if (content !== null) {
                            isEmpty.current = false;
                            isGroupEmpty = false;
                        }

                    } else if (field.dataType === 'number') {
                        content = data[field.dataField].toString();
                        if (content !== null) {
                            isEmpty.current = false;
                            isGroupEmpty = false;
                        }

                    } else if (field.dataType === 'boolean') {
                        const val = data[field.dataField];
                        if (val !== null) {
                            isEmpty.current = false;
                            isGroupEmpty = false;
                        }

                        content = <div className={'data-group linear'}>
                            {val ?
                                field.trueIcon && <Icon className={'true'} i={field.trueIcon} /> :
                                field.falseIcon && <Icon className={'false'} i={field.falseIcon} /> }
                            {val ? field.trueValue : field.falseValue}
                        </div>;

                    } else if (field.dataType === 'item') {

                        const item = data[field.dataField];

                        if (!item) return null;

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

                    } else if (field.dataType === 'list') {

                        const items = data[field.dataField];

                        if (items && items.length > 0) {
                            isEmpty.current = false;
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
                    }

                    if (field.hideEmpty && isGroupEmpty)
                        return null;

                    return <div key={index} className={'data-group' + (field.linear ? ' linear' : '')} title={field.label}>
                        { field.label && <label>{field.label}</label>}
                        { content }
                        { field.newItem && <Button
                            onClick={() => field.newItem.onClick(data.id)}
                            label={field.newItem.label}
                            transparent={field.newItem.transparent ?? true}
                            icon={field.newItem.icon ?? 'add_circle'}
                        />}
                    </div>;
            })}
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