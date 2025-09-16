import React, { useState, useMemo } from 'react';
import {Item, Menu, useContextMenu} from "react-contexify";
import Button from '../Button';

// Columns definition example
let fields = {
    name: { title: 'Name', display: true, sortable: true, filterable: true, type: 'string', openModal: 'userDetails' },
    roles: { title: 'Roles', display: true, sortable: true, filterable: true, type: 'list', openModal: 'roleDetails' },
    active: { title: 'Active', display: true, sortable: true, filterable: true, type: 'boolean' },
    description: { title: '', display: true, sortable: true, filterable: true, type: 'description' },
};

const TableHeader = ({ 
    fields, 
    filters, 
    sortConfig, 
    handleFilter, 
    handleSorting 
}) => {
    const [headerCollapsed, setHeaderCollapsed] = useState(true);

    return <div className={`app-table-header ${headerCollapsed ? 'collapsed' : ''}`}>
                <Button
                    className={`collapse ${headerCollapsed ? 'collapsed' : ''}`}
                    onClick={() => setHeaderCollapsed(!headerCollapsed)}
                    icon={headerCollapsed ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
                />
                {Object.entries(fields).map(([key, field]) => (
                    <div className={`app-table-header-cell ${key}`} key={key}>
                        <div className={'app-table-header-cell-label'}>
                            {field.title}
                        </div>
                        <div className={'app-table-header-cell-actions'}>
                            <input
                                className='search'
                                title={field.title}
                                placeholder={`Filter by the ${field.title.toLowerCase()}...`}
                                name={key}
                                value={filters[key] || ''}
                                onChange={handleFilter}
                            />
                            <Button
                                className={`order ${sortConfig.key === key ? sortConfig.direction : ''}`}
                                name={key}
                                onClick={handleSorting}
                                icon={sortConfig.key === key &&
                                sortConfig.direction === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                            />
                        </div>
                    </div>
                ))}
            </div>;
}


const TableRow = ({ data, fields, subRowField, displayContextMenu, isSubItem = false }) => {
    return <>
        <div className={'app-table-row'}>
            {/* Here will be logic that lists data using iteration over fields.  */}
        </div>
        {
            data[subRowField] && data[subRowField].length > 0 && data[subRowField].map((subItemData) => 
            <TableRow data={subItemData} fields={fields} isSubItem={true}/>)
        }
    </>;
};

const MENU_ID = "table_context_menu";

const Table = ({ 
    dataSource, 
    fields, 
    hasHeader = true,
    hasContextMenu = true,
    hasSelectableRows = true, 
    selectedItems = null,
    setSelectedItems = null,
    dataPlaceholder, 
    descriptions = null,
    descriptionField = 'description',
    subRows = null,
    subRowField = null
}) => {
    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const { show } = useContextMenu({ id: MENU_ID, });

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
        const { name } = e.target;
        let direction = 'asc';
        if (sortConfig.key === name && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key: name, direction });
    };

    const filteredAndSortedData = useMemo(() => {
        let filteredData = [...dataSource];

        Object.keys(filters).forEach(key => {
            // To be improved with different filter types (e.g., exact match for numbers, boolean, etc.)
            // Currently, it does a simple case-insensitive substring match for strings.
            if (filters[key]) {
                filteredData = filteredData.filter(item =>
                    item[key] && item[key].toString().toLowerCase().includes(filters[key].toLowerCase())
                );
            }
        });

        if (sortConfig.key) {
            filteredData.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filteredData;

    }, [dataSource, filters, sortConfig]);
    
    return (
        <div className="app-table">
            {hasHeader && (
                <TableHeader
                    fields={fields}
                    filters={filters}
                    sortConfig={sortConfig}
                    handleFilter={handleFilter}
                    handleSorting={handleSorting}
                />
            )}
            {filteredAndSortedData?.length === 0 ? <p>{dataPlaceholder}</p> : (
                filteredAndSortedData.map((data, index) => (
                    subRows || descriptionField ? 
                    <div className={'app-table-row-stack'}>
                        <TableRow key={index} data={data} fields={fields} subRowField={subRowField} displayContextMenu={displayContextMenu}/>
                    </div> :
                    <TableRow key={index} data={data} fields={fields} displayContextMenu={displayContextMenu}/>
                ))
            )}
        </div>
    );
}

export default Table;