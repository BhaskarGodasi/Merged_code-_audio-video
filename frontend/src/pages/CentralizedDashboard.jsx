import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Music, Monitor, Zap, TrendingUp, Shield } from 'lucide-react';
import './CentralizedDashboard.css';

const CentralizedDashboard = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="centralized-dashboard">
            {/* Background */}
            <div className="dashboard-bg">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="gradient-orb orb-3"></div>
            </div>

            {/* Header */}
            <div className="dashboard-header">
                <div className="user-welcome">
                    <span>Welcome back, <strong>{user?.username || 'User'}</strong></span>
                </div>
                <button className="dashboard-logout-btn" onClick={handleLogout}>
                    <span className="logout-icon">⏻</span>
                    <span>Logout</span>
                </button>
            </div>

            <div className="dashboard-content">
                <div className="title-section">
                    <h1 className="dashboard-title">
                        <span className="title-gradient">Ninja Media</span>
                        <br />
                        <span className="title-light">Ad Manager</span>
                    </h1>
                    <p className="dashboard-subtitle">
                        Choose your workspace to begin managing campaigns
                    </p>
                </div>

                <div className="app-cards">
                    {/* Audio App Card */}
                    <div
                        className="app-card audio-card"
                        onClick={() => navigate('/audio-dashboard')}
                    >
                        <div className="card-glow audio-glow"></div>
                        <div className="card-header">
                            <div className="card-icon-wrapper">
                                <div className="icon-bg audio-icon-bg"></div>
                                <Music className="card-icon" size={32} strokeWidth={2.5} />
                            </div>
                            <div className="card-badge">Popular</div>
                        </div>

                        <h2 className="card-title">Audio Workspace</h2>
                        <p className="card-description">
                            Manage audio campaigns, devices, jingles, and broadcast schedules
                        </p>

                        <div className="card-features">
                            <div className="feature-item">
                                <Zap size={16} />
                                <span>Real-time Broadcasting</span>
                            </div>
                            <div className="feature-item">
                                <TrendingUp size={16} />
                                <span>Campaign Analytics</span>
                            </div>
                            <div className="feature-item">
                                <Shield size={16} />
                                <span>Device Management</span>
                            </div>
                        </div>

                        <div className="card-footer">
                            <span className="card-cta">Enter Workspace</span>
                            <div className="card-arrow">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M7 3L14 10L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Video App Card */}
                    <div
                        className="app-card video-card"
                        onClick={() => navigate('/video-dashboard')}
                    >
                        <div className="card-glow video-glow"></div>
                        <div className="card-header">
                            <div className="card-icon-wrapper">
                                <div className="icon-bg video-icon-bg"></div>
                                <Monitor className="card-icon" size={32} strokeWidth={2.5} />
                            </div>
                            <div className="card-badge video-badge">Coming Soon</div>
                        </div>

                        <h2 className="card-title">Video Workspace</h2>
                        <p className="card-description">
                            Control LED displays, video content, and digital signage networks
                        </p>

                        <div className="card-features">
                            <div className="feature-item">
                                <Zap size={16} />
                                <span>LED Display Control</span>
                            </div>
                            <div className="feature-item">
                                <TrendingUp size={16} />
                                <span>Content Scheduling</span>
                            </div>
                            <div className="feature-item">
                                <Shield size={16} />
                                <span>Network Management</span>
                            </div>
                        </div>

                        <div className="card-footer">
                            <span className="card-cta">Enter Workspace</span>
                            <div className="card-arrow">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M7 3L14 10L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CentralizedDashboard;
