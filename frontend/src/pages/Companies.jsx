import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { companiesApi } from '../services/api';
import './ClientDetails.css';

const defaultForm = {
	name: '',
	contactPerson: '',
	email: '',
	phone: '',
	address: '',
	state: '',
	city: '',
	sector: '',
	category: '',
	status: 'active',
};

const Companies = () => {
	const [companies, setCompanies] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [showForm, setShowForm] = useState(false);
	const [editingCompanyId, setEditingCompanyId] = useState(null);
	const [formData, setFormData] = useState(defaultForm);
	const [submitting, setSubmitting] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [expandedCompanyId, setExpandedCompanyId] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		fetchCompanies();
	}, []);

	const fetchCompanies = async () => {
		try {
			setLoading(true);
			const data = await companiesApi.list();
			setCompanies(data);
		} catch (err) {
			console.error('Error fetching companies:', err);
			setError('Failed to load companies');
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (event) => {
		const { name, value } = event.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const resetForm = () => {
		setFormData(defaultForm);
		setEditingCompanyId(null);
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setSubmitting(true);
		setError(null);

		try {
			if (editingCompanyId) {
				await companiesApi.update(editingCompanyId, formData);
			} else {
				await companiesApi.create(formData);
			}

			resetForm();
			setShowForm(false);
			fetchCompanies();
		} catch (err) {
			setError(err?.response?.data?.message || (editingCompanyId ? 'Failed to update company' : 'Failed to create company'));
		} finally {
			setSubmitting(false);
		}
	};

	const handleEdit = (company) => {
		setFormData({
			name: company.name || '',
			contactPerson: company.contactPerson || '',
			email: company.email || '',
			phone: company.phone || '',
			address: company.address || '',
			state: company.state || '',
			city: company.city || '',
			sector: company.sector || '',
			category: company.category || '',
			status: company.status || 'active',
		});
		setEditingCompanyId(company.id);
		setShowForm(true);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const handleDelete = async (companyId) => {
		if (!window.confirm('Delete this company? You must remove or reassign its brands first.')) {
			return;
		}
		try {
			await companiesApi.remove(companyId);
			if (editingCompanyId === companyId) {
				resetForm();
				setShowForm(false);
			}
			if (expandedCompanyId === companyId) {
				setExpandedCompanyId(null);
			}
			fetchCompanies();
		} catch (err) {
			setError(err?.response?.data?.message || 'Failed to delete company');
		}
	};

	const filteredCompanies = useMemo(() => {
		const search = searchTerm.toLowerCase();
		return companies.filter((company) => {
			const matchesSearch =
				company.name?.toLowerCase().includes(search) ||
				company.contactPerson?.toLowerCase().includes(search) ||
				company.email?.toLowerCase().includes(search) ||
				company.phone?.toLowerCase().includes(search) ||
				company.status?.toLowerCase().includes(search);

			const matchesStatus = statusFilter ? company.status === statusFilter : true;

			return matchesSearch && matchesStatus;
		});
	}, [companies, searchTerm, statusFilter]);

	if (loading) {
		return <div className="page-container">Loading companies...</div>;
	}

	return (
		<div className="page-container">
			<div className="page-header">
				<h1>Companies</h1>
				<button className="button-primary" onClick={() => {
					if (showForm) {
						resetForm();
					}
					setShowForm(!showForm);
				}}>
					{showForm ? 'Cancel' : '+ New Company'}
				</button>
			</div>

			{error && <div className="error-message">{error}</div>}

			{showForm && (
				<div className="form-card" style={{ marginBottom: '30px' }}>
					<h2>{editingCompanyId ? 'Edit Company' : 'Create Company'}</h2>
					<form onSubmit={handleSubmit}>
						<div className="form-grid">
							<div className="form-control">
								<label htmlFor="name">Company Name <span className="required">*</span></label>
								<input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
							</div>
						<div className="form-control">
							<label htmlFor="contactPerson">Ads Manager <span className="required">*</span></label>
							<input id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} required />
						</div>
						<div className="form-control">
							<label htmlFor="email">Email <span className="required">*</span></label>
							<input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
						</div>
						<div className="form-control">
							<label htmlFor="phone">Phone <span className="required">*</span></label>
							<input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
						</div>
						<div className="form-control">
							<label htmlFor="state">State <span className="required">*</span></label>
							<input id="state" name="state" value={formData.state} onChange={handleInputChange} required />
						</div>
						<div className="form-control">
							<label htmlFor="city">City <span className="required">*</span></label>
							<input id="city" name="city" value={formData.city} onChange={handleInputChange} required />
						</div>
						<div className="form-control">
							<label htmlFor="sector">Sector <span className="required">*</span></label>
							<select id="sector" name="sector" value={formData.sector} onChange={handleInputChange} required>
								<option value="">Select sector</option>
								<option value="private">Private</option>
								<option value="government">Government</option>
							</select>
						</div>
						<div className="form-control">
							<label htmlFor="category">Category <span className="required">*</span></label>
							<input id="category" name="category" value={formData.category} onChange={handleInputChange} required />
						</div>
						<div className="form-control">
							<label htmlFor="address">Address <span className="required">*</span></label>
							<input id="address" name="address" value={formData.address} onChange={handleInputChange} required />
						</div>
						<div className="form-control">
							<label htmlFor="status">Status <span className="required">*</span></label>
							<select id="status" name="status" value={formData.status} onChange={handleInputChange} required>
								<option value="active">Active</option>
								<option value="inactive">Inactive</option>
							</select>
						</div>
					</div>
						<div className="form-actions">
							<button type="submit" className="button-primary" disabled={submitting}>
								{submitting ? (editingCompanyId ? 'Updating...' : 'Creating...') : (editingCompanyId ? 'Update Company' : 'Create Company')}
							</button>
							{editingCompanyId && (
								<button type="button" className="button-secondary" onClick={() => {
									resetForm();
									setShowForm(false);
								}}>
									Cancel Edit
								</button>
							)}
						</div>
					</form>
				</div>
			)}

			<div className="search-and-filter" style={{ marginBottom: '24px', display: 'grid', gap: '12px', gridTemplateColumns: '2fr 1fr' }}>
				<input
					type="text"
					placeholder="Search companies by name, contact, email, phone, or status..."
					value={searchTerm}
					onChange={(event) => setSearchTerm(event.target.value)}
					style={{
						width: '100%',
						padding: '12px 16px',
						fontSize: '1rem',
						border: '2px solid #e0e0e0',
						borderRadius: '8px',
					}}
				/>
				<select
					value={statusFilter}
					onChange={(event) => setStatusFilter(event.target.value)}
					style={{
						padding: '12px 16px',
						fontSize: '1rem',
						border: '2px solid #e0e0e0',
						borderRadius: '8px',
					}}
				>
					<option value="">All Statuses</option>
					<option value="active">Active</option>
					<option value="inactive">Inactive</option>
				</select>
			</div>

			<div className="clients-grid">
				{filteredCompanies.length === 0 ? (
					<div className="empty-state">
						<p>{searchTerm ? 'No companies match your search.' : 'No companies found. Create your first company to get started.'}</p>
					</div>
				) : (
					filteredCompanies.map((company) => (
						<div key={company.id} className="client-card">
							<div className="client-card-header">
								<h3>{company.name}</h3>
								<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
									<button className="client-action-btn" onClick={() => setExpandedCompanyId(expandedCompanyId === company.id ? null : company.id)} title="Toggle brand list">
										{expandedCompanyId === company.id ? '↓' : '→'}
									</button>
									<button className="client-action-btn" onClick={() => handleEdit(company)} title="Edit company">
										✏️
									</button>
									<button className="client-action-btn" onClick={() => handleDelete(company.id)} title="Delete company">
										🗑️
									</button>
									<span className={`status-badge status-${company.status}`}>
										{company.status}
									</span>
								</div>
							</div>

							<div className="client-card-body">
								{company.contactPerson && (
									<div className="client-info-row">
										<span className="info-label">Ads Manager:</span>
										<span className="info-value">{company.contactPerson}</span>
									</div>
								)}
								{company.email && (
									<div className="client-info-row">
										<span className="info-label">Email:</span>
										<span className="info-value">{company.email}</span>
									</div>
								)}
								{company.phone && (
									<div className="client-info-row">
										<span className="info-label">Phone:</span>
										<span className="info-value">{company.phone}</span>
									</div>
								)}
								{company.sector && (
									<div className="client-info-row">
										<span className="info-label">Sector:</span>
										<span className="info-value">{company.sector}</span>
									</div>
								)}
								{company.category && (
									<div className="client-info-row">
										<span className="info-label">Category:</span>
										<span className="info-value">{company.category}</span>
									</div>
								)}
							</div>

							<div className="client-card-stats">
								<div className="stat-item">
									<div className="stat-value">{company.brands?.length || 0}</div>
									<div className="stat-label">Brands</div>
								</div>
								<div className="stat-item">
									<div className="stat-value">{company.brands?.reduce((sum, brand) => sum + (brand.activeCampaigns || 0), 0)}</div>
									<div className="stat-label">Active Campaigns</div>
								</div>
								<div className="stat-item">
									<div className="stat-value">{company.brands?.reduce((sum, brand) => sum + (brand.totalPlays || 0), 0)}</div>
									<div className="stat-label">Total Plays</div>
								</div>
							</div>

							{expandedCompanyId === company.id && (
								<div style={{ marginTop: '16px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
									<h4 style={{ marginBottom: '12px' }}>Brands under {company.name}</h4>
									{company.brands && company.brands.length > 0 ? (
										<ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
											{company.brands.map((brand) => (
												<li key={brand.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px' }}>
													<div style={{ display: 'flex', flexDirection: 'column' }}>
														<strong>{brand.name}</strong>
														<span style={{ color: '#666', fontSize: '0.9rem' }}>{brand.status === 'active' ? 'Active' : 'Inactive'}</span>
													</div>
													<button className="button-secondary" onClick={() => navigate(`/brands/${brand.id}`)}>
														View Brand
													</button>
												</li>
											))}
										</ul>
									) : (
										<p className="empty-state" style={{ margin: 0 }}>No brands yet.</p>
									)}
								</div>
							)}
						</div>
					))
				)}
			</div>
		</div>
	);
};

export default Companies;
