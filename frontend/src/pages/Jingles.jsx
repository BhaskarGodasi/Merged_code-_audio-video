import { useEffect, useState } from 'react';
import Modal from '../components/common/Modal';
import JingleUpload from '../components/jingles/JingleUpload';
import JingleList from '../components/jingles/JingleList';
import { jinglesApi } from '../services/api';

const Jingles = () => {
	const [jingles, setJingles] = useState([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');

	const loadData = async () => {
		const results = await jinglesApi.list();
		setJingles(results);
	};

	useEffect(() => {
		loadData();
	}, []);

	const handleUploaded = () => {
		loadData();
		setIsModalOpen(false);
	};

	// Filter jingles based on search term
	const filteredJingles = jingles.filter(jingle => 
		jingle.title?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<div>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
				<h2 className="page-heading" style={{ margin: 0 }}>Jingles</h2>
				<button 
					className="button-primary" 
					onClick={() => setIsModalOpen(true)}
					style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
				>
					<span style={{ fontSize: '18px' }}>+</span>
					Upload New Jingle
				</button>
			</div>

			<div style={{ marginBottom: '20px' }}>
				<input
					type="text"
					placeholder="Search jingles by title..."
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

			<JingleList jingles={filteredJingles} onRefresh={loadData} />

			<Modal 
				isOpen={isModalOpen} 
				onClose={() => setIsModalOpen(false)}
				title="Upload Audio Jingle"
				maxWidth="700px"
			>
				<JingleUpload onUploaded={handleUploaded} />
			</Modal>
		</div>
	);
};

export default Jingles;
