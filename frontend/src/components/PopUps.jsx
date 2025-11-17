// FRONTEND/components/PopUps.jsx
import React, {useCallback, useMemo} from 'react';
import useApp from '../contexts/AppContext';
import Button from './Button';
import '../styles/PopUps.css'
import Icon from './Icon';

const PopUps = ({popUps = {}}) => {

    const { killPopUp } = useApp();

    const icons = useMemo(() => ({
        info: 'info',
        success: 'check_circle',
        warning: 'warning',
        error: 'error',
        action: 'release_alert',
        disconnected: 'cloud_off'
    }), []);

    const getIcon = useCallback((type) => {
        const icon = icons[type];
        
        if (!icon)
            return icons['info'];
        
        return icon;

    }, [icons]);

    console.log(popUps);
    return (
        <div className='app-popups'>
            {Object.values(popUps).map(({ id, content, isVisible, type, noClose}) => (
                <div
                    key={id}
                    className={'app-popup' 
                        + (isVisible ? ' visible' : '')
                        + (type ? ` ${type}` : '')
                    }
                >
                    {!noClose && <Button
                        className={'app-popup-close'}
                        transparent={true}
                        icon={'close'}
                        onClick={()=>killPopUp(id)}
                    />}
                    <Icon
                        i={getIcon(type)}
                        s={true}
                    />
                    {content}
                </div>
            ))}
        </div>
    );
};

export default PopUps;