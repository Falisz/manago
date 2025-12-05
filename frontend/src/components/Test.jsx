// FRONTEND/components/Test.jsx
import React from 'react';
import useApp from '../contexts/AppContext';
import Button from './Button';
import MonthGrid from "./MonthGrid";

const Test = () => {

    const { showPopUp, setLoading } = useApp();

    return <div>
        <Button
            label={'Loading'}
            onClick={() => setLoading(true)}
        />
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
        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center'}}>
            <MonthGrid
                date={'2025-10'}
            />
            <MonthGrid
                date={'2025-11'}
            />
            <MonthGrid
                date={'2025-12'}
            />
            <MonthGrid
                date={'2026-01'}
            />
        </div>
    </div>;
};

export default Test;