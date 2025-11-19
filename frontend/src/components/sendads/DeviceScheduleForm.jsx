import React, { useState, useEffect } from 'react';
import './DeviceScheduleForm.css';

const DeviceScheduleForm = ({ deviceSchedule, onSave, loading }) => {
	const [formData, setFormData] = useState({
		playbackWindowStart: '00:00:00',
		playbackWindowEnd: '23:59:59',
		isActive: true,
	});

	useEffect(() => {
		if (deviceSchedule) {
			setFormData({
				playbackWindowStart: deviceSchedule.playbackWindowStart || '00:00:00',
				playbackWindowEnd: deviceSchedule.playbackWindowEnd || '23:59:59',
				isActive: deviceSchedule.isActive !== undefined ? deviceSchedule.isActive : true,
			});
		}
	}, [deviceSchedule]);

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
		}));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		onSave(formData);
	};

	return (
		<form className="device-schedule-form compact" onSubmit={handleSubmit}>
			<div className="form-row-compact">
				<div className="form-group-inline">
					<label htmlFor="playbackWindowStart">Start <span className="required">*</span></label>
					<input
						type="time"
						id="playbackWindowStart"
						name="playbackWindowStart"
						value={formData.playbackWindowStart}
						onChange={handleChange}
						step="1"
						required
					/>
				</div>
				<div className="form-group-inline">
					<label htmlFor="playbackWindowEnd">End <span className="required">*</span></label>
					<input
						type="time"
						id="playbackWindowEnd"
						name="playbackWindowEnd"
						value={formData.playbackWindowEnd}
						onChange={handleChange}
						step="1"
						required
					/>
				</div>
				<div className="form-group-inline checkbox-inline">
					<label className="checkbox-label">
						<input
							type="checkbox"
							name="isActive"
							checked={formData.isActive}
							onChange={handleChange}
						/>
						<span>Active</span>
					</label>
				</div>
				<button type="submit" className="btn btn-primary btn-compact" disabled={loading}>
					{loading ? 'Saving...' : deviceSchedule ? 'Update' : 'Create'}
				</button>
			</div>
		</form>
	);
};

export default DeviceScheduleForm;
