// FRONTEND/Components/AppModules.jsx
import React from 'react';
import useAppState from '../contexts/AppStateContext';
import { useModals } from '../contexts/ModalContext';
import Table from './Table';

const AppModules = () => {
    const { appState, toggleModule } = useAppState();
    const { openModal } = useModals();

    const handleToggleConfirm = (id, value) => {
        openModal({
            content: 'confirm',
            type: 'pop-up',
            message: 'Are you sure you want to disable this app module? All the data related to it will not be ' +
                'accessible within the app until its reactivation.',
            onConfirm: () => toggleModule(id, value).then(),
        });
    }

    const tableStructure = {
        pageHeader: {
            title: 'App Modules',
            itemName: 'Module',
        },
        tableFields: {
            icon: {
                display: true,
                type: 'icon',
                openModal: 'roleDetails',
                style: {maxWidth: 25+'px', paddingRight: 0, display: 'flex', alignItems: 'center'},
                iconStyle: {fontSize: '2rem' }
            },
            title: {
                display: true,
                type: 'string',
                openModal: 'roleDetails',
                style: {fontSize: '1.5rem', paddingLeft: '20px', textTransform: 'uppercase', fontFamily: 'var(--font-family-condensed)' },
            },
            enabled: {
                display: true,
                type: 'toggleSwitch',
                style: {textAlign: 'right', maxWidth: '200px'},
                checked: (data) => data.enabled,
                onChange: (data) => handleToggleConfirm(data.id, data.enabled),
                disabled: (data) => data.id === 0,
            },
        },
        descriptionField: 'description',
    }

    return (
        <Table
            dataSource={appState.modules}
            tableStructure={tableStructure}
            dataPlaceholder={'No Modules found.'}
        />
    );
};

export default AppModules;