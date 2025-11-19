import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { devicesApi, jinglesApi, deviceSchedulesApi, campaignsApi } from '../services/api';
import DeviceScheduleForm from '../components/sendads/DeviceScheduleForm';
import JingleScheduleForm from '../components/sendads/JingleScheduleForm';
import ScheduledJinglesList from '../components/sendads/ScheduledJinglesList';
import PlayOrderModal from '../components/sendads/PlayOrderModal';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import './SendAds.css';

const SendAds = () => {
	const navigate = useNavigate();
	const [devices, setDevices] = useState([]);
	const [jingles, setJingles] = useState([]);
	const [campaigns, setCampaigns] = useState([]);
	const [selectedDevice, setSelectedDevice] = useState(null);
	const [deviceSchedule, setDeviceSchedule] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [showJingleForm, setShowJingleForm] = useState(false);
	const [playbackStatus, setPlaybackStatus] = useState({});
	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [showPlayOrderModal, setShowPlayOrderModal] = useState(false);
	const [playOrderData, setPlayOrderData] = useState(null);

	useEffect(() => {
		fetchDevicesAndJingles();
	}, []);

	const fetchDevicesAndJingles = async () => {
		try {
			const [devicesData, jinglesData, campaignsData] = await Promise.all([
				devicesApi.list(),
				jinglesApi.list(),
				campaignsApi.list(),
			]);
			setDevices(devicesData);
			setJingles(jinglesData);
			setCampaigns(campaignsData);
		} catch (err) {
			setError('Failed to load devices and jingles');
			console.error(err);
		}
	};

	const handleDeviceSelect = async (device) => {
		// Clear previous schedule immediately to prevent cross-device contamination
		setDeviceSchedule(null);
		setSelectedDevice(device);
		setLoading(true);
		setError(null);
		
		try {
			const schedule = await deviceSchedulesApi.getByDevice(device.id);
			// Verify the schedule belongs to the selected device before setting state
			if (schedule && schedule.deviceId === device.id) {
				setDeviceSchedule(schedule);
			} else {
				console.warn('Received schedule for different device, ignoring');
				setDeviceSchedule(null);
			}
		} catch (err) {
			// No schedule exists yet, that's okay
			if (err.response?.status === 404) {
				setDeviceSchedule(null);
			} else {
				setError('Configure the device schedule time first before scheduling ads');
				console.error(err);
			}
		} finally {
			setLoading(false);
		}
	};

	const handleScheduleSave = async (scheduleData) => {
		setLoading(true);
		setError(null);

		try {
			const payload = {
				deviceId: selectedDevice.id,
				...scheduleData,
			};
			const updatedSchedule = await deviceSchedulesApi.createOrUpdate(payload);
			// Verify schedule belongs to current device
			if (updatedSchedule && updatedSchedule.deviceId === selectedDevice.id) {
				setDeviceSchedule(updatedSchedule);
			}
			alert('Device schedule saved successfully!');
		} catch (err) {
			setError('Failed to save device schedule');
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const handleAddJingle = async (jingleData) => {
	    if (!deviceSchedule) {
		    setError('Configure the device schedule time first before scheduling ads');
		    return;
	    }

		setLoading(true);
		setError(null);

		try {
			const payload = {
				deviceScheduleId: deviceSchedule.id,
				...jingleData,
			};
			await deviceSchedulesApi.addJingle(payload);
			
			// Reload the schedule - use current selectedDevice to prevent stale reference
			if (selectedDevice && selectedDevice.id) {
				const updatedSchedule = await deviceSchedulesApi.getByDevice(selectedDevice.id);
				// Verify schedule belongs to current device
				if (updatedSchedule && updatedSchedule.deviceId === selectedDevice.id) {
					setDeviceSchedule(updatedSchedule);
				}
			}
			setShowJingleForm(false);
			alert('Jingle added successfully!');
		} catch (err) {
			setError('Failed to add jingle');
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const handleUpdateJingle = async (jingleScheduleId, updates) => {
		setLoading(true);
		setError(null);

		try {
			await deviceSchedulesApi.updateJingle(jingleScheduleId, updates);
			
			// Reload the schedule - use current selectedDevice to prevent stale reference
			if (selectedDevice && selectedDevice.id) {
				const updatedSchedule = await deviceSchedulesApi.getByDevice(selectedDevice.id);
				// Verify schedule belongs to current device
				if (updatedSchedule && updatedSchedule.deviceId === selectedDevice.id) {
					setDeviceSchedule(updatedSchedule);
				}
			}
			alert('Jingle updated successfully!');
		} catch (err) {
			setError('Failed to update jingle');
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const handleRemoveJingle = async (jingleScheduleId) => {
		if (!window.confirm('Are you sure you want to remove this jingle?')) {
			return;
		}

		setLoading(true);
		setError(null);

		try {
			console.log('Removing jingle schedule ID:', jingleScheduleId);
			await deviceSchedulesApi.removeJingle(jingleScheduleId);
			
			// Reload the schedule - use current selectedDevice to prevent stale reference
			if (selectedDevice && selectedDevice.id) {
				const updatedSchedule = await deviceSchedulesApi.getByDevice(selectedDevice.id);
				// Verify schedule belongs to current device
				if (updatedSchedule && updatedSchedule.deviceId === selectedDevice.id) {
					setDeviceSchedule(updatedSchedule);
				}
			}
			alert('Jingle removed successfully!');
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to remove jingle');
			console.error('Delete error:', err);
			console.error('Error response:', err.response);
			alert(`Error: ${err.response?.data?.message || 'Failed to remove jingle'}`);
		} finally {
			setLoading(false);
		}
	};

	const togglePlayback = async (deviceId, action) => {
		try {
			await devicesApi.controlPlayback(deviceId, action);
			setPlaybackStatus(prev => ({ ...prev, [deviceId]: action === 'play' }));
			alert(`Playback ${action === 'play' ? 'resumed' : 'paused'} successfully!`);
		} catch (err) {
			console.error('Playback control error:', err);
			alert(`Failed to ${action} playback`);
		}
	};

	const handleViewPlayOrder = async () => {
		if (!selectedDevice) {
			alert('Please select a device first');
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const playOrder = await deviceSchedulesApi.getPlayOrder(selectedDevice.id);
			setPlayOrderData(playOrder);
			setShowPlayOrderModal(true);
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to load play order');
			console.error('Play order error:', err);
			alert(`Error: ${err.response?.data?.message || 'Failed to load play order'}`);
		} finally {
			setLoading(false);
		}
	};

	// Filter devices based on search term
	const filteredDevices = devices.filter(device => 
		device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		device.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		device.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		device.status?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	// Pagination for devices
	const totalDevices = filteredDevices.length;
	const totalPages = Math.max(1, Math.ceil(totalDevices / itemsPerPage));

	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const pagedDevices = filteredDevices.slice(startIndex, endIndex);

	// Keep currentPage in range when totalPages changes
	useEffect(() => {
		if (currentPage > totalPages) {
			setCurrentPage(1);
		}
	}, [currentPage, totalPages]);

	// Reset to first page when search term changes
	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm]);

	return (
		<div className="send-ads-page">
			<div className="page-header">
				<h1>Send Ads to Devices</h1>
				<p>Configure jingle schedules for individual devices with playback windows and rotation spots</p>
				<div style={{ marginTop: '16px' }}>
					<button
						className="btn btn-primary"
						onClick={() => navigate('/add-to-multiple-devices')}
						style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
					>
						<span style={{ fontSize: '18px' }}>+</span>
						Add to Multiple Devices
					</button>
				</div>
			</div>

			{error && (
				<div className="alert alert-error">
					{error}
				</div>
			)}

			<div className="send-ads-container">
				<div className="device-selector-panel">
					<h2>Select Device</h2>
					<div style={{ marginBottom: '16px' }}>
						<input
							type="text"
							placeholder="Search devices..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							style={{
								width: '100%',
								padding: '10px 12px',
								border: '2px solid #bae6fd',
								borderRadius: '8px',
								fontSize: '14px',
								transition: 'all 0.2s ease'
							}}
						/>
					</div>
					<div className="device-list">
						{pagedDevices.map((device) => (
							<div
								key={device.id}
								className={`device-card ${selectedDevice?.id === device.id ? 'selected' : ''} ${device.status}`}
								onClick={() => handleDeviceSelect(device)}
							>
								<div className="device-name">{device.name || device.serialNumber}</div>
								<div className="device-status">{device.status}</div>
								{device.location && <div className="device-location">{device.location}</div>}
							</div>
						))}
					</div>

					{/* Pagination controls for device list */}
					{totalDevices > itemsPerPage && (
						<div style={{ marginTop: '12px' }}>
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								totalItems={totalDevices}
								itemsPerPage={itemsPerPage}
								onPageChange={(page) => setCurrentPage(Math.max(1, Math.min(totalPages, page)))}
								onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
							/>
						</div>
					)}
				</div>

				<div className="schedule-config-panel">
					{!selectedDevice ? (
						<div className="empty-state">
							<p>Select a device to configure its ad schedule</p>
						</div>
					) : (
						<>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
								<h2 style={{ margin: 0 }}>Configure Schedule for {selectedDevice.name || selectedDevice.serialNumber}</h2>
								<button
									className={playbackStatus[selectedDevice.id] === false ? 'btn-primary' : 'btn-secondary'}
									onClick={() => togglePlayback(selectedDevice.id, playbackStatus[selectedDevice.id] === false ? 'play' : 'pause')}
									style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
								>
									{playbackStatus[selectedDevice.id] === false ? '▶️ Resume Playback' : '⏸️ Pause Playback'}
								</button>
							</div>
							
							<DeviceScheduleForm
								deviceSchedule={deviceSchedule}
								onSave={handleScheduleSave}
								loading={loading}
							/>

							{deviceSchedule && (
								<div className="jingles-section">
									<div className="section-header">
										<h3>Scheduled Jingles</h3>
										<div style={{ display: 'flex', gap: '8px' }}>
											<button
												className="btn btn-secondary"
												onClick={handleViewPlayOrder}
												disabled={loading || !deviceSchedule.jingles || deviceSchedule.jingles.length === 0}
												style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
											>
												<span>👁️</span>
												View Order of Play
											</button>
											<button
												className="btn btn-primary"
												onClick={() => setShowJingleForm(!showJingleForm)}
												disabled={loading}
											>
												{showJingleForm ? 'Cancel' : '+ Add Jingle'}
											</button>
										</div>
									</div>

								{showJingleForm && (
									<JingleScheduleForm
										jingles={jingles}
										campaigns={campaigns}
										onSubmit={handleAddJingle}
										onCancel={() => setShowJingleForm(false)}
										loading={loading}
									/>
								)}									<ScheduledJinglesList
										scheduledJingles={deviceSchedule.jingles || []}
										onUpdate={handleUpdateJingle}
										onRemove={handleRemoveJingle}
										loading={loading}
									/>
								</div>
							)}
						</>
					)}
				</div>
			</div>

			{/* Play Order Modal */}
			{showPlayOrderModal && (
				<PlayOrderModal
					playOrder={playOrderData}
					onClose={() => {
						setShowPlayOrderModal(false);
						setPlayOrderData(null);
					}}
				/>
			)}
		</div>
	);
};

export default SendAds;
