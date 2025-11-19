import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
	const [formData, setFormData] = useState({
		username: '',
		password: '',
	});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { login } = useAuth();

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		setError(''); // Clear error when user types
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			await login(formData.username, formData.password);
			navigate('/'); // Redirect to dashboard after successful login
		} catch (err) {
			const errorMessage = err.response?.data?.error || 'Login failed. Please try again.';
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="login-container">
			<div className="login-card">
				<div className="login-header">
					<img src="/logo.ico" alt="logo" className="login-logo" />
					<h1 className="app-title">Ninja Smart Audio</h1>
					<p>Digital-Out-Of-Home Audio Advertising Platform</p>
				</div>

				<form onSubmit={handleSubmit} className="login-form">
					<h2>Login</h2>

					{error && (
						<div className="alert alert-danger" role="alert">
							{error}
						</div>
					)}

					<div className="form-group">
						<label htmlFor="username">Username or Email</label>
						<input
							type="text"
							id="username"
							name="username"
							className="form-control"
							value={formData.username}
							onChange={handleChange}
							required
							autoFocus
							placeholder="Enter username or email"
							disabled={loading}
						/>
					</div>

					<div className="form-group">
						<label htmlFor="password">Password</label>
						<input
							type="password"
							id="password"
							name="password"
							className="form-control"
							value={formData.password}
							onChange={handleChange}
							required
							placeholder="Enter password"
							disabled={loading}
						/>
					</div>

					<button
						type="submit"
						className="btn btn-primary btn-block"
						disabled={loading}
					>
						{loading ? 'Logging in...' : 'Login'}
					</button>

					<div className="login-info">
						<p><strong>Default Credentials:</strong></p>
						<ul>
							<li><strong>Super Admin:</strong> superadmin@dooh.com / admin123</li>
							<li><strong>Admin:</strong> admin@dooh.com / admin123</li>
						</ul>
					</div>
				</form>
			</div>
		</div>
	);
}
