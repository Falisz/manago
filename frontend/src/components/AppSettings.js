import React, { useEffect, useState } from 'react';
import useAppState from '../contexts/AppStateContext';
import axios from 'axios';
import '../assets/styles/Form.css';
import '../assets/styles/AppSettings.css';
import Loader from "./Loader";
import AppModules from "./AppModules";
import Dropdown from "./Dropdown";
import Icon from "./Icon";
import Button from "./Button";

const AppSettings = () => {
    const { appState, getConfigOptions, refreshConfig } = useAppState();
    const [configOptions, setConfigOptions] = useState(null);
    const [formConfig, setFormConfig] = useState({
        style: appState.style,
        theme: appState.theme,
        color: appState.color,
        background: appState.background
    });

    useEffect(() => {
        const fetchConfigOptions = async () => {
            const options = await getConfigOptions();
            setConfigOptions(options);
        };
        fetchConfigOptions().then();
    }, [getConfigOptions]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormConfig((prev) => ({
            ...prev,
            [name]: value,
            ...(name === 'style' && value !== 'fluent' ? { background: null } : {})
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Filter out null/undefined values
            const payload = Object.fromEntries(
                Object.entries(formConfig).filter(([, v]) => v != null)
            );
            await axios.put('/config', payload, { withCredentials: true });
            await refreshConfig();
        } catch (err) {
            console.error('Error saving config:', err);
        }
    };

    if (!configOptions) {
        return <Loader/>;
    }

    return (
        <>
            <div className="page-section">
                <div className='page-header'>
                    <h1 className={'page-title'}> App Style</h1>
                </div>
                <form
                    className={'app-form seethrough app-scroll app-overflow-y'}
                    onSubmit={handleSubmit}
                >
                    <div className={'form-group'}>
                        <label
                            className={'form-label'}
                        >
                            <Icon i={'type_specimen'} s={true}/>
                            Style
                        </label>
                        <Dropdown
                            name="style"
                            value={formConfig.style}
                            options={configOptions.style}
                            onChange={handleChange}
                            upperCaseNames={true}
                        />
                    </div>
                    <div className={'form-group'}>
                        <label
                            className={'form-label'}
                        >
                            <Icon i={'routine'} s={true}/>
                            Theme
                        </label>
                        <Dropdown
                            name="theme"
                            value={formConfig.theme}
                            options={configOptions.theme}
                            onChange={handleChange}
                            upperCaseNames={true}
                        />
                    </div>
                    <div className={'form-group'}>
                        <label
                            className={'form-label'}
                        >
                            <Icon i={'palette'} s={true}/>
                            Color
                        </label>
                        <Dropdown
                            className={'palette'}
                            name="color"
                            value={formConfig.color}
                            options={configOptions.color}
                            onChange={handleChange}
                            upperCaseNames={true}
                        />
                    </div>
                    <div
                        className={'form-group ' + (formConfig.style !== 'fluent' ? 'disabled' : '') }
                    >
                        <div
                            className={'form-label'}
                        >
                            <Icon i={'wallpaper'} s={true}/>
                            Background
                        </div>
                        <div className='background-gallery'>
                            {configOptions.background.map((opt) => (
                                <label key={opt} className="radio-label">
                                    <input
                                        type="radio"
                                        name="background"
                                        value={opt}
                                        checked={formConfig.background === opt}
                                        onChange={handleChange}
                                        disabled={formConfig.style !== 'fluent'}
                                    />
                                    <img
                                        className={'background-thumbnail'}
                                        src={`./assets/background-${opt.toLowerCase()}.jpg`}
                                        alt={opt}
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                    <Button
                        className={'submit'}
                        type={'submit'}
                        label={'Save Changes'}
                        icon={'save'}
                    />
                </form>
            </div>
            <div className={'page-section'}>
                <AppModules/>
            </div>
        </>
    );
};

export default AppSettings;