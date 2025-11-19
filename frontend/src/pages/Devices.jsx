import { useEffect, useState } from 'react';
import Modal from '../components/common/Modal';
import DevicePairing from '../components/devices/DevicePairing';
import DeviceList from '../components/devices/DeviceList';
import DeviceMap from '../components/devices/DeviceMap';
import { devicesApi } from '../services/api';

const Devices = () => {
	const [devices, setDevices] = useState([]);
	const [showMap, setShowMap] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');

	const loadData = async () => {
		try {
			setLoading(true);
			setError(null);
			const deviceData = await devicesApi.list();
			console.log('Devices loaded:', deviceData);
			setDevices(deviceData);
		} catch (err) {
			console.error('Error loading data:', err);
			setError(err.message || 'Failed to load data');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const handleCreated = () => {
		loadData();
		// Keep modal open to show pairing code
	};

	// Filter devices based on search term
	const filteredDevices = devices.filter(device => 
		device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		device.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		device.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		device.status?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<div>
			{error && (
				<div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px', color: '#c00' }}>
					Error: {error}
				</div>
			)}
			
			{loading && <div>Loading devices...</div>}
			
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
				<h2 className="page-heading" style={{ margin: 0 }}>Devices</h2>
				<div style={{ display: 'flex', gap: '12px' }}>
					<button
						className="button-secondary"
						onClick={() => setShowMap(!showMap)}
						style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
					>
						{showMap ? '📋 Show List' : '🗺️ View Map'}
					</button>
					{!showMap && (
						<button 
							className="button-primary" 
							onClick={() => setIsModalOpen(true)}
							style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
						>
							<span style={{ fontSize: '18px' }}>+</span>
							Add New Device
						</button>
					)}
				</div>
			</div>
			
			{!showMap && (
				<>
					<div style={{ marginBottom: '20px' }}>
						<input
							type="text"
							placeholder="Search devices by name, serial number, location, or status..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							style={{
								width: '100%',
								padding: '12px 16px',
								border: '2px solid #bae6fd',
								borderRadius: '10px',
								fontSize: '14px',
								transition: 'all 0.2s ease'
							}}
						/>
					</div>
					<DeviceList devices={filteredDevices} onRefresh={loadData} />
				</>
			)}
			
			{showMap && <DeviceMap devices={devices} />}

			<Modal 
				isOpen={isModalOpen} 
				onClose={() => setIsModalOpen(false)}
				title="Provision New Device"
				maxWidth="700px"
			>
				<DevicePairing onCreated={handleCreated} />
			</Modal>
		</div>
	);
};

export default Devices;
