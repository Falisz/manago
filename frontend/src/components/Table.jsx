// FRONTEND/components/Table.jsx
import React, {useState, useMemo} from 'react';
import {Item, Menu, RightSlot, useContextMenu} from 'react-contexify';
import useNav from '../contexts/NavContext';
import Button from './Button';
import Icon from './Icon';
import ToggleSwitch from './ToggleSwitch';
import 'react-contexify/dist/ReactContexify.css';
import '../styles/Table.css';

const TableHeader = ({
                         fields,
                         filters,
                         tableSortable,
                         tableFilterable,
                         sortConfig,
                         handleFilter,
                         handleSorting,
                     }) => {

    const [headerCollapsed, setHeaderCollapsed] = useState(true);

    const collapseButton = (tableSortable || tableFilterable);

    return <div className={`app-table-header ${headerCollapsed ? 'collapsed' : ''}`}>
                {Object.values(fields).map((field) => {
                    const {
                        label = '',
                        name = '',
                        display,
                        sortable: fieldSortable = true,
                        filterable: fieldFilterable = true,
                        style = {}
                    } = field;

                    if (!name)
                        return null;

                    const sortable = tableSortable && fieldSortable;
                    const filterable = tableFilterable && fieldFilterable;

                    if (display !== undefined && !display)
                        return null;

                    return (
                        <div
                            className={`app-table-header-cell ${name}`}
                            key={name.toString()}
                            style={style}
                        >
                            {label && <div className={'app-table-header-cell-label'}>
                                {label}
                            </div>}
                            {(filterable || sortable) && <div className={'app-table-header-cell-actions'}>
                                {filterable && <input
                                    className='search'
                                    title={label}
                                    placeholder={`Filter by the ${label.toLowerCase()}...`}
                                    name={name}
                                    value={filters[name] || ''}
                                    onChange={handleFilter}
                                />}
                                {sortable && <Button
                                    className={`order ${sortConfig.key === name ? sortConfig.direction : ''}`}
                                    name={name}
                                    onClick={handleSorting}
                                    icon={sortConfig.name === name &&
                                    sortConfig.direction === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                                />}
                            </div>}
                        </div>
                    );
                })}
                {collapseButton &&
                    <Button
                        className={`collapse_header ${headerCollapsed ? 'collapsed' : ''}`}
                        transparent={true}
                        onClick={() => setHeaderCollapsed(!headerCollapsed)}
                        icon={headerCollapsed ? 'add_circle' : 'remove_circle'}
                    />
                }
            </div>;
}

const TableField = ({field, data, selectionMode}) => {

    const { openModal, openDialog } = useNav();

    const { name, type, display, style } = field;

    if ((display !== undefined && !display) || type === 'description')
        return null;

    let value = data[name], content;

    if (typeof field.value === 'function')
        value = field.value(data);
    else if (field.value != null)
        value = field.value;

    if (field.formats)
        if (field.formats[value] != null)
            value = field.formats[value].toString().replace('%n', value);
        else if (field.formats.default != null)
            value = field.formats.default.toString().replace('%n', value);

    switch (type) {
        case 'string':
            content = (
                <span
                    className='app-clickable'
                    onClick={() => {
                        if (!selectionMode && field.openModal) {
                            openModal({ content: field.openModal, type: 'dialog', contentId: data.id });
                        }
                    }}
                >
                    {value ||
                        (name === 'name' && data.first_name ? `${data.first_name} ${data.last_name}` : '')}
                </span>
            );
            break;
        case 'icon':
            content = (
                <Icon
                    className={field.openModal ? 'app-clickable' : ''}
                    onClick={() => {
                        if (!selectionMode && field.openModal) {
                            openModal({ content: field.openModal, type: 'dialog', contentId: data.id });
                        }
                    }}
                    i={value}
                    s={true}
                    style={field.iconStyle || null}
                />
            );
            break;
        case 'list':
            if (value && value.length > 0) {
                content = value.map((item, index) => (
                    <span
                        key={item.id || index}
                        className={`app-clickable sub-item ${field.className || ''}`}
                        onClick={() => {
                            if (!selectionMode && field.openModal) {
                                openDialog({ content: field.openModal, contentId: item.id });
                            }
                        }}
                    >
                        {item.name || `${item.first_name || ''} ${item.last_name || ''}`}
                    </span>
                )).reduce((prev, curr) => [prev, ', ', curr]);
            } else {
                content = '';
            }
            break;
        case 'boolean':
            content = value ? '✔️' : '✖️';
            break;
        case 'toggleSwitch':
            content = <ToggleSwitch
                checked={field.checked(data)}
                onChange={() => field.onChange(data)}
                disabled={field.disabled(data)}
            />;
            break;
        case 'number':
            content = value ?? 0;
            break;
        default:
            content = value?.toString() ?? '';
    }

    return (
        <div
            key={name}
            className={`app-table-row-cell ${name}`}
            style={style}
        >
            {content}
        </div>
    );
};

const TableRow = ({
                      data,
                      fields,
                      subRowField,
                      descriptionField,
                      displayContextMenu,
                      isSubRow = false,
                      handleSelect,
                      selectedItems,
                      hasContextMenu,
                      openModal,
                      openDialog
                  }) => {

    const selectionMode = selectedItems?.size > 0;

    const rowContent = (
        <>
            <div
                className={`app-table-row${selectedItems?.has(data.id) ? 
                    ' selected' : ''}${isSubRow ? 
                    ' sub-row' : ''}${descriptionField ? 
                    ' with-desc' : ''}`}
                onClick={(e) => handleSelect(e, data.id)}
                onContextMenu={(e) => hasContextMenu && displayContextMenu(e, data)}
            >
                {isSubRow && <Icon className={'app-table-sub-row-icon'} i={'subdirectory_arrow_right'} />}
                {Object.values(fields).map((field, index) => 
                    <TableField
                        key={index}
                        field={field}
                        data={data}
                        selectionMode={selectionMode}
                    />
                )}
                {data[descriptionField] && data[descriptionField].trim() !== '' &&
                    <div className={'app-table-row-cell app-table-row-desc'}>{data[descriptionField]}</div>
                }
            </div>
            {data[subRowField] && data[subRowField].length > 0 &&
                <div className={'app-table-sub-rows'}>
                    {data[subRowField].map((subItemData) =>
                        <TableRow
                            key={subItemData.id}
                            data={subItemData}
                            fields={fields}
                            subRowField={subRowField}
                            descriptionField={descriptionField}
                            hasContextMenu={hasContextMenu}
                            displayContextMenu={displayContextMenu}
                            isSubRow={true}
                            handleSelect={handleSelect}
                            selectedItems={selectedItems}
                            openModal={openModal}
                            openDialog={openDialog}
                        />
                    )}
                </div>
            }
        </>
    );

    return subRowField ? <div className={'app-table-row-stack'}>{rowContent}</div> : rowContent;
};

const TableMenu = ({id, contextMenuActions, selectionMode, handleSelect, selectedItems, setSelectedItems}) => {
    return (
        <Menu className={'app-context-menu'} id={id}>
            {contextMenuActions.filter(item => item.selectionMode === selectionMode).map(item => (
                <Item 
                    key={item.id}
                    onClick={({ props }) => {
                        if (item.select) {
                            handleSelect('contextMenuClick', props[item.select]);
                        } else if (item.setSelected) {
                            setSelectedItems(item.setSelected);
                        } else if (item.onClick) {
                            if (item.selectionMode)
                                item.onClick(selectedItems);
                            else
                                item.onClick(props);
                        } else 
                            return null;
                    }}
                >
                    {item.label} { item.shortcut ? <RightSlot>{item.shortcut}</RightSlot> : null }
                </Item>
            ))}
        </Menu>
    );
}

/**
 *
 * @param className
 * @param style
 * @param data
 * @param fields
 * @param subRowFields
 * @param descriptionFields
 * @param header
 * @param columnHeaders
 * @param searchable
 * @param sortable
 * @param selectableRows
 * @param contextMenuActions
 * @param dataPlaceholder
 */
const Table = ({
                   className,
                   style,
                   data,
                   fields,
                   subRowFields,
                   descriptionFields,
                   header,
                   columnHeaders = true,
                   filterable = false,
                   sortable = false,
                   selectableRows = false,
                   contextMenuActions,
                   dataPlaceholder = null,
               }) => {

    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [selectedItems, setSelectedItems] = useState(new Set());
    const MENU_ID = 'table_context_menu';
    const { show } = useContextMenu({ id: MENU_ID, });
    const { openModal, openDialog } = useNav();

    const displayContextMenu = (e, item) => {
        e.preventDefault();
        show({ event: e, props: item });
    }

    const handleFilter = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value
        }));
        
        if (value.trim() !== '') {
            e.target.classList.add('non-empty');
        } else {
            e.target.classList.remove('non-empty');
        }
    };

    const handleSorting = (e) => {
        const { name } = e.currentTarget;
        let direction = 'asc';
        if (sortConfig.key === name && sortConfig.direction === 'asc')
            direction = 'desc';
        setSortConfig({ key: name, direction });
    };

    const handleSelect = (e, id) => {
        if (!selectableRows)
            return;

        if (selectionMode || e === 'contextMenuClick' || e.shiftKey || e.ctrlKey) {
            if (e !== 'contextMenuClick')
                e.preventDefault();
            
            setSelectedItems(prev => {
                const newSelected = new Set(Array.from(prev));
                if (newSelected?.has(id)) {
                    newSelected.delete(id);
                } else {
                    newSelected.add(id);
                }
                return newSelected;
            });
        }        
    };

    const displayData = useMemo(() => {
        if (!data || !fields)
            return [];

        let filteredData = [...data];

        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                const filterValue = filters[key].toLowerCase();
                const field = fields[key];

                filteredData = filteredData.filter(item => {
                    let itemValue = item[key];

                    if (typeof field?.value === 'function') {
                        itemValue = field.value(item);
                    }

                    if (key === 'name' && !itemValue && item.first_name) {
                        itemValue = `${item.first_name} ${item.last_name}`;
                        return itemValue.toLowerCase().includes(filterValue);
                    }

                    if (key === 'name' && field?.type === 'string' && item.code_name) {
                        return item.name?.toLowerCase().includes(filterValue) || item.code_name?.toLowerCase().includes(filterValue);
                    }

                    switch (field?.type) {
                        case 'string':
                            return itemValue?.toLowerCase().includes(filterValue);
                        case 'list':
                            return (itemValue || []).some(sub => {
                                const subName = sub.name || `${sub.first_name || ''} ${sub.last_name || ''}`;
                                return subName.toLowerCase().includes(filterValue);
                            });
                        case 'boolean':
                            const trueValues = ['active', 'true', 'yes', '1', 'y'];
                            const falseValues = ['inactive', 'false', 'no', '0', 'n', 'not', 'non', 'not-active'];
                            if (trueValues.includes(filterValue)) return itemValue === true;
                            if (falseValues.includes(filterValue)) return itemValue === false;
                            return true;
                        case 'number':
                            const parsedFilter = parseInt(filters[key], 10);
                            if (!isNaN(parsedFilter)) {
                                return itemValue === parsedFilter;
                            }
                            return true;
                        default:
                            return itemValue?.toString().toLowerCase().includes(filterValue);
                    }
                });
            }
        });

        if (sortConfig.key) {
            const field = fields[sortConfig.key];
            filteredData.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (typeof field?.value === 'function') {
                    aValue = field.value(a);
                    bValue = field.value(b);
                }

                if (sortConfig.key === 'name' && !aValue && a.first_name) {
                    aValue = `${a.first_name} ${a.last_name}`;
                    bValue = `${b.first_name} ${b.last_name}`;
                }

                switch (field?.type) {
                    case 'string':
                        aValue = aValue?.toLowerCase() ?? '';
                        bValue = bValue?.toLowerCase() ?? '';
                        break;
                    case 'list':
                        aValue = (aValue || [])
                            .map(sub => sub.name || `${sub.first_name} ${sub.last_name}`)
                            .sort()
                            .join(', ')
                            .toLowerCase();
                        bValue = (bValue || []).map(sub => sub.name || `${sub.first_name} ${sub.last_name}`)
                            .sort()
                            .join(', ')
                            .toLowerCase();
                        break;
                    case 'boolean':
                        aValue = aValue ? 1 : 0;
                        bValue = bValue ? 1 : 0;
                        break;
                    case 'number':
                        aValue = aValue ?? 0;
                        bValue = bValue ?? 0;
                        break;
                    default:
                        aValue = aValue?.toString().toLowerCase() ?? '';
                        bValue = bValue?.toString().toLowerCase() ?? '';
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filteredData;

    }, [data, fields, filters, sortConfig]);

    if (!fields) {
        console.error('Table cannot be render without properly defined Table Structure.');
        return null;
    }

    const selectionMode = selectedItems?.size > 0;
    
    return (
        <>
            {header &&
                <div className='page-header'>
                    {header.title &&
                        <h1 className={'page-title'}> {header.title} </h1>
                    }
                    {selectionMode > 0 &&
                        <div className='selected-items'>
                            <p className='seethrough'>
                                {selectedItems.size} {header.itemName || 'Item'}
                                {selectedItems.size !== 1 ? 's' : ''} selected.
                            </p>
                            <Button
                                onClick={() => setSelectedItems(new Set())}
                                label={'Clear selection'}
                            />
                            <Button
                                onClick={() => setSelectedItems(header.allElements)}
                                label={'Select all'}
                            />
                        </div>
                    }
                    {(header.button || header.newItemModal) &&
                        <Button
                            {...header.button}
                            className={header.button?.className ?? 'new-item'}
                            label={header.button?.label ?? `Add ${header.itemName ?? 'Item'}`}
                            icon={header.button?.icon ?? 'add'}
                            onClick={header.button?.onClick ?? (() => openModal({ content: header.newItemModal }))}
                        />
                    }
                </div>
            }
            <div className={`app-table seethrough app-overflow-hidden${selectionMode ? ' selection-mode' : ''}`+
                `${className? ' ' + className : ''}`} style={style}>
                {columnHeaders && (
                    <TableHeader
                        fields={fields}
                        filters={filters}
                        sortConfig={sortConfig}
                        tableFilterable={filterable}
                        tableSortable={sortable}
                        handleFilter={handleFilter}
                        handleSorting={handleSorting}
                    />
                )}
                <div className={'app-table-body app-overflow-y app-scroll'}>
                    {!displayData.length ? (
                        <p className={'app-table-no-matches'}>
                            {dataPlaceholder ?? 'No matching items found.'}
                        </p>
                    ) : (
                        displayData.map((data, index) =>
                            <TableRow
                                key={index}
                                data={data}
                                fields={fields}
                                handleSelect={(e, id) => handleSelect(e, id, data.id)}
                                selectedItems={selectedItems}
                                subRowField={subRowFields}
                                descriptionField={descriptionFields}
                                hasContextMenu={contextMenuActions && contextMenuActions.length > 0}
                                displayContextMenu={displayContextMenu}
                                openModal={openModal}
                                openDialog={openDialog}
                            />
                        )
                    )}
                </div>
                {contextMenuActions && <TableMenu 
                    id={MENU_ID}
                    contextMenuActions={contextMenuActions}
                    selectionMode={selectionMode}
                    handleSelect={handleSelect}
                    selectedItems={selectedItems}
                    setSelectedItems={setSelectedItems} 
                />}
            </div>
        </>
    );
}

export default Table;