import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
				<div className="spinner-border" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	// Check if user's role is allowed
	if (allowedRoles && !allowedRoles.includes(user.role)) {
		return <Navigate to="/" replace />;
	}

	return children;
}
