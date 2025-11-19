import { useEffect, useState } from 'react';
import { usersApi, brandsApi } from '../../services/api';

export default function UserList({ users, onUpdate, brands: initialBrands }) {
	const [editingUser, setEditingUser] = useState(null);
	const [editForm, setEditForm] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [filter, setFilter] = useState('all');
	const [brands, setBrands] = useState(initialBrands || []);

	// Load brands if not provided
	useEffect(() => {
		if (!initialBrands) {
			brandsApi.list().then(setBrands).catch(console.error);
		}
	}, [initialBrands]);

	const startEdit = (user) => {
		setEditingUser(user.id);
		setEditForm({
			username: user.username,
			email: user.email,
			password: '', // Leave empty - only update if provided
			role: user.role,
			brandId: user.brandId || '',
			isActive: user.isActive,
		});
		setError(null);
	};

	const cancelEdit = () => {
		setEditingUser(null);
		setEditForm(null);
		setError(null);
	};

	const handleEditChange = (e) => {
		const { name, value, type, checked } = e.target;
		setEditForm((prev) => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
		}));
	};

	const handleUpdate = async (userId) => {
		setError(null);
		setLoading(true);

		try {
			const payload = {
				username: editForm.username,
				email: editForm.email,
				role: editForm.role,
				isActive: editForm.isActive,
			};

			// Only include password if it's been changed
			if (editForm.password) {
				payload.password = editForm.password;
			}

			// Only include brand (brandId) for brand user role
			if (editForm.role === 'client' && editForm.brandId) {
				payload.brandId = parseInt(editForm.brandId, 10);
			}

			await usersApi.update(userId, payload);
			cancelEdit();
			if (onUpdate) onUpdate();
		} catch (err) {
			const errorMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to update user';
			setError(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (userId, username) => {
		if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) {
			return;
		}

		try {
			await usersApi.remove(userId);
			if (onUpdate) onUpdate();
		} catch (err) {
			const errorMsg = err.response?.data?.error || 'Failed to delete user';
			alert(errorMsg);
		}
	};

	const handleToggleStatus = async (userId) => {
		try {
			await usersApi.toggleStatus(userId);
			if (onUpdate) onUpdate();
		} catch (err) {
			const errorMsg = err.response?.data?.error || 'Failed to toggle user status';
			alert(errorMsg);
		}
	};

	const filteredUsers = users.filter((user) => {
		if (filter === 'all') return true;
		return user.role === filter;
	});

	const getRoleBadgeColor = (role) => {
		switch (role) {
			case 'superadmin':
				return '#dc3545'; // Red
			case 'admin':
				return '#fd7e14'; // Orange
			case 'client':
				return '#0d6efd'; // Blue
			default:
				return '#6c757d'; // Gray
		}
	};

	const formatDate = (dateString) => {
		if (!dateString) return 'Never';
		return new Date(dateString).toLocaleString();
	};

	return (
		<div className="card">
			<div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<h3>User List ({filteredUsers.length})</h3>
				<div style={{ display: 'flex', gap: '10px' }}>
					<label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
						Filter:
						<select
							value={filter}
							onChange={(e) => setFilter(e.target.value)}
							style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #ddd' }}
						>
							<option value="all">All Roles</option>
							<option value="superadmin">Super Admin</option>
							<option value="admin">Admin</option>
							<option value="client">Brand User</option>
						</select>
					</label>
				</div>
			</div>
			<div className="card-body">
				{error && (
					<div className="alert alert-danger" role="alert">
						{error}
					</div>
				)}
				<div style={{ overflowX: 'auto' }}>
					<table className="table">
						<thead>
							<tr>
								<th>#</th>
								<th>Username</th>
								<th>Email</th>
								<th>Role</th>
								<th>Brand</th>
								<th>Status</th>
								<th>Last Login</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
								{filteredUsers.length === 0 ? (
									<tr>
										<td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
											No users found
										</td>
									</tr>
								) : (
									filteredUsers.map((user, idx) => (
										<tr key={user.id}>
											<td style={{ textAlign: 'center', width: '48px' }}>{idx + 1}</td>
											{editingUser === user.id ? (
											<>
												<td>
													<input
														type="text"
														name="username"
														value={editForm.username}
														onChange={handleEditChange}
														className="form-control"
														required
														minLength={3}
														maxLength={50}
													/>
												</td>
												<td>
													<input
														type="email"
														name="email"
														value={editForm.email}
														onChange={handleEditChange}
														className="form-control"
														required
													/>
												</td>
												<td>
													<select
														name="role"
														value={editForm.role}
														onChange={handleEditChange}
														className="form-control"
														required
													>
														<option value="client">Brand User</option>
														<option value="admin">Admin</option>
														<option value="superadmin">Super Admin</option>
													</select>
												</td>
												<td>
													{editForm.role === 'client' ? (
														<select
															name="brandId"
															value={editForm.brandId}
															onChange={handleEditChange}
															className="form-control"
															required
														>
															<option value="">Select brand</option>
															{brands.map((brand) => (
																<option key={brand.id} value={brand.id}>
																	{brand.name}
																</option>
															))}
														</select>
													) : (
														<span style={{ color: '#999' }}>N/A</span>
													)}
												</td>
												<td>
													<input
														type="checkbox"
														name="isActive"
														checked={editForm.isActive}
														onChange={handleEditChange}
													/>
												</td>
												<td colSpan="2">
													<div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
														<button
															onClick={() => handleUpdate(user.id)}
															className="btn btn-sm btn-success"
															disabled={loading}
														>
															{loading ? 'Saving...' : 'Save'}
														</button>
														<button
															onClick={cancelEdit}
															className="btn btn-sm btn-secondary"
															disabled={loading}
														>
															Cancel
														</button>
														<input
															type="password"
															name="password"
															value={editForm.password}
															onChange={handleEditChange}
															placeholder="New password (optional)"
															className="form-control"
															style={{ width: '200px' }}
															minLength={6}
														/>
													</div>
												</td>
											</>
										) : (
											<>
												<td>
													<strong>{user.username}</strong>
												</td>
												<td>{user.email}</td>
												<td>
													<span
														style={{
															padding: '4px 8px',
															borderRadius: '4px',
															backgroundColor: getRoleBadgeColor(user.role),
															color: 'white',
															fontSize: '12px',
															fontWeight: 'bold',
														}}
													>
														{user.role.toUpperCase()}
													</span>
												</td>
												<td>
													{user.client ? (
														<span>
															{user.client.name}
															<br />
															<small style={{ color: '#666' }}>{user.client.contactPerson}</small>
														</span>
													) : (
														<span style={{ color: '#999' }}>—</span>
													)}
												</td>
												<td>
													<span
														style={{
															padding: '4px 8px',
															borderRadius: '4px',
															backgroundColor: user.isActive ? '#28a745' : '#6c757d',
															color: 'white',
															fontSize: '12px',
															cursor: 'pointer',
														}}
														onClick={() => handleToggleStatus(user.id)}
														title="Click to toggle status"
													>
														{user.isActive ? 'ACTIVE' : 'INACTIVE'}
													</span>
												</td>
												<td>
													<small>{formatDate(user.lastLogin)}</small>
												</td>
												<td>
													<div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
														<button
															onClick={() => startEdit(user)}
															className="btn btn-sm btn-primary"
														>
															Edit
														</button>
														<button
															onClick={() => handleDelete(user.id, user.username)}
															className="btn btn-sm btn-danger"
														>
															Delete
														</button>
													</div>
												</td>
											</>
										)}
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
