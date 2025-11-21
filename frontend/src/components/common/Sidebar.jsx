import PropTypes from 'prop-types';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { NAV_LINKS } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, onLinkClick, onToggle }) => {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const isVideoDashboard = location.pathname.startsWith('/video-dashboard');

	// Filter nav links based on user role
	const getFilteredLinks = () => {
		if (!user) return [];

		if (user.role === 'client') {
			// Brand users can access dashboard, their brand page, live relay, and playback logs
			const clientRoutes = ['/', '/brands', '/live-relay', '/logs'];
			return NAV_LINKS.filter((link) => clientRoutes.includes(link.to));
		}

		if (user.role === 'admin') {
			// Admins can see everything except Users
			return NAV_LINKS.filter(link => link.to !== '/users');
		}

		// Super admins can see everything
		return NAV_LINKS;
	};

	const handleLogout = () => {
		logout();
		navigate('/login');
	};

	const filteredLinks = getFilteredLinks();

	return (
		<aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
			<div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: isOpen ? 'space-between' : 'center' }}>
				{isOpen ? (
					<div className="brand-content" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<img
							src="./NMC-Logo.png"
							alt="logo"
							className="app-logo"
						/>
						<span className={"app-title"}>
							{isVideoDashboard ? "Ninja Media" : "Ninja Smart Audio"}
						</span>
					</div>
				) : (
					<img
						src="./NMC-Logo.png"
						alt="logo"
						className="app-logo-collapsed"
					/>
				)}
				<button
					type="button"
					className="sidebar-toggle-btn"
					onClick={onToggle}
					aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
					style={{ marginLeft: isOpen ? 8 : 0, background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
				>
					{isOpen ? '«' : '»'}
				</button>
			</div>

			{user && isOpen && (
				<div className="sidebar-user-info">
					<div className="user-role-badge" style={{
						backgroundColor: user.role === 'superadmin' ? '#dc3545' : user.role === 'admin' ? '#fd7e14' : '#0d6efd',
						color: 'white',
						padding: '4px 8px',
						borderRadius: '4px',
						fontSize: '11px',
						fontWeight: 'bold',
						textAlign: 'center',
						marginBottom: '8px'
					}}>
						{user.role.toUpperCase()}
					</div>
					<div style={{ fontSize: '13px', color: '#ddd', textAlign: 'center' }}>
						{user.username}
					</div>
				</div>
			)}

			<nav className="sidebar-nav">
				{filteredLinks.map((link) => (
					<NavLink
						key={link.to}
						to={link.to}
						className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
						onClick={onLinkClick}
						end={link.to === '/'}
						title={!isOpen ? link.label : ''}
					>
						<span className="link-icon">{link.icon || '📊'}</span>
						{isOpen && <span className="link-label">{link.label}</span>}
					</NavLink>
				))}
			</nav>

			<div className="sidebar-footer">
				<button
					className="sidebar-link logout-btn"
					onClick={handleLogout}
					title={!isOpen ? 'Logout' : ''}
					style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
				>
					{/* Use a clearer power icon for logout; can be changed to an SVG if preferred */}
					<span className="link-icon">⏻</span>
					{isOpen && <span className="link-label">Logout</span>}
				</button>
			</div>
		</aside>
	);
};

Sidebar.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onLinkClick: PropTypes.func,
	onToggle: PropTypes.func,
};

Sidebar.defaultProps = {
	onLinkClick: () => { },
	onToggle: () => { },
};

export default Sidebar;
