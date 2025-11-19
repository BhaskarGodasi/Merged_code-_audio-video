import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { campaignsApi, brandsApi } from '../../services/api';
import { statusBadgeClass } from '../../utils/helpers';
import Pagination from '../common/Pagination';
import { API_BASE_URL } from '../../utils/constants';
import './CampaignList.css';

const CampaignList = ({ campaigns, jingles, onRefresh }) => {
	const [editingId, setEditingId] = useState(null);
	const [editForm, setEditForm] = useState({});
	const [brands, setBrands] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [playingAudio, setPlayingAudio] = useState(null);

	useEffect(() => {
		fetchBrands();
	}, []);

	const fetchBrands = async () => {
		try {
			const data = await brandsApi.list();
			setBrands(data);
		} catch (err) {
			console.error('Error fetching brands:', err);
		}
	};

	// Pagination logic
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = campaigns.slice(indexOfFirstItem, indexOfLastItem);
	const totalPages = Math.ceil(campaigns.length / itemsPerPage);

	const handlePageChange = (page) => {
		setCurrentPage(page);
	};

	const handleItemsPerPageChange = (newItemsPerPage) => {
		setItemsPerPage(newItemsPerPage);
		setCurrentPage(1);
	};

	const handleDelete = async (id) => {
		const shouldDelete = window.confirm('Delete this campaign?');
		if (!shouldDelete) {
			return;
		}
		await campaignsApi.remove(id);
		onRefresh();
	};

	const startEdit = (campaign) => {
		setEditingId(campaign.id);
		const selectedJingleIds = campaign.jingles && campaign.jingles.length > 0 
			? campaign.jingles.map(j => j.id) 
			: [];
		setEditForm({
			brandId: campaign.brandId || '',
			companyName: campaign.companyName || campaign.brand?.company?.name || '',
			state: campaign.state || campaign.client?.company?.state || '',
			contactPerson: campaign.contactPerson || '',
			campaignName: campaign.campaignName || '',
			language: campaign.language || '',
			email: campaign.email || '',
			phone: campaign.phone || '',
			startDate: campaign.startDate?.split('T')[0] || '',
			endDate: campaign.endDate?.split('T')[0] || '',
			jingleIds: selectedJingleIds,
			selectedJingleId: '',
		});
	};

	const cancelEdit = () => {
		setEditingId(null);
		setEditForm({});
	};

	const handleAddJingleToEdit = () => {
		if (!editForm.selectedJingleId) return;
		const jingleId = Number(editForm.selectedJingleId);
		if (!editForm.jingleIds.includes(jingleId)) {
			setEditForm((current) => ({
				...current,
				jingleIds: [...current.jingleIds, jingleId],
				selectedJingleId: '',
			}));
		}
	};

	const handleRemoveJingleFromEdit = (jingleId) => {
		setEditForm((current) => ({
			...current,
			jingleIds: current.jingleIds.filter((id) => id !== jingleId),
		}));
	};

	const handleUpdate = async (id) => {
		const payload = {
			...editForm,
			companyName: editForm.companyName,
			state: editForm.state,
			language: editForm.language,
			jingleIds: editForm.jingleIds?.length > 0 ? editForm.jingleIds : [],
		};
		await campaignsApi.update(id, payload);
		setEditingId(null);
		onRefresh();
	};

	const handlePlay = (filePath) => {
		if (playingAudio) {
			playingAudio.pause();
			if (playingAudio.dataset.filePath === filePath) {
				setPlayingAudio(null);
				return;
			}
		}

		const baseUrl = API_BASE_URL.replace('/api', '');
		const audio = new Audio(`${baseUrl}/${filePath}`);
		audio.dataset.filePath = filePath;
		audio.play();
		audio.onended = () => setPlayingAudio(null);
		setPlayingAudio(audio);
	};

	const renderJingles = (campaign) => {
		const jingles = campaign.jingles || [];

		if (jingles.length === 0) {
			return <span className="muted">—</span>;
		}

		return (
			<div className="jingle-column">
				{jingles.map((jingle) => (
					<div key={jingle.id} className="jingle-row">
						<button
							type="button"
							className={`jingle-play-btn ${playingAudio?.dataset?.filePath === jingle.filePath ? 'playing' : ''}`}
							onClick={() => handlePlay(jingle.filePath)}
							title={playingAudio?.dataset?.filePath === jingle.filePath ? 'Stop' : 'Play'}
						>
							{playingAudio?.dataset?.filePath === jingle.filePath ? '⏸' : '▶'}
						</button>
						<span className="jingle-title">{jingle.title}</span>
					</div>
				))}
			</div>
		);
	};

	if (!campaigns.length) {
		return <p className="muted">No campaigns yet. Create one using the form.</p>;
	}

	return (
		<>
			{editingId && (
				<div className="modal-overlay" onClick={cancelEdit}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<h3>Edit Campaign</h3>
						<div className="form-grid">
							{/* Row 1: Client and Brand */}
							<div className="form-group">
								<label>Brand</label>
								<select
									value={editForm.brandId}
									onChange={(e) => {
										const brandId = Number(e.target.value) || '';
										const selected = brands.find(b => b.id === brandId);
										setEditForm({ ...editForm, brandId: brandId, companyName: selected?.company?.name || '', state: selected?.company?.state || '' });
									}}
								>
									<option value="">Select Brand</option>
									{brands.map((brand) => (
										<option key={brand.id} value={brand.id}>
											{brand.name}
										</option>
									))}
								</select>
							</div>
							<div className="form-group">
								<label>Company <span className="required">*</span></label>
								<input
									type="text"
									value={editForm.companyName}
									readOnly
								/>
							</div>

							{/* Row 2: Campaign Name and Ad Manager */}
							<div className="form-group">
								<label>Campaign Name</label>
								<input
									type="text"
									value={editForm.campaignName}
									onChange={(e) => setEditForm({ ...editForm, campaignName: e.target.value })}
								/>
							</div>
							<div className="form-group">
								<label>Ad Manager</label>
								<input
									type="text"
									value={editForm.contactPerson}
									onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })}
								/>
							</div>

							<div className="form-group">
								<label>State</label>
								<input
									type="text"
									value={editForm.state}
									onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
								/>
							</div>

							<div className="form-group">
								<label>Language</label>
								<input
									type="text"
									value={editForm.language}
									onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
								/>
							</div>

							{/* Row 3: Email and Phone */}
							<div className="form-group">
								<label>Email</label>
								<input
									type="email"
									value={editForm.email}
									onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
								/>
							</div>
							<div className="form-group">
								<label>Phone</label>
								<input
									type="text"
									value={editForm.phone}
									onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
								/>
							</div>

							{/* Row 4: Start Date and End Date */}
							<div className="form-group">
								<label>Start Date</label>
								<input
									type="date"
									value={editForm.startDate}
									onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
								/>
							</div>
							<div className="form-group">
								<label>End Date</label>
								<input
									type="date"
									value={editForm.endDate}
									onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
								/>
							</div>

							{/* Row 5: Select Jingles (full width) */}
								<div className="form-group" style={{ gridColumn: '1 / -1' }}>
									<label>Select Jingles <span className="required">*</span></label>
								<div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
									<select 
										value={editForm.selectedJingleId || ''} 
										onChange={(e) => setEditForm({ ...editForm, selectedJingleId: e.target.value })}
										style={{ flex: 1 }}
									>
										<option value="">Choose a jingle to add</option>
										{jingles.filter(j => !(editForm.jingleIds || []).includes(j.id)).map((jingle) => (
											<option key={jingle.id} value={jingle.id}>
												{jingle.title}
											</option>
										))}
									</select>
									<button
										type="button"
										className="button-primary"
										onClick={handleAddJingleToEdit}
										disabled={!editForm.selectedJingleId}
										style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
									>
										+ Add
									</button>
								</div>
								{(editForm.jingleIds || []).length > 0 && (
									<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
										{editForm.jingleIds.map((jingleId) => {
											const jingle = jingles.find(j => j.id === jingleId);
											return jingle ? (
												<div
													key={jingleId}
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: '8px',
														padding: '6px 12px',
														backgroundColor: '#0284c7',
														color: '#fff',
														borderRadius: '6px',
														fontSize: '14px',
													}}
												>
													<span>{jingle.title}</span>
													<button
														type="button"
														onClick={() => handleRemoveJingleFromEdit(jingleId)}
														style={{
															background: 'none',
															border: 'none',
															color: '#fff',
															cursor: 'pointer',
															fontSize: '16px',
															padding: '0 4px',
															lineHeight: 1,
														}}
														title="Remove jingle"
													>
														×
													</button>
												</div>
											) : null;
										})}
									</div>
								)}
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
							<th>Campaign</th>
							<th>Brand</th>
							<th>Ad Manager</th>
							<th>Status</th>
							<th>Jingle</th>
							<th>No of Plays</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{currentItems.map((campaign, idx) => (
							<tr key={campaign.id}>
								<td style={{ width: '48px', textAlign: 'center' }}>{indexOfFirstItem + idx + 1}</td>
								<td className="stacked">
									<span>{campaign.campaignName}</span>
									<span className="muted">ID #{campaign.id}</span>
								</td>
								<td>{campaign.client?.name || campaign.companyName || '—'}</td>
								<td className="stacked">
									<span>{campaign.contactPerson}</span>
									<span className="muted">{campaign.email}</span>
								</td>
								<td>
									<span className={statusBadgeClass(campaign.status)}>{campaign.status}</span>
								</td>
								<td>{renderJingles(campaign)}</td>
								<td style={{ textAlign: 'center' }}>
									<span style={{ fontWeight: '600', color: '#0284c7', fontSize: '16px' }}>
										{(campaign.playCount || 0).toLocaleString()}
									</span>
								</td>
								<td>
									<div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
										<button 
											type="button" 
											className="button-primary" 
											onClick={() => startEdit(campaign)}
											title="Edit campaign"
											style={{ padding: '8px 12px', minWidth: '40px' }}
										>
											✏️
										</button>
										<button 
											type="button" 
											className="button-secondary" 
											onClick={() => handleDelete(campaign.id)}
											title="Delete campaign"
											style={{ padding: '8px 12px', minWidth: '40px' }}
										>
											🗑️
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{campaigns.length > 0 && (
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalItems={campaigns.length}
						itemsPerPage={itemsPerPage}
						onPageChange={handlePageChange}
						onItemsPerPageChange={handleItemsPerPageChange}
					/>
				)}
			</div>
		</>
	);
};

CampaignList.propTypes = {
	campaigns: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.number,
		}),
	),
	jingles: PropTypes.array,
	onRefresh: PropTypes.func,
};

CampaignList.defaultProps = {
	campaigns: [],
	jingles: [],
	onRefresh: () => {},
};

export default CampaignList;
