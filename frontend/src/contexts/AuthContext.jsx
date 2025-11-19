import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { http } from '../services/api';
import { useIdleTimer } from '../hooks/useIdleTimer';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within AuthProvider');
	}
	return context;
};

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(localStorage.getItem('token'));
	const [loading, setLoading] = useState(true);

	// Logout function (defined early for use in idle timer)
	const logout = useCallback(() => {
		setToken(null);
		setUser(null);
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		localStorage.removeItem('tokenExpiry');
	}, []);

	// Auto-logout on inactivity (30 minutes)
	useIdleTimer(
		() => {
			if (token && user) {
				console.log('[Auth] Auto-logout triggered due to inactivity');
				logout();
				// Optionally show a toast notification
				window.dispatchEvent(new CustomEvent('auth:idle-logout', { 
					detail: { message: 'You have been logged out due to inactivity' }
				}));
			}
		},
		30 * 60 * 1000, // 30 minutes
		{
			enabled: !!token && !!user, // Only enable when authenticated
			crossTab: true
		}
	);

	// Check token expiration periodically
	useEffect(() => {
		if (!token || !user) return;

		const checkTokenExpiration = () => {
			const tokenExpiry = localStorage.getItem('tokenExpiry');
			if (tokenExpiry) {
				const expiryTime = parseInt(tokenExpiry, 10);
				const now = Date.now();
				
				// Logout if token expired
				if (now >= expiryTime) {
					console.log('[Auth] Token expired, logging out');
					logout();
					window.dispatchEvent(new CustomEvent('auth:token-expired', { 
						detail: { message: 'Your session has expired. Please login again.' }
					}));
				}
			}
		};

		// Check immediately
		checkTokenExpiration();

		// Check every minute
		const interval = setInterval(checkTokenExpiration, 60 * 1000);

		return () => clearInterval(interval);
	}, [token, user, logout]);

	// Initialize auth state from localStorage
	useEffect(() => {
		const initAuth = async () => {
			const storedToken = localStorage.getItem('token');
			const storedUser = localStorage.getItem('user');

			if (storedToken && storedUser) {
				try {
					// set Authorization header immediately so verification request includes it
					http.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
					setToken(storedToken);
					setUser(JSON.parse(storedUser));
					// Verify token is still valid by fetching current user
					const response = await http.get('/auth/me');
					setUser(response.data);
					localStorage.setItem('user', JSON.stringify(response.data));
				} catch (error) {
					// Token invalid or expired, clear auth state
					console.error('Token validation failed:', error);
					logout();
				}
			}
			setLoading(false);
		};

		initAuth();
	}, [logout]);

	// Update axios default headers when token changes
	useEffect(() => {
		if (token) {
			http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
		} else {
			delete http.defaults.headers.common['Authorization'];
		}
	}, [token]);

	const login = async (username, password) => {
		const response = await http.post('/auth/login', { username, password });
		const { token: newToken, user: userData } = response.data;

		setToken(newToken);
		setUser(userData);

		localStorage.setItem('token', newToken);
		localStorage.setItem('user', JSON.stringify(userData));

		// Store token expiry (default 7 days from now if not specified)
		// Backend JWT_EXPIRES_IN is '7d' by default
		const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
		localStorage.setItem('tokenExpiry', expiryTime.toString());

		return userData;
	};

	const hasRole = (...roles) => {
		return user && roles.includes(user.role);
	};

	const isClient = () => user?.role === 'client';
	const isAdmin = () => user?.role === 'admin';
	const isSuperAdmin = () => user?.role === 'superadmin';

	const value = {
		user,
		token,
		loading,
		login,
		logout,
		hasRole,
		isClient,
		isAdmin,
		isSuperAdmin,
		isAuthenticated: !!token && !!user,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
