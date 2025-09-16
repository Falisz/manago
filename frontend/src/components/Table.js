import React, { useState, useMemo } from 'react';
import {Item, Menu, useContextMenu} from "react-contexify";
import Button from './Button';
import '../assets/styles/Table.css';
import {useModals} from "../contexts/ModalContext";
import Icon from "./Icon";

// Columns definition example
// let fields = {
//     name: { title: 'Name', display: true, sortable: true, filterable: true, type: 'string', openModal: 'userDetails' },
//     roles: { title: 'Roles', display: true, sortable: true, filterable: true, type: 'list', openModal: 'roleDetails' },
//     active: { title: 'Active', display: true, sortable: true, filterable: true, type: 'boolean' },
//     description: { title: '', display: true, sortable: true, filterable: true, type: 'description' },
// };

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
                      descriptions,
                      descriptionField,
                      displayContextMenu,
                      isSubRow = false,
                      hasSelectableRows,
                      selectedItems,
                      setSelectedItems,
                      hasContextMenu,
                      openModal
                  }) => {

    const selectionMode = selectedItems?.size > 0;

    const handleSelect = (e, id) => {
        if (!hasSelectableRows) return;
        if (e.shiftKey || selectionMode) {
            e.preventDefault();
            setSelectedItems(prev => {
                const newSelected = new Set(prev);
                if (newSelected.has(id)) {
                    newSelected.delete(id);
                } else {
                    newSelected.add(id);
                }
                return newSelected;
            });
        }
    };

    return (
        <>
            <div
                className={`app-table-row${selectedItems?.has(data.id) ? 
                    ' selected' : ''}${isSubRow ? 
                    ' sub-row' : ''}${descriptions ? 
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
                            hasSelectableRows={hasSelectableRows}
                            selectedItems={selectedItems}
                            setSelectedItems={setSelectedItems}
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
 * @param {Object} fields
 * @param {boolean} hasHeader
 * @param {boolean} hasSelectableRows
 * @param {boolean} hasContextMenu
 * @param {Set | null} selectedItems
 * @param {Object[]} contextMenuItems
 * @param {function | null} setSelectedItems
 * @param {string | null} dataPlaceholder
 * @param {boolean} descriptions
 * @param {string} descriptionField
 * @param {boolean} subRows
 * @param {string} subRowField
 * @param {string} contextMenuItems.id
 * @param {string} contextMenuItems.label
 * @param {boolean} contextMenuItems.selectionMode
 * @param {function} handleContextMenuClick
 * **/
const Table = ({
                   dataSource,
                   fields,
                   hasHeader = true,
                   hasContextMenu = false,
                   hasSelectableRows = true,
                   selectedItems = null,
                   setSelectedItems = null,
                   dataPlaceholder,
                   descriptions = false,
                   descriptionField = 'description',
                   subRows = false,
                   subRowField = '',
                   contextMenuItems = [],
                   handleContextMenuClick,
               }) => {
    const MENU_ID = "table_context_menu";

    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const { show } = useContextMenu({ id: MENU_ID, });
    const { openModal } = useModals();

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

    const filteredAndSortedData = useMemo(() => {
        if (!dataSource) return [];

        let filteredData = [...dataSource];

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

    }, [dataSource, filters, sortConfig]);

    const selectionMode = selectedItems?.size > 0;
    
    return (
        <div className={`app-table seethrough app-overflow-hidden ${selectionMode ? ' selection-mode' : ''}`}>
            {hasHeader && (
                <TableHeader
                    fields={fields}
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
                            key={data.id || index}
                            data={data}
                            fields={fields}
                            subRowField={subRowField}
                            descriptions={descriptions}
                            descriptionField={descriptionField}
                            hasContextMenu={hasContextMenu}
                            displayContextMenu={displayContextMenu}
                            hasSelectableRows={hasSelectableRows}
                            selectedItems={selectedItems}
                            setSelectedItems={setSelectedItems}
                            openModal={openModal}
                        />

                        return subRows ? (
                            <div key={index} className={'app-table-row-stack'}>
                                {tableRow}
                            </div>
                        ) : tableRow
                    })
                )}
            </div>
            {hasContextMenu && (
                <Menu className={'app-context-menu'} id={MENU_ID}>
                    {contextMenuItems.filter(item => item.selectionMode === selectionMode).map(item => (
                        <Item key={item.id} id={item.id} onClick={({ props }) => handleContextMenuClick({ id: item.id, props })}>
                            {item.label}
                        </Item>
                    ))}
                </Menu>
            )}
        </div>
    );
}

export default Table;