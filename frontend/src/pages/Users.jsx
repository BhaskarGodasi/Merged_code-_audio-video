import { useState, useEffect } from 'react';
import UserForm from '../components/users/UserForm';
import UserList from '../components/users/UserList';
import { usersApi, brandsApi } from '../services/api';

export default function Users() {
	const [users, setUsers] = useState([]);
	const [brands, setBrands] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchData = async () => {
		setLoading(true);
		setError(null);
		try {
			const [usersData, brandsData] = await Promise.all([
				usersApi.list(),
				brandsApi.list()
			]);
			setUsers(usersData);
			setBrands(brandsData);
		} catch (err) {
			console.error('Error fetching data:', err);
			setError('Failed to load users. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	if (loading && users.length === 0) {
		return (
			<div style={{ padding: '20px', textAlign: 'center' }}>
				<div className="spinner-border" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
				<p>Loading users...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div style={{ padding: '20px' }}>
				<div className="alert alert-danger" role="alert">
					{error}
					<button 
						onClick={fetchData} 
						className="btn btn-sm btn-danger" 
						style={{ marginLeft: '10px' }}
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	return (
		<div style={{ padding: '20px' }}>
			<div style={{ marginBottom: '20px' }}>
				<h1>User Management</h1>
				<p style={{ color: '#666', fontSize: '14px' }}>
					Manage system users: Super Admins, Admins, and Brand users. 
					Only Super Admins can manage other admins.
				</p>
			</div>

			<div style={{ marginBottom: '30px' }}>
				<UserForm onSuccess={fetchData} brands={brands} />
			</div>

			<UserList users={users} onUpdate={fetchData} brands={brands} />
		</div>
	);
}
