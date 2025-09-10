// FRONTEND/components/Button.js
import React from 'react';
import Icon from "./Icon";

const Button = ({children, className, onClick, label, icon=null}) => {

    return (
        <button
            className={'app-button ' + className}
            onClick={onClick}
        >
            {icon && <Icon i={icon}/>}
            {children || label}
        </button>
    );

}

export default Button;