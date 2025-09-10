// FRONTEND/components/Icon.js
import React from 'react';

const Icon = ({i='check_circle', className=null, onClick=null, s=false}) => {
    return (
        <i
            className={'material-' + (s ? 'symbols-rounded' : 'icons') + (className ? (' ' + className) : '')}
            onClick={onClick}
        >
            {i}
        </i>
    );

}

export default Icon;