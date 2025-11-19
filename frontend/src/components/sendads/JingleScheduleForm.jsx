import React, { useState, useMemo } from 'react';
import './JingleScheduleForm.css';

const JingleScheduleForm = ({ jingles, campaigns = [], onSubmit, onCancel, loading }) => {
	const [formData, setFormData] = useState({
		campaignId: '',
		jingleId: '',
		startDate: new Date().toISOString().split('T')[0],
		endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
		spots: 1,
		isActive: true,
	});

	// Filter jingles based on selected campaign
	const filteredJingles = useMemo(() => {
		if (!formData.campaignId) {
			return [];
		}
		const selectedCampaign = campaigns.find(c => c.id === parseInt(formData.campaignId, 10));
		if (!selectedCampaign || !selectedCampaign.jingles) {
			return [];
		}
		// Return jingles that are part of the selected campaign
		return selectedCampaign.jingles;
	}, [formData.campaignId, campaigns]);

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
			// Reset jingleId when campaign changes
			...(name === 'campaignId' && { jingleId: '' }),
		}));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		
		if (!formData.campaignId) {
			alert('Please select a campaign');
			return;
		}

		if (!formData.jingleId) {
			alert('Please select a jingle');
			return;
		}

		onSubmit({
			...formData,
			jingleId: parseInt(formData.jingleId, 10),
			percentage: parseInt(formData.spots, 10), // map spots -> percentage for backend
		});
	};

	return (
		<form className="jingle-schedule-form compact" onSubmit={handleSubmit}>
			<div className="form-grid-compact">
				<div className="form-group-compact">
					<label htmlFor="campaignId">Campaign <span className="required">*</span></label>
					<select
						id="campaignId"
						name="campaignId"
						value={formData.campaignId}
						onChange={handleChange}
						required
					>
						<option value="">Select Campaign...</option>
						{campaigns.map((campaign) => (
							<option key={campaign.id} value={campaign.id}>
								{campaign.campaignName}
							</option>
						))}
					</select>
				</div>

				<div className="form-group-compact">
					<label htmlFor="jingleId">Jingle <span className="required">*</span></label>
					<select
						id="jingleId"
						name="jingleId"
						value={formData.jingleId}
						onChange={handleChange}
						required
						disabled={!formData.campaignId}
					>
						<option value="">{formData.campaignId ? 'Choose...' : 'Select campaign first'}</option>
						{filteredJingles.map((jingle) => (
							<option key={jingle.id} value={jingle.id}>
								{jingle.title} ({jingle.durationSeconds || 0}s)
							</option>
						))}
					</select>
				</div>

				<div className="form-group-compact">
					<label htmlFor="spots">Spots <span className="required">*</span></label>
					<input
						type="number"
						id="spots"
						name="spots"
						value={formData.spots}
						onChange={handleChange}
						min="1"
						max="100"
						required
					/>
				</div>

				<div className="form-group-compact">
					<label htmlFor="startDate">Start Date <span className="required">*</span></label>
					<input
						type="date"
						id="startDate"
						name="startDate"
						value={formData.startDate}
						onChange={handleChange}
						required
					/>
				</div>

				<div className="form-group-compact">
					<label htmlFor="endDate">End Date <span className="required">*</span></label>
					<input
						type="date"
						id="endDate"
						name="endDate"
						value={formData.endDate}
						onChange={handleChange}
						required
					/>
				</div>

				<div className="form-group-compact checkbox-group">
					<label className="checkbox-label-compact">
						<input
							type="checkbox"
							name="isActive"
							checked={formData.isActive}
							onChange={handleChange}
						/>
						<span>Active</span>
					</label>
				</div>

				<div className="form-actions-compact">
					<button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
						{loading ? 'Adding...' : 'Add'}
					</button>
					<button type="button" className="btn btn-secondary btn-sm" onClick={onCancel} disabled={loading}>
						Cancel
					</button>
				</div>
			</div>
		</form>
	);
};

export default JingleScheduleForm;
