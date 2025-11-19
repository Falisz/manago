// FRONTEND/components/PopUps.jsx
import React from 'react';
import useApp from '../contexts/AppContext';
import Button from './Button';
import '../styles/PopUps.css'
import Icon from './Icon';

const icons = {
    info: 'info',
    success: 'check_circle',
    warning: 'warning',
    error: 'error',
    action: 'release_alert',
    disconnected: 'cloud_off'
};

const PopUp = ({id, type, header, content, onClick, isVisible, noClose}) => {

    const { killPopUp } = useApp();

    return (
    <div
        key={id}
        className={'app-popup' 
            + (isVisible ? ' visible' : '')
            + (type ? ` ${type}` : ' info')
        }
    >
        {!noClose && <Button
            className={'app-popup-close'}
            transparent={true}
            icon={'close'}
            onClick={()=>killPopUp(id)}
        />}
        <Icon
            i={icons[type] || icons['info']}
            s={true}
            onClick={onClick}
            clickable={!!onClick}
        />
        <div className={'app-popup-contents' + (onClick ? ' app-clickable' : '')}
             onClick={onClick}>
        {header && <div className={'app-popup-header'}>{header}</div>}
        {content}
        </div>
    </div>
    );

}

const PopUps = ({popUps = {}}) => (
    <div className='app-popups'>
        {Object.values(popUps).slice(-10).map(popUp => <PopUp key={popUp.id} {...popUp}/>)}
    </div>
);

export default PopUps;