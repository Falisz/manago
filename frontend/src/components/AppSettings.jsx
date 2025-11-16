// FRONTEND/Components/AppSettings.jsx
import React, {useEffect, useRef, useState, useMemo} from 'react';
import useApp from '../contexts/AppContext';
import useNav from '../contexts/NavContext';
import EditForm from './EditForm';
import Loader from './Loader';
import Table from './Table';
import '../styles/AppSettings.css';
import '../styles/EditForm.css';

const AppModules = () => {
    const { appState, toggleModule } = useApp();
    const { openModal } = useNav();

    const handleToggleConfirm = (id, value) => {
        openModal({
            content: 'confirm',
            type: 'dialog',
            message: `Are you sure you want to ${!value ? 'enable' : 'disable'} this app module?` + (value ? ' All the data related to it will not be ' +
                'accessible within the app until its reactivation.' : ''),
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
                style: {maxWidth: 25+'px', paddingRight: 0, display: 'flex', alignItems: 'center'},
                iconStyle: {fontSize: '2rem' }
            },
            title: {
                display: true,
                type: 'string',
                style: {fontSize: '1.5rem', cursor: 'default', paddingLeft: '20px', textTransform: 'uppercase', fontFamily: 'var(--font-family-condensed)' },
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

const AppStyles = () => {
    const { appState, getConfigOptions, saveConfig } = useApp();
    const [configOptions, setConfigOptions] = useState({});
    const [loading, setLoading] = useState(true);
    const isMounted = useRef(false);
    const [formConfig, setFormConfig] = useState({
        style: appState.style,
        theme: appState.theme,
        color: appState.color,
        background: appState.background
    });

    useEffect(() => {
        if (isMounted.current)
            return;

        const fetchConfigs = async () => setConfigOptions(await getConfigOptions());

        fetchConfigs().then();

        setLoading(false);

        isMounted.current = true;
    }, [getConfigOptions]);

    const backgroundOptions = useMemo(() => {
        const opts = configOptions?.background;

        if (!opts)
            return [];

        return opts.map( opt => ({id: opt, image: `./assets/background-${opt.toLowerCase()}.jpg`}) );
    }, [configOptions.background]);

    const formStructure = useMemo(() => {
        const labelStyle = {
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            textTransform: 'uppercase',
            fontSize: '1.5rem',
            fontFamily: "'Roboto Condensed', sans-serif",
            fontWeight: 400
        };

        const iconStyle = {
            fontSize: '2rem',
        };

        const upperCase = {
            textTransform: 'uppercase',
        };

        return {
            fields: {
                style: {
                    section: 0,
                    style: {
                        flex: '1 1 30%'
                    },
                    label: 'UI Style',
                    labelStyle,
                    icon: 'type_specimen',
                    iconStyle,
                    field: 'style',
                    inputType: 'dropdown',
                    searchable: false,
                    selectedStyle: upperCase,
                    optionsStyle: upperCase,
                    options: configOptions.style
                },
                theme: {
                    section: 0,
                    style: {
                        flex: '1 1 30%'
                    },
                    label: 'Theme',
                    labelStyle,
                    icon: 'routine',
                    iconStyle,
                    field: 'theme',
                    inputType: 'dropdown',
                    searchable: false,
                    selectedStyle: upperCase,
                    optionsStyle: upperCase,
                    options: configOptions.theme
                },
                color: {
                    className: 'app-color',
                    section: 0,
                    style: {
                        flex: '1 1 30%'
                    },
                    label: 'Color',
                    labelStyle,
                    icon: 'palette',
                    iconStyle,
                    field: 'color',
                    inputType: 'dropdown',
                    searchable: false,
                    selectedStyle: upperCase,
                    optionsStyle: upperCase,
                    options: configOptions.color
                },
                background: {
                    section: 1,
                    className: 'app-background',
                    label: 'Background',
                    labelStyle,
                    icon: 'wallpaper',
                    iconStyle,
                    field: 'background',
                    inputType: 'radio',
                    options: backgroundOptions,
                    disabled: formConfig.style !== 'fluent'
                }
            },
            onSubmit: {
                onSave: async () => await saveConfig(formConfig)
            },
            onCancel: {
                hidden: true
            }
        };
    }, [backgroundOptions, configOptions.color, configOptions.style, configOptions.theme, formConfig, saveConfig]);

    if (loading)
        return <Loader/>;

    return <EditForm
        className={'seethrough app-scroll app-overflow-y'}
        structure={formStructure}
        source={formConfig}
        setSource={setFormConfig}
    />;

}

const AppSettings = () => {
    return (
        <>
            <div className='page-section'>
                <div className='page-header'>
                    <h1 className={'page-title'}> App Style</h1>
                </div>
                <AppStyles/>
            </div>
            <div className={'page-section'}>
                <AppModules/>
            </div>
        </>
    );
};

export default AppSettings;