import { useEffect, useState } from 'react';
import LogTable from '../components/logs/LogTable';
import { logsApi } from '../services/api';

const Logs = () => {
	const [logs, setLogs] = useState([]);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true);

	const loadData = async (filters = {}) => {
		try {
			setLoading(true);
			setError(null);
			console.log('[Logs Page] Loading logs with filters:', filters);
			const results = await logsApi.list(filters);
			console.log('[Logs Page] Logs loaded:', results.length, 'logs');
			setLogs(results);
		} catch (err) {
			console.error('[Logs Page] Error loading logs:', err);
			console.error('[Logs Page] Error response:', err?.response?.data);
			setError(err?.response?.data?.error || err.message || 'Failed to load logs');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	return (
		<div>
			<h2 className="page-heading">Playback Logs</h2>
			{error && (
				<div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px', color: '#c00' }}>
					Error: {error}
				</div>
			)}
			{loading && <div>Loading logs...</div>}
			{!loading && logs.length === 0 && !error && (
				<div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: '#fef3cd', border: '1px solid #ffc107', borderRadius: '4px', color: '#856404' }}>
					No playback logs found. Logs will appear here after devices play jingles.
				</div>
			)}
			<LogTable logs={logs} onFilter={loadData} />
		</div>
	);
};

export default Logs;
