import React, {useEffect, useRef} from 'react';
import useAppState from '../contexts/AppStateContext';

const AppSettings = () => {

    const { appState, getConfigOptions } = useAppState();
    const configOptionsRef = useRef();

    const currentConfig = {
        style: appState.style,
        theme: appState.theme,
        color: appState.color,
        background: appState.background
    }

    useEffect(() => {
        const fetchConfigOptions = async () => {
            configOptionsRef.current = await getConfigOptions();
        };
        fetchConfigOptions();
    }, [getConfigOptions]);


    return (
        <div class="seethrough app-scroll app-overflow-y">
            <pre>{JSON.stringify(currentConfig, null, 2)}</pre>
            <pre>{JSON.stringify(configOptionsRef.current, null, 2)}</pre>
        </div>
    );
}

export default AppSettings;