import React, { useEffect, useState } from 'react';
import useAppState from '../contexts/AppStateContext';
import axios from 'axios';
import '../assets/styles/Form.css';
import '../assets/styles/AppSettings.css';
import Loader from "./Loader";
import AppModules from "./AppModules";

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
                    className={'app-form app-settings seethrough app-scroll app-overflow-y'}
                    onSubmit={handleSubmit}
                >
                    <div className={'form-group'}>
                        <label
                            className={'form-group-header'}>
                            <i className={'material-symbols-outlined'}>type_specimen</i>
                            Style
                        </label>
                        <select name="style" value={formConfig.style} onChange={handleChange}>
                            {configOptions.style.map((opt) => (
                                <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                    <div className={'form-group'}>
                        <label
                            className={'form-group-header'}>
                            <i className={'material-symbols-outlined'}>routine</i>
                            Theme
                        </label>
                        <select name="theme" value={formConfig.theme} onChange={handleChange}>
                            {configOptions.theme.map((opt) => (
                                <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                    <div className={'form-group'}>
                        <label
                            className={'form-group-header'}>
                            <i className={'material-symbols-outlined'}>palette</i>
                            Color
                        </label>
                        <select name="color" value={formConfig.color} onChange={handleChange}>
                            {configOptions.color.map((opt) => (
                                <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                    <div
                        className={'form-group ' + (formConfig.style !== 'fluent' ? 'disabled' : '') }
                    >
                        <div
                            className={'form-group-header'}
                        >
                            <i className={'material-symbols-outlined'}>wallpaper</i>
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
                    <button
                        className='submit-button'
                        type='submit'
                    >
                        Save Changes
                    </button>
                </form>
            </div>
            <div className={'page-section'}>
                <AppModules/>
            </div>
        </>
    );
};

export default AppSettings;