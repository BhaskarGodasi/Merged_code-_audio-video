import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './MultiDeviceJingleForm.css';

const MultiDeviceJingleForm = ({ devices, jingles, onSubmit, onCancel, loading }) => {
	const [selectedDevices, setSelectedDevices] = useState([]);
	const [addedJingles, setAddedJingles] = useState([]);
	const [currentJingle, setCurrentJingle] = useState({
		jingleId: '',
		startDate: new Date().toISOString().split('T')[0],
		endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
		spots: 1,
		isActive: true,
	});
	const [searchTerm, setSearchTerm] = useState('');
	const [error, setError] = useState(null);

	const handleDeviceToggle = (deviceId) => {
		setSelectedDevices((prev) =>
			prev.includes(deviceId)
				? prev.filter((id) => id !== deviceId)
				: [...prev, deviceId]
		);
		setError(null); // Clear error when selection changes
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
		}));
	};

	const handleAddJingle = () => {
		if (!currentJingle.jingleId) {
			setError('Please select a jingle');
			return;
		}

		const jingle = jingles.find((j) => j.id === parseInt(currentJingle.jingleId, 10));
		const newJingle = {
			...currentJingle,
			jingleId: parseInt(currentJingle.jingleId, 10),
			percentage: parseInt(currentJingle.spots, 10), // map spots -> percentage for storage
			spots: parseInt(currentJingle.spots, 10),
			jingleTitle: jingle?.title,
		};

		setAddedJingles([...addedJingles, newJingle]);
		// Reset form
		setCurrentJingle({
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

		if (selectedDevices.length === 0) {
			setError('Please select at least one device');
			return;
		}

		if (addedJingles.length === 0) {
			setError('Please add at least one jingle');
			return;
		}

		try {
			// Submit each jingle to the selected devices
			await onSubmit({
				deviceIds: selectedDevices,
				jingles: addedJingles,
			});
		} catch (err) {
			const errorMsg = err.response?.data?.message || 'Failed to add jingles to devices';
			setError(errorMsg);
		}
	};

	// Filter devices based on search
	const filteredDevices = devices.filter(
		(device) =>
			device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			device.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			device.location?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	// Get selected device names
	const selectedDeviceNames = devices
		.filter((d) => selectedDevices.includes(d.id))
		.map((d) => d.name || d.serialNumber);

	return (
		<div className="multi-device-container">
			{error && (
				<div className="error-banner">
					<span className="error-icon">⚠️</span>
					<span>{error}</span>
				</div>
			)}

			<div className="multi-device-layout">
				{/* Left Panel - Device Selection */}
				<div className="device-panel">
					<div className="panel-header">
						<h3>Select Devices</h3>
						{selectedDevices.length > 0 && (
							<span className="selected-count">{selectedDevices.length} selected</span>
						)}
					</div>

					<div className="device-search">
						<input
							type="text"
							placeholder="Search devices..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="search-input"
						/>
					</div>

					<div className="select-all-container">
						<label className="checkbox-label">
							<input
								type="checkbox"
								checked={selectedDevices.length === filteredDevices.length && filteredDevices.length > 0}
								onChange={handleSelectAll}
							/>
							<span>Select All</span>
						</label>
					</div>

					<div className="device-list-scroll">
						{filteredDevices.length === 0 ? (
							<div className="no-devices">No devices found</div>
						) : (
							filteredDevices.map((device) => (
								<label key={device.id} className="device-item">
									<input
										type="checkbox"
										checked={selectedDevices.includes(device.id)}
										onChange={() => handleDeviceToggle(device.id)}
									/>
									<div className="device-info">
										<div className="device-name">{device.name || device.serialNumber}</div>
										<div className="device-meta">
											{device.location && <span>{device.location}</span>}
											<span className={`status-badge ${device.status}`}>{device.status}</span>
										</div>
									</div>
								</label>
							))
						)}
					</div>

					{/* Show selected devices */}
					{selectedDevices.length > 0 && (
						<div className="selected-devices-info">
							<strong>Adding to:</strong>
							<div className="device-tags">
								{selectedDeviceNames.map((name, index) => (
									<span key={index} className="device-tag">
										{name}
									</span>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Right Panel - Jingle Configuration */}
				<div className="jingle-panel">
					<div className="panel-header">
						<h3>Add Jingles</h3>
					</div>

					{/* Jingle Form */}
					<div className="jingle-form">
						<div className="form-row">
							<div className="form-field">
								<label htmlFor="jingleId">Jingle <span className="required">*</span></label>
								<select
									id="jingleId"
									name="jingleId"
									value={currentJingle.jingleId}
									onChange={handleJingleChange}
								>
									<option value="">Choose a jingle...</option>
									{jingles.map((jingle) => (
										<option key={jingle.id} value={jingle.id}>
											{jingle.title} ({jingle.durationSeconds || 0}s)
										</option>
									))}
								</select>
							</div>

							<div className="form-field">
								<label htmlFor="spots">Rotation Spots <span className="required">*</span></label>
								<input
									type="number"
									id="spots"
									name="spots"
									value={currentJingle.spots}
									onChange={handleJingleChange}
									min="1"
									max="100"
								/>
							</div>
						</div>

						<div className="form-row">
							<div className="form-field">
								<label htmlFor="startDate">Start Date <span className="required">*</span></label>
								<input
									type="date"
									id="startDate"
									name="startDate"
									value={currentJingle.startDate}
									onChange={handleJingleChange}
								/>
							</div>

							<div className="form-field">
								<label htmlFor="endDate">End Date <span className="required">*</span></label>
								<input
									type="date"
									id="endDate"
									name="endDate"
									value={currentJingle.endDate}
									onChange={handleJingleChange}
								/>
							</div>
						</div>

						<div className="form-row">
							<div className="form-field checkbox-field">
								<label className="checkbox-label">
									<input
										type="checkbox"
										name="isActive"
										checked={currentJingle.isActive}
										onChange={handleJingleChange}
									/>
									<span>Active</span>
								</label>
							</div>

							<div className="form-field">
								<button
									type="button"
									className="btn-add-jingle"
									onClick={handleAddJingle}
									disabled={loading}
								>
									+ Add Jingle
								</button>
							</div>
						</div>
					</div>

					{/* Added Jingles List */}
					{addedJingles.length > 0 && (
						<div className="added-jingles">
							<h4>Jingles to Add ({addedJingles.length})</h4>
							<div className="jingles-list">
								{addedJingles.map((jingle, index) => (
									<div key={index} className="jingle-item">
										<div className="jingle-details">
											<div className="jingle-title">{jingle.jingleTitle}</div>
											<div className="jingle-info">
												{jingle.startDate} to {jingle.endDate} • Spots: {jingle.spots ?? jingle.percentage}% • 
												{jingle.isActive ? ' Active' : ' Inactive'}
											</div>
										</div>
										<button
											type="button"
											className="btn-remove"
											onClick={() => handleRemoveJingle(index)}
											disabled={loading}
										>
											✕
										</button>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Footer Actions */}
			<div className="modal-footer">
				<button type="button" className="btn-cancel" onClick={onCancel} disabled={loading}>
					Cancel
				</button>
				<button type="button" className="btn-submit" onClick={handleSubmitAll} disabled={loading}>
					{loading ? 'Adding...' : `Add ${addedJingles.length} Jingle(s) to ${selectedDevices.length} Device(s)`}
				</button>
			</div>
		</div>
	);
};

MultiDeviceJingleForm.propTypes = {
	devices: PropTypes.array.isRequired,
	jingles: PropTypes.array.isRequired,
	onSubmit: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired,
	loading: PropTypes.bool,
};

MultiDeviceJingleForm.defaultProps = {
	loading: false,
};

export default MultiDeviceJingleForm;
