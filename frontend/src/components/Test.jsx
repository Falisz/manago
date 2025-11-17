// FRONTEND/components/Test.jsx
import React from 'react';
import useApp from '../contexts/AppContext';
import Button from './Button';

const Test = () => {

    const { showPopUp } = useApp();

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
            onClick={() => showPopUp({type: 'disconnected', noClose: true, content: 'disconnected'})}
        />
        <Button
            label={'action'}
            onClick={() => showPopUp({type: 'action', content: 'action'})}
        />
    </div>;
};

export default Test;