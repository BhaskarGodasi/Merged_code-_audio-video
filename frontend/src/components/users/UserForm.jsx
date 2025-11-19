import { useEffect, useState } from 'react';
import { usersApi, brandsApi } from '../../services/api';

const defaultFormState = {
	username: '',
	email: '',
	password: '',
	role: 'client',
	brandId: '',
	isActive: true,
};

export default function UserForm({ onSuccess, brands: initialBrands }) {
	const [form, setForm] = useState(defaultFormState);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [brands, setBrands] = useState(initialBrands || []);

	// Load brands if not provided
	useEffect(() => {
		if (!initialBrands) {
			brandsApi.list().then(setBrands).catch(console.error);
		}
	}, [initialBrands]);

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setForm((prev) => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const payload = {
				username: form.username,
				email: form.email,
				password: form.password,
				role: form.role,
				isActive: form.isActive,
			};

			// Only include brand (brandId) when creating brand users
			if (form.role === 'client' && form.brandId) {
				payload.brandId = parseInt(form.brandId, 10);
			}

			await usersApi.create(payload);
			setForm(defaultFormState);
			if (onSuccess) onSuccess();
		} catch (err) {
			const errorMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to create user';
			setError(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="card">
			<div className="card-header">
				<h3>Create New User</h3>
			</div>
			<div className="card-body">
				{error && (
					<div className="alert alert-danger" role="alert">
						{error}
					</div>
				)}
				<form onSubmit={handleSubmit}>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
						{/* Username */}
						<div className="form-group">
							<label htmlFor="username">
									Username <span className="required">*</span>
								</label>
							<input
								type="text"
								id="username"
								name="username"
								className="form-control"
								value={form.username}
								onChange={handleChange}
								required
								placeholder="Enter username"
								pattern="[a-zA-Z0-9_]+"
								title="Username can only contain letters, numbers, and underscores"
								minLength={3}
								maxLength={50}
							/>
						</div>

						{/* Email */}
						<div className="form-group">
							<label htmlFor="email">
									Email <span className="required">*</span>
								</label>
							<input
								type="email"
								id="email"
								name="email"
								className="form-control"
								value={form.email}
								onChange={handleChange}
								required
								placeholder="user@example.com"
							/>
						</div>

						{/* Password */}
						<div className="form-group">
							<label htmlFor="password">
									Password <span className="required">*</span>
								</label>
							<input
								type="password"
								id="password"
								name="password"
								className="form-control"
								value={form.password}
								onChange={handleChange}
								required
								minLength={6}
								placeholder="Minimum 6 characters"
							/>
						</div>

						{/* Role */}
						<div className="form-group">
							<label htmlFor="role">
									Role <span className="required">*</span>
								</label>
							<select
								id="role"
								name="role"
								className="form-control"
								value={form.role}
								onChange={handleChange}
								required
							>
								<option value="client">Brand User</option>
								<option value="admin">Admin</option>
								<option value="superadmin">Super Admin</option>
							</select>
						</div>

						{/* Brand assignment (only for brand role) */}
						{form.role === 'client' && (
							<div className="form-group">
								<label htmlFor="brandId">
									Brand <span className="required">*</span>
								</label>
								<select
									id="brandId"
									name="brandId"
									className="form-control"
									value={form.brandId}
									onChange={handleChange}
									required
								>
									<option value="">Select a brand</option>
									{brands.map((brand) => (
										<option key={brand.id} value={brand.id}>
											{brand.name}
										</option>
									))}
								</select>
							</div>
						)}

						{/* Active Status */}
						<div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
							<input
								type="checkbox"
								id="isActive"
								name="isActive"
								checked={form.isActive}
								onChange={handleChange}
								style={{ width: 'auto', margin: 0 }}
							/>
							<label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer' }}>
								Active User
							</label>
						</div>
					</div>

					<div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
						<button type="submit" className="btn btn-primary" disabled={loading}>
							{loading ? 'Creating...' : 'Create User'}
						</button>
						<button
							type="button"
							className="btn btn-secondary"
							onClick={() => setForm(defaultFormState)}
						>
							Reset
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
