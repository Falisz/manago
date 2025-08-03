import React from 'react';

const Button = ({className, onClick, label, icon=null}) => {

    return (
        <button
            className={className}
            onClick={onClick}
        >
            {icon && <i className={"material-icons"}>{icon}</i>}
            {label}
        </button>
    );

}

export default Button;