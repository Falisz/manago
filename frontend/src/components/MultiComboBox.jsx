// FRONTEND/components/MultiComboBox.jsx
import React, { useCallback } from 'react';
import ComboBox from './ComboBox';
import Button from './Button';

const MultiComboBox = ({
                           formData,
                           dataField,
                           onChange,
                           itemSource,
                           itemNameField,
                           itemIdField = 'id',
                           itemName = 'Item',
                           itemExcludedIds
                       }) => {

    const getOptions = useCallback((index, itemExcludedIds) => {
        if (!dataField || formData === undefined)
            return null;

        const currentSelected = formData[dataField] && formData[dataField][index];
        const idField = itemIdField;
        const nameField = itemNameField;

        const filteredSource = itemSource?.filter(item => 
            ( (currentSelected && item[idField] === currentSelected) || 
                (!formData[dataField]?.includes(item[idField]) && !itemExcludedIds?.includes(item[idField])))).map(item => {
                    let name;
                    
                    if (Array.isArray(nameField))
                        name = nameField.map(field => item[field]).join(' ');
                    else 
                        name = item[nameField] || item[idField];

                    return {id: item[idField], name};
            }) || [];

        return Array.from(filteredSource);
    }, [dataField, formData, itemIdField, itemNameField, itemSource]);           
    

    if (formData === undefined || !dataField || !onChange || !itemSource || !itemNameField) {
        return <div>
                Error rendering MultiDropdown component. Lacking props:
                {formData === undefined && ' formData'}
                {!dataField && ' dataField'}
                {!onChange && ' onChange'}
                {!itemSource && ' itemSource'}
                {!itemNameField && ' itemNameField'}
            </div>
    }
    
    const newItem = itemSource && !formData[dataField]?.includes(null) && formData[dataField]?.length < itemSource.length;

    return <>
        { itemSource?.length === 0 ? (<p>No {itemName}s available.</p>) : (
            <>
                <div className={'multi-dropdown'}>
                    {formData[dataField]?.map((itemId, index) => (
                        <div key={index} className='multi-dropdown-item'>
                            <ComboBox
                                name={dataField}
                                value={itemId}
                                options={getOptions(index, itemExcludedIds)}
                                onChange={(e) => onChange(e, 'set', index)}
                                placeholder={`Select ${itemName}`}
                                noneAllowed={true}
                            />
                            {(index > 0 || formData[dataField][0] !== null) && (
                                <Button
                                    className={'remove-button'}
                                    onClick={() => onChange({target: {name: dataField, type: 'dropdown'}, persist: () => {}}, 'del', index)}
                                    icon={'cancel'}
                                    transparent={true}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <Button
                    className={'new-dropdown-button'}
                    onClick={() => onChange({target: {name: dataField, type: 'dropdown'}, persist: () => {}}, 'add')}
                    icon={'add_circle'}
                    label={`Add Another ${itemName}`}
                    disabled={!newItem}
                    transparent={true}
                />
            </>
        )}
    </>;
}

export default MultiComboBox;