import React from 'react';
import Dropdown from "./Dropdown";

const ComboDropdown = ({
                           formData,
                           dataField,
                           onChange,
                           itemSource,
                           itemNameField,
                           itemIdField = 'id',
                           itemName = 'Item',
                           itemExcludedIds,
                           modeField,
                           modeOptions,
                       }) => {

    const getOptions = () => {
        const idField= itemIdField;
        const nameField = itemNameField;

        const filteredSource = itemSource?.filter(item =>
             !formData[dataField]?.includes(item[idField]) && !itemExcludedIds?.includes(item[idField]) ).map(item => {
            let name;

            if (Array.isArray(nameField))
                name = nameField.map(field => item[field]).join(' ');
            else
                name = item[nameField] || item[idField];

            return {id: item[idField], name};
        }) || [];

        return Array.from(filteredSource);
    }

    return (
        <div className={'app-combo-dropdown'}>
            <Dropdown
                name={modeField}
                value={formData[modeField]}
                options={modeOptions}
                onChange={onChange}
                placeholder={`Select Mode`}
                searchable={false}
                style={{width: '100px', minWidth: 'unset'}}
            />
            <Dropdown
                name={dataField}
                value={formData[dataField]}
                options={getOptions()}
                onChange={onChange}
                placeholder={`Select ${itemName}`}
            />
        </div>
    )
}

export default ComboDropdown;