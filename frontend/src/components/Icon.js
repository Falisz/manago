// FRONTEND/components/Icon.js
import React from 'react';

const Icon = ({i='check_circle', className=null, onClick=null, s=false, clickable=false}) =>
    <icon
        className={'material-' + (s ? 'symbols-rounded' : 'icons')
            + (clickable ? (' app-clickable') : '')
            + (className ? (' ' + className) : '')}
        onClick={onClick}
    >
        {i}
    </icon>;

export default Icon;