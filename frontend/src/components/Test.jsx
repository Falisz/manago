// FRONTEND/components/Test.jsx
import React, {useEffect, useRef} from 'react';
import useApp from '../contexts/AppContext';
import Button from './Button';
import { useUser } from '../hooks/useResource';

const Test = () => {

    const { showPopUp } = useApp();
    const { users, fetchUsers } = useUser();
    const isMounted = useRef(false);

    useEffect(() => {
        fetchUsers().then(
            _res => isMounted.current = true
        );
    }, [fetchUsers]);

    if(isMounted.current)
        console.log(users);

    return <div>
        <Button
            label={'info'}
            onClick={() => showPopUp({type: 'info', content: 'Info'})}
        />
        <Button
            label={'success'}
            onClick={() => showPopUp({type: 'success', content: 'Success'})}
        />
        <Button
            label={'warning'}
            onClick={() => showPopUp({type: 'warning', content: 'Warning'})}
        />
        <Button
            label={'error'}
            onClick={() => showPopUp({type: 'error', content: 'Error'})}
        />
        <Button
            label={'disconnected'}
            onClick={() => showPopUp({type: 'disconnected', content: 'disconnected'})}
        />
        <Button
            label={'action'}
            onClick={() => showPopUp({type: 'action', content: 'action'})}
        />
    </div>;
};

export default Test;