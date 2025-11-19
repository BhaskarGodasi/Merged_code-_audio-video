import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { brandsApi } from '../services/api';
import { getSocket } from '../services/socket';
import './ClientDetails.css';

const BrandDetails = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [activeTab, setActiveTab] = useState('overview');

	const fetchBrandAnalytics = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const analytics = await brandsApi.getAnalytics(id);
			setData(analytics);
		} catch (err) {
			console.error('Error fetching brand analytics:', err);
			setError(err?.response?.data?.message || 'Failed to load brand analytics');
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		fetchBrandAnalytics();
		
		// Set up Socket.IO listener for real-time playback updates
		const socket = getSocket();
		
		const handlePlaybackUpdate = (payload) => {
			console.log('[BrandDetails] Received playback update:', payload);
			// Refresh analytics when new playback occurs
			fetchBrandAnalytics();
		};
		
		socket.on('playback:new', handlePlaybackUpdate);
		
		// Cleanup listener on unmount
		return () => {
			socket.off('playback:new', handlePlaybackUpdate);
		};
	}, [fetchBrandAnalytics]);

	if (loading) {
		return <div className="page-container">Loading brand details...</div>;
	}

	if (error || !data) {
		return (
			<div className="page-container">
				<div className="error-message">{error || 'Brand not found'}</div>
				<button className="button-secondary" onClick={() => navigate('/brands')}>
					Back to Brands
				</button>
			</div>
		);
	}

	const { client: brand, campaigns, stats, campaignPlayStats, devicePlayStats } = data;
	const activeCampaigns = campaigns.filter((c) => c.status === 'active');
	const completedCampaigns = campaigns.filter((c) => c.status === 'completed');
	const scheduledCampaigns = campaigns.filter((c) => c.status === 'scheduled');

	return (
		<div className="page-container client-details-page">
			<div className="client-header">
				<button className="button-secondary back-button" onClick={() => navigate('/brands')}>
					← Back to Brands
				</button>
				<div className="client-title-section">
					<h1>{brand.name}</h1>
					<span className={`status-badge status-${brand.status}`}>{brand.status}</span>
				</div>
			</div>

			<div className="client-info-card">
				<h2>Brand Information</h2>
				<div className="info-grid">
					{brand.contactPerson && (
						<div className="info-item">
							<span className="info-label">Client Contact</span>
							<span className="info-value">{brand.contactPerson}</span>
						</div>
					)}
					{brand.email && (
						<div className="info-item">
							<span className="info-label">Email</span>
							<span className="info-value">{brand.email}</span>
						</div>
					)}
					{brand.phone && (
						<div className="info-item">
							<span className="info-label">Phone</span>
							<span className="info-value">{brand.phone}</span>
						</div>
					)}
					{/* address and notes removed */}
				</div>
			</div>

			<div className="stats-overview">
				<div className="stat-card">
					<div className="stat-icon">📊</div>
					<div className="stat-content">
						<div className="stat-number">{stats.totalCampaigns}</div>
						<div className="stat-title">Total Campaigns</div>
					</div>
				</div>
				<div className="stat-card active">
					<div className="stat-icon">🎯</div>
					<div className="stat-content">
						<div className="stat-number">{stats.activeCampaigns}</div>
						<div className="stat-title">Active Campaigns</div>
					</div>
				</div>
				<div className="stat-card">
					<div className="stat-icon">▶️</div>
					<div className="stat-content">
						<div className="stat-number">{(stats.totalPlays || 0).toLocaleString()}</div>
						<div className="stat-title">Total Plays</div>
					</div>
				</div>
				<div className="stat-card">
					<div className="stat-icon">📱</div>
					<div className="stat-content">
						<div className="stat-number">{devicePlayStats.length}</div>
						<div className="stat-title">Active Devices</div>
					</div>
				</div>
			</div>

			<div className="tabs">
				<button
					className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
					onClick={() => setActiveTab('overview')}
				>
					Campaigns Overview
				</button>
				<button
					className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
					onClick={() => setActiveTab('analytics')}
				>
					Analytics & Charts
				</button>
			</div>

			{activeTab === 'overview' && (
				<div className="tab-content">
					<div className="campaigns-section">
						<h2>Active Campaigns ({activeCampaigns.length})</h2>
						{activeCampaigns.length === 0 ? (
							<p className="empty-state">No active campaigns</p>
						) : (
							<div className="campaigns-list">
								{activeCampaigns.map((campaign) => (
									<CampaignCard key={campaign.id} campaign={campaign} campaignPlayStats={campaignPlayStats} />
								))}
							</div>
						)}
					</div>

					<div className="campaigns-section">
						<h2>Scheduled Campaigns ({scheduledCampaigns.length})</h2>
						{scheduledCampaigns.length === 0 ? (
							<p className="empty-state">No scheduled campaigns</p>
						) : (
							<div className="campaigns-list">
								{scheduledCampaigns.map((campaign) => (
									<CampaignCard key={campaign.id} campaign={campaign} campaignPlayStats={campaignPlayStats} />
								))}
							</div>
						)}
					</div>

					<div className="campaigns-section">
						<h2>Completed Campaigns ({completedCampaigns.length})</h2>
						{completedCampaigns.length === 0 ? (
							<p className="empty-state">No completed campaigns</p>
						) : (
							<div className="campaigns-list">
								{completedCampaigns.map((campaign) => (
									<CampaignCard key={campaign.id} campaign={campaign} campaignPlayStats={campaignPlayStats} />
								))}
							</div>
						)}
					</div>
				</div>
			)}

			{activeTab === 'analytics' && (
				<div className="tab-content">
					<div className="analytics-section">
						<h2>Device Playback Analytics</h2>
						{devicePlayStats.length === 0 ? (
							<p className="empty-state">No playback data available</p>
						) : (
							<>
								<p className="section-description">
									Shows how many times jingles from this brand have been played on each device
								</p>
								<DevicePlayChart devicePlayStats={devicePlayStats} />
								<div className="device-play-table">
									<table>
										<thead>
											<tr>
												<th>Device Name</th>
												<th>Location</th>
												<th>Total Plays</th>
											</tr>
										</thead>
										<tbody>
											{devicePlayStats
												.sort((a, b) => b.playCount - a.playCount)
												.map((device) => (
													<tr key={device.deviceId}>
														<td>{device.deviceName}</td>
														<td>{device.deviceLocation}</td>
														<td className="number-cell">{device.playCount.toLocaleString()}</td>
													</tr>
												))}
										</tbody>
									</table>
								</div>
							</>
						)}
					</div>

					<div className="analytics-section">
						<h2>Campaign Performance</h2>
						{campaignPlayStats.length === 0 ? (
							<p className="empty-state">No campaign playback data available</p>
						) : (
							<>
								<p className="section-description">
									Shows the number of times each jingle was played in each campaign
								</p>
								<div className="campaign-play-table">
									<table>
										<thead>
											<tr>
												<th>Campaign Name</th>
												<th>Jingle Title</th>
												<th>Play Count</th>
											</tr>
										</thead>
										<tbody>
											{campaignPlayStats
												.sort((a, b) => b.playCount - a.playCount)
												.map((stat, index) => (
													<tr key={index}>
														<td>{stat.campaignName}</td>
														<td>{stat.jingleTitle}</td>
														<td className="number-cell">{stat.playCount.toLocaleString()}</td>
													</tr>
												))}
										</tbody>
									</table>
								</div>
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

const CampaignCard = ({ campaign, campaignPlayStats }) => {
	const navigate = useNavigate();
	const campaignPlays = campaignPlayStats.filter((stat) => stat.campaignId === campaign.id);
	const totalPlays = campaignPlays.reduce((sum, stat) => sum + stat.playCount, 0);

	return (
		<div 
			className="campaign-card clickable"
			onClick={() => navigate(`/campaigns/${campaign.id}`)}
			style={{ cursor: 'pointer' }}
		>
			<div className="campaign-card-header">
				<h3>{campaign.campaignName}</h3>
				<span className={`campaign-status status-${campaign.status}`}>{campaign.status}</span>
			</div>
			<div className="campaign-card-body">
				<div className="campaign-info-row">
					<span className="info-label">Client Contact:</span>
					<span>{campaign.contactPerson}</span>
				</div>
				<div className="campaign-info-row">
					<span className="info-label">Period:</span>
					<span>
						{new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
					</span>
				</div>
				<div className="campaign-info-row">
					<span className="info-label">Jingles:</span>
					<span>
						{campaign.jingles && campaign.jingles.length > 0
							? campaign.jingles.map(j => j.title).join(', ')
							: 'No jingles assigned'}
					</span>
				</div>
				<div className="campaign-info-row">
					<span className="info-label">Total Plays:</span>
					<span className="plays-count">{totalPlays.toLocaleString()}</span>
				</div>
			</div>
		</div>
	);
};

const DevicePlayChart = ({ devicePlayStats }) => {
	if (!devicePlayStats || devicePlayStats.length === 0) return null;

	const maxPlays = Math.max(...devicePlayStats.map((d) => d.playCount));
	const sortedDevices = [...devicePlayStats].sort((a, b) => b.playCount - a.playCount).slice(0, 10); // Top 10

	const chartHeight = 400;
	const barHeight = 30;
	const barSpacing = 10;
	const leftMargin = 150;
	const rightMargin = 80;
	const chartWidth = 800;

	return (
		<div className="chart-container">
			<svg width={chartWidth} height={Math.max(chartHeight, sortedDevices.length * (barHeight + barSpacing) + 40)}>
				{sortedDevices.map((device, index) => {
					const barWidth = (device.playCount / maxPlays) * (chartWidth - leftMargin - rightMargin);
					const y = index * (barHeight + barSpacing) + 20;

					return (
						<g key={device.deviceId}>
							<text x={leftMargin - 10} y={y + barHeight / 2 + 5} textAnchor="end" className="chart-label">
								{device.deviceName.length > 20
									? device.deviceName.substring(0, 20) + '...'
									: device.deviceName}
							</text>
							<rect
								x={leftMargin}
								y={y}
								width={barWidth}
								height={barHeight}
								fill="#4CAF50"
								className="chart-bar"
							/>
							<text
								x={leftMargin + barWidth + 10}
								y={y + barHeight / 2 + 5}
								className="chart-value"
							>
								{device.playCount.toLocaleString()}
							</text>
						</g>
					);
				})}
			</svg>
		</div>
	);
};

export default BrandDetails;
