// FRONTEND/components/Button.js
import React from 'react';

const Button = ({children, className, onClick, label, icon=null}) => {

    return (
        <button
            className={'app-button ' + className}
            onClick={onClick}
        >
            {icon && <i className={'material-icons'}>{icon}</i>}
            {children || label}
        </button>
    );

}

export default Button;