// FRONTEND/Components/Button.jsx
import React from 'react';
import Icon from './Icon';
import '../styles/Button.css';

/**
 * This is a shorthand button component for an app.
 * @param children
 * @param id
 * @param className
 * @param type
 * @param disabled
 * @param onClick
 * @param label
 * @param title
 * @param name
 * @param icon
 * @param transparent
 * @param style
 * @param iconStyle
 * @returns {JSX.Element}
 * @constructor
 */
const Button = ({
    children,
    id,
    className=null,
    type='button',
    disabled = false,
    onClick,
    label,
    title,
    name,
    icon=null,
    transparent=false,
    style,
    iconStyle
}) =>
    <button
        id={id}
        className={'app-button' + ( transparent ? (' no-bg') : '') + ( className ? (' ' + className) : '') +
            (disabled ?  ' disabled' : '')}
        type={type}
        title={title}
        name={name}
        onClick={onClick}
        disabled={disabled}
        style={style}
    >
        {icon && <Icon i={icon} style={iconStyle}/>}
        {children || label}
    </button>;

export default Button;