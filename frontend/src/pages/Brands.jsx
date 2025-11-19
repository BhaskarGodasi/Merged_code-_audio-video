import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { brandsApi, companiesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './ClientDetails.css';

const defaultForm = {
	name: '',
	contactPerson: '',
	email: '',
	phone: '',
	status: 'active',
	companyId: '',
};


const Brands = () => {
	const { user } = useAuth();
	const [brands, setBrands] = useState([]);
	const [companies, setCompanies] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingBrandId, setEditingBrandId] = useState(null);
	const [formData, setFormData] = useState(defaultForm);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCompanyId, setSelectedCompanyId] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(12);
	const navigate = useNavigate();

	const fetchData = async () => {
		try {
			setLoading(true);
			let brandList = [];
			let companyList = [];
			if (user && user.role === 'client') {
				brandList = await brandsApi.list();
				setBrands(brandList);
				setCompanies([]);
			} else {
				[brandList, companyList] = await Promise.all([
					brandsApi.list(),
					companiesApi.list(),
				]);
				setBrands(brandList);
				setCompanies(companyList);
			}
		} catch (err) {
			console.error('Error fetching brands:', err);
			setError('Failed to load brands');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const resetForm = () => {
		setFormData(defaultForm);
		setEditingBrandId(null);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSubmitting(true);
		setError(null);

		const payload = {
			...formData,
			companyId: formData.companyId ? Number(formData.companyId) : null,
		};

		try {
			if (editingBrandId) {
				await brandsApi.update(editingBrandId, payload);
			} else {
				await brandsApi.create(payload);
			}

			resetForm();
			setShowForm(false);
			fetchData();
		} catch (err) {
			setError(err?.response?.data?.message || (editingBrandId ? 'Failed to update brand' : 'Failed to create brand'));
		} finally {
			setSubmitting(false);
		}
	};

	const handleEdit = (brand) => {
		setFormData({
			name: brand.name || '',
			contactPerson: brand.contactPerson || '',
			email: brand.email || '',
			phone: brand.phone || '',
			status: brand.status || 'active',
			companyId: brand.companyId ? String(brand.companyId) : '',
		});
		setEditingBrandId(brand.id);
		setShowForm(true);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const handleDelete = async (brandId) => {
		if (!window.confirm('Delete this brand? This cannot be undone.')) {
			return;
		}
		try {
			await brandsApi.remove(brandId);
			if (editingBrandId === brandId) {
				resetForm();
				setShowForm(false);
			}
			fetchData();
		} catch (err) {
			setError(err?.response?.data?.message || 'Failed to delete brand');
		}
	};

	const filteredBrands = useMemo(() => {
		const search = searchTerm.toLowerCase();
		return brands.filter((brand) => {
			const matchesSearch =
				brand.name?.toLowerCase().includes(search) ||
				brand.contactPerson?.toLowerCase().includes(search) ||
				brand.email?.toLowerCase().includes(search) ||
				brand.phone?.toLowerCase().includes(search) ||
				brand.status?.toLowerCase().includes(search);

			const matchesCompany = selectedCompanyId ? brand.companyId === Number(selectedCompanyId) : true;

			return matchesSearch && matchesCompany;
		});
	}, [brands, searchTerm, selectedCompanyId]);

	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredBrands.slice(indexOfFirstItem, indexOfLastItem);
	const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);

	const handlePageChange = (page) => {
		setCurrentPage(page);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const handleItemsPerPageChange = (e) => {
		setItemsPerPage(Number(e.target.value));
		setCurrentPage(1);
	};

	if (loading) {
		return <div className="page-container">Loading brands...</div>;
	}

	return (
		<div className="page-container">
			<div className="page-header">
				<h1>Brands</h1>
				<button className="button-primary" onClick={() => setShowForm(!showForm)}>
					{showForm ? 'Cancel' : '+ New Brand'}
				</button>
			</div>

			{error && <div className="error-message">{error}</div>}

			{showForm && (
				<div className="form-card" style={{ marginBottom: '30px' }}>
					<h2>{editingBrandId ? 'Edit Brand' : 'Create New Brand'}</h2>
					<form onSubmit={handleSubmit}>
						<div className="form-grid">
							<div className="form-control">
								<label htmlFor="name">Brand Name <span className="required">*</span></label>
								<input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
							</div>
							<div className="form-control">
								<label htmlFor="companyId">Company <span className="required">*</span></label>
								<select
									id="companyId"
									name="companyId"
									value={formData.companyId}
									onChange={handleInputChange}
									required
								>
									<option value="">Select company</option>
									{companies.map((company) => (
										<option key={company.id} value={company.id}>
											{company.name}
										</option>
									))}
								</select>
							</div>
							<div className="form-control">
								<label htmlFor="contactPerson">Client Contact</label>
								<input id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} />
							</div>
							<div className="form-control">
								<label htmlFor="email">Email</label>
								<input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
							</div>
							<div className="form-control">
								<label htmlFor="phone">Phone</label>
								<input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
							</div>
							<div className="form-control">
								<label htmlFor="status">Status</label>
								<select id="status" name="status" value={formData.status} onChange={handleInputChange}>
									<option value="active">Active</option>
									<option value="inactive">Inactive</option>
								</select>
							</div>
                            
						</div>
						<div className="form-actions">
							<button type="submit" className="button-primary" disabled={submitting}>
								{submitting ? (editingBrandId ? 'Updating...' : 'Creating...') : (editingBrandId ? 'Update Brand' : 'Create Brand')}
							</button>
							{editingBrandId && (
								<button
									type="button"
									className="button-secondary"
									onClick={() => {
										resetForm();
										setShowForm(false);
									}}
								>
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
					placeholder="Search brands by name, ads manager, email, phone, or status..."
					value={searchTerm}
					onChange={(e) => {
						setSearchTerm(e.target.value);
						setCurrentPage(1);
					}}
					style={{
						width: '100%',
						padding: '12px 16px',
						fontSize: '1rem',
						border: '2px solid #e0e0e0',
						borderRadius: '8px',
					}}
				/>
				<select
					value={selectedCompanyId}
					onChange={(e) => {
						setSelectedCompanyId(e.target.value);
						setCurrentPage(1);
					}}
					style={{
						padding: '12px 16px',
						fontSize: '1rem',
						border: '2px solid #e0e0e0',
						borderRadius: '8px',
					}}
				>
					<option value="">All Companies</option>
					{companies.map((company) => (
						<option key={company.id} value={company.id}>
							{company.name}
						</option>
					))}
				</select>
			</div>

			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
				<div style={{ color: '#666', fontSize: '0.95rem' }}>
					Showing {filteredBrands.length === 0 ? 0 : indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredBrands.length)} of {filteredBrands.length} brands
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<label htmlFor="itemsPerPage" style={{ fontSize: '0.95rem', color: '#666' }}>
						Show:
					</label>
					<select
						id="itemsPerPage"
						value={itemsPerPage}
						onChange={handleItemsPerPageChange}
						style={{
							padding: '6px 12px',
							fontSize: '0.95rem',
							border: '2px solid #e0e0e0',
							borderRadius: '6px',
							cursor: 'pointer',
						}}
					>
						<option value={6}>6</option>
						<option value={12}>12</option>
						<option value={24}>24</option>
						<option value={48}>48</option>
					</select>
				</div>
			</div>

			<div className="clients-grid">
				{currentItems.length === 0 ? (
					<div className="empty-state">
						<p>{searchTerm ? 'No brands match your search.' : 'No brands found. Create your first brand to get started.'}</p>
					</div>
				) : (
					currentItems.map((brand) => (
						<div
							key={brand.id}
							className="client-card"
							onClick={() => navigate(`/brands/${brand.id}`)}
						>
							<div className="client-card-header">
								<h3>{brand.name}</h3>
								<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
									{brand.company?.name && (
										<span className="status-badge" style={{ textTransform: 'none', background: '#eef2ff', color: '#4338ca' }}>
											{brand.company.name}
										</span>
									)}
									<button className="client-action-btn" onClick={(e) => { e.stopPropagation(); handleEdit(brand); }} title="Edit brand">
										✏️
									</button>
									<button className="client-action-btn" onClick={(e) => { e.stopPropagation(); handleDelete(brand.id); }} title="Delete brand">
										🗑️
									</button>
									<span className={`status-badge status-${brand.status}`}>
										{brand.status}
									</span>
								</div>
							</div>

							<div className="client-card-body">
								{brand.contactPerson && (
									<div className="client-info-row">
										<span className="info-label">Client Contact:</span>
										<span className="info-value">{brand.contactPerson}</span>
									</div>
								)}
								{brand.email && (
									<div className="client-info-row">
										<span className="info-label">Email:</span>
										<span className="info-value">{brand.email}</span>
									</div>
								)}
								{brand.phone && (
									<div className="client-info-row">
										<span className="info-label">Phone:</span>
										<span className="info-value">{brand.phone}</span>
									</div>
								)}
							</div>

							<div className="client-card-stats">
								<div className="stat-item">
									<div className="stat-value">{brand.totalCampaigns || 0}</div>
									<div className="stat-label">Total Campaigns</div>
								</div>
								<div className="stat-item active">
									<div className="stat-value">{brand.activeCampaigns || 0}</div>
									<div className="stat-label">Active</div>
								</div>
								<div className="stat-item">
									<div className="stat-value">{brand.totalPlays || 0}</div>
									<div className="stat-label">Total Plays</div>
								</div>
							</div>
						</div>
					))
				)}
			</div>

			{filteredBrands.length > itemsPerPage && (
				<div className="pagination" style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
					<button
						onClick={() => handlePageChange(currentPage - 1)}
						disabled={currentPage === 1}
						style={{
							padding: '8px 16px',
							border: '2px solid #e0e0e0',
							borderRadius: '6px',
							background: currentPage === 1 ? '#f5f5f5' : 'white',
							cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
							fontSize: '0.95rem',
						}}
					>
						Previous
					</button>
					{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
						<button
							key={page}
							onClick={() => handlePageChange(page)}
							className={page === currentPage ? 'pagination-active' : ''}
							style={{
								padding: '8px 12px',
								borderRadius: '6px',
								border: page === currentPage ? '2px solid #4caf50' : '2px solid #e0e0e0',
								background: page === currentPage ? '#e8f5e9' : 'white',
							}}
						>
							{page}
						</button>
					))}
					<button
						onClick={() => handlePageChange(currentPage + 1)}
						disabled={currentPage === totalPages}
						style={{
							padding: '8px 16px',
							border: '2px solid #e0e0e0',
							borderRadius: '6px',
							background: currentPage === totalPages ? '#f5f5f5' : 'white',
							cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
							fontSize: '0.95rem',
						}}
					>
						Next
					</button>
				</div>
			)}
		</div>
	);
};

export default Brands;
