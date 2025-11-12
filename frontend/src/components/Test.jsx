// FRONTEND/components/Test.jsx
import React, { useRef, useEffect, useMemo, useState } from 'react';
import useAppState from '../contexts/AppStateContext';
import axios from 'axios';
import EditForm from './EditForm';

const Test = () => {
    const { appState, getConfigOptions, refreshConfig } = useAppState();
    const [configOptions, setConfigOptions] = useState({});
    const isMounted = useRef(false);
    const [formConfig, setFormConfig] = useState({
        style: appState.style,
        theme: appState.theme,
        color: appState.color,
        background: appState.background
    });

    useEffect(()=>{
        if (isMounted.current)
            return;

        const fetchConfigs = async () => setConfigOptions(await getConfigOptions());

        fetchConfigs().then();

        isMounted.current = true;
    },[getConfigOptions]);

    const backgroundOptions = useMemo(() => {
        
        const opts = configOptions?.background; 
        
        if(!opts)
            return [{id: null}]
        
        return opts.map(
            opt => ({id: opt, image: `./assets/background-${opt.toLowerCase()}.jpg`})
        )
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
        
        return {
            header: {
                title: 'Testing Radio input'
            },
            inputs: {
                style: {
                    section: 0,
                    style: {
                        flex: '1 1 30%'
                    },
                    label: 'Style',
                    labelStyle,
                    icon: 'type_specimen',
                    iconStyle,
                    field: 'style',
                    inputType: 'dropdown',
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
                    options: configOptions.theme
                },
                color: {
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
                    options: configOptions.color
                },
                background: {
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
                onSave: async () => {
                    try {
                        const payload = Object.fromEntries(
                            Object.entries(formConfig).filter(([, v]) => v != null)
                        );
                        await axios.put('/config', payload, { withCredentials: true });
                        await refreshConfig();
                    } catch (err) {
                        console.error('Error saving config:', err);
                    }
                }
            },
            onCancel: {
                hidden: true
            }
        };
    }, [backgroundOptions, configOptions.color, configOptions.style, configOptions.theme, formConfig, refreshConfig]);

    return <EditForm 
        className={'seethrough app-scroll app-overflow-y'}
        structure={formStructure} 
        source={formConfig}
        setSource={setFormConfig}
    />;
};

export default Test;