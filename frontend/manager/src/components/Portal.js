// frontend/Manager/Portal.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const Dashboard = () => <h3>Dashboard</h3>;
const Reports = () => <h3>Reports</h3>;
const Settings = () => <h3>Settings</h3>;
const NotFound = () => <h3>404 - Page Not Found</h3>;

const Portal = () => {
    return (
        <Router basename="/">
            <div>
                <nav>
                    <Link to="/">Dashboard</Link> |{" "}
                    <Link to="/reports">Reports</Link> |{" "}
                    <Link to="/settings">Settings</Link> |{" "}
                </nav>
            </div>

            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
};

export default Portal;
