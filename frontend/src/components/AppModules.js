//FRONTEND/Components/AppModules.js
import React from 'react';
import { useConnectivity } from '../contexts/ConnectivityContext';
import '../assets/styles/AppModules.css';

const AppModules = () => {
    const { modules, handleToggle } = useConnectivity();

    return (
        <div className="app-modules">
            <h2>App Modules</h2>
            <table>
                <thead>
                <tr>
                    <th>Icon</th>
                    <th>Title</th>
                    <th>Enabled</th>
                </tr>
                </thead>
                <tbody>
                {modules.map((module) => {
                    const isMain = module.id === 0;
                    return (
                        <tr key={module.id}>
                            <td>{module.icon && <span className="material-symbols-outlined">{module.icon}</span>}</td>
                            <td>{module.title}</td>
                            <td>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={module.enabled}
                                        onChange={() => handleToggle(module.id, module.enabled)}
                                        disabled={isMain}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};

export default AppModules;