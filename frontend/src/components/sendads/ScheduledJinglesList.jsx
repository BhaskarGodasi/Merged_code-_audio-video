import React from 'react';
import './ScheduledJinglesList.css';

const ScheduledJinglesList = ({ scheduledJingles, onUpdate, onRemove, loading }) => {
	if (!scheduledJingles || scheduledJingles.length === 0) {
		return (
			<div className="empty-jingles">
				<p>No jingles scheduled yet. Click "Add Jingle" to get started.</p>
			</div>
		);
	}

	const formatDate = (dateStr) => {
		return new Date(dateStr).toLocaleDateString();
	};

	const isActive = (scheduleJingle) => {
		const now = new Date();
		const start = new Date(scheduleJingle.startDate);
		const end = new Date(scheduleJingle.endDate);
		return scheduleJingle.isActive && now >= start && now <= end;
	};

	return (
		<div className="scheduled-jingles-list">
			{scheduledJingles.map((scheduleJingle) => {
				const active = isActive(scheduleJingle);
				
				return (
					<div key={scheduleJingle.id} className={`jingle-item ${active ? 'active' : 'inactive'}`}>
						<div className="jingle-info">
							<div className="jingle-title">
								{scheduleJingle.jingle?.title || 'Unknown Jingle'}
								{active && <span className="badge-active">ACTIVE</span>}
							</div>
							<div className="jingle-details">
								<span className="detail-item">
									<strong>Duration:</strong> {scheduleJingle.jingle?.durationSeconds || 0}s
								</span>
								<span className="detail-item">
									<strong>Spots:</strong> {scheduleJingle.spots ?? scheduleJingle.percentage}x
								</span>
								<span className="detail-item">
									<strong>Period:</strong> {formatDate(scheduleJingle.startDate)} - {formatDate(scheduleJingle.endDate)}
								</span>
								<span className="detail-item">
									<strong>Status:</strong> {scheduleJingle.isActive ? 'Enabled' : 'Disabled'}
								</span>
							</div>
						</div>
						<div className="jingle-actions">
							<button
								className="btn-icon btn-toggle"
								onClick={() => onUpdate(scheduleJingle.id, { isActive: !scheduleJingle.isActive })}
								disabled={loading}
								title={scheduleJingle.isActive ? 'Disable' : 'Enable'}
							>
								{scheduleJingle.isActive ? '⏸' : '▶'}
							</button>
							<button
								className="btn-icon btn-remove"
								onClick={() => onRemove(scheduleJingle.id)}
								disabled={loading}
								title="Remove"
							>
								🗑
							</button>
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default ScheduledJinglesList;
