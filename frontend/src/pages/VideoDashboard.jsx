import React from 'react';
import { useNavigate } from 'react-router-dom';

const VideoDashboard = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#100f0fff',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8f8f9ff'
        }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Video App Dashboard</h1>
            <p style={{ fontSize: '1.2rem', color: '#e81d0bff', marginBottom: '40px' }}>
                This feature is currently under development.
            </p>
            <button
                onClick={() => navigate('/dashboard-select')}
                style={{
                    padding: '12px 24px',
                    fontSize: '1rem',
                    backgroundColor: '#a98dfdff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#8b5cf6'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#a78bfa'}
            >
                Back to Selection
            </button>
        </div>
    );
};

export default VideoDashboard;
