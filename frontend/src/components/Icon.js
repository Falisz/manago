// FRONTEND/components/Icon.js
import React from 'react';

const Icon = ({i, className=null}) => {
    return (
        <i className={'material-icons' + (className ? (' ' + className) : '')}>{i}</i>
    );

}

export default Icon;