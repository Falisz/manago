import React from 'react';
import '../assets/styles/AppModules.css';
import useAppStatus from "../contexts/AppStatusContext";
import { useModals } from "../contexts/ModalContext";

const AppModules = () => {
    const { appConfig, toggleModule } = useAppStatus();
    const { openModal, closeTopModal } = useModals();

    const handleToggleConfirm = (id, value) => {
        openModal({
            type: 'confirm',
            isPopUp: true,
            message: 'Are you sure you want to disable this app module? All the data related to it will not be ' +
                'accessible within the app until its reactivation.',
            onConfirm: () => {
                closeTopModal();
                setTimeout(() => {
                    toggleModule(id, value).then();
                }, 300);
            },
        });
    }

    return (
        <>
            <div className={"modules-notice"}>
                Depending on the different needs of your business you are able to enable different modules of this app.
                <br/><b>These settings should be changed only by a system admin.</b>
            </div>
            <div className="modules-list">
                { appConfig.modules?.length > 0 ? (appConfig.modules?.map((module) => {
                    const isMain = module.id === 0;
                    return (
                        <div className="modules-list-row" key={module.id}>
                            <div className="module-content">
                                {module.icon && <span className="module-icon material-symbols-outlined">{module.icon}</span>}
                                <div className="module-title">{module.title}</div>
                                <label className="module-switch">
                                    <input
                                        type="checkbox"
                                        checked={module.enabled}
                                        onChange={() => handleToggleConfirm(module.id, module.enabled)}
                                        disabled={isMain}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            {(
                                <div className="module-description">
                                    {module.description ||
                                        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor " +
                                        "incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud " +
                                        "exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure " +
                                        "dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. " +
                                        "Excepteur sint occaecat cupidatat non proident."}
                                </div>
                            )}
                        </div>
                    ); }
                )) : <p>No modules found.</p> }
            </div>
        </>
    );
};

export default AppModules;