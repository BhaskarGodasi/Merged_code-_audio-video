import { useState } from 'react';
import PropTypes from 'prop-types';
import { devicesApi } from '../../services/api';

const initialForm = {
	name: '',
	location: '',
	serialNumber: '',
};

const DevicePairing = ({ onCreated }) => {
	const [form, setForm] = useState(initialForm);
	const [submitting, setSubmitting] = useState(false);
	const [lastDevice, setLastDevice] = useState(null);

	const handleChange = (event) => {
		const { name, value } = event.target;
		setForm((current) => ({ ...current, [name]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setSubmitting(true);

		// Client-side validation: require serialNumber
		if (!form.serialNumber || form.serialNumber.trim() === '') {
			alert('Serial Number is required');
			setSubmitting(false);
			return;
		}
		try {
			const device = await devicesApi.create(form);
			setLastDevice(device);
			setForm(initialForm);
			onCreated(device);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form className="form-card" onSubmit={handleSubmit}>
			<h2>Provision Device</h2>
			<div className="form-grid">
				<div className="form-control">
					<label htmlFor="deviceName">Device Name</label>
					<input id="deviceName" name="name" value={form.name} onChange={handleChange} placeholder="Mall Entrance" />
				</div>
				<div className="form-control">
					<label htmlFor="deviceLocation">Location</label>
					<input id="deviceLocation" name="location" value={form.location} onChange={handleChange} placeholder="Ground floor lobby" />
				</div>
				<div className="form-control">
					<label htmlFor="serialNumber">Serial Number</label>
					<input required id="serialNumber" name="serialNumber" value={form.serialNumber} onChange={handleChange} placeholder="Android box serial" />
				</div>
				{/* Notes removed per request - keep form compact */}
			</div>
			<div className="form-actions">
				<button type="submit" className="button-primary" disabled={submitting}>
					{submitting ? 'Creating...' : 'Generate Pairing Code'}
				</button>
			</div>
			{lastDevice && (
				<div className="success-message" style={{ marginTop: 20, textAlign: 'center' }}>
					<h3 style={{ margin: '0 0 12px', color: '#065f46', fontSize: '18px' }}>✓ Device Created Successfully!</h3>
					<p style={{ margin: '0 0 8px', fontSize: '14px' }}>Provide this pairing code to the Android device:</p>
					<p style={{ fontSize: 32, fontWeight: 700, margin: 0, color: '#059669', letterSpacing: '4px' }}>{lastDevice.pairingCode}</p>
				</div>
			)}
		</form>
	);
};

DevicePairing.propTypes = {
	onCreated: PropTypes.func,
};

DevicePairing.defaultProps = {
	onCreated: () => {},
};

export default DevicePairing;
