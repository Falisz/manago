//FRONTEND/App.js
import React from 'react';
import './App.css';
import { ConnectivityProvider } from './ConnectivityContext';
import { LoadingProvider } from './LoadingContext';
import { UserProvider } from './UserContext';
import AppContent from "./AppContent";

const App = () => {
    return (
        <ConnectivityProvider>
            <LoadingProvider>
                <UserProvider>
                    <AppContent />
                </UserProvider>
            </LoadingProvider>
        </ConnectivityProvider>
    );
};

export default App;
