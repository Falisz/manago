// FRONTEND/components/Icon.jsx
import React from 'react';

const Icon = ({i='check_circle', className=null, onClick=null, s=false, clickable=false}) =>
    <span
        className={'icon material-' + (s ? 'symbols-rounded' : 'icons')
            + (clickable ? (' app-clickable') : '')
            + (className ? (' ' + className) : '')}
        onClick={onClick}
    >
        {i}
    </span>;

export default Icon;