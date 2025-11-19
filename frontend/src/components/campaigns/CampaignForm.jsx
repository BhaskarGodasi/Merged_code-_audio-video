import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { campaignsApi, brandsApi } from '../../services/api';

const defaultFormState = {
	brandId: '',
	companyName: '',
	contactPerson: '',
	campaignName: '',
	email: '',
	phone: '',
	startDate: '',
	endDate: '',
	jingleIds: [],
	selectedJingleId: '',
	state: '',
	language: '',
};

const CampaignForm = ({ jingles, onCreated }) => {
	const [form, setForm] = useState(defaultFormState);
	const [brands, setBrands] = useState([]);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [validationErrors, setValidationErrors] = useState([]);

	useEffect(() => {
		fetchBrands();
	}, []);

	const fetchBrands = async () => {
		try {
			const data = await brandsApi.list();
			setBrands(data.filter((brand) => brand.status === 'active'));
		} catch (err) {
			console.error('Error fetching brands:', err);
		}
	};

	const handleChange = (event) => {
		const { name, value } = event.target;
		// If brand (brandId) changed, auto-populate company name from selected brand
		if (name === 'brandId') {
			const brandId = value ? Number(value) : '';
			const selected = brands.find(b => b.id === brandId);
			const companyName = selected?.company?.name || '';
			const state = selected?.company?.state || '';
			setForm((current) => ({ ...current, brandId: value, companyName, state }));
			return;
		}
		setForm((current) => ({ ...current, [name]: value }));
	};

	const handleAddJingle = () => {
		if (!form.selectedJingleId) return;
		const jingleId = Number(form.selectedJingleId);
		if (!form.jingleIds.includes(jingleId)) {
			setForm((current) => ({
				...current,
				jingleIds: [...current.jingleIds, jingleId],
				selectedJingleId: '',
			}));
		}
	};

	const handleRemoveJingle = (jingleId) => {
		setForm((current) => ({
			...current,
			jingleIds: current.jingleIds.filter((id) => id !== jingleId),
		}));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		// Check if at least one jingle is selected
		if (!form.jingleIds || form.jingleIds.length === 0) {
			setError('Please select at least one jingle to attach to the campaign');
			setValidationErrors([]);
			return;
		}

		setSubmitting(true);
		setError(null);
		setValidationErrors([]);
		try {
			const payload = {
				...form,
				brandId: form.brandId ? Number(form.brandId) : null,
				state: form.state || null,
				jingleIds: form.jingleIds.map(id => Number(id)),
			};
			const created = await campaignsApi.create(payload);
			setForm(defaultFormState);
			onCreated(created);
		} catch (apiError) {
			// Check if there are validation details
			const details = apiError?.response?.data?.details;
			if (details && Array.isArray(details) && details.length > 0) {
				// Store validation errors for display
				setValidationErrors(details);
				setError('Please fix the following validation errors:');
			} else {
				setError(apiError?.response?.data?.message || 'Failed to create campaign');
			}
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form className="form-card" onSubmit={handleSubmit}>
			<h2>Create Campaign</h2>
			{error && (
				<div className="error-message">
					{error}
					{validationErrors.length > 0 && (
						<ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
							{validationErrors.map((err, index) => (
								<li key={index}>
									<strong>{err.path || err.param}:</strong> {err.msg}
								</li>
							))}
						</ul>
					)}
				</div>
			)}
			<div className="form-grid">
				{/* Row 1: Brand selection */}
				<div className="form-control">
					<label htmlFor="brandId">Brand <span className="required">*</span></label>
					<select id="brandId" name="brandId" value={form.brandId} onChange={handleChange} required>
						<option value="">Select brand</option>
						{brands.map((brand) => (
							<option key={brand.id} value={brand.id}>
								{brand.name}
							</option>
						))}
					</select>
				</div>
				<div className="form-control">
					<label htmlFor="companyName">Company <span className="required">*</span></label>
					<input id="companyName" name="companyName" value={form.companyName} onChange={handleChange} readOnly />
				</div>

				{/* Row 2: Campaign Name and Ad Manager */}
				<div className="form-control">
					<label htmlFor="campaignName">Campaign Name <span className="required">*</span></label>
					<input id="campaignName" name="campaignName" value={form.campaignName} onChange={handleChange} required />
				</div>
				<div className="form-control">
					<label htmlFor="contactPerson">Ads Manager <span className="required">*</span></label>
					<input id="contactPerson" name="contactPerson" value={form.contactPerson} onChange={handleChange} required />
				</div>

				{/* Row 3: Email and Phone */}
				<div className="form-control">
					<label htmlFor="email">Email <span className="required">*</span></label>
					<input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
				</div>
				<div className="form-control">
					<label htmlFor="phone">Phone <span className="required">*</span></label>
					<input id="phone" name="phone" value={form.phone} onChange={handleChange} required />
				</div>

					<div className="form-control">
						<label htmlFor="state">State <span className="required">*</span></label>
						<input id="state" name="state" value={form.state} onChange={handleChange} required />
					</div>

					<div className="form-control">
						<label htmlFor="language">Language <span className="required">*</span></label>
						<input id="language" name="language" value={form.language} onChange={handleChange} required />
					</div>

				{/* Row 4: Start Date and End Date */}
				<div className="form-control">
					<label htmlFor="startDate">Start Date <span className="required">*</span></label>
					<input id="startDate" name="startDate" type="date" value={form.startDate} onChange={handleChange} required />
				</div>
				<div className="form-control">
					<label htmlFor="endDate">End Date <span className="required">*</span></label>
					<input id="endDate" name="endDate" type="date" value={form.endDate} onChange={handleChange} required />
				</div>

				{/* Row 5: Select Jingles (full width) */}
				<div className="form-control" style={{ gridColumn: '1 / -1' }}>
					<label htmlFor="selectedJingleId">Select Jingles <span className="required">*</span></label>
					<div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
						<select 
							id="selectedJingleId" 
							name="selectedJingleId" 
							value={form.selectedJingleId} 
							onChange={handleChange}
							style={{ flex: 1 }}
						>
							<option value="">Choose a jingle to add</option>
							{jingles.filter(j => !form.jingleIds.includes(j.id)).map((jingle) => (
								<option key={jingle.id} value={jingle.id}>
									{jingle.title}
								</option>
							))}
						</select>
						<button
							type="button"
							className="button-primary"
							onClick={handleAddJingle}
							disabled={!form.selectedJingleId}
							style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
						>
							+ Add
						</button>
					</div>
					{form.jingleIds.length > 0 && (
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
							{form.jingleIds.map((jingleId) => {
								const jingle = jingles.find(j => j.id === jingleId);
								return jingle ? (
									<div
										key={jingleId}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											padding: '6px 12px',
											backgroundColor: '#0284c7',
											color: '#fff',
											borderRadius: '6px',
											fontSize: '14px',
										}}
									>
										<span>{jingle.title}</span>
										<button
											type="button"
											onClick={() => handleRemoveJingle(jingleId)}
											style={{
												background: 'none',
												border: 'none',
												color: '#fff',
												cursor: 'pointer',
												fontSize: '16px',
												padding: '0 4px',
												lineHeight: 1,
											}}
											title="Remove jingle"
										>
											×
										</button>
									</div>
								) : null;
							})}
						</div>
					)}
				</div>
			</div>
			<div className="form-actions">
				<button type="submit" className="button-primary" disabled={submitting}>
					{submitting ? 'Saving...' : 'Create Campaign'}
				</button>
			</div>
		</form>
	);
};

CampaignForm.propTypes = {
	jingles: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.number,
			title: PropTypes.string,
		}),
	).isRequired,
	onCreated: PropTypes.func,
};

CampaignForm.defaultProps = {
	onCreated: () => {},
};

export default CampaignForm;
