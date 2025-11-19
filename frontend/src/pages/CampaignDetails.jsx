import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignsApi } from '../services/api';
import './CampaignDetails.css';

const CampaignDetails = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchCampaignAnalytics = async () => {
			try {
				setLoading(true);
				setError(null);
				const analytics = await campaignsApi.getAnalytics(id);
				setData(analytics);
			} catch (err) {
				console.error('Error fetching campaign analytics:', err);
				setError(err?.response?.data?.message || 'Failed to load campaign details');
			} finally {
				setLoading(false);
			}
		};

		fetchCampaignAnalytics();
	}, [id]);

	if (loading) {
		return <div className="page-container">Loading campaign details...</div>;
	}

	if (error || !data) {
		return (
			<div className="page-container">
				<div className="error-message">{error || 'Campaign not found'}</div>
				<button className="button-secondary" onClick={() => navigate(-1)}>
					Go Back
				</button>
			</div>
		);
	}

	const { campaign, devices, stats } = data;
	const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

	return (
		<div className="page-container campaign-details-page">
			{/* Header */}
			<div className="campaign-details-header">
				<button className="button-secondary back-button" onClick={() => navigate(-1)}>
					← Back
				</button>
				<div className="campaign-title-section">
					<h1>{campaign.campaignName}</h1>
					<span className={`status-badge status-${campaign.status}`}>
						{campaign.status.toUpperCase()}
					</span>
				</div>
			</div>

			{/* Campaign Information Card */}
			<div className="campaign-info-section">
				<div className="info-card">
					<h2>Campaign Information</h2>
					<div className="info-grid">
						<div className="info-item">
							<span className="info-label">Campaign Name</span>
							<span className="info-value">{campaign.campaignName}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Brand</span>
							<span className="info-value">{campaign.brand?.name || 'N/A'}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Company</span>
							<span className="info-value">{campaign.brand?.company?.name || campaign.companyName || 'N/A'}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Ads Manager</span>
							<span className="info-value">{campaign.contactPerson}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Email</span>
							<span className="info-value">{campaign.email}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Phone</span>
							<span className="info-value">{campaign.phone}</span>
						</div>
						<div className="info-item">
							<span className="info-label">State</span>
							<span className="info-value">{campaign.state || 'N/A'}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Language</span>
							<span className="info-value">{campaign.language || 'N/A'}</span>
						</div>
						<div className="info-item">
							<span className="info-label">Start Date</span>
							<span className="info-value">{formatDate(campaign.startDate)}</span>
						</div>
						<div className="info-item">
							<span className="info-label">End Date</span>
							<span className="info-value">{formatDate(campaign.endDate)}</span>
						</div>
					</div>
				</div>
			</div>

			{/* Statistics Cards */}
			<div className="stats-overview">
				<div className="stat-card">
					<div className="stat-icon">📱</div>
					<div className="stat-content">
						<div className="stat-number">{stats.totalDevices}</div>
						<div className="stat-title">Active Devices</div>
					</div>
				</div>
				<div className="stat-card">
					<div className="stat-icon">🎵</div>
					<div className="stat-content">
						<div className="stat-number">{stats.totalJingles}</div>
						<div className="stat-title">Jingles</div>
					</div>
				</div>
				<div className="stat-card">
					<div className="stat-icon">▶️</div>
					<div className="stat-content">
						<div className="stat-number">{stats.totalPlays.toLocaleString()}</div>
						<div className="stat-title">Total Plays</div>
					</div>
				</div>
			</div>

			{/* Devices Section */}
			<div className="devices-section">
				<div className="section-header">
					<h2>
						<span className="section-icon">📱</span>
						Devices Running Campaign
					</h2>
					<div className="section-badge">{devices.length} {devices.length === 1 ? 'Device' : 'Devices'}</div>
				</div>
				{devices.length === 0 ? (
					<div className="empty-state">
						<div className="empty-icon">📭</div>
						<p>No devices are currently running jingles from this campaign</p>
					</div>
				) : (
					<div className="devices-grid">
						{devices.map((device) => (
							<div key={device.deviceId} className="device-card-new">
								<div className="device-header-new">
									<div className="device-info">
										<div className="device-name-badge">
											<div className="device-avatar">{device.deviceName.charAt(0).toUpperCase()}</div>
											<div>
												<h3>{device.deviceName}</h3>
												<span className="device-location-new">
													<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
														<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
														<circle cx="12" cy="10" r="3"></circle>
													</svg>
													{device.location || 'Unknown Location'}
												</span>
											</div>
										</div>
										<div className="jingles-count-badge">
											{device.jingles.length} {device.jingles.length === 1 ? 'Jingle' : 'Jingles'}
										</div>
									</div>
								</div>
								<div className="device-body-new">
									<div className="jingles-grid">
										{device.jingles.map((jingle, idx) => (
											<div key={idx} className="jingle-card-new">
												<div className="jingle-icon-wrapper">
													<svg className="jingle-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
														<path d="M9 18V5l12-2v13"></path>
														<circle cx="6" cy="18" r="3"></circle>
														<circle cx="18" cy="16" r="3"></circle>
													</svg>
												</div>
												<div className="jingle-content">
													<h4 className="jingle-title-new">{jingle.jingleTitle}</h4>
													<div className="jingle-meta">
														<div className="jingle-meta-item">
															<span className="meta-label">Spots</span>
															<span className="meta-value spots-value">{jingle.spots}</span>
														</div>
														<div className="jingle-meta-divider"></div>
													<div className="jingle-meta-item">
														<span className="meta-label">Created</span>
														<span className="meta-value">
															{jingle.jingleCreatedOn 
																? new Date(jingle.jingleCreatedOn).toLocaleString('en-IN', { 
																		month: 'short', 
																		day: 'numeric', 
																		year: 'numeric',
																		hour: '2-digit',
																		minute: '2-digit'
																	})
																: 'N/A'}
														</span>
													</div>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default CampaignDetails;
