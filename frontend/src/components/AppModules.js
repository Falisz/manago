import React from 'react';
import '../assets/styles/AppModules.css';
import { useAppCore } from '../contexts/AppCoreContext';

const AppModules = () => {
    const { modules, handleToggle } = useAppCore();

    return (
        <>
            <div className={"modules-notice"}>
                Depending on the different needs of your business you are able to enable different modules of this app.
                <br/><b>These settings should be changed only by a system admin.</b>
            </div>
            <div className="modules-list">
                {modules.length === 0 ? (
                    <p>No modules found.</p>
                ) : (
                    modules.map((module) => {
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
                                            onChange={() => handleToggle(module.id, module.enabled)}
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
                        );
                    })
                )}
            </div>
        </>
    );
};

export default AppModules;