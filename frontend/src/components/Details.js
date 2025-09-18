import React, {useRef} from 'react';
import Button from "./Button";
import Icon from "./Icon";

interface StructureConfig {
    header: DetailsHeaderConfig;
    [section: string]: DetailsSectionConfig;
}
interface DetailsHeaderConfig {
    type: string;
    titlePrefix?: DataFieldConfig;
    title?: DataFieldConfig;
    buttons?: Record<string, ButtonConfig>;
}
interface DetailsSectionConfig {
    type: string,
    header: DataFieldConfig,
    [group: string]: DataFieldConfig,
}
interface ButtonConfig {
    className?: string;
    onClick: (id: string | number) => void;
    title?: string;
    icon?: string;
    transparent?: boolean;
}
interface DataFieldConfig {
    dataField: string | string[];
    dataType: string;
    text?: string;
    className?: string;
    title?: string;
    style?: React.CSSProperties;
    items?: DataFieldConfig[];
    newItem?: DataFieldConfig;
}

const DetailsHeader = ({structure, data}: {structure: DetailsHeaderConfig, data: any}) =>
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
                    className={'details-title-prefix' + (value.className ? ' ' + value.className : '')}
                    title={value.title}
                    style={value.style}
                > 
                    #{content}
                </div>
            } else if (key==='title')
                return <div
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

const DetailsSection = ({structure, data}: {structure: DetailsSectionConfig, data: any}) => {
    const isEmpty = useRef(true);

    const content = <div className='app-details-section'>
        {Object.entries(structure).map(([key, value]) => {
            if (key==='type')
                return null;

            if (value.type === 'section-header') {
                return <div className='section-header'>
                    {value.text}
                    {value.editButton && <Button
                        onClick={() => value.editButton.onClick(data)}
                        label={value.editButton.label}
                        transparent={value.editButton.transparent ?? true}
                        icon={value.editButton.icon ?? 'edit'}
                    />}
                </div>;

            } else if (value.type === 'data-group') {
                let content = value.placeholder;

                if (value.dataType === 'string') {
                    content = data[value.dataField];
                    if (content !== null)
                        isEmpty.current = false;

                } else if (value.dataType === 'number') {
                    content = data[value.dataField].toString();
                    if (content !== null)
                        isEmpty.current = false;

                } else if (value.dataType === 'boolean') {
                    const val = data[value.dataField];
                    if (val !== null)
                        isEmpty.current = false;

                    content = <div className={'data-group linear'}>
                        {val ?
                            value.trueIcon && <Icon className={'true'} i={value.trueIcon} /> :
                            value.falseIcon && <Icon className={'false'} i={value.falseIcon} /> }
                        {val ? value.trueValue : value.falseValue}
                    </div>;

                } else if (value.dataType === 'list') {

                    const items = data[value.dataField];

                    if (items && items.length > 0) {
                        isEmpty.current = false;
                        content = Object.values(items).map((item, index) => {
                            const itemStruct = value.items;
                            if (!itemStruct)
                                return null;

                            const id = itemStruct.idField ? item[itemStruct.idField] : item['id'];

                            let name;
                            if (Array.isArray(itemStruct.dataField)) {
                                name = itemStruct.dataField.map(field => item[field] ?? '').join(' ')
                            } else if (typeof value.dataField === 'string') {
                                name = item[itemStruct.dataField];
                            } else {
                                name = itemStruct.text || '';
                            }

                            return <div
                                key={index}
                                className={'data-group' + (itemStruct.onClick ? ' clickable' : '')}
                                onClick={() => itemStruct.onClick(id)}
                            >
                                {name}
                            </div>
                        });
                    }
                }

                return <div className={'data-group' + (value.linear ? ' linear' : '')} title={value.label}>
                    { value.label && <label>{value.label}</label>}
                    { content }
                    { value.newItem && <Button
                        onClick={() => value.newItem.onClick(data.id)}
                        label={value.newItem.label}
                        transparent={value.newItem.transparent ?? true}
                        icon={value.newItem.icon ?? 'add_circle'}
                    />}
                </div>;

            } else
                return null;
        })}
    </div>

    if (structure.hideEmpty && isEmpty.current)
        return null;

    return content;
}


const Details = ({structure, data, className, style}: {
    structure: StructureConfig,
    data: any,
    className?: string,
    style?: React.CSSProperties
}) =>
    <div className={'app-details' + (className ? ' ' + className : '')} style={style}>
        {Object.values(structure).map((value, index) => {
            if (value.type === 'header')
                return <DetailsHeader key={index} structure={value} data={data} />

            if (value.type === 'section')
                return <DetailsSection key={index} structure={value} data={data} />

            return null;
        })}
    </div>

export default Details;