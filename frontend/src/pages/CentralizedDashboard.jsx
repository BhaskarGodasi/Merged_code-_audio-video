import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './CentralizedDashboard.css';

const CentralizedDashboard = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="centralized-dashboard">
            <button className="dashboard-logout-btn" onClick={handleLogout} title="Logout">
                ⏻ Logout
            </button>
            <div className="dashboard-content">
                <h1 className="dashboard-title">Welcome to Ninja Media Ad Manager</h1>
                <p className="dashboard-subtitle">Select your workspace to continue</p>

                <div className="app-cards">
                    <div className="app-card audio-card" onClick={() => navigate('/audio-dashboard')}>
                        <div className="card-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                        </div>
                        <h2>Audio App</h2>
                        <p>Manage audio campaigns, devices, and jingles.</p>
                        <div className="card-arrow">→</div>
                    </div>

                    <div className="app-card video-card" onClick={() => navigate('/video-dashboard')}>
                        <div className="card-icon">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                                <line x1="7" y1="2" x2="7" y2="22"></line>
                                <line x1="17" y1="2" x2="17" y2="22"></line>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <line x1="2" y1="7" x2="7" y2="7"></line>
                                <line x1="2" y1="17" x2="7" y2="17"></line>
                                <line x1="17" y1="17" x2="22" y2="17"></line>
                                <line x1="17" y1="7" x2="22" y2="7"></line>
                            </svg>
                        </div>
                        <h2>Video App</h2>
                        <p>Manage video content, displays, and schedules.</p>
                        <div className="card-arrow">→</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CentralizedDashboard;
