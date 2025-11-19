import PropTypes from 'prop-types';
import './Header.css';

const Header = ({ onToggleSidebar }) => (
	<header className="header-bar">
		<div className="header-inner">
			<div className="header-left">
				<button type="button" className="icon-button" onClick={onToggleSidebar}>
					☰
				</button>
				<img src="/logo.ico" alt="logo" className="app-logo header-app-logo" />
				<div>
					<h1 className="header-title app-title">Ninja Smart Audio</h1>
					<p className="header-subtitle">Voicing Brands Where Journeys Begin</p>
				</div>
			</div>
		</div>
	</header>
);

Header.propTypes = {
	onToggleSidebar: PropTypes.func.isRequired,
};

export default Header;
