import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { devicesApi, jinglesApi, deviceSchedulesApi, campaignsApi } from '../services/api';
import './AddToMultipleDevices.css';

const AddToMultipleDevices = () => {
	const navigate = useNavigate();
	const [devices, setDevices] = useState([]);
	const [jingles, setJingles] = useState([]);
	const [campaigns, setCampaigns] = useState([]);
	const [selectedDevices, setSelectedDevices] = useState([]);
	const [addedJingles, setAddedJingles] = useState([]);
	const [currentJingle, setCurrentJingle] = useState({
		campaignId: '',
		jingleId: '',
		startDate: new Date().toISOString().split('T')[0],
		endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
		spots: 1,
		isActive: true,
	});
	const [searchTerm, setSearchTerm] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			setLoading(true);
			const [devicesRes, jinglesRes, campaignsRes] = await Promise.all([
				devicesApi.list(),
				jinglesApi.list(),
				campaignsApi.list(),
			]);
			setDevices(devicesRes);
			setJingles(jinglesRes);
			setCampaigns(campaignsRes);
		} catch (err) {
			setError('Failed to load data. Please try again.');
			console.error('Error fetching data:', err);
		} finally {
			setLoading(false);
		}
	};

	const handleDeviceToggle = (deviceId) => {
		setSelectedDevices((prev) =>
			prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]
		);
		setError(null);
	};

	const handleSelectAll = () => {
		if (selectedDevices.length === filteredDevices.length) {
			setSelectedDevices([]);
		} else {
			setSelectedDevices(filteredDevices.map((d) => d.id));
		}
		setError(null);
	};

	const handleJingleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setCurrentJingle((prev) => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
			// Reset jingleId when campaign changes
			...(name === 'campaignId' && { jingleId: '' }),
		}));
	};

	const handleAddJingle = () => {
		if (!currentJingle.campaignId) {
			setError('Please select a campaign');
			return;
		}

		if (!currentJingle.jingleId) {
			setError('Please select a jingle');
			return;
		}

		const jingle = jingles.find((j) => j.id === parseInt(currentJingle.jingleId, 10));
		const newJingle = {
			...currentJingle,
			jingleId: parseInt(currentJingle.jingleId, 10),
			percentage: parseInt(currentJingle.spots, 10),
			spots: parseInt(currentJingle.spots, 10),
			jingleTitle: jingle?.title,
		};

		setAddedJingles([...addedJingles, newJingle]);
		// Reset form
		setCurrentJingle({
			campaignId: '',
			jingleId: '',
			startDate: new Date().toISOString().split('T')[0],
			endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
			spots: 1,
			isActive: true,
		});
		setError(null);
	};

	const handleRemoveJingle = (index) => {
		setAddedJingles(addedJingles.filter((_, i) => i !== index));
	};

	const handleSubmitAll = async () => {
		setError(null);
		setSuccess(null);

		if (selectedDevices.length === 0) {
			setError('Please select at least one device');
			return;
		}

		if (addedJingles.length === 0) {
			setError('Please add at least one jingle');
			return;
		}

		try {
			setLoading(true);
			await deviceSchedulesApi.addJingleToMultipleDevices({
				deviceIds: selectedDevices,
				jingles: addedJingles,
			});
			setSuccess(`Successfully added ${addedJingles.length} jingle(s) to ${selectedDevices.length} device(s)`);
			// Reset form
			setSelectedDevices([]);
			setAddedJingles([]);
			// Scroll to top to show success message
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} catch (err) {
			const backendMsg = err.response?.data?.message;
			// Map backend validation errors about missing jingle fields to a clearer instruction
			if (typeof backendMsg === 'string' && (
				backendMsg.includes('jingleData') ||
				backendMsg.includes('jingleId') ||
				backendMsg.includes('startDate') ||
				backendMsg.includes('endDate')
			)) {
				setError('Configure the device schedule time first before scheduling ads');
			} else {
				const errorMsg = backendMsg || 'Failed to add jingles to devices';
				setError(errorMsg);
			}
		} finally {
			setLoading(false);
		}
	};

	// Filter jingles based on selected campaign
	const filteredJingles = (() => {
		if (!currentJingle.campaignId) {
			return [];
		}
		const selectedCampaign = campaigns.find(c => c.id === parseInt(currentJingle.campaignId, 10));
		if (!selectedCampaign || !selectedCampaign.jingles) {
			return [];
		}
		return selectedCampaign.jingles;
	})();

	const filteredDevices = devices.filter(
		(device) =>
			device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			device.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			device.location?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const selectedDeviceNames = devices
		.filter((d) => selectedDevices.includes(d.id))
		.map((d) => d.name || d.serialNumber);

	return (
		<div className="add-multiple-page">
			<div className="page-header">
				<div className="header-content">
					<button className="back-button" onClick={() => navigate('/send-ads')}>
						← Back
					</button>
					<h1>Add Jingles to Multiple Devices</h1>
				</div>
			</div>

			{error && (
				<div className="alert alert-error">
					<span className="alert-icon">⚠️</span>
					<span>{error}</span>
				</div>
			)}

			{success && (
				<div className="alert alert-success">
					<span className="alert-icon">✓</span>
					<span>{success}</span>
				</div>
			)}

			<div className="page-layout">
				{/* Left Section - Device Selection */}
				<div className="left-section">
					<div className="section-card">
						<div className="card-header">
							<h2>Select Devices</h2>
							{selectedDevices.length > 0 && (
								<span className="badge-count">{selectedDevices.length} selected</span>
							)}
						</div>

						<div className="search-box">
							<input
								type="text"
								placeholder="Search devices by name, serial, or location..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="search-input"
							/>
						</div>

						<div className="select-all-row">
							<label className="checkbox-label">
								<input
									type="checkbox"
									checked={
										selectedDevices.length === filteredDevices.length &&
										filteredDevices.length > 0
									}
									onChange={handleSelectAll}
								/>
								<span>Select All ({filteredDevices.length} devices)</span>
							</label>
						</div>

						<div className="devices-scroll-area">
							{filteredDevices.length === 0 ? (
								<div className="empty-state">No devices found</div>
							) : (
								filteredDevices.map((device) => (
									<label key={device.id} className="device-card">
										<input
											type="checkbox"
											checked={selectedDevices.includes(device.id)}
											onChange={() => handleDeviceToggle(device.id)}
										/>
										<div className="device-details">
											<div className="device-title">
												{device.name || device.serialNumber}
											</div>
											<div className="device-metadata">
												{device.location && <span>{device.location}</span>}
												<span className={`status-pill ${device.status}`}>
													{device.status}
												</span>
											</div>
										</div>
									</label>
								))
							)}
						</div>
					</div>

					{/* Selected Devices Summary */}
					{selectedDevices.length > 0 && (
						<div className="section-card selected-summary">
							<h3>Adding jingles to:</h3>
							<div className="tags-container">
								{selectedDeviceNames.map((name, index) => (
									<span key={index} className="device-tag">
										{name}
									</span>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Right Section - Jingle Configuration */}
				<div className="right-section">
					<div className="section-card">
						<div className="card-header">
							<h2>Configure Jingles</h2>
						</div>

					{/* Jingle Form */}
					<div className="jingle-config-form">
						<div className="form-grid">
							<div className="form-group">
								<label htmlFor="campaignId">Select Campaign <span className="required">*</span></label>
								<select
									id="campaignId"
									name="campaignId"
									value={currentJingle.campaignId}
									onChange={handleJingleChange}
									className="form-control"
								>
									<option value="">Choose a campaign...</option>
									{campaigns.map((campaign) => (
										<option key={campaign.id} value={campaign.id}>
											{campaign.campaignName}
										</option>
									))}
								</select>
							</div>

							<div className="form-group">
								<label htmlFor="jingleId">Select Jingle <span className="required">*</span></label>
								<select
									id="jingleId"
									name="jingleId"
									value={currentJingle.jingleId}
									onChange={handleJingleChange}
									className="form-control"
									disabled={!currentJingle.campaignId}
								>
									<option value="">{currentJingle.campaignId ? 'Choose a jingle...' : 'Select campaign first'}</option>
									{filteredJingles.map((jingle) => (
										<option key={jingle.id} value={jingle.id}>
											{jingle.title} ({jingle.durationSeconds || 0}s)
										</option>
									))}
								</select>
							</div>

							<div className="form-group">
								<label htmlFor="startDate">Start Date <span className="required">*</span></label>
								<input
									type="date"
									id="startDate"
									name="startDate"
									value={currentJingle.startDate}
									onChange={handleJingleChange}
									className="form-control"
								/>
							</div>

							<div className="form-group">
								<label htmlFor="endDate">End Date <span className="required">*</span></label>
								<input
									type="date"
									id="endDate"
									name="endDate"
									value={currentJingle.endDate}
									onChange={handleJingleChange}
									className="form-control"
								/>
							</div>

							<div className="form-group">
								<label htmlFor="spots">Rotation Spots <span className="required">*</span></label>
								<input
									type="number"
									id="spots"
									name="spots"
									value={currentJingle.spots}
									onChange={handleJingleChange}
									min="1"
									max="100"
									className="form-control"
								/>
							</div>

							<div className="form-group checkbox-group-container">
								<label className="checkbox-label-inline">
									<input
										type="checkbox"
										name="isActive"
										checked={currentJingle.isActive}
										onChange={handleJingleChange}
									/>
									<span>Active</span>
								</label>
							</div>
						</div>

						<div className="form-actions">
							<button
								type="button"
								className="btn btn-add"
									onClick={handleAddJingle}
									disabled={loading}
								>
									+ Add Jingle to Queue
								</button>
							</div>
						</div>
					</div>

					{/* Added Jingles Queue */}
					<div className="section-card jingles-queue">
						<div className="card-header">
							<h2>Jingles Queue</h2>
							<span className="badge-count">{addedJingles.length} jingle(s)</span>
						</div>

						<div className="jingles-scroll-area">
							{addedJingles.length === 0 ? (
								<div className="empty-state">
									No jingles added yet. Configure and add jingles above.
								</div>
							) : (
								addedJingles.map((jingle, index) => (
									<div key={index} className="jingle-queue-item">
										<div className="jingle-content">
											<div className="jingle-name">{jingle.jingleTitle}</div>
											<div className="jingle-specs">
												<span>
													{jingle.startDate} → {jingle.endDate}
												</span>
												<span>•</span>
												<span>Spots: {jingle.spots ?? jingle.percentage}</span>
												<span>•</span>
												<span className={jingle.isActive ? 'active-text' : 'inactive-text'}>
													{jingle.isActive ? 'Active' : 'Inactive'}
												</span>
											</div>
										</div>
										<button
											type="button"
											className="btn-delete"
											onClick={() => handleRemoveJingle(index)}
											disabled={loading}
											title="Remove jingle"
										>
											✕
										</button>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Footer Actions */}
			<div className="page-footer">
				<button
					type="button"
					className="btn btn-secondary"
					onClick={() => navigate('/send-ads')}
					disabled={loading}
				>
					Cancel
				</button>
				<button
					type="button"
					className="btn btn-primary"
					onClick={handleSubmitAll}
					disabled={loading || selectedDevices.length === 0 || addedJingles.length === 0}
				>
					{loading
						? 'Processing...'
						: `Add ${addedJingles.length} Jingle(s) to ${selectedDevices.length} Device(s)`}
				</button>
			</div>
		</div>
	);
};

export default AddToMultipleDevices;
