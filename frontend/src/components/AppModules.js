import React from 'react';
import '../assets/styles/AppSettings.css';
import useAppState from '../contexts/AppStateContext';
import { useModals } from '../contexts/ModalContext';
import Icon from './Icon';

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

    return (
        <>
            <div className='page-header'>
                <h1 className={'page-title'}> App Modules </h1>
            </div>
            <div className='app-table seethrough modules-list app-overflow-y app-scroll'>
                <p>
                    Depending on the different needs of your business you are able to enable different modules of this app.
                </p>
                { appState.modules?.length > 0 ? (appState.modules?.map((module) => {
                    const isMain = module.id === 0;
                    return (
                        <div className='app-table-row with-desc' key={module.id}>
                            <div className='app-table-row-cell module-icon'>
                                {module.icon && <Icon i={module.icon} s={true} />}
                            </div>
                            <div className='app-table-row-cell module-title'>
                                {module.title}
                            </div>
                            <div className='app-table-row-cell module-switch'>
                                <div className='app-switch'
                                     onClick={() => handleToggleConfirm(module.id, module.enabled)}
                                >
                                    <input
                                        type='checkbox'
                                        checked={module.enabled}
                                        onChange={() => handleToggleConfirm(module.id, module.enabled)}
                                        disabled={isMain}
                                    />
                                    <span className='toggle-slider'></span>
                                </div>
                            </div>
                            <div className='app-table-row-cell app-table-row-desc module-description'>
                                {module.description}
                            </div>
                        </div>
                    ); }
                )) : <p>No modules found.</p> }
            </div>
        </>
    );
};

export default AppModules;