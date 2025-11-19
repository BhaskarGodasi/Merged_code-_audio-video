import { useEffect, useState } from 'react';
import Modal from '../components/common/Modal';
import CampaignForm from '../components/campaigns/CampaignForm';
import CampaignList from '../components/campaigns/CampaignList';
import { campaignsApi, jinglesApi } from '../services/api';

const Campaigns = () => {
	const [campaigns, setCampaigns] = useState([]);
	const [jingles, setJingles] = useState([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');

	const loadData = async () => {
		const [campaignData, jingleData] = await Promise.all([
			campaignsApi.list(),
			jinglesApi.list(),
		]);
		setCampaigns(campaignData);
		setJingles(jingleData);
	};

	useEffect(() => {
		loadData();
	}, []);

	const handleCreated = () => {
		loadData();
		setIsModalOpen(false);
	};

	// Filter campaigns based on search term
	const filteredCampaigns = campaigns.filter(campaign => 
		campaign.campaignName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		campaign.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		campaign.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		campaign.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		campaign.status?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<div>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
				<h2 className="page-heading" style={{ margin: 0 }}>Campaigns</h2>
				<button 
					className="button-primary" 
					onClick={() => setIsModalOpen(true)}
					style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
				>
					<span style={{ fontSize: '18px' }}>+</span>
					Add New Campaign
				</button>
			</div>
			
			<div style={{ marginBottom: '20px' }}>
				<input
					type="text"
					placeholder="Search campaigns by name, brand, ads manager, or status..."
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
			
			<CampaignList
				campaigns={filteredCampaigns}
				jingles={jingles}
				onRefresh={() => {
					loadData();
				}}
			/>

			<Modal 
				isOpen={isModalOpen} 
				onClose={() => setIsModalOpen(false)}
				title="Create New Campaign"
				maxWidth="900px"
			>
				<CampaignForm
					jingles={jingles}
					onCreated={handleCreated}
				/>
			</Modal>
		</div>
	);
};

export default Campaigns;
