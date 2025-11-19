import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { campaignsApi, devicesApi, logsApi, brandsApi } from '../services/api';
import './Dashboard.css';
import { formatDateTime, statusBadgeClass } from '../utils/helpers';

const Dashboard = () => {
	const navigate = useNavigate();
	const { user, isClient } = useAuth();
	const [summary, setSummary] = useState({ 
		totalCampaigns: 0, 
		activeCampaigns: 0,
		scheduledCampaigns: 0,
		completedCampaigns: 0,
		devices: 0, 
		onlineDevices: 0,
		logs: 0,
		jingles: 0
	});
	const [topCampaigns, setTopCampaigns] = useState([]);
	const [recentLogs, setRecentLogs] = useState([]);
	const [loading, setLoading] = useState(true);
	const isClientUser = isClient();

	useEffect(() => {
		const fetchData = async () => {
			if (!user) {
				return;
			}

			try {
				if (isClientUser && user?.brandId) {
					const analytics = await brandsApi.getAnalytics(user.brandId);
					const logs = await logsApi.list({ limit: 5 });

					const campaignPlayStats = analytics.campaignPlayStats || [];
					const campaigns = analytics.campaigns || [];
					const stats = analytics.stats || { totalCampaigns: 0, totalPlays: 0 };
					const devicePlayStats = analytics.devicePlayStats || [];

					const campaignPlayCountMap = new Map();
					campaignPlayStats.forEach((stat) => {
						campaignPlayCountMap.set(stat.campaignId, stat.playCount || 0);
					});

				const campaignsWithStats = campaigns.map((campaign) => ({
					...campaign,
					playCount: campaignPlayCountMap.get(campaign.id) || 0,
				}));

				const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
				const scheduledCampaigns = campaigns.filter(c => c.status === 'scheduled').length;
				const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;

				setSummary({
					totalCampaigns: stats.totalCampaigns,
					activeCampaigns,
					scheduledCampaigns,
					completedCampaigns,
					devices: devicePlayStats.length,
					onlineDevices: devicePlayStats.filter(d => d.status === 'online').length,
					logs: stats.totalPlays,
					jingles: 0
				});					setTopCampaigns(campaignsWithStats.slice(0, 5));
					setRecentLogs(logs.slice(0, 5));
			} else {
			const [campaigns, devices, logsCountData, logs] = await Promise.all([
				campaignsApi.list(),
				devicesApi.list(),
				logsApi.count(),
				logsApi.list({ limit: 5 }),
			]);

			const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
			const scheduledCampaigns = campaigns.filter(c => c.status === 'scheduled').length;
			const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
			const onlineDevices = devices.filter(d => d.status === 'online').length;

			setSummary({
				totalCampaigns: campaigns.length,
				activeCampaigns,
				scheduledCampaigns,
				completedCampaigns,
				devices: devices.length,
				onlineDevices,
				logs: logsCountData.count,
				jingles: 0
			});				setTopCampaigns(campaigns.slice(0, 5));
					setRecentLogs(logs.slice(0, 5));
				}
			} catch (error) {
				console.error('Failed to load dashboard data:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [user, isClientUser]);

	if (loading) {
		return <p className="muted">Loading dashboard...</p>;
	}

	return (
		<div className="dashboard-container">
			<div className="dashboard-header">
				<div className="header-content">
					<h2 className="dashboard-title">
						{isClientUser ? `Welcome, ${user?.username || 'Brand'}` : 'Dashboard Overview'}
					</h2>
					{isClientUser && (
						<p className="dashboard-subtitle">
							Track your campaign performance and ad plays
						</p>
					)}
				</div>
			</div>

			<div className="stats-grid">
				<div className="stat-card stat-card-primary" onClick={() => navigate('/campaigns')}>
					<div className="stat-icon">
						<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M3 3v18h18M7 16l4-4 4 4 6-6"/>
						</svg>
					</div>
					<div className="stat-content">
						<div className="stat-label">{isClientUser ? 'My Campaigns' : 'Total Campaigns'}</div>
						<div className="stat-value">{summary.totalCampaigns}</div>
						<div className="stat-trend">View all campaigns</div>
					</div>
				</div>

				<div className="stat-card stat-card-success" onClick={() => navigate('/campaigns')}>
					<div className="stat-icon">
						<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<circle cx="10" cy="10" r="7"/><path d="M10 6v4l2 2"/>
						</svg>
					</div>
					<div className="stat-content">
						<div className="stat-label">Active Campaigns</div>
						<div className="stat-value">{summary.activeCampaigns}</div>
						<div className="stat-trend">Currently running</div>
					</div>
				</div>

				<div className="stat-card stat-card-info" onClick={() => navigate('/devices')}>
					<div className="stat-icon">
						<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<rect x="5" y="2" width="10" height="16" rx="1"/><path d="M9 18h2"/>
						</svg>
					</div>
					<div className="stat-content">
						<div className="stat-label">{isClientUser ? 'Devices' : 'Total Devices'}</div>
						<div className="stat-value">{summary.devices}</div>
						<div className="stat-subtext">{summary.onlineDevices} online now</div>
					</div>
				</div>

				<div className="stat-card stat-card-warning" onClick={() => navigate('/logs')}>
					<div className="stat-icon">
						<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<polygon points="5 3 19 12 5 21 5 3"/>
						</svg>
					</div>
					<div className="stat-content">
						<div className="stat-label">Total Plays</div>
						<div className="stat-value">{summary.logs.toLocaleString()}</div>
						<div className="stat-trend">All time playback</div>
					</div>
				</div>

				{!isClientUser && (
					<>
						<div className="stat-card stat-card-scheduled" onClick={() => navigate('/campaigns')}>
							<div className="stat-icon">
								<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
								</svg>
							</div>
							<div className="stat-content">
								<div className="stat-label">Scheduled</div>
								<div className="stat-value">{summary.scheduledCampaigns}</div>
								<div className="stat-trend">Upcoming campaigns</div>
							</div>
						</div>

						<div className="stat-card stat-card-completed" onClick={() => navigate('/campaigns')}>
							<div className="stat-icon">
								<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
								</svg>
							</div>
							<div className="stat-content">
								<div className="stat-label">Completed</div>
								<div className="stat-value">{summary.completedCampaigns}</div>
								<div className="stat-trend">Past campaigns</div>
							</div>
						</div>
					</>
				)}
			</div>

			<div className="dashboard-tables">
				<div className="dashboard-section">
					<div className="section-header-modern">
						<h3 className="section-title-modern">
							{isClientUser ? 'My Campaigns' : 'Recent Campaigns'}
						</h3>
						<button className="btn-view-all" onClick={() => navigate('/campaigns')}>
							View All
						</button>
					</div>
					<div className="table-wrapper-modern">
						<table>
							<thead>
								<tr>
									<th>Campaign</th>
									{!isClientUser && <th>Brand</th>}
									<th>Status</th>
									{isClientUser && <th>Plays</th>}
								</tr>
							</thead>
							<tbody>
								{topCampaigns.length > 0 ? (
									topCampaigns.map((campaign) => (
										<tr key={campaign.id}>
											<td style={{ fontWeight: 500 }}>{campaign.campaignName}</td>
											{!isClientUser && <td>{campaign.client?.name || campaign.companyName || '—'}</td>}
											<td>
												<span className={statusBadgeClass(campaign.status)}>{campaign.status}</span>
											</td>
											{isClientUser && <td className="stat-number">{campaign.playCount ?? 0}</td>}
										</tr>
									))
								) : (
									<tr>
										<td colSpan={isClientUser ? 3 : 4} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' }}>
											No campaigns found
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>

				<div className="dashboard-section">
					<div className="section-header-modern">
						<h3 className="section-title-modern">
							Recent Activity
						</h3>
						<button className="btn-view-all" onClick={() => navigate('/logs')}>
							View All
						</button>
					</div>
					<div className="table-wrapper-modern">
						<table>
							<thead>
								<tr>
									<th>Log ID</th>
									<th>Device</th>
									<th>Campaign</th>
									<th>Timestamp</th>
								</tr>
							</thead>
							<tbody>
								{recentLogs.length > 0 ? (
									recentLogs.map((log) => (
										<tr key={log.id}>
											<td className="log-id">#{log.id}</td>
											<td>{log.device?.name || log.device?.serialNumber || log.deviceId}</td>
											<td style={{ fontWeight: 500 }}>{log.campaign?.campaignName || log.campaignId}</td>
											<td className="log-time">{formatDateTime(log.playbackAt)}</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' }}>
											No activity yet
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
