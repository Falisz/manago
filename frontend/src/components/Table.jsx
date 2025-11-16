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
                         sortConfig,
                         handleFilter,
                         handleSorting
                     }) => {

    const [headerCollapsed, setHeaderCollapsed] = useState(true);

    return <div className={`app-table-header ${headerCollapsed ? 'collapsed' : ''}`}>
                {Object.entries(fields).map(([key, field]) => (
                    field.display &&
                    <div
                        className={`app-table-header-cell ${key}`}
                        key={key}
                        style={field.style || null}
                    >
                        <div className={'app-table-header-cell-label'}>
                            {field.title}
                        </div>
                        <div className={'app-table-header-cell-actions'}>
                            {field.filterable && <input
                                className='search'
                                title={field.title}
                                placeholder={`Filter by the ${field.title.toLowerCase()}...`}
                                name={key}
                                value={filters[key] || ''}
                                onChange={handleFilter}
                            />}
                            {field.sortable && <Button
                                className={`order ${sortConfig.key === key ? sortConfig.direction : ''}`}
                                name={key}
                                onClick={handleSorting}
                                icon={sortConfig.key === key &&
                                sortConfig.direction === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                            />}
                        </div>
                    </div>
                ))}
                {Object.values(fields).some(field => field.filterable || field.sortable) &&
                    <Button
                        className={`collapse_header ${headerCollapsed ? 'collapsed' : ''}`}
                        transparent={true}
                        onClick={() => setHeaderCollapsed(!headerCollapsed)}
                        icon={headerCollapsed ? 'add_circle' : 'remove_circle'}
                    />
                }
            </div>;
}


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
                      openModal
                  }) => {

    const selectionMode = selectedItems?.size > 0;

    return (
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
                {Object.entries(fields).map(([key, field]) => {
                    if (!field.display || field.type === 'description') return null;
                    let content;
                    const value = data[key];

                    switch (field.type) {
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
                                  {value || (key === 'name' && data.first_name ? `${data.first_name} ${data.last_name}` : '')}
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
                                                openModal({ content: field.openModal, type: 'dialog', contentId: item.id });
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
                            if (field.computeValue)
                                content = field.computeValue(data);
                            else
                                content = value ?? 0;
                            if (field.formats) {
                                if (field.formats[content] !== undefined) {
                                    content = field.formats[content];
                                } else if (field.formats.default) {
                                    content = field.formats.default.toString().replace('%n', content);
                                }
                            }
                            break;
                        default:
                            content = value?.toString() || '';
                    }

                    return (
                        <div
                            key={key}
                            className={`app-table-row-cell ${key}`}
                            style={field.style || null}
                        >
                            {content}
                        </div>
                    );
                })}
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
                        />
                    )}
                </div>
            }
        </>
    );
};

/**
 * @param {Object[]} dataSource
 * @param {Object} tableStructure
 * @param {boolean} hasSelectableRows
 * @param {string | null} dataPlaceholder
 * @param {string} className
 * @param {Object} style
 * **/
const Table = ({
                   dataSource,
                   tableStructure,
                   hasSelectableRows = false,
                   dataPlaceholder = null,
                   className,
                   style
               }) => {
    const MENU_ID = 'table_context_menu';

    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [selectedItems, setSelectedItems] = useState(new Set());
    const { show } = useContextMenu({ id: MENU_ID, });
    const { openModal } = useNav();

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
        if (sortConfig.key === name && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key: name, direction });
    };

    const handleSelect = (e, id) => {
        if (!hasSelectableRows)
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

    const filteredAndSortedData = useMemo(() => {
        if (!dataSource || !tableStructure) return [];

        let filteredData = [...dataSource];
        const fields = tableStructure?.tableFields;

        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                const filterValue = filters[key].toLowerCase();
                const field = fields[key];

                filteredData = filteredData.filter(item => {
                    let itemValue = item[key];

                    if (field?.computeValue) {
                        itemValue = field.computeValue(item);
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

                if (field?.computeValue) {
                    aValue = field.computeValue(a);
                    bValue = field.computeValue(b);
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
                        aValue = (aValue || []).map(sub => sub.name || `${sub.first_name} ${sub.last_name}`).sort().join(', ').toLowerCase();
                        bValue = (bValue || []).map(sub => sub.name || `${sub.first_name} ${sub.last_name}`).sort().join(', ').toLowerCase();
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

    }, [dataSource, tableStructure, filters, sortConfig]);

    if (!tableStructure) {
        console.error('Table cannot be render without properly defined Table Structure.');
        return null;
    }

    const selectionMode = selectedItems?.size > 0;
    const hasHeader = tableStructure.hasHeader;
    const pageHeader = tableStructure.pageHeader;
    const tableFields = tableStructure.tableFields;
    const subRowField = tableStructure.subRowField;
    const descriptionField = tableStructure.descriptionField;
    const contextMenuActions = tableStructure.contextMenuActions;
    
    return (
        <>
            {pageHeader && 
                <div className='page-header'>
                    {pageHeader.title &&
                        <h1 className={'page-title'}> {pageHeader.title} </h1>
                    }
                    {selectionMode > 0 &&
                        <div className='selected-items'>
                            <p className='seethrough'>
                                {selectedItems.size} {pageHeader.itemName || 'Item'}{selectedItems.size !== 1 ? 's' : ''} selected.
                            </p>
                            <Button
                                onClick={() => setSelectedItems(new Set())}
                                label={'Clear selection'}
                            />
                            <Button
                                onClick={() => setSelectedItems(pageHeader.allElements)}
                                label={'Select all'}
                            />
                        </div>
                    }
                    {tableStructure.pageHeader.newItemModal && 
                        <Button
                            className='new-item'
                            onClick={() => openModal({ content: pageHeader.newItemModal })}
                            label={`Add ${pageHeader.itemName || 'Item'}`}
                            icon={'add'}
                        />
                    }
                </div>
            }
            <div className={`app-table seethrough app-overflow-hidden${selectionMode ? ' selection-mode' : ''}`+
                `${className? ' ' + className : ''}`} style={style}>
                {hasHeader && (
                    <TableHeader
                        fields={tableFields}
                        filters={filters}
                        sortConfig={sortConfig}
                        handleFilter={handleFilter}
                        handleSorting={handleSorting}
                    />
                )}
                <div className={'app-table-body app-overflow-y app-scroll'}>
                    {filteredAndSortedData?.length === 0 ? (
                        <p className={'app-table-no-matches'}>{dataPlaceholder || 'No matching items found.'}</p>
                    ) : (
                        filteredAndSortedData.map((data, index) => {
                            const tableRow = <TableRow
                                key={index}
                                data={data}
                                fields={tableFields}
                                handleSelect={(e, id) => handleSelect(e, id, data.id)}
                                selectedItems={selectedItems}
                                subRowField={subRowField}
                                descriptionField={descriptionField}
                                hasContextMenu={contextMenuActions && contextMenuActions.length > 0}
                                displayContextMenu={displayContextMenu}
                                openModal={openModal}
                            />;

                            return subRowField ? (
                                <div key={index} className={'app-table-row-stack'}>
                                    {tableRow}
                                </div>
                            ) : tableRow
                        })
                    )}
                </div>
                {contextMenuActions && contextMenuActions.length > 0 && (
                    <Menu className={'app-context-menu'} id={MENU_ID}>
                        {contextMenuActions.filter(item => item.selectionMode === selectionMode).map(item => (
                            <Item 
                                key={item.id}
                                onClick={({ props }) => {
                                    if (item.select)
                                        handleSelect('contextMenuClick', props[item.select]);
                                    else if (item.setSelected)
                                        setSelectedItems(item.setSelected);
                                    else if (item.onClick)
                                        if (item.selectionMode)
                                            item.onClick(selectedItems);
                                        else
                                            item.onClick(props);
                                    else 
                                        return null;
                                    }}>
                                {item.label} { item.shortcut ? <RightSlot>{item.shortcut}</RightSlot> : null }
                            </Item>
                        ))}
                    </Menu>
                )}
            </div>
        </>
    );
}

export default Table;