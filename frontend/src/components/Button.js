// FRONTEND/components/Button.js
import React from 'react';
import Icon from "./Icon";

const Button = ({
                    children,
                    className=null,
                    type='button',
                    disabled = false,
                    onClick,
                    label,
                    icon=null,
                    transparent=false
}) => {

    return (
        <button
            className={'app-button' + ( transparent ? (' no-bg') : '') + ( className ? (' ' + className) : '')}
            type={type}
            onClick={onClick}
            disabled={disabled}
        >
            {icon && <Icon i={icon}/>}
            {children || label}
        </button>
    );

}

export default Button;