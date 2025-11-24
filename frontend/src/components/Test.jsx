// FRONTEND/components/Test.jsx
import React, {useEffect, useRef} from 'react';
import useApp from '../contexts/AppContext';
import Button from './Button';
import { useRequestStatuses } from '../hooks/useResource';

const Test = () => {

    const { showPopUp } = useApp();
    const { requestStatuses, fetchRequestStatuses } = useRequestStatuses();
    const isMounted = useRef(false);

    useEffect(() => {
        fetchRequestStatuses().then(
            _res => isMounted.current = true
        );
    }, [fetchRequestStatuses]);

    if(isMounted.current)
        console.log(requestStatuses);

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