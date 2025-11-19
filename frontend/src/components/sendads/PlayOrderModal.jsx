import React from 'react';
import PropTypes from 'prop-types';
import './PlayOrderModal.css';

const PlayOrderModal = ({ playOrder, onClose }) => {
	if (!playOrder) return null;

	const { playOrder: sequence, gcd, adCounts, totalAds } = playOrder;

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-content play-order-modal" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h2>Ad Play Order (GCD Algorithm)</h2>
					<button className="btn-close" onClick={onClose}>
						✕
					</button>
				</div>

				<div className="modal-body">
					{/* Summary Section */}
					<div className="play-order-summary">
						<div className="summary-card">
							<div className="summary-label">Ads per Loop</div>
							<div className="summary-value">{totalAds}</div>
						</div>
						<div className="summary-card">
							<div className="summary-label">GCD</div>
							<div className="summary-value">{gcd}</div>
						</div>
					</div>

					<div className="info-note">
						<strong>Note:</strong> This sequence will repeat throughout the playback window until each ad reaches its minimum spot count for the day.
					</div>

					{/* Ad Counts Section */}
					<div className="ad-counts-section">
						<h3>Ads in Single Loop</h3>
						<div className="ad-counts-grid">
							{Object.entries(adCounts || {}).map(([adName, count]) => (
								<div key={adName} className="ad-count-item">
									<span className="ad-name">{adName}</span>
									<span className="ad-count">{count}x</span>
								</div>
							))}
						</div>
					</div>

					{/* Full Sequence Table */}
					<div className="full-sequence-section">
						<h3>Complete Playback Sequence</h3>
						<div className="sequence-table-container">
							<table className="sequence-table">
								<thead>
									<tr>
										<th>#</th>
										<th>Ad Title</th>
										<th>File</th>
									</tr>
								</thead>
								<tbody>
									{sequence && sequence.map((ad, index) => (
										<tr key={index}>
											<td>{index + 1}</td>
											<td>{ad.title}</td>
											<td className="filename">{ad.filename}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<p className="repeat-note">↻ This sequence repeats until spot counts are satisfied</p>
					</div>
				</div>

				<div className="modal-footer">
					<button className="btn-primary" onClick={onClose}>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};

PlayOrderModal.propTypes = {
	playOrder: PropTypes.shape({
		playOrder: PropTypes.array,
		gcd: PropTypes.number,
		adCounts: PropTypes.object,
		totalAds: PropTypes.number,
	}),
	onClose: PropTypes.func.isRequired,
};

export default PlayOrderModal;
