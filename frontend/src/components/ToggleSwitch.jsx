// FRONTEND/components/ToggleSwitch.jsx
import React from 'react';
import '../styles/ToggleSwitch.css';

const ToggleSwitch = ({ checked, onChange, disabled }) => 
    <div className='app-switch' onClick={() => !disabled && onChange(!checked)}>
        <input
            type='checkbox'
            checked={checked}
            onChange={() => !disabled && onChange(!checked)}
            disabled={disabled}
        />
        <span className='toggle-slider'></span>
    </div>

export default ToggleSwitch;