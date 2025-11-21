import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Bell, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = ({ onToggleSidebar }) => {
	const location = useLocation();
	const navigate = useNavigate();
	const { user } = useAuth();
	const isVideoDashboard = location.pathname.startsWith('/video-dashboard');

	const handleDashboardClick = () => {
		navigate('/');
	};

	const handleNotificationClick = () => {
		// TODO: Implement notification functionality
		console.log('Notifications clicked');
	};

	const handleProfileClick = () => {
		// TODO: Implement profile menu functionality
		console.log('Profile clicked');
	};

	return (
		<header className="header-bar">
			<div className="header-inner">
				<div className="header-left">
					<button type="button" className="icon-button" onClick={onToggleSidebar}>
						☰
					</button>
					<img
						src='./NMC-Logo.png'
						alt="logo"
						className="app-logo header-app-logo"
					/>
					<div>
						<h1 className="header-title app-title">
							{isVideoDashboard ? "Ninja Media Screeno - LED" : "Ninja Smart Audio"}
						</h1>
						<p className="header-subtitle">
							{isVideoDashboard ? "" : "Voicing Brands Where Journeys Begin"}
						</p>
					</div>
				</div>
				<div className="header-right">
					<button
						type="button"
						className="header-nav-button"
						onClick={handleDashboardClick}
						title="Go to Central Dashboard"
					>
						<Home className="nav-button-icon" size={18} />
						<span className="nav-button-text">Dashboard</span>
					</button>
					<button
						type="button"
						className="header-icon-button"
						onClick={handleNotificationClick}
						title="Notifications"
					>
						<Bell className="notification-icon" size={20} />
					</button>
					<button
						type="button"
						className="header-profile-button"
						onClick={handleProfileClick}
						title={user?.username || 'Profile'}
					>
						<div className="profile-avatar">
							{user?.username ? (
								user.username.charAt(0).toUpperCase()
							) : (
								<User size={18} />
							)}
						</div>
						<span className="profile-username">{user?.username || 'User'}</span>
					</button>
				</div>
			</div>
		</header>
	);
};

Header.propTypes = {
	onToggleSidebar: PropTypes.func.isRequired,
};

export default Header;
