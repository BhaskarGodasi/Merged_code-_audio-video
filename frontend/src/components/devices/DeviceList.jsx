import { useState } from 'react';
import PropTypes from 'prop-types';
import { devicesApi } from '../../services/api';
import { formatDateTime, statusBadgeClass } from '../../utils/helpers';
import Pagination from '../common/Pagination';

const DeviceList = ({ devices, onRefresh }) => {
	const [editingId, setEditingId] = useState(null);
	const [editForm, setEditForm] = useState({});
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [repairModal, setRepairModal] = useState({ show: false, device: null, step: 'confirm' });
	const [newPairingCode, setNewPairingCode] = useState('');

	// Pagination logic
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = devices.slice(indexOfFirstItem, indexOfLastItem);
	const totalPages = Math.ceil(devices.length / itemsPerPage);

	const handlePageChange = (page) => {
		setCurrentPage(page);
	};

	const handleItemsPerPageChange = (newItemsPerPage) => {
		setItemsPerPage(newItemsPerPage);
		setCurrentPage(1);
	};

	const handleDelete = async (id) => {
		const shouldDelete = window.confirm('Delete this device? This cannot be undone.');
		if (!shouldDelete) {
			return;
		}
		await devicesApi.remove(id);
		onRefresh();
	};

	const startEdit = (device) => {
		setEditingId(device.id);
		setEditForm({
			name: device.name || '',
			location: device.location || '',
			status: device.status || 'offline',
			volumeLevel: device.volumeLevel || 80,
			notes: device.notes || '',
		});
	};

	const cancelEdit = () => {
		setEditingId(null);
		setEditForm({});
	};

	const handleUpdate = async (id) => {
		await devicesApi.update(id, editForm);
		setEditingId(null);
		onRefresh();
	};

	const handleRepair = async (device) => {
		setRepairModal({ show: true, device, step: 'confirm' });
	};

	const confirmRepair = async () => {
		const device = repairModal.device;
		try {
			const result = await devicesApi.repair(device.id);
			setNewPairingCode(result.device.pairingCode);
			setRepairModal({ show: true, device, step: 'success' });
			onRefresh();
		} catch (error) {
			setRepairModal({ show: true, device, step: 'error', error: error.message });
		}
	};

	const closeRepairModal = () => {
		setRepairModal({ show: false, device: null, step: 'confirm' });
		setNewPairingCode('');
	};

	if (!devices.length) {
		return <p className="muted">No devices registered yet.</p>;
	}

	return (
		<>
			{repairModal.show && (
				<div className="modal-overlay" onClick={closeRepairModal}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						{repairModal.step === 'confirm' && (
							<>
								<h3>Re-pair Device</h3>
								<p style={{ marginBottom: '16px' }}>
									Unpair device <strong>{repairModal.device?.name || repairModal.device?.serialNumber}</strong>?
								</p>
								<div style={{ background: '#fff3cd', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
									<p style={{ margin: '0 0 12px 0', fontWeight: '600', color: '#856404' }}>This will:</p>
									<ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
										<li>Disconnect the device immediately</li>
										<li>Generate a new pairing code</li>
										<li>Reset the device status to offline</li>
										<li>Require re-pairing with the new code</li>
									</ul>
								</div>
								<div style={{ display: 'flex', gap: '12px' }}>
									<button type="button" className="button-warning" onClick={confirmRepair}>
										Yes, Re-pair Device
									</button>
									<button type="button" className="button-secondary" onClick={closeRepairModal}>
										Cancel
									</button>
								</div>
							</>
						)}
						{repairModal.step === 'success' && (
							<>
								<h3>✓ Device Unpaired Successfully</h3>
								<p style={{ marginBottom: '16px' }}>
									The device has been unpaired. Use the new pairing code below to reconnect:
								</p>
								<div style={{ 
									background: '#d1ecf1', 
									padding: '20px', 
									borderRadius: '8px', 
									marginBottom: '20px',
									textAlign: 'center'
								}}>
									<p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#0c5460', fontWeight: '600' }}>
										New Pairing Code
									</p>
									<p style={{ 
										margin: 0, 
										fontSize: '32px', 
										fontWeight: 'bold', 
										color: '#0c5460',
										letterSpacing: '4px',
										fontFamily: 'monospace'
									}}>
										{newPairingCode}
									</p>
								</div>
								<button type="button" className="button-primary" onClick={closeRepairModal}>
									Close
								</button>
							</>
						)}
						{repairModal.step === 'error' && (
							<>
								<h3>Error</h3>
								<p style={{ marginBottom: '20px', color: '#dc3545' }}>
									Failed to unpair device: {repairModal.error}
								</p>
								<button type="button" className="button-secondary" onClick={closeRepairModal}>
									Close
								</button>
							</>
						)}
					</div>
				</div>
			)}
			{editingId && (
				<div className="modal-overlay" onClick={cancelEdit}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<h3>Edit Device</h3>
						<div className="form-grid">
							<div className="form-group">
								<label>Device Name</label>
								<input
									type="text"
									value={editForm.name}
									onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
								/>
							</div>
							<div className="form-group">
								<label>Location</label>
								<input
									type="text"
									value={editForm.location}
									onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
								/>
							</div>
							<div className="form-group">
								<label>Status</label>
								<select
									value={editForm.status}
									onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
								>
									<option value="offline">Offline</option>
									<option value="online">Online</option>
									<option value="error">Error</option>
									<option value="maintenance">Maintenance</option>
								</select>
							</div>
							<div className="form-group">
								<label>Volume Level ({editForm.volumeLevel}%)</label>
								<input
									type="range"
									min="0"
									max="100"
									value={editForm.volumeLevel}
									onChange={(e) => setEditForm({ ...editForm, volumeLevel: Number(e.target.value) })}
								/>
							</div>
							<div className="form-group" style={{ gridColumn: '1 / -1' }}>
								<label>Notes</label>
								<textarea
									value={editForm.notes}
									onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
									rows="3"
								/>
							</div>
						</div>
						<div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
							<button type="button" className="button-primary" onClick={() => handleUpdate(editingId)}>
								Save Changes
							</button>
							<button type="button" className="button-secondary" onClick={cancelEdit}>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
			<div className="table-wrapper">
				<table>
					<thead>
						<tr>
							<th>#</th>
							<th>Device</th>
							<th>Status</th>
							<th>Pairing</th>
							<th>Last Seen</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{currentItems.map((device, idx) => {
							const serial = indexOfFirstItem + idx + 1;
							const lastSeen = device.lastSeenAt ? formatDateTime(device.lastSeenAt) : '—';
							return (
								<tr key={device.id}>
									<td style={{ width: '48px', textAlign: 'center' }}>{serial}</td>
									<td className="stacked">
										<span>{device.name || 'Unnamed device'}</span>
										<span className="muted">Serial: {device.serialNumber}</span>
										{device.location && <span className="muted">Location: {device.location}</span>}
									</td>
									<td>
										<span className={statusBadgeClass(device.status)}>{device.status}</span>
									</td>
									<td className="stacked">
										<span>Code: {device.pairingCode}</span>
										<span className="muted">Paired: {device.isPaired ? 'Yes' : 'No'}</span>
									</td>
									<td>{lastSeen}</td>
									<td>
										<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
											<button type="button" className="button-primary" onClick={() => startEdit(device)}>
												Edit
											</button>
											<button 
												type="button" 
												className="button-warning" 
												onClick={() => handleRepair(device)}
											>
												Re-pair
											</button>
											<button type="button" className="button-secondary" onClick={() => handleDelete(device.id)}>
												Delete
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
				{devices.length > 0 && (
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalItems={devices.length}
						itemsPerPage={itemsPerPage}
						onPageChange={handlePageChange}
						onItemsPerPageChange={handleItemsPerPageChange}
					/>
				)}
			</div>
		</>
	);
};

DeviceList.propTypes = {
	devices: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.number,
		}),
	),
	onRefresh: PropTypes.func,
};

DeviceList.defaultProps = {
	devices: [],
	onRefresh: () => {},
};

export default DeviceList;
