// FRONTEND/components/PopUps.jsx
import React, {useCallback, useMemo} from 'react';
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

const PopUp = ({popUp}) => {

    const { id, type, header, content, isVisible, noClose } = popUp;

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
        />
        <div className={'app-popup-contents'}>
        {header && <div className={'app-popup-header'}>{header}</div>}
        {content}
        </div>
    </div>
    );

}

const PopUps = ({popUps = {}}) => {

    console.log(popUps);
    return (
        <div className='app-popups'>
            {Object.values(popUps).map(popUp => <PopUp key={popUp.id} popUp={popUp}/>)}
        </div>
    );
};

export default PopUps;